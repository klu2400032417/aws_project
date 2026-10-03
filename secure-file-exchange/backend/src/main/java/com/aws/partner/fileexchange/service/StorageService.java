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
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.security.MessageDigest;
import java.util.*;
import java.util.stream.Collectors;

@Service
public class StorageService {
    private static final Logger log = LoggerFactory.getLogger(StorageService.class);

    @Value("${aws.s3.bucket-name:}")
    private String bucketName;

    @Value("${app.storage.local-root:./data/storage}")
    private String localStorageRoot;

    private final S3Client s3Client;
    private final AwsConfig awsConfig;

    @Autowired
    public StorageService(@Autowired(required = false) S3Client s3Client, AwsConfig awsConfig) {
        this.s3Client = s3Client;
        this.awsConfig = awsConfig;
    }

    public String buildKey(String partnerId, String category, String fileName, String transferId) {
        return String.format("partner/%s/%s/%s_%s", partnerId, category,
                sanitizeFileName(transferId), sanitizeFileName(fileName));
    }

    public void storeValidated(String partnerId, String fileName, String transferId, byte[] data, String contentType, String sha256) {
        String key = buildKey(partnerId, "validated", fileName, transferId);
        store(key, partnerId, "validated", data, contentType, sha256, "VALIDATED");
    }

    public void storeQuarantine(String partnerId, String fileName, String transferId, byte[] data, String contentType, String sha256) {
        String key = buildKey(partnerId, "quarantine", fileName, transferId);
        store(key, partnerId, "quarantine", data, contentType, sha256, "QUARANTINED");
    }

    public void storeOutgoing(String partnerId, String fileName, String transferId, byte[] data, String contentType, String sha256) {
        String key = buildKey(partnerId, "outgoing", fileName, transferId);
        store(key, partnerId, "outgoing", data, contentType, sha256, "VALIDATED");
    }

    private void store(String key, String partnerId, String category,
                       byte[] data, String contentType, String sha256, String status) {
        if (isAwsStorageEnabled()) {
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
                throw new IllegalStateException("Failed to persist uploaded object to S3: " + key, e);
            }
        }

