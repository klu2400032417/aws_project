# S3 -> Lambda -> DynamoDB -> CloudWatch
# AWS credentials are resolved by the AWS provider's standard credential chain.
terraform {
  required_version = ">= 1.5.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "bucket_name" {
  description = "Optional globally unique bucket name. Defaults to an account- and region-specific name."
  type        = string
  default     = null
  nullable    = true
}

variable "enable_sns_alerts" {
  description = "Create an SNS topic and publish quarantine and CloudWatch alarm notifications."
  type        = bool
  default     = false
}

variable "security_alert_email" {
  description = "Optional email subscription for the SNS alert topic. Confirm the subscription with AWS."
  type        = string
  default     = ""
}

variable "environment_name" {
  description = "Environment label applied to provisioned resources."
  type        = string
  default     = "development"
}

provider "aws" {
  region = var.aws_region
}

data "aws_caller_identity" "current" {}

locals {
  bucket_name          = coalesce(var.bucket_name, "secure-file-exchange-${data.aws_caller_identity.current.account_id}-${var.aws_region}")
  function_name        = "secure-file-exchange-validator"
  cloudwatch_namespace = "SecureFileExchange/Production"
  sns_topic_arn        = var.enable_sns_alerts ? aws_sns_topic.security_alerts[0].arn : ""
}

# Package the handler with Terraform's archive provider. boto3 is included in
# the managed Python runtime, so no additional application dependencies are needed.
data "archive_file" "validator" {
  type        = "zip"
  source_file = abspath("${path.module}/../lambda/lambda_function.py")
  output_path = "${path.module}/.terraform/lambda_function.zip"
}

# 1. Amazon S3 storage bucket
resource "aws_s3_bucket" "partner_exchange" {
  bucket = local.bucket_name
}

resource "aws_s3_bucket_public_access_block" "partner_exchange" {
  bucket                  = aws_s3_bucket.partner_exchange.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "partner_exchange" {
  bucket = aws_s3_bucket.partner_exchange.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "partner_exchange" {
  bucket = aws_s3_bucket.partner_exchange.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 2. DynamoDB transfer index and partner records
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

# The Transfer Family server remains the planned SFTP entry point; uploaded
# objects still enter the validation pipeline through the S3 notification below.
resource "aws_transfer_server" "sftp" {
  identity_provider_type = "SERVICE_MANAGED"
  endpoint_type          = "PUBLIC"
  protocols              = ["SFTP"]
  logging_role           = aws_iam_role.transfer_logging.arn

  tags = {
    Name        = "Partner-SFTP-Gateway"
    Status      = "PlannedProduction"
    Environment = var.environment_name
  }

  depends_on = [aws_iam_role_policy_attachment.transfer_logging]
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

# 3. Optional SNS alert destination
resource "aws_sns_topic" "security_alerts" {
  count = var.enable_sns_alerts ? 1 : 0
  name  = "secure-file-exchange-security-alerts"
}

resource "aws_sns_topic_subscription" "security_alert_email" {
  count     = var.enable_sns_alerts && var.security_alert_email != "" ? 1 : 0
  topic_arn = aws_sns_topic.security_alerts[0].arn
  protocol  = "email"
  endpoint  = var.security_alert_email
}

# 4. Lambda execution role and least-privilege access
resource "aws_iam_role" "validator" {
  name = "secure-file-exchange-validator"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
      Action = "sts:AssumeRole"
    }]
  })
}

resource "aws_iam_role_policy_attachment" "transfer_logging" {
  role       = aws_iam_role.transfer_logging.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSTransferLoggingAccess"
}

resource "aws_cloudwatch_log_group" "validator" {
  name              = "/aws/lambda/${local.function_name}"
  retention_in_days = 14
}

