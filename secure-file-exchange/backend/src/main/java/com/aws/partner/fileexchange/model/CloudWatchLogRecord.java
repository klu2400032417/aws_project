package com.aws.partner.fileexchange.model;

import java.util.Map;

public class CloudWatchLogRecord {
    private String timestamp;
    private String level;
    private String logger;
    private String message;
    private String eventType;
    private String partnerId;
    private String transferId;
    private Map<String, Object> dimensions;
    private Map<String, Object> metrics;

    public CloudWatchLogRecord() {}

    public CloudWatchLogRecord(String timestamp, String level, String logger, String message,
                               String eventType, String partnerId, String transferId,
                               Map<String, Object> dimensions, Map<String, Object> metrics) {
        this.timestamp = timestamp;
        this.level = level;
        this.logger = logger;
        this.message = message;
        this.eventType = eventType;
        this.partnerId = partnerId;
        this.transferId = transferId;
        this.dimensions = dimensions;
        this.metrics = metrics;
    }

    public String getTimestamp() { return timestamp; }
    public void setTimestamp(String timestamp) { this.timestamp = timestamp; }

    public String getLevel() { return level; }
    public void setLevel(String level) { this.level = level; }

    public String getLogger() { return logger; }
    public void setLogger(String logger) { this.logger = logger; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getEventType() { return eventType; }
    public void setEventType(String eventType) { this.eventType = eventType; }

    public String getPartnerId() { return partnerId; }
    public void setPartnerId(String partnerId) { this.partnerId = partnerId; }

    public String getTransferId() { return transferId; }
    public void setTransferId(String transferId) { this.transferId = transferId; }

    public Map<String, Object> getDimensions() { return dimensions; }
    public void setDimensions(Map<String, Object> dimensions) { this.dimensions = dimensions; }

    public Map<String, Object> getMetrics() { return metrics; }
    public void setMetrics(Map<String, Object> metrics) { this.metrics = metrics; }
}
