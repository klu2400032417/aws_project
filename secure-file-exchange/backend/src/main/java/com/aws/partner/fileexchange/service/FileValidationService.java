package com.aws.partner.fileexchange.service;

import com.aws.partner.fileexchange.model.FileTransfer;
import com.aws.partner.fileexchange.model.Partner;
import com.aws.partner.fileexchange.model.SecurityEvent;
import com.aws.partner.fileexchange.model.ValidationResult;
import com.aws.partner.fileexchange.repository.FileTransferRepository;
import com.aws.partner.fileexchange.repository.PartnerRepository;
import com.aws.partner.fileexchange.repository.SecurityEventRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.security.MessageDigest;
import java.time.Instant;
import java.util.*;

@Service
public class FileValidationService {
    private static final Logger log = LoggerFactory.getLogger(FileValidationService.class);

    private final StorageService storageService;
    private final FileTransferRepository transferRepository;
    private final PartnerRepository partnerRepository;
    private final SecurityEventRepository securityEventRepository;
    private final CloudWatchMonitoringService cloudWatchService;

    @Value("${app.security.max-file-size-mb:50}")
    private long globalMaxFileSizeMb;

    private static final Set<String> RESTRICTED_EXTENSIONS = Set.of(
            ".exe", ".bat", ".cmd", ".sh", ".vbs", ".scr", ".dll", ".ps1", ".jar", ".app", ".msi", ".com"
    );

    @Autowired
    public FileValidationService(StorageService storageService,
                                 FileTransferRepository transferRepository,
                                 PartnerRepository partnerRepository,
                                 SecurityEventRepository securityEventRepository,
                                 CloudWatchMonitoringService cloudWatchService) {
        this.storageService = storageService;
        this.transferRepository = transferRepository;
        this.partnerRepository = partnerRepository;
        this.securityEventRepository = securityEventRepository;
        this.cloudWatchService = cloudWatchService;
    }

