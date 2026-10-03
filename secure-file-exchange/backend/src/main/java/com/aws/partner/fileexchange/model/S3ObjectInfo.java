package com.aws.partner.fileexchange.model;

public class S3ObjectInfo {
    private String key;
    private String bucket;
    private String partnerId;
    private String category; // "incoming", "outgoing", "validated", "quarantine"
    private String fileName;
    private long size;
    private String eTag;
    private String storageClass;
    private String lastModified;
    private String sha256Hash;
    private String status;

    public S3ObjectInfo() {}

    public S3ObjectInfo(String key, String bucket, String partnerId, String category,
                        String fileName, long size, String eTag, String storageClass,
                        String lastModified, String sha256Hash, String status) {
        this.key = key;
        this.bucket = bucket;
        this.partnerId = partnerId;
        this.category = category;
        this.fileName = fileName;
        this.size = size;
        this.eTag = eTag;
        this.storageClass = storageClass;
        this.lastModified = lastModified;
        this.sha256Hash = sha256Hash;
        this.status = status;
    }

    public String getKey() { return key; }
    public void setKey(String key) { this.key = key; }

    public String getBucket() { return bucket; }
    public void setBucket(String bucket) { this.bucket = bucket; }

    public String getPartnerId() { return partnerId; }
    public void setPartnerId(String partnerId) { this.partnerId = partnerId; }

    public String getCategory() { return category; }
    public void setCategory(String category) { this.category = category; }

    public String getFileName() { return fileName; }
    public void setFileName(String fileName) { this.fileName = fileName; }

    public long getSize() { return size; }
    public void setSize(long size) { this.size = size; }

    public String getETag() { return eTag; }
    public void setETag(String eTag) { this.eTag = eTag; }

    public String getStorageClass() { return storageClass; }
    public void setStorageClass(String storageClass) { this.storageClass = storageClass; }

    public String getLastModified() { return lastModified; }
    public void setLastModified(String lastModified) { this.lastModified = lastModified; }

    public String getSha256Hash() { return sha256Hash; }
    public void setSha256Hash(String sha256Hash) { this.sha256Hash = sha256Hash; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }
}
