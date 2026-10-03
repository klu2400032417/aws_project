package com.aws.partner.fileexchange.model;

public class SecurityEvent {
    private String eventId;
    private String timestamp;
    private String severity; // INFO, WARNING, HIGH, CRITICAL
    private String eventType;
    private String partnerId;
    private String partnerName;
    private String fileName;
    private String description;
    private String sha256Hash;
    private String actionTaken;
    private String clientIp;
    private boolean resolved;

    public SecurityEvent() {}

    public SecurityEvent(String eventId, String timestamp, String severity, String eventType,
                         String partnerId, String partnerName, String fileName, String description,
                         String sha256Hash, String actionTaken, String clientIp) {
        this.eventId = eventId;
        this.timestamp = timestamp;
        this.severity = severity;
        this.eventType = eventType;
        this.partnerId = partnerId;
        this.partnerName = partnerName;
        this.fileName = fileName;
        this.description = description;
        this.sha256Hash = sha256Hash;
        this.actionTaken = actionTaken;
        this.clientIp = clientIp;
        this.resolved = false;
    }

    public String getEventId() { return eventId; }
    public void setEventId(String eventId) { this.eventId = eventId; }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getSeverity() { return severity; }
    public void setSeverity(String severity) { this.severity = severity; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getPartnerId() { return partnerId; }
    public void setPartnerId(String partnerId) { this.partnerId = partnerId; }

    public String getPartnerName() { return partnerName; }
    public void setPartnerName(String partnerName) { this.partnerName = partnerName; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getSha256Hash() { return sha256Hash; }
    public void setSha256Hash(String sha256Hash) { this.sha256Hash = sha256Hash; }

    public String getActionTaken() { return actionTaken; }
    public void setActionTaken(String actionTaken) { this.actionTaken = actionTaken; }

    public String getClientIp() { return clientIp; }
    public void setClientIp(String clientIp) { this.clientIp = clientIp; }

    public boolean isResolved() { return resolved; }
    public void setResolved(boolean resolved) { this.resolved = resolved; }
}