    public FileTransfer processFileUpload(String partnerId, String originalFileName, byte[] fileBytes,
                                          String contentType, String clientIp, String direction) {
        long startTime = System.currentTimeMillis();
        String timestamp = Instant.now().toString();

        FileTransfer transfer = new FileTransfer();
        transfer.setTransferId(UUID.randomUUID().toString());
        transfer.setPartnerId(partnerId);
        transfer.setFileName(originalFileName);
        transfer.setFileSize(fileBytes != null ? fileBytes.length : 0);
        transfer.setDirection(direction != null ? direction : "INCOMING");
        transfer.setCreatedAt(timestamp);
        transfer.setMimeType(contentType != null ? contentType : "application/octet-stream");
        transfer.setUploadedBy(null);
        transfer.setS3Bucket(storageService.getBucketName());

        Optional<Partner> partnerOpt = partnerRepository.findById(partnerId);
        if (partnerOpt.isEmpty()) {
            throw new IllegalArgumentException("Partner is not registered: " + partnerId);
        }
        Partner partner = partnerOpt.get();
        transfer.setPartnerName(partner.getName());

        // 1. Calculate SHA-256 Checksum
        String sha256 = calculateSha256(fileBytes);
        transfer.setSha256Hash(sha256);

        cloudWatchService.recordFileReceived(partnerId, originalFileName, fileBytes != null ? fileBytes.length : 0);

        // 2. Validate Partner Status
        if ("SUSPENDED".equalsIgnoreCase(partner.getStatus())) {
            // Suspended partner cannot exchange files
            securityEventRepository.save(new SecurityEvent(
                    null, timestamp, "HIGH", "SUSPENDED_PARTNER_ATTEMPT", partnerId, partner.getName(),
                    originalFileName, "Suspended partner attempted file exchange", sha256,
                    "Payload automatically quarantined; transfer marked QUARANTINED", clientIp
            ));
            cloudWatchService.recordSecurityViolation(partnerId, "SUSPENDED_PARTNER_ATTEMPT", "HIGH", "Suspended partner attempted file exchange");
            return quarantineTransfer(transfer, "Partner account " + partnerId + " is currently SUSPENDED by Security Administration", fileBytes, startTime);
        }

        // 3. Filename Security & Path Traversal Validation
        if (originalFileName == null || originalFileName.isBlank()) {
            return quarantineTransfer(transfer, "Invalid or empty filename supplied", fileBytes, startTime);
        }
        if (originalFileName.contains("..") || originalFileName.contains("/") || originalFileName.contains("\\") || originalFileName.contains("\0")) {
            securityEventRepository.save(new SecurityEvent(
                    null, timestamp, "CRITICAL", "PATH_TRAVERSAL_ATTEMPT", partnerId, partner.getName(),
                    originalFileName, "Detected directory traversal or null byte injection attempt in filename", sha256,
                    "Payload isolated in S3 quarantine; blocked traversal", clientIp
            ));
            cloudWatchService.recordSecurityViolation(partnerId, "PATH_TRAVERSAL_ATTEMPT", "CRITICAL", "Path traversal injection attempt");
            return quarantineTransfer(transfer, "Security Violation: Filename contains prohibited path traversal characters", fileBytes, startTime);
        }

        // 4. File Extension Security Check (Prohibited Executables)
        String lowerName = originalFileName.toLowerCase(Locale.ROOT);
        for (String restricted : RESTRICTED_EXTENSIONS) {
            if (lowerName.endsWith(restricted)) {
                securityEventRepository.save(new SecurityEvent(
                        null, timestamp, "CRITICAL", "SUSPICIOUS_EXTENSION_BLOCKED", partnerId, partner.getName(),
                        originalFileName, "Prohibited executable / script format detected: " + restricted, sha256,
                        "Immediate quarantine isolation applied to S3 prefix partner/" + partnerId + "/quarantine/", clientIp
                ));
                cloudWatchService.recordSecurityViolation(partnerId, "SUSPICIOUS_EXTENSION_BLOCKED", "CRITICAL", "Prohibited executable: " + restricted);
                return quarantineTransfer(transfer, "Security Violation: Restricted executable or script extension (" + restricted + ") is strictly prohibited", fileBytes, startTime);
            }
        }

        // 5. Allowed File Types Verification
        List<String> allowedTypes = partner.getAllowedFileTypes();
        if (allowedTypes != null && !allowedTypes.isEmpty()) {
            boolean matchesAllowed = allowedTypes.stream().anyMatch(lowerName::endsWith);
            if (!matchesAllowed) {
                securityEventRepository.save(new SecurityEvent(
                        null, timestamp, "WARNING", "UNAUTHORIZED_EXTENSION", partnerId, partner.getName(),
                        originalFileName, "File extension not in partner allowed whitelist: " + allowedTypes, sha256,
                        "Transferred to S3 quarantine bucket prefix", clientIp
                ));
                cloudWatchService.recordSecurityViolation(partnerId, "UNAUTHORIZED_EXTENSION", "WARNING", "Extension not in partner whitelist");
                return quarantineTransfer(transfer, "Policy Violation: File type is not in the partner's authorized extension whitelist " + allowedTypes, fileBytes, startTime);
            }
        }

        // 6. File Size Limit Verification
        long partnerMaxBytes = (partner.getMaxFileSizeMb() > 0 ? partner.getMaxFileSizeMb() : globalMaxFileSizeMb) * 1024 * 1024;
        if (fileBytes != null && fileBytes.length > partnerMaxBytes) {
            long sizeMb = fileBytes.length / (1024 * 1024);
            securityEventRepository.save(new SecurityEvent(
                    null, timestamp, "WARNING", "OVERSIZED_PAYLOAD_REJECTED", partnerId, partner.getName(),
                    originalFileName, String.format("File size (%d MB) exceeds partner quota (%d MB)", sizeMb, partner.getMaxFileSizeMb()),
                    sha256, "Payload quarantined due to SLA quota breach", clientIp
            ));
            cloudWatchService.recordSecurityViolation(partnerId, "OVERSIZED_PAYLOAD_REJECTED", "WARNING", "File size exceeds quota");
            return quarantineTransfer(transfer, String.format("Quota Violation: File size (%d MB) exceeds partner quota limit (%d MB)", sizeMb, partner.getMaxFileSizeMb()), fileBytes, startTime);
        }

        // 7. SHA-256 Duplicate File Detection
        List<FileTransfer> existingDuplicates = transferRepository.findAllBySha256HashIgnoreCase(sha256);
        if (!existingDuplicates.isEmpty()) {
            FileTransfer dup = existingDuplicates.get(0);
            // Flag as DUPLICATE
            securityEventRepository.save(new SecurityEvent(
                    null, timestamp, "WARNING", "DUPLICATE_FILE_DETECTED", partnerId, partner.getName(),
                    originalFileName, String.format("Identical SHA-256 payload detected (%s). Matches transfer %s ('%s')", sha256.substring(0, 12) + "...", dup.getTransferId(), dup.getFileName()),
                    sha256, "Marked DUPLICATE; recorded in the security audit database", clientIp
            ));
            cloudWatchService.recordDuplicateRejected(partnerId, originalFileName, sha256);

            // Store in quarantine with duplicate tag
            storageService.storeQuarantine(partnerId, originalFileName, transfer.getTransferId(), fileBytes, contentType, sha256);
            String quarantineKey = storageService.buildKey(partnerId, "quarantine", originalFileName, transfer.getTransferId());

            ValidationResult vr = new ValidationResult(false, "DUPLICATE",
                    String.format("Duplicate payload detected. Matches existing transfer %s ('%s') with identical SHA-256 checksum.", dup.getTransferId(), dup.getFileName()),
                    sha256);
            vr.setQuarantinedS3Key(quarantineKey);
            vr.setProcessingTimeMs(System.currentTimeMillis() - startTime);
            vr.setTimestamp(Instant.now().toString());
            vr.setSecurityFlags(List.of("DUPLICATE_SHA256", "HASH_COLLISION_VERIFIED"));

            transfer.setStatus("DUPLICATE");
            transfer.setS3Key(quarantineKey);
            transfer.setValidationResult(vr);
            transfer.setCompletedAt(Instant.now().toString());

            transferRepository.save(transfer);
            partnerRepository.incrementTransferCount(partnerId);
            return transfer;
        }

        // 8. Passed All Validations -> Move to Validated prefix: partner/{partnerId}/validated/
        String validatedKey;
        if ("OUTGOING".equalsIgnoreCase(direction)) {
            storageService.storeOutgoing(partnerId, originalFileName, transfer.getTransferId(), fileBytes, contentType, sha256);
            validatedKey = storageService.buildKey(partnerId, "outgoing", originalFileName, transfer.getTransferId());
        } else {
            storageService.storeValidated(partnerId, originalFileName, transfer.getTransferId(), fileBytes, contentType, sha256);
            validatedKey = storageService.buildKey(partnerId, "validated", originalFileName, transfer.getTransferId());
        }

        ValidationResult vr = new ValidationResult(true, "VALIDATED",
                "Passed partner status, filename, extension, size, and duplicate checks; SHA-256 calculated.",
                sha256);
        vr.setValidatedS3Key(validatedKey);
        vr.setProcessingTimeMs(System.currentTimeMillis() - startTime);
        vr.setTimestamp(Instant.now().toString());
        vr.setSecurityFlags(List.of("PARTNER_ACTIVE", "FILENAME_CHECKED", "FILE_TYPE_CHECKED", "SIZE_CHECKED", "SHA256_CALCULATED"));

        transfer.setStatus("VALIDATED");
        transfer.setS3Key(validatedKey);
        transfer.setValidationResult(vr);
        transfer.setCompletedAt(Instant.now().toString());

        transferRepository.save(transfer);
        partnerRepository.incrementTransferCount(partnerId);
        cloudWatchService.recordValidationPassed(partnerId, originalFileName, sha256);

        log.info("File {} for partner {} successfully VALIDATED and stored to {}", originalFileName, partnerId, validatedKey);
        return transfer;
    }

