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

    @Value("${aws.s3.bucket-name:}")
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
        boolean hasAwsCredentials = awsConfig.isAwsCredentialsAvailable();
        boolean hasAwsStorage = storageService.isAwsStorageEnabled();

        status.setAwsConnected(hasAwsCredentials);
        status.setExecutionMode(hasAwsStorage ? "AWS_S3" : "LOCAL_PERSISTENT_STORAGE");
        status.setRegion(region);
        status.setS3Bucket(hasAwsStorage ? bucketName : "");
        status.setS3Ready(hasAwsStorage);
        status.setDynamoDbReady(false);
        status.setCloudWatchReady(cloudWatchService.isCloudWatchEnabled());

        status.setTransferFamilyStatus("OPTIONAL_NOT_CONFIGURED");
        status.setTransferFamilyNote("The application accepts REST uploads. Provision AWS Transfer Family separately if SFTP ingress is required.");
        status.setLearnerLabConstraintDetails(
                "AWS Transfer Family can act as an external SFTP gateway mapping partner SSH keys to S3 prefixes. " +
                "The active application accepts uploads through its REST API, validates them, and persists records in the relational database and files in the configured S3 bucket or local persistent storage."
        );

        status.setStorageStats(Map.of(
                "totalFiles", storageService.getStoredCount(),
                "storageLocation", storageService.getStorageLocation(),
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
                        Map.of("step", 2, "component", "AWS Transfer Family (Optional)", "role", "SFTP Server Endpoint with IAM Home Directory Mapping"),
                        Map.of("step", 3, "component", "Amazon S3 Storage", "role", "Partner-partitioned object storage"),
                        Map.of("step", 4, "component", "AWS Lambda Validator", "role", "Triggered by S3 ObjectCreated; verifies SHA-256, MIME, Quotas, Traversal"),
                        Map.of("step", 5, "component", "Amazon DynamoDB", "role", "Metadata catalog & SHA-256 duplicate index"),
                        Map.of("step", 6, "component", "Amazon CloudWatch & SNS", "role", "EMF Metrics, Alarms, and Quarantine notifications"),
                        Map.of("step", 7, "component", "React Enterprise Dashboard", "role", "Real-time administrative visibility & partner control")
                ),
                "applicationRuntime", List.of(
                        Map.of("step", 1, "component", "Partner Client / Admin Portal", "protocol", "HTTPS REST API Bridge"),
                        Map.of("step", 2, "component", "Configured Storage", "role", "Persistent partner file storage"),
                        Map.of("step", 3, "component", "Validation Worker Engine", "role", "Automated Lambda-identical SHA-256 duplicate check & quarantine"),
                        Map.of("step", 4, "component", "Relational Database", "role", "Partner, transfer, and security audit records"),
                        Map.of("step", 5, "component", "Amazon CloudWatch (Optional)", "role", "Metrics are published when AWS credentials are configured"),
                        Map.of("step", 6, "component", "React Admin Dashboard", "role", "Partner, file, transfer, and audit management")
                ),
                "pptAlignment", "The runtime uses a REST API, relational database, and configured S3 or local file storage. The separate Terraform configuration describes the optional AWS event-processing pipeline."
        ));
    }
}
