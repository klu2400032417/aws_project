package com.aws.partner.fileexchange.controller;

import com.aws.partner.fileexchange.config.AwsConfig;
import com.aws.partner.fileexchange.model.CloudWatchLogRecord;
import com.aws.partner.fileexchange.model.SystemStatus;
import com.aws.partner.fileexchange.service.CloudWatchMonitoringService;
import com.aws.partner.fileexchange.service.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/system")
public class SystemController {

    private final AwsConfig awsConfig;
    private final StorageService storageService;
    private final CloudWatchMonitoringService cloudWatchService;

    @Value("${aws.s3.bucket-name:secure-partner-file-exchange-lab}")
    private String bucketName;

    @Value("${aws.region:us-east-1}")
    private String region;

    @Autowired
    public SystemController(AwsConfig awsConfig,
                            StorageService storageService,
                            CloudWatchMonitoringService cloudWatchService) {
        this.awsConfig = awsConfig;
        this.storageService = storageService;
        this.cloudWatchService = cloudWatchService;
    }

    @GetMapping("/status")
    public ResponseEntity<SystemStatus> getSystemStatus() {
        SystemStatus status = new SystemStatus();
        boolean hasAws = awsConfig.isAwsCredentialsAvailable();

        status.setAwsConnected(hasAws);
        status.setExecutionMode(hasAws ? "AWS_ACTIVE_HYBRID" : "HIGH_FIDELITY_SIMULATION");
        status.setRegion(region);
        status.setS3Bucket(bucketName);
        status.setS3Ready(true);
        status.setDynamoDbReady(hasAws);
        status.setCloudWatchReady(hasAws);

        status.setTransferFamilyStatus("PRODUCTION_CONCEPT_ONLY");
        status.setTransferFamilyNote("Transfer Family is designated as 'Planned Production Integration'. In AWS Learner Lab, Transfer Family SFTP endpoints cannot be provisioned due to IAM boundary constraints.");
        status.setLearnerLabConstraintDetails(
                "In enterprise production, AWS Transfer Family acts as the external SFTP gateway mapping partner SSH keys to S3 prefixes. " +
                "In this AWS Learner Lab deployment, file ingestion is securely achieved via Direct S3 / Signed REST APIs while preserving identical S3 folder partitioning (incoming, validated, quarantine, outgoing), automated Lambda-grade validation logic, DynamoDB audit metadata, and CloudWatch EMF monitoring."
        );

        status.setStorageStats(Map.of(
                "totalFiles", storageService.getStoredCount(),
                "bucketName", bucketName,
                "prefixModel", "partner/{partnerId}/[incoming|outgoing|validated|quarantine]/"
        ));

        return ResponseEntity.ok(status);
    }

    @GetMapping("/cloudwatch-logs")
    public ResponseEntity<List<CloudWatchLogRecord>> getCloudWatchLogs(
            @RequestParam(value = "limit", defaultValue = "50") int limit) {
        return ResponseEntity.ok(cloudWatchService.getRecentLogs(limit));
    }

    @GetMapping("/architecture-info")
    public ResponseEntity<Map<String, Object>> getArchitectureInfo() {
        return ResponseEntity.ok(Map.of(
                "conceptArchitecture", List.of(
                        Map.of("step", 1, "component", "Partner Client", "protocol", "SFTP / FTPS / AS2"),
                        Map.of("step", 2, "component", "AWS Transfer Family (Planned)", "role", "SFTP Server Endpoint with IAM Home Directory Mapping"),
                        Map.of("step", 3, "component", "Amazon S3 Storage", "role", "partitioned bucket partner/{id}/incoming/"),
                        Map.of("step", 4, "component", "AWS Lambda Validator", "role", "Triggered by S3 ObjectCreated; verifies SHA-256, MIME, Quotas, Traversal"),
                        Map.of("step", 5, "component", "Amazon DynamoDB", "role", "Metadata catalog & SHA-256 duplicate index"),
                        Map.of("step", 6, "component", "Amazon CloudWatch & SNS", "role", "EMF Metrics, Alarms, and Quarantine notifications"),
                        Map.of("step", 7, "component", "React Enterprise Dashboard", "role", "Real-time administrative visibility & partner control")
                ),
                "learnerLabAchievedArchitecture", List.of(
                        Map.of("step", 1, "component", "Partner Client / Admin Portal", "protocol", "HTTPS REST API Gateway Bridge"),
                        Map.of("step", 2, "component", "Amazon S3 (or High-Fidelity S3 Store)", "role", "Direct ingestion into partner/{id}/incoming/"),
                        Map.of("step", 3, "component", "Validation Worker Engine", "role", "Automated Lambda-identical SHA-256 duplicate check & quarantine"),
                        Map.of("step", 4, "component", "Amazon DynamoDB", "role", "PartnerFileTransfers, Partners & SecurityEvents stores"),
                        Map.of("step", 5, "component", "Amazon CloudWatch", "role", "EMF log generation & metric publishing"),
                        Map.of("step", 6, "component", "React Enterprise Admin Dashboard", "role", "Production-grade UI with live demo controls")
                ),
                "pptAlignment", "Aligns with PPT architecture: Transfer Family -> S3 -> IAM -> CloudWatch. Honestly highlights Transfer Family as target production gateway due to Learner Lab sandbox restrictions."
        ));
    }
}
