package com.aws.partner.fileexchange.model;

import jakarta.persistence.Column;
import jakarta.persistence.Embedded;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "file_transfers")
public class FileTransfer {
    @Id
    @Column(name = "transfer_id", nullable = false, length = 64)
    private String transferId;
    @Column(name = "partner_id", nullable = false, length = 64)
    private String partnerId;
    @Column(name = "partner_name")
    private String partnerName;
    @Column(name = "file_name")
    private String fileName;
    @Column(name = "file_size", nullable = false)
    private long fileSize;
    @Column(name = "sha256_hash", length = 64)
    private String sha256Hash;
    @Column(name = "direction", length = 16)
    private String direction; // INCOMING, OUTGOING
    @Column(name = "status", length = 32)
    private String status;    // VALIDATED, QUARANTINED, DUPLICATE, FAILED
    @Column(name = "s3_bucket")
    private String s3Bucket;
    @Column(name = "s3_key")
    private String s3Key;
    @Column(name = "incoming_s3_key")
    private String incomingS3Key;
    @Embedded
    private ValidationResult validationResult;
    @Column(name = "mime_type")
    private String mimeType;
    @Column(name = "uploaded_by")
    private String uploadedBy;
    @Column(name = "created_at")
    private String createdAt;
    @Column(name = "completed_at")
    private String completedAt;
    @Column(name = "production_concept_note", length = 1024)
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
