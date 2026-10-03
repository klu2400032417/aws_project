package com.aws.partner.fileexchange.service;

import com.aws.partner.fileexchange.config.AwsConfig;
import com.aws.partner.fileexchange.model.S3ObjectInfo;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import software.amazon.awssdk.core.ResponseBytes;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.*;

import java.io.File;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Service
public class StorageService {
    private static final Logger log = LoggerFactory.getLogger(StorageService.class);

    @Value("${aws.s3.bucket-name:secure-partner-file-exchange-lab}")
    private String bucketName;

    @Value("${app.storage.local-root:./storage}")
    private String localStorageRoot;

    private final S3Client s3Client;
    private final AwsConfig awsConfig;

    // High-fidelity in-memory S3 cache holding key -> metadata & content bytes
    private final Map<String, S3StoredFile> localS3Store = new ConcurrentHashMap<>();

    public static class S3StoredFile {
        private final String key;
        private final String bucket;
        private final byte[] data;
        private final String contentType;
        private final String eTag;
        private final String sha256;
        private final Instant lastModified;
        private final String partnerId;
        private final String category;
        private final String fileName;
        private String status;

        public S3StoredFile(String key, String bucket, byte[] data, String contentType,
                            String eTag, String sha256, Instant lastModified,
                            String partnerId, String category, String fileName, String status) {
            this.key = key;
            this.bucket = bucket;
            this.data = data;
            this.contentType = contentType;
            this.eTag = eTag;
            this.sha256 = sha256;
            this.lastModified = lastModified;
            this.partnerId = partnerId;
            this.category = category;
            this.fileName = fileName;
            this.status = status;
        }

        public String getKey() { return key; }
        public String getBucket() { return bucket; }
        public byte[] getData() { return data; }
        public String getContentType() { return contentType; }
        public String getETag() { return eTag; }
        public String getSha256() { return sha256; }
        public Instant getLastModified() { return lastModified; }
        public String getPartnerId() { return partnerId; }
        public String getCategory() { return category; }
        public String getFileName() { return fileName; }
        public String getStatus() { return status; }
        public void setStatus(String status) { this.status = status; }
    }

    @Autowired
    public StorageService(@Autowired(required = false) S3Client s3Client, AwsConfig awsConfig) {
        this.s3Client = s3Client;
        this.awsConfig = awsConfig;
    }

    public String buildKey(String partnerId, String category, String fileName) {
        return String.format("partner/%s/%s/%s", partnerId, category, sanitizeFileName(fileName));
    }

    public S3StoredFile storeIncoming(String partnerId, String fileName, byte[] data, String contentType, String sha256) {
        String key = buildKey(partnerId, "incoming", fileName);
        return store(key, partnerId, "incoming", fileName, data, contentType, sha256, "INCOMING");
    }

    public S3StoredFile storeValidated(String partnerId, String fileName, byte[] data, String contentType, String sha256) {
        String key = buildKey(partnerId, "validated", fileName);
        // Clean incoming if it was there
        String incomingKey = buildKey(partnerId, "incoming", fileName);
        delete(incomingKey);
        return store(key, partnerId, "validated", fileName, data, contentType, sha256, "VALIDATED");
    }

    public S3StoredFile storeQuarantine(String partnerId, String fileName, byte[] data, String contentType, String sha256, String reason) {
        String key = buildKey(partnerId, "quarantine", fileName);
        // Clean incoming if it was there
        String incomingKey = buildKey(partnerId, "incoming", fileName);
        delete(incomingKey);
        return store(key, partnerId, "quarantine", fileName, data, contentType, sha256, "QUARANTINED");
    }

    public S3StoredFile storeOutgoing(String partnerId, String fileName, byte[] data, String contentType, String sha256) {
        String key = buildKey(partnerId, "outgoing", fileName);
        return store(key, partnerId, "outgoing", fileName, data, contentType, sha256, "VALIDATED");
    }

