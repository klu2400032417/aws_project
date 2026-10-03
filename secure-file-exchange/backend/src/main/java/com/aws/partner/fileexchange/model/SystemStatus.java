package com.aws.partner.fileexchange.model;

import java.util.Map;

public class SystemStatus {
    private boolean awsConnected;
    private String executionMode; // "AWS_HYBRID" or "HIGH_FIDELITY_SIMULATION"
    private String region;
    private String s3Bucket;
    private boolean s3Ready;
    private boolean dynamoDbReady;
    private boolean cloudWatchReady;
    private String transferFamilyStatus; // "PRODUCTION_CONCEPT_ONLY"
    private String transferFamilyNote;
    private String learnerLabConstraintDetails;
    private Map<String, Object> storageStats;

    public SystemStatus() {}

    public boolean isAwsConnected() { return awsConnected; }
    public void setAwsConnected(boolean awsConnected) { this.awsConnected = awsConnected; }

    public String getExecutionMode() { return executionMode; }
    public void setExecutionMode(String executionMode) { this.executionMode = executionMode; }

    public String getRegion() { return region; }
    public void setRegion(String region) { this.region = region; }

    public String getS3Bucket() { return s3Bucket; }
    public void setS3Bucket(String s3Bucket) { this.s3Bucket = s3Bucket; }

    public boolean isS3Ready() { return s3Ready; }
    public void setS3Ready(boolean s3Ready) { this.s3Ready = s3Ready; }

    public boolean isDynamoDbReady() { return dynamoDbReady; }
    public void setDynamoDbReady(boolean dynamoDbReady) { this.dynamoDbReady = dynamoDbReady; }

    public boolean isCloudWatchReady() { return cloudWatchReady; }
    public void setCloudWatchReady(boolean cloudWatchReady) { this.cloudWatchReady = cloudWatchReady; }

    public String getTransferFamilyStatus() { return transferFamilyStatus; }
    public void setTransferFamilyStatus(String transferFamilyStatus) { this.transferFamilyStatus = transferFamilyStatus; }

    public String getTransferFamilyNote() { return transferFamilyNote; }
    public void setTransferFamilyNote(String transferFamilyNote) { this.transferFamilyNote = transferFamilyNote; }

    public String getLearnerLabConstraintDetails() { return learnerLabConstraintDetails; }
    public void setLearnerLabConstraintDetails(String learnerLabConstraintDetails) { this.learnerLabConstraintDetails = learnerLabConstraintDetails; }

    public Map<String, Object> getStorageStats() { return storageStats; }
    public void setStorageStats(Map<String, Object> storageStats) { this.storageStats = storageStats; }
}