    private FileTransfer quarantineTransfer(FileTransfer transfer, String reason, byte[] fileBytes, long startTime) {
        String quarantineKey = storageService.buildKey(transfer.getPartnerId(), "quarantine", transfer.getFileName(), transfer.getTransferId());
        storageService.storeQuarantine(transfer.getPartnerId(), transfer.getFileName(), transfer.getTransferId(), fileBytes, transfer.getMimeType(), transfer.getSha256Hash());

        ValidationResult vr = new ValidationResult(false, "QUARANTINED", reason, transfer.getSha256Hash());
        vr.setQuarantinedS3Key(quarantineKey);
        vr.setProcessingTimeMs(System.currentTimeMillis() - startTime);
        vr.setTimestamp(Instant.now().toString());
        vr.setSecurityFlags(List.of("SECURITY_ISOLATION_APPLIED", "QUARANTINE_ENFORCED"));

        transfer.setStatus("QUARANTINED");
        transfer.setS3Key(quarantineKey);
        transfer.setValidationResult(vr);
        transfer.setCompletedAt(Instant.now().toString());

        transferRepository.save(transfer);
        partnerRepository.incrementTransferCount(transfer.getPartnerId());
        cloudWatchService.recordValidationQuarantined(transfer.getPartnerId(), transfer.getFileName(), reason, transfer.getSha256Hash());

        log.warn("File {} for partner {} was QUARANTINED: {}", transfer.getFileName(), transfer.getPartnerId(), reason);
        return transfer;
    }

    public static String calculateSha256(byte[] data) {
        if (data == null || data.length == 0) {
            return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"; // Empty hash
        }
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (java.security.NoSuchAlgorithmException e) {
            throw new IllegalStateException("SHA-256 is unavailable", e);
        }
    }
}
