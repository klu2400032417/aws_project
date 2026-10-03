package com.aws.partner.fileexchange.service;

import com.aws.partner.fileexchange.config.AwsConfig;
import com.aws.partner.fileexchange.model.CloudWatchLogRecord;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.services.cloudwatch.CloudWatchClient;
import software.amazon.awssdk.services.cloudwatch.model.Dimension;
import software.amazon.awssdk.services.cloudwatch.model.MetricDatum;
import software.amazon.awssdk.services.cloudwatch.model.PutMetricDataRequest;
import software.amazon.awssdk.services.cloudwatch.model.StandardUnit;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentLinkedDeque;

@Service
public class CloudWatchMonitoringService {
    private static final Logger log = LoggerFactory.getLogger(CloudWatchMonitoringService.class);

    @Value("${aws.cloudwatch.namespace:SecureFileExchange}")
    private String namespace;

    @Value("${app.environment:local}")
    private String environment;

    private final CloudWatchClient cloudWatchClient;
    private final AwsConfig awsConfig;
    private final ObjectMapper objectMapper = new ObjectMapper();

    // Recent backend metric activity shown in the UI.
    private final Deque<CloudWatchLogRecord> liveLogBuffer = new ConcurrentLinkedDeque<>();
    private static final int MAX_LIVE_LOGS = 150;

    @Autowired
    public CloudWatchMonitoringService(@Autowired(required = false) CloudWatchClient cloudWatchClient, AwsConfig awsConfig) {
        this.cloudWatchClient = cloudWatchClient;
        this.awsConfig = awsConfig;
    }

    public void recordFileReceived(String partnerId, String fileName, long fileSize) {
        emitEmfMetric("FilesReceived", 1.0, "Count", partnerId, Map.of("fileName", fileName, "sizeBytes", fileSize));
        emitEmfMetric("BytesTransferred", (double) fileSize, "Bytes", partnerId, Map.of("fileName", fileName));
    }

    public void recordValidationPassed(String partnerId, String fileName, String sha256) {
        emitEmfMetric("ValidationPassed", 1.0, "Count", partnerId, Map.of("fileName", fileName, "sha256", sha256));
    }

    public void recordValidationQuarantined(String partnerId, String fileName, String reason, String sha256) {
        emitEmfMetric("ValidationQuarantined", 1.0, "Count", partnerId, Map.of("fileName", fileName, "reason", reason, "sha256", sha256));
    }

    public void recordDuplicateRejected(String partnerId, String fileName, String sha256) {
        emitEmfMetric("DuplicateFilesRejected", 1.0, "Count", partnerId, Map.of("fileName", fileName, "sha256", sha256));
    }

    public void recordSecurityViolation(String partnerId, String eventType, String severity, String description) {
        emitEmfMetric("SecurityViolations", 1.0, "Count", partnerId, Map.of("eventType", eventType, "severity", severity, "description", description));
    }

    private void emitEmfMetric(String metricName, double value, String unit, String partnerId, Map<String, Object> extraDimensions) {
        String timestamp = Instant.now().toString();

        Map<String, Object> dimensions = new HashMap<>(extraDimensions != null ? extraDimensions : Collections.emptyMap());
        dimensions.put("PartnerId", partnerId != null ? partnerId : "GLOBAL");
        dimensions.put("Environment", environment);

        Map<String, Object> metrics = Map.of(metricName, value);

        // Build AWS CloudWatch Embedded Metric Format (EMF) structure
        Map<String, Object> emfPayload = new LinkedHashMap<>();
        emfPayload.put("_aws", Map.of(
                "Timestamp", System.currentTimeMillis(),
                "CloudWatchMetrics", List.of(Map.of(
                        "Namespace", namespace,
                        "Dimensions", List.of(List.of("PartnerId", "Environment")),
                        "Metrics", List.of(Map.of("Name", metricName, "Unit", unit))
                ))
        ));
        emfPayload.putAll(dimensions);
        emfPayload.putAll(metrics);

        try {
            String jsonLog = objectMapper.writeValueAsString(emfPayload);
            log.info("[CloudWatch-EMF] {}", jsonLog);
        } catch (Exception e) {
            log.warn("Unable to serialize CloudWatch metric {} for partner {}", metricName, partnerId, e);
        }

        // Store into UI log buffer
        CloudWatchLogRecord record = new CloudWatchLogRecord(
                timestamp,
                metricName.contains("Quarantined") || metricName.contains("Violation") ? "WARN" : "INFO",
                "com.aws.partner.fileexchange.CloudWatchMonitoringService",
                String.format("Recorded metric [%s: %s %s] for partner %s", metricName, value, unit, partnerId),
                metricName,
                partnerId,
                null,
                dimensions,
                metrics
        );

        liveLogBuffer.addFirst(record);
        while (liveLogBuffer.size() > MAX_LIVE_LOGS) {
            liveLogBuffer.removeLast();
        }

        // Send to real AWS CloudWatch if available
        if (cloudWatchClient != null && awsConfig.isAwsCredentialsAvailable()) {
            try {
                MetricDatum datum = MetricDatum.builder()
                        .metricName(metricName)
                        .value(value)
                        .unit(StandardUnit.fromValue(unit))
                        .timestamp(Instant.now())
                        .dimensions(
                                Dimension.builder().name("PartnerId").value(partnerId != null ? partnerId : "GLOBAL").build(),
                                Dimension.builder().name("Environment").value(environment).build()
                        )
                        .build();

                PutMetricDataRequest request = PutMetricDataRequest.builder()
                        .namespace(namespace)
                        .metricData(datum)
                        .build();

                cloudWatchClient.putMetricData(request);
            } catch (Exception e) {
                log.warn("Unable to publish CloudWatch metric {} for partner {}", metricName, partnerId, e);
            }
        }
    }

    public List<CloudWatchLogRecord> getRecentLogs(int limit) {
        return liveLogBuffer.stream().limit(limit).toList();
    }

    public boolean isCloudWatchEnabled() {
        return cloudWatchClient != null && awsConfig.isAwsCredentialsAvailable();
    }
}