        persistToLocalDisk(key, data);
    }

    public byte[] getFileBytes(String key) {
        Path localPath = localPathForKey(key);
        if (Files.isRegularFile(localPath)) {
            try {
                return Files.readAllBytes(localPath);
            } catch (IOException e) {
                throw new IllegalStateException("Failed to read stored file: " + key, e);
            }
        }
        if (isAwsStorageEnabled()) {
            try {
                GetObjectRequest getReq = GetObjectRequest.builder().bucket(bucketName).key(key).build();
                ResponseBytes<GetObjectResponse> responseBytes = s3Client.getObjectAsBytes(getReq);
                return responseBytes.asByteArray();
            } catch (Exception e) {
                if (isNotFound(e)) return null;
                throw new IllegalStateException("Failed to fetch S3 object: " + key, e);
            }
        }
        return null;
    }

    public boolean delete(String key) {
        Path localPath = localPathForKey(key);
        boolean existed = Files.exists(localPath);
        if (isAwsStorageEnabled()) {
            try {
                s3Client.headObject(HeadObjectRequest.builder().bucket(bucketName).key(key).build());
                existed = true;
                s3Client.deleteObject(DeleteObjectRequest.builder().bucket(bucketName).key(key).build());
            } catch (Exception e) {
                if (!isNotFound(e)) {
                    throw new IllegalStateException("Failed to delete S3 object: " + key, e);
                }
            }
        }
        try {
            Files.deleteIfExists(localPath);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to delete local file: " + key, e);
        }
        return existed;
    }

    public List<S3ObjectInfo> listAllObjects() {
        if (isAwsStorageEnabled()) {
            List<S3ObjectInfo> objects = new ArrayList<>();
            try {
                for (S3Object object : s3Client.listObjectsV2Paginator(
                        ListObjectsV2Request.builder().bucket(bucketName).build()).contents()) {
                    String key = object.key();
                    String[] parts = key.split("/", 4);
                    if (parts.length < 4 || !"partner".equals(parts[0])) continue;
                    String category = parts[2];
                    String fileName = parts[3];
                    objects.add(new S3ObjectInfo(
                            key, bucketName, parts[1], category, fileName, object.size(),
                            object.eTag(), object.storageClassAsString(),
                            object.lastModified() == null ? null : object.lastModified().toString(),
                            null, category.toUpperCase(Locale.ROOT)
                    ));
                }
                return objects;
            } catch (Exception e) {
                throw new IllegalStateException("Failed to list objects from S3 bucket: " + bucketName, e);
            }
        }
        return listLocalObjects();
    }

    public List<S3ObjectInfo> listByPartner(String partnerId) {
        return listAllObjects().stream()
                .filter(f -> partnerId.equalsIgnoreCase(f.getPartnerId()))
                .collect(Collectors.toList());
    }

    public List<S3ObjectInfo> listByCategory(String category) {
        return listAllObjects().stream()
                .filter(f -> category.equalsIgnoreCase(f.getCategory()))
                .collect(Collectors.toList());
    }

    private List<S3ObjectInfo> listLocalObjects() {
        Path root = Paths.get(localStorageRoot).toAbsolutePath().normalize();
        if (!Files.exists(root)) return List.of();
        try (var paths = Files.walk(root)) {
            return paths.filter(Files::isRegularFile)
                    .map(path -> localObjectInfo(root, path))
                    .filter(Objects::nonNull)
                    .sorted(Comparator.comparing(S3ObjectInfo::getLastModified,
                            Comparator.nullsLast(Comparator.reverseOrder())))
                    .collect(Collectors.toList());
        } catch (IOException e) {
            throw new IllegalStateException("Failed to list locally stored objects", e);
        }
    }

    private S3ObjectInfo localObjectInfo(Path root, Path path) {
        String key = root.relativize(path).toString().replace(File.separatorChar, '/');
        String[] parts = key.split("/", 4);
        if (parts.length < 4 || !"partner".equals(parts[0])) return null;
        try {
            var attributes = Files.readAttributes(path, java.nio.file.attribute.BasicFileAttributes.class);
            return new S3ObjectInfo(key, getBucketName(), parts[1], parts[2], parts[3],
                    attributes.size(), null, null, attributes.lastModifiedTime().toInstant().toString(),
                    calculateSha256(path), parts[2].toUpperCase(Locale.ROOT));
        } catch (IOException e) {
            throw new IllegalStateException("Failed to inspect stored file: " + path, e);
        }
    }

    private String calculateSha256(Path path) throws IOException {
        try (var input = Files.newInputStream(path)) {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] buffer = new byte[8192];
            int read;
            while ((read = input.read(buffer)) != -1) digest.update(buffer, 0, read);
            return HexFormat.of().formatHex(digest.digest());
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }

    private void persistToLocalDisk(String s3Key, byte[] data) {
        try {
            Path targetPath = localPathForKey(s3Key);
            Files.createDirectories(targetPath.getParent());
            Files.write(targetPath, data);
        } catch (Exception e) {
            throw new IllegalStateException("Failed to persist local file: " + s3Key, e);
        }
    }

    private Path localPathForKey(String key) {
        Path root = Paths.get(localStorageRoot).toAbsolutePath().normalize();
        Path target = root.resolve(key).normalize();
        if (!target.startsWith(root)) {
            throw new IllegalArgumentException("Invalid storage key");
        }
        return target;
    }

    private String sanitizeFileName(String name) {
        if (name == null || name.isBlank()) return "file";
        String baseName = name.replace('\\', '/');
        baseName = baseName.substring(baseName.lastIndexOf('/') + 1);
        String sanitized = baseName.replaceAll("[^a-zA-Z0-9._-]", "_");
        return sanitized.isBlank() || ".".equals(sanitized) || "..".equals(sanitized) ? "file" : sanitized;
    }

    public String getBucketName() {
        return bucketName == null ? "" : bucketName;
    }

    public String getStorageLocation() {
        return isAwsStorageEnabled() ? "s3://" + bucketName : Paths.get(localStorageRoot).toAbsolutePath().normalize().toString();
    }

    public boolean isAwsStorageEnabled() {
        return s3Client != null && awsConfig.isAwsCredentialsAvailable()
                && bucketName != null && !bucketName.isBlank();
    }

    private boolean isNotFound(Exception exception) {
        return exception instanceof NoSuchKeyException
                || exception instanceof S3Exception s3Exception && s3Exception.statusCode() == 404;
    }

    public int getStoredCount() {
        return listAllObjects().size();
    }
}
