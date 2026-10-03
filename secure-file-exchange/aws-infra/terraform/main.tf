# Terraform Module: Secure Partner File Exchange Platform
# Target Production Architecture: Transfer Family -> S3 -> Lambda -> DynamoDB -> CloudWatch

terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "bucket_name" {
  type    = string
  default = "enterprise-secure-file-exchange-prod"
}

provider "aws" {
  region = var.aws_region
}

# 1. Amazon S3 Storage Bucket
resource "aws_s3_bucket" "partner_exchange" {
  bucket = var.bucket_name
}

resource "aws_s3_bucket_server_side_encryption_configuration" "kms_enc" {
  bucket = aws_s3_bucket.partner_exchange.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 2. AWS Transfer Family Server (Target Production SFTP Gateway)
resource "aws_transfer_server" "sftp" {
  identity_provider_type = "SERVICE_MANAGED"
  endpoint_type          = "PUBLIC"
  protocols              = ["SFTP"]
  logging_role           = aws_iam_role.transfer_logging.arn

  tags = {
    Name        = "Partner-SFTP-Gateway"
    Status      = "PlannedProduction"
    Environment = "prod"
  }
}

resource "aws_iam_role" "transfer_logging" {
  name = "TransferFamilyLoggingRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action    = "sts:AssumeRole"
      Effect    = "Allow"
      Principal = { Service = "transfer.amazonaws.com" }
    }]
  })
}

# 3. Amazon DynamoDB Tables
resource "aws_dynamodb_table" "transfers" {
  name         = "PartnerFileTransfers"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "transferId"

  attribute {
    name = "transferId"
    type = "S"
  }

  attribute {
    name = "sha256Hash"
    type = "S"
  }

  global_secondary_index {
    name            = "Sha256Index"
    hash_key        = "sha256Hash"
    projection_type = "ALL"
  }
}

resource "aws_dynamodb_table" "partners" {
  name         = "Partners"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "partnerId"

  attribute {
    name = "partnerId"
    type = "S"
  }
}

resource "aws_dynamodb_table" "security_events" {
  name         = "SecurityEvents"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "eventId"

  attribute {
    name = "eventId"
    type = "S"
  }
}

# 4. Amazon CloudWatch Metric Alarm
resource "aws_cloudwatch_metric_alarm" "quarantine_alarm" {
  alarm_name          = "HighQuarantineRateAlert"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ValidationQuarantined"
  namespace           = "SecureFileExchange/Production"
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "Triggered when more than 3 files are quarantined in 5 minutes"
}
