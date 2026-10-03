package com.aws.partner.fileexchange.model;

import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Embeddable;
import java.util.ArrayList;
import java.util.List;

@Embeddable
public class ValidationResult {
    @Column(name = "validation_valid")
    private boolean valid;
    @Column(name = "validation_status")
    private String status; // VALIDATED, QUARANTINED, DUPLICATE, FAILED
    @Column(name = "validation_reason", length = 2048)
    private String reason;
    @Column(name = "validation_sha256_hash", length = 64)
    private String sha256Hash;
    @Convert(converter = StringListConverter.class)
    @Column(name = "validation_security_flags", length = 2048)
    private List<String> securityFlags = new ArrayList<>();
    @Column(name = "validation_quarantined_s3_key")
    private String quarantinedS3Key;
    @Column(name = "validation_validated_s3_key")
    private String validatedS3Key;
    @Column(name = "validation_processing_time_ms")
    private long processingTimeMs;
    @Column(name = "validation_timestamp")
    private String timestamp;

    public ValidationResult() {}

    public ValidationResult(boolean valid, String status, String reason, String sha256Hash) {
        this.valid = valid;
        this.status = status;
        this.reason = reason;
        this.sha256Hash = sha256Hash;
    }

    public boolean isValid() { return valid; }
    public void setValid(boolean valid) { this.valid = valid; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getReason() { return reason; }
    public void setReason(String reason) { this.reason = reason; }

    public String getSha256Hash() { return sha256Hash; }
    public void setSha256Hash(String sha256Hash) { this.sha256Hash = sha256Hash; }

    public List<String> getSecurityFlags() { return securityFlags; }
    public void setSecurityFlags(List<String> securityFlags) { this.securityFlags = securityFlags; }

    public String getQuarantinedS3Key() { return quarantinedS3Key; }
    public void setQuarantinedS3Key(String quarantinedS3Key) { this.quarantinedS3Key = quarantinedS3Key; }

    public String getValidatedS3Key() { return validatedS3Key; }
    public void setValidatedS3Key(String validatedS3Key) { this.validatedS3Key = validatedS3Key; }

    public long getProcessingTimeMs() { return processingTimeMs; }
    public void setProcessingTimeMs(long processingTimeMs) { this.processingTimeMs = processingTimeMs; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }
}
