package com.aws.partner.fileexchange.model;

public class FileTransfer {
    private String transferId;
    private String partnerId;
    private String partnerName;
    private String fileName;
    private long fileSize;
    private String sha256Hash;
    private String direction; // INCOMING, OUTGOING
    private String status;    // VALIDATED, QUARANTINED, DUPLICATE, FAILED
    private String s3Bucket;
    private String s3Key;
    private String incomingS3Key;
    private ValidationResult validationResult;
    private String mimeType;
    private String uploadedBy;
    private String createdAt;
    private String completedAt;
    private String productionConceptNote;

    public FileTransfer() {}

    public String getTransferId() { return transferId; }
    public void setTransferId(String transferId) { this.transferId = transferId; }

    public String getPartnerId() { return partnerId; }
    public void setPartnerId(String partnerId) { this.partnerId = partnerId; }

    public String getPartnerName() { return partnerName; }
    public void setPartnerName(String partnerName) { this.partnerName = partnerName; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public long getFileSize() { return fileSize; }
    public void setFileSize(long fileSize) { this.fileSize = fileSize; }

    public String getSha256Hash() { return sha256Hash; }
    public void setSha256Hash(String sha256Hash) { this.sha256Hash = sha256Hash; }

    public String getDirection() { return direction; }
    public void setDirection(String direction) { this.direction = direction; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getS3Bucket() { return s3Bucket; }
    public void setS3Bucket(String s3Bucket) { this.s3Bucket = s3Bucket; }

    public String getS3Key() { return s3Key; }
    public void setS3Key(String s3Key) { this.s3Key = s3Key; }

    public String getIncomingS3Key() { return incomingS3Key; }
    public void setIncomingS3Key(String incomingS3Key) { this.incomingS3Key = incomingS3Key; }

    public ValidationResult getValidationResult() { return validationResult; }
    public void setValidationResult(ValidationResult validationResult) { this.validationResult = validationResult; }

    public String getMimeType() { return mimeType; }
    public void setMimeType(String mimeType) { this.mimeType = mimeType; }

    public String getUploadedBy() { return uploadedBy; }
    public void setUploadedBy(String uploadedBy) { this.uploadedBy = uploadedBy; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getCompletedAt() { return completedAt; }
    public void setCompletedAt(String completedAt) { this.completedAt = completedAt; }

    public String getProductionConceptNote() { return productionConceptNote; }
    public void setProductionConceptNote(String productionConceptNote) { this.productionConceptNote = productionConceptNote; }
}
