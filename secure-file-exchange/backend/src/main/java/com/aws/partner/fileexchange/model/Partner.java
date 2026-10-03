package com.aws.partner.fileexchange.model;

import jakarta.persistence.*;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "partners")
public class Partner {

    @Id
    @Column(name = "partner_id", nullable = false, unique = true, length = 64)
    private String partnerId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "company")
    private String company;

    @Column(name = "contact_email")
    private String contactEmail;

    @Column(name = "access_level", length = 32)
    private String accessLevel; // READ_ONLY, READ_WRITE, ADMIN, ENCRYPTED_ONLY

    @Column(name = "status", length = 32)
    private String status;      // ACTIVE, SUSPENDED

    @Convert(converter = StringListConverter.class)
    @Column(name = "allowed_file_types", length = 512)
    private List<String> allowedFileTypes = new ArrayList<>();

    @Column(name = "max_file_size_mb")
    private long maxFileSizeMb;

    @Column(name = "sftp_username")
    private String sftpUsername;

    @Column(name = "s3_home_prefix")
    private String s3HomePrefix;

    @Column(name = "ip_whitelist")
    private String ipWhitelist;

    @Column(name = "pgp_key_fingerprint")
    private String pgpKeyFingerprint;

    @Column(name = "total_transfers")
    private long totalTransfers;

    @Column(name = "created_at")
    private String createdAt;

    @Column(name = "updated_at")
    private String updatedAt;

    public Partner() {}

    public Partner(String partnerId, String name, String company, String contactEmail,
                   String accessLevel, String status, List<String> allowedFileTypes,
                   long maxFileSizeMb, String sftpUsername, String s3HomePrefix,
                   String ipWhitelist, String pgpKeyFingerprint, long totalTransfers,
                   String createdAt, String updatedAt) {
        this.partnerId = partnerId;
        this.name = name;
        this.company = company;
        this.contactEmail = contactEmail;
        this.accessLevel = accessLevel;
        this.status = status;
        this.allowedFileTypes = allowedFileTypes != null ? allowedFileTypes : new ArrayList<>();
        this.maxFileSizeMb = maxFileSizeMb;
        this.sftpUsername = sftpUsername;
        this.s3HomePrefix = s3HomePrefix;
        this.ipWhitelist = ipWhitelist;
        this.pgpKeyFingerprint = pgpKeyFingerprint;
        this.totalTransfers = totalTransfers;
        this.createdAt = createdAt;
        this.updatedAt = updatedAt;
    }

    public String getPartnerId() { return partnerId; }
    public void setPartnerId(String partnerId) { this.partnerId = partnerId; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getCompany() { return company; }
    public void setCompany(String company) { this.company = company; }

    public String getContactEmail() { return contactEmail; }
    public void setContactEmail(String contactEmail) { this.contactEmail = contactEmail; }

    public String getAccessLevel() { return accessLevel; }
    public void setAccessLevel(String accessLevel) { this.accessLevel = accessLevel; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public List<String> getAllowedFileTypes() { return allowedFileTypes; }
    public void setAllowedFileTypes(List<String> allowedFileTypes) { this.allowedFileTypes = allowedFileTypes; }

    public long getMaxFileSizeMb() { return maxFileSizeMb; }
    public void setMaxFileSizeMb(long maxFileSizeMb) { this.maxFileSizeMb = maxFileSizeMb; }

    public String getSftpUsername() { return sftpUsername; }
    public void setSftpUsername(String sftpUsername) { this.sftpUsername = sftpUsername; }

    public String getS3HomePrefix() { return s3HomePrefix; }
    public void setS3HomePrefix(String s3HomePrefix) { this.s3HomePrefix = s3HomePrefix; }

    public String getIpWhitelist() { return ipWhitelist; }
    public void setIpWhitelist(String ipWhitelist) { this.ipWhitelist = ipWhitelist; }

    public String getPgpKeyFingerprint() { return pgpKeyFingerprint; }
    public void setPgpKeyFingerprint(String pgpKeyFingerprint) { this.pgpKeyFingerprint = pgpKeyFingerprint; }

    public long getTotalTransfers() { return totalTransfers; }
    public void setTotalTransfers(long totalTransfers) { this.totalTransfers = totalTransfers; }

    public String getCreatedAt() { return createdAt; }
    public void setCreatedAt(String createdAt) { this.createdAt = createdAt; }

    public String getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(String updatedAt) { this.updatedAt = updatedAt; }
}
