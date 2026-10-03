package com.aws.partner.fileexchange.model;

import java.util.ArrayList;
import java.util.List;

public class ValidationResult {
    private boolean valid;
    private String status; // VALIDATED, QUARANTINED, DUPLICATE, FAILED
    private String reason;
    private String sha256Hash;
    private List<String> securityFlags = new ArrayList<>();
    private String quarantinedS3Key;
    private String validatedS3Key;
    private long processingTimeMs;
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