resource "aws_iam_role_policy" "validator" {
  name = "secure-file-exchange-validator-access"
  role = aws_iam_role.validator.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat([
      {
        Sid    = "WriteFunctionLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = ["${aws_cloudwatch_log_group.validator.arn}:*"]
      },
      {
        Sid    = "ProcessPartnerObjects"
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = ["${aws_s3_bucket.partner_exchange.arn}/*"]
      },
      {
        Sid    = "ReadAndWriteTransferRecords"
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:Query"
        ]
        Resource = [
          aws_dynamodb_table.transfers.arn,
          "${aws_dynamodb_table.transfers.arn}/index/Sha256Index"
        ]
      }
    ], var.enable_sns_alerts ? [{
      Sid      = "PublishSecurityAlerts"
      Effect   = "Allow"
      Action   = ["sns:Publish"]
      Resource = [aws_sns_topic.security_alerts[0].arn]
    }] : [])
  })
}

resource "aws_lambda_function" "validator" {
  function_name    = local.function_name
  role             = aws_iam_role.validator.arn
  runtime          = "python3.11"
  handler          = "lambda_function.lambda_handler"
  filename         = data.archive_file.validator.output_path
  source_code_hash = data.archive_file.validator.output_base64sha256
  timeout          = 60
  memory_size      = 512

  environment {
    variables = {
      DYNAMO_TABLE         = aws_dynamodb_table.transfers.name
      SNS_ALERT_TOPIC_ARN  = local.sns_topic_arn
      CLOUDWATCH_NAMESPACE = local.cloudwatch_namespace
    }
  }

  depends_on = [
    aws_iam_role_policy.validator,
    aws_cloudwatch_log_group.validator
  ]
}

# S3's static prefix filter cannot express partner/*/incoming/. Subscribe to
# partner/ and let the handler ignore keys outside each partner's incoming/ prefix.
resource "aws_lambda_permission" "allow_s3" {
  statement_id   = "AllowPartnerBucketInvoke"
  action         = "lambda:InvokeFunction"
  function_name  = aws_lambda_function.validator.function_name
  principal      = "s3.amazonaws.com"
  source_arn     = aws_s3_bucket.partner_exchange.arn
  source_account = data.aws_caller_identity.current.account_id
}

resource "aws_s3_bucket_notification" "partner_exchange" {
  bucket = aws_s3_bucket.partner_exchange.id

  lambda_function {
    lambda_function_arn = aws_lambda_function.validator.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "partner/"
  }

  depends_on = [aws_lambda_permission.allow_s3]
}

# 5. CloudWatch quarantine alarm. The handler emits this metric using EMF.
resource "aws_cloudwatch_metric_alarm" "quarantine_alarm" {
  alarm_name          = "HighQuarantineRateAlert"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ValidationQuarantined"
  namespace           = local.cloudwatch_namespace
  period              = 300
  statistic           = "Sum"
  threshold           = 3
  alarm_description   = "Triggered when more than 3 files are quarantined in 5 minutes"
  treat_missing_data  = "notBreaching"
  alarm_actions       = var.enable_sns_alerts ? [aws_sns_topic.security_alerts[0].arn] : []

  dimensions = {
    Status = "QUARANTINED"
  }

  depends_on = [
    aws_lambda_function.validator,
    aws_sns_topic_policy.security_alerts
  ]
}

resource "aws_sns_topic_policy" "security_alerts" {
  count  = var.enable_sns_alerts ? 1 : 0
  arn    = aws_sns_topic.security_alerts[0].arn
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowAccountAdministration"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "sns:*"
        Resource = aws_sns_topic.security_alerts[0].arn
      },
      {
        Sid    = "AllowCloudWatchAlarmNotifications"
        Effect = "Allow"
        Principal = {
          Service = "cloudwatch.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.security_alerts[0].arn
        Condition = {
          ArnLike = {
            "aws:SourceArn" = "arn:aws:cloudwatch:${var.aws_region}:${data.aws_caller_identity.current.account_id}:alarm:HighQuarantineRateAlert"
          }
        }
      }
    ]
  })
}

output "storage_bucket_name" {
  value = aws_s3_bucket.partner_exchange.bucket
}

output "validator_function_name" {
  value = aws_lambda_function.validator.function_name
}

output "transfers_table_name" {
  value = aws_dynamodb_table.transfers.name
}

output "partners_table_name" {
  value = aws_dynamodb_table.partners.name
}