    private S3StoredFile store(String key, String partnerId, String category, String fileName,
                              byte[] data, String contentType, String sha256, String status) {
        String eTag = "\"" + UUID.randomUUID().toString().replace("-", "").substring(0, 16) + "\"";
        Instant now = Instant.now();

        // 1. Store in memory store
        S3StoredFile stored = new S3StoredFile(key, bucketName, data, contentType, eTag, sha256, now, partnerId, category, fileName, status);
        localS3Store.put(key, stored);

        // 2. Persist locally to disk backup if possible
        persistToLocalDisk(key, data);

        // 3. Store to real AWS S3 if client is configured
        if (s3Client != null && awsConfig.isAwsCredentialsAvailable()) {
            try {
                PutObjectRequest putReq = PutObjectRequest.builder()
                        .bucket(bucketName)
                        .key(key)
                        .contentType(contentType != null ? contentType : "application/octet-stream")
                        .metadata(Map.of(
                                "partner-id", partnerId,
                                "file-category", category,
                                "sha256-hash", sha256 != null ? sha256 : "",
                                "status", status
                        ))
                        .build();
                s3Client.putObject(putReq, RequestBody.fromBytes(data));
                log.info("Uploaded to AWS S3: s3://{}/{}", bucketName, key);
            } catch (Exception e) {
                log.warn("S3 AWS upload attempt failed ({}) -> maintained in High-Fidelity Local S3 store", e.getMessage());
            }
        }

        return stored;
    }

    public byte[] getFileBytes(String key) {
        S3StoredFile file = localS3Store.get(key);
        if (file != null) {
            return file.getData();
        }
        if (s3Client != null && awsConfig.isAwsCredentialsAvailable()) {
            try {
                GetObjectRequest getReq = GetObjectRequest.builder().bucket(bucketName).key(key).build();
                ResponseBytes<GetObjectResponse> responseBytes = s3Client.getObjectAsBytes(getReq);
                return responseBytes.asByteArray();
            } catch (Exception e) {
                log.debug("AWS S3 fetch failed for key: {}", key);
            }
        }
        return null;
    }

    public boolean delete(String key) {
        boolean existed = localS3Store.remove(key) != null;
        if (s3Client != null && awsConfig.isAwsCredentialsAvailable()) {
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucketName).key(key).build());
            } catch (Exception e) {
                log.debug("AWS S3 delete failed for key: {}", key);
            }
        }
        return existed;
    }

    public List<S3ObjectInfo> listAllObjects() {
        return localS3Store.values().stream()
                .map(this::mapToInfo)
                .sorted((a, b) -> Objects.compare(b.getLastModified(), a.getLastModified(), Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    public List<S3ObjectInfo> listByPartner(String partnerId) {
        return localS3Store.values().stream()
                .filter(f -> partnerId.equalsIgnoreCase(f.getPartnerId()))
                .map(this::mapToInfo)
                .collect(Collectors.toList());
    }

    public List<S3ObjectInfo> listByCategory(String category) {
        return localS3Store.values().stream()
                .filter(f -> category.equalsIgnoreCase(f.getCategory()))
                .map(this::mapToInfo)
                .collect(Collectors.toList());
    }

    private S3ObjectInfo mapToInfo(S3StoredFile f) {
        return new S3ObjectInfo(
                f.getKey(),
                f.getBucket(),
                f.getPartnerId(),
                f.getCategory(),
                f.getFileName(),
                f.getData() != null ? f.getData().length : 0,
                f.getETag(),
                "STANDARD",
                f.getLastModified().toString(),
                f.getSha256(),
                f.getStatus()
        );
    }

    private void persistToLocalDisk(String s3Key, byte[] data) {
        try {
            Path targetPath = Paths.get(localStorageRoot, s3Key.replace('/', File.separatorChar));
            Files.createDirectories(targetPath.getParent());
            Files.write(targetPath, data);
        } catch (Exception e) {
            log.trace("Local disk storage backup write skipped: {}", e.getMessage());
        }
    }

    private String sanitizeFileName(String name) {
        if (name == null) return "unknown";
        return Paths.get(name).getFileName().toString().replaceAll("[^a-zA-Z0-9._-]", "_");
    }

    public String getBucketName() {
        return bucketName;
    }

    public int getStoredCount() {
        return localS3Store.size();
    }
}
