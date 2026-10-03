package com.aws.partner.fileexchange.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;

import java.util.UUID;

@Entity
@Table(name = "security_events")
public class SecurityEvent {
    @Id
    @Column(name = "event_id", nullable = false, length = 64)
    private String eventId;
    @Column(name = "event_timestamp")
    private String timestamp;
    @Column(name = "severity", length = 16)
    private String severity; // INFO, WARNING, HIGH, CRITICAL
    @Column(name = "event_type")
    private String eventType;
    @Column(name = "partner_id")
    private String partnerId;
    @Column(name = "partner_name")
    private String partnerName;
    @Column(name = "file_name")
    private String fileName;
    @Column(name = "description", length = 2048)
    private String description;
    @Column(name = "sha256_hash", length = 64)
    private String sha256Hash;
    @Column(name = "action_taken", length = 1024)
    private String actionTaken;
    @Column(name = "client_ip")
    private String clientIp;
    @Column(name = "resolved", nullable = false)
    private boolean resolved;

    public SecurityEvent() {}

    @PrePersist
    private void assignEventId() {
        if (eventId == null || eventId.isBlank()) {
            eventId = UUID.randomUUID().toString();
        }
    }

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
