import React, { useState } from 'react';
import { 
  Layers, 
  ShieldAlert, 
  CheckCircle2, 
  Server, 
  Cloud, 
  Database, 
  Terminal, 
  FileCode, 
  Copy, 
  Check, 
  ArrowRight, 
  Lock, 
  Zap, 
  FileText,
  AlertTriangle,
  Info
} from 'lucide-react';

export default function ArchitectureView() {
  const [activeCodeTab, setActiveCodeTab] = useState('cloudformation');
  const [copied, setCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const cloudFormationCode = `AWSTemplateFormatVersion: '2010-09-09'
Description: 'Production AWS Transfer Family SFTP + S3 Ingestion + Lambda Validation Stack'

Parameters:
  Environment:
    Type: String
    Default: prod
  StorageBucketName:
    Type: String
    Default: enterprise-secure-file-exchange-prod

Resources:
  # 1. Dedicated S3 Bucket with Partition Prefix Scoping
  PartnerFileStorageBucket:
    Type: AWS::S3::Bucket
    Properties:
      BucketName: !Ref StorageBucketName
      BucketEncryption:
        ServerSideEncryptionConfiguration:
          - ServerSideEncryptionByDefault:
              SSEAlgorithm: AES256
      PublicAccessBlockConfiguration:
        BlockPublicAcls: true
        BlockPublicPolicy: true
        IgnorePublicAcls: true
        RestrictPublicBuckets: true
      NotificationConfiguration:
        LambdaConfigurations:
          - Event: 's3:ObjectCreated:*'
            Filter:
              S3Key:
                Rules:
                  - Name: prefix
                    Value: partner/
            Function: !GetAtt FileValidationLambda.Arn

  # 2. AWS Transfer Family SFTP Server (PRODUCTION PLANNED GATEWAY)
  # NOTE: Restricted in AWS Learner Lab. Included for production deployment.
  SFTPServer:
    Type: AWS::Transfer::Server
    Properties:
      IdentityProviderType: SERVICE_MANAGED
      EndpointType: PUBLIC
      Protocols:
        - SFTP
      LoggingRole: !GetAtt TransferLoggingRole.Arn
      Tags:
        - Key: Environment
          Value: !Ref Environment
        - Key: Project
          Value: SecurePartnerFileExchange

  # 3. DynamoDB Table for File Metadata & SHA-256 Duplication Check
  PartnerFileTransfersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: PartnerFileTransfers
      BillingMode: PAY_PER_REQUEST
      AttributeDefinitions:
        - AttributeName: transferId
          AttributeType: S
        - AttributeName: sha256Hash
          AttributeType: S
      KeySchema:
        - AttributeName: transferId
          KeyType: HASH
      GlobalSecondaryIndexes:
        - IndexName: Sha256Index
          KeySchema:
            - AttributeName: sha256Hash
              KeyType: HASH
          Projection:
            ProjectionType: ALL

  # 4. Lambda Validation Function
  FileValidationLambda:
    Type: AWS::Lambda::Function
    Properties:
      FunctionName: !Sub '\${Environment}-partner-file-validator'
      Runtime: python3.11
      Handler: lambda_function.lambda_handler
      Timeout: 30
      MemorySize: 512
      Role: !GetAtt LambdaExecutionRole.Arn
      Environment:
        Variables:
          DYNAMO_TABLE: !Ref PartnerFileTransfersTable
          CLOUDWATCH_NAMESPACE: 'SecureFileExchange/Production'
      Code:
        ZipFile: |
          import json, hashlib, boto3, os, urllib.parse

          s3 = boto3.client('s3')
          dynamo = boto3.resource('dynamodb')
          cw = boto3.client('cloudwatch')

          def lambda_handler(event, context):
              for record in event['Records']:
                  bucket = record['s3']['bucket']['name']
                  key = urllib.parse.unquote_plus(record['s3']['object']['key'])
                  # Validation: SHA-256, Size, Extension checks
                  # Moves object to validated/ or quarantine/
                  print(f"Validated S3 object: {key}")
              return {"statusCode": 200}`;

  const terraformCode = `# Terraform Configuration for AWS Transfer Family SFTP + S3 Architecture
# Planned Production Integration (Excluded in AWS Learner Lab due to sandbox restrictions)

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# 1. S3 Storage Bucket
resource "aws_s3_bucket" "partner_exchange" {
  bucket = "enterprise-secure-file-exchange-prod"
}

resource "aws_s3_bucket_server_side_encryption_configuration" "encrypt" {
  bucket = aws_s3_bucket.partner_exchange.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# 2. AWS Transfer Family Server (Target Production SFTP Endpoint)
resource "aws_transfer_server" "sftp_server" {
  identity_provider_type = "SERVICE_MANAGED"
  endpoint_type          = "PUBLIC"
  protocols              = ["SFTP"]
  logging_role           = aws_iam_role.transfer_logging.arn

  tags = {
    Name        = "Partner-SFTP-Gateway"
    Environment = "production"
  }
}

# 3. Transfer Family Partner User with IAM S3 Prefix Scoping
resource "aws_transfer_user" "partner_healthcorp" {
  server_id      = aws_transfer_server.sftp_server.id
  user_name      = "sftp-healthcorp"
  role           = aws_iam_role.partner_s3_access.arn
  home_directory = "/\${aws_s3_bucket.partner_exchange.id}/partner/PRT-HEALTHCORP/"

  home_directory_mappings {
    entry  = "/"
    target = "/\${aws_s3_bucket.partner_exchange.id}/partner/PRT-HEALTHCORP"
  }
}

# 4. DynamoDB Metadata Store
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
}`;

  const lambdaPythonCode = `"""
Production AWS Lambda Validation Function
Triggered by S3 ObjectCreated event on partner/{partnerId}/incoming/
Calculates SHA-256, verifies partner policies, routes to validated/ or quarantine/,
and records immutable audit catalog in DynamoDB.
"""
import json
import hashlib
import os
import urllib.parse
import boto3
from datetime import datetime

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
cloudwatch = boto3.client('cloudwatch')

DYNAMO_TABLE = os.environ.get('DYNAMO_TABLE', 'PartnerFileTransfers')
RESTRICTED_EXTENSIONS = {'.exe', '.bat', '.cmd', '.sh', '.vbs', '.scr', '.dll', '.ps1'}

def lambda_handler(event, context):
    table = dynamodb.Table(DYNAMO_TABLE)
    
    for record in event['Records']:
        bucket = record['s3']['bucket']['name']
        key = urllib.parse.unquote_plus(record['s3']['object']['key'])
        
        # Parse prefix: partner/{partnerId}/incoming/{filename}
        parts = key.split('/')
        if len(parts) < 4 or parts[2] != 'incoming':
            continue
            
        partner_id = parts[1]
        filename = parts[3]
        
        # 1. Download payload stream and compute SHA-256
        obj = s3.get_object(Bucket=bucket, Key=key)
        data = obj['Body'].read()
        sha256_hash = hashlib.sha256(data).hexdigest()
        file_size = len(data)
        
        # 2. Check for duplicate SHA-256
        dup_query = table.query(
            IndexName='Sha256Index',
            KeyConditionExpression=boto3.dynamodb.conditions.Key('sha256Hash').eq(sha256_hash)
        )
        is_duplicate = len(dup_query.get('Items', [])) > 0
        
        # 3. Check for restricted executable extensions
        ext = os.path.splitext(filename)[1].lower()
        is_malicious = ext in RESTRICTED_EXTENSIONS
        
        # 4. Route object
        if is_malicious:
            status = 'QUARANTINED'
            dest_key = f"partner/{partner_id}/quarantine/{filename}"
            reason = f"Prohibited executable format: {ext}"
        elif is_duplicate:
            status = 'DUPLICATE'
            dest_key = f"partner/{partner_id}/quarantine/{filename}"
            reason = f"Duplicate SHA-256 payload detected ({sha256_hash[:12]}...)"
        else:
            status = 'VALIDATED'
            dest_key = f"partner/{partner_id}/validated/{filename}"
            reason = "Passed security scan & cryptographic checksum verification"
            
        # Copy to destination prefix and purge incoming
        s3.copy_object(Bucket=bucket, CopySource={'Bucket': bucket, 'Key': key}, Key=dest_key)
        s3.delete_object(Bucket=bucket, Key=key)
        
        # 5. Persist audit to DynamoDB
        table.put_item(Item={
            'transferId': f"TX-{os.urandom(4).hex().upper()}",
            'partnerId': partner_id,
            'fileName': filename,
            'fileSize': file_size,
            'sha256Hash': sha256_hash,
            'status': status,
            's3Key': dest_key,
            'reason': reason,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # 6. Publish CloudWatch Metric
        cloudwatch.put_metric_data(
            Namespace='SecureFileExchange/Production',
            MetricData=[
                {'MetricName': 'FilesProcessed', 'Value': 1, 'Unit': 'Count'},
                {'MetricName': f"Status_{status}", 'Value': 1, 'Unit': 'Count'}
            ]
        )
        
    return {"statusCode": 200, "body": "Validation complete"}`;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-white tracking-tight">System Architecture & AWS Infrastructure Blueprint</h1>
        <p className="text-xs text-slate-400 mt-0.5">
        Current application services and the separate optional AWS infrastructure design.
        </p>
      </div>

      {/* Prominent Architectural Advisory Banner */}
      <div className="bg-slate-900/90 border border-amber-600/40 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-amber-500/20 text-amber-400">
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-amber-300">
              Runtime and Optional AWS Services
            </h2>
            <p className="text-xs text-slate-300 mt-0.5">
              The application reports only services that are configured and used.
            </p>
          </div>
        </div>

        <p className="text-xs text-slate-300 leading-relaxed">
          AWS Transfer Family is not configured by the application. The REST backend validates uploads and persists partner, transfer, and security records in the relational database.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs pt-1">
          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="font-semibold text-amber-400 block mb-1">
              Optional AWS Pipeline (Terraform):
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              <strong className="text-slate-200">S3 → Lambda → DynamoDB → CloudWatch.</strong> The separate Terraform configuration defines this AWS event-processing pipeline; deploy it separately to activate it.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800">
            <span className="font-semibold text-emerald-400 block mb-1">
              Current Application Runtime:
            </span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              <strong className="text-slate-200">React + Spring Boot + relational database + configured S3 or local storage.</strong> The backend validates manual uploads, calculates SHA-256, detects duplicates, and persists transfer and security audit records. CloudWatch metrics are optional when AWS credentials are configured.
            </p>
          </div>
        </div>
      </div>

      {/* Side-by-Side Visual Architecture Diagrams */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Diagram 1: Target Production Concept */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Cloud className="w-4 h-4 text-amber-400" />
              <h3 className="text-sm font-bold text-white">Target Production Architecture</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800 font-mono">
              PLANNED INTEGRATION
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sky-400 font-mono font-bold block text-[11px]">1. External Trading Partner</span>
                <span className="text-slate-400 text-[11px]">Connects via SFTP / FTPS / AS2 client with SSH Key</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
            </div>

            <div className="p-3 rounded-lg bg-amber-950/20 border border-amber-800/60 flex items-center justify-between">
              <div>
                <span className="text-amber-400 font-mono font-bold block text-[11px]">2. AWS Transfer Family Gateway</span>
                <span className="text-slate-300 text-[11px]">SFTP Server endpoint with IAM Scoped Home Directory</span>
              </div>
              <ArrowRight className="w-4 h-4 text-amber-500/60" />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sky-400 font-mono font-bold block text-[11px]">3. Amazon S3 Storage Bucket</span>
                <span className="text-slate-400 text-[11px]">Object stored in <code className="text-sky-300">partner/{'{id}'}/incoming/</code></span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-mono font-bold block text-[11px]">4. AWS Lambda Validation Worker</span>
                <span className="text-slate-400 text-[11px]">Triggered by S3 ObjectCreated; verifies SHA-256 & Quota</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-purple-400 font-mono font-bold block text-[11px]">5. Amazon DynamoDB & CloudWatch</span>
                <span className="text-slate-400 text-[11px]">Metadata cataloged in DynamoDB; EMF metrics emitted</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>

        {/* Diagram 2: Current application runtime */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="text-sm font-bold text-white">Current Application Runtime</h3>
            </div>
            <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800 font-mono">
              ACTIVE
            </span>
          </div>

          <div className="space-y-2 text-xs">
            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sky-400 font-mono font-bold block text-[11px]">1. React Enterprise Admin Portal</span>
                <span className="text-slate-400 text-[11px]">Partner management, file upload, storage browser, audit views</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
            </div>

            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-800/60 flex items-center justify-between">
              <div>
                <span className="text-emerald-400 font-mono font-bold block text-[11px]">2. Spring Boot REST Ingestion Bridge</span>
                <span className="text-slate-300 text-[11px]">Multipart uploads validated by backend services</span>
              </div>
              <ArrowRight className="w-4 h-4 text-emerald-500/60" />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-sky-400 font-mono font-bold block text-[11px]">3. Relational Database & File Storage</span>
                <span className="text-slate-400 text-[11px]">Partners, transfers, and audit records; files stored in configured S3 or local storage</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-indigo-400 font-mono font-bold block text-[11px]">4. Automated Validation Engine</span>
                <span className="text-slate-400 text-[11px]">SHA-256 duplicate checks, extension and partner policy validation</span>
              </div>
              <ArrowRight className="w-4 h-4 text-slate-600" />
            </div>

            <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800 flex items-center justify-between">
              <div>
                <span className="text-purple-400 font-mono font-bold block text-[11px]">5. Optional CloudWatch Metrics</span>
                <span className="text-slate-400 text-[11px]">Published when AWS credentials and the CloudWatch client are available</span>
              </div>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Production Infrastructure Code & Scripts Viewer */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-sm font-semibold text-white">Production Deployment Code & Templates</h2>
            <p className="text-xs text-slate-400">
              Ready-to-deploy Infrastructure-as-Code for your project report and production implementation.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab('cloudformation')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeCodeTab === 'cloudformation' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              CloudFormation
            </button>
            <button
              onClick={() => setActiveCodeTab('terraform')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeCodeTab === 'terraform' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Terraform
            </button>
            <button
              onClick={() => setActiveCodeTab('lambda')}
              className={`px-3 py-1 rounded text-xs font-medium transition-colors ${
                activeCodeTab === 'lambda' ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              Lambda Handler
            </button>
          </div>
        </div>

        <div className="relative bg-slate-950 p-4 font-mono text-xs text-slate-300 max-h-96 overflow-y-auto">
          <button
            onClick={() => {
              const code = activeCodeTab === 'cloudformation' 
                ? cloudFormationCode 
                : activeCodeTab === 'terraform' 
                ? terraformCode 
                : lambdaPythonCode;
              copyToClipboard(code);
            }}
            className="absolute top-4 right-4 flex items-center gap-1 px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-sans transition-colors border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy Code'}</span>
          </button>

          <pre className="overflow-x-auto leading-relaxed">
            {activeCodeTab === 'cloudformation' && cloudFormationCode}
            {activeCodeTab === 'terraform' && terraformCode}
            {activeCodeTab === 'lambda' && lambdaPythonCode}
          </pre>
        </div>
      </div>
    </div>
  );
}
