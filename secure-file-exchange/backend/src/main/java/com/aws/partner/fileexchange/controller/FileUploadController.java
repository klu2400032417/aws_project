package com.aws.partner.fileexchange.controller;

import com.aws.partner.fileexchange.model.FileTransfer;
import com.aws.partner.fileexchange.model.S3ObjectInfo;
import com.aws.partner.fileexchange.repository.FileTransferRepository;
import com.aws.partner.fileexchange.repository.PartnerRepository;
import com.aws.partner.fileexchange.service.FileValidationService;
import com.aws.partner.fileexchange.service.StorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.*;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {

    private final FileValidationService validationService;
    private final StorageService storageService;
    private final FileTransferRepository transferRepository;
    private final PartnerRepository partnerRepository;

    @Autowired
    public FileUploadController(FileValidationService validationService,
                                StorageService storageService,
                                FileTransferRepository transferRepository,
                                PartnerRepository partnerRepository) {
        this.validationService = validationService;
        this.storageService = storageService;
        this.transferRepository = transferRepository;
        this.partnerRepository = partnerRepository;
    }

    @PostMapping(value = "/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<FileTransfer> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("partnerId") String partnerId,
            @RequestParam(value = "direction", defaultValue = "INCOMING") String direction,
            HttpServletRequest request) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        try {
            String clientIp = request.getRemoteAddr();
            String fileName = file.getOriginalFilename();
            byte[] fileBytes = file.getBytes();
            String contentType = file.getContentType();

            FileTransfer result = validationService.processFileUpload(partnerId, fileName, fileBytes, contentType, clientIp, direction);
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            return ResponseEntity.internalServerError().build();
        }
    }

    @PostMapping("/quick-test")
    public ResponseEntity<FileTransfer> runQuickTestPayload(
            @RequestBody Map<String, String> payload,
            HttpServletRequest request) {

        String testType = payload.getOrDefault("testType", "VALID_CLAIMS_CSV");
        String partnerId = payload.getOrDefault("partnerId", "PRT-HEALTHCORP");
        String clientIp = request.getRemoteAddr();

        String fileName;
        byte[] content;
        String contentType;

        switch (testType) {
            case "MALICIOUS_EXE":
                fileName = "trojan_patch_v2.exe";
                content = new byte[]{0x4D, 0x5A, (byte) 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, (byte) 0xFF, (byte) 0xFF, 0x54, 0x52, 0x4F, 0x4A, 0x41, 0x4E};
                contentType = "application/x-msdownload";
                break;

            case "DUPLICATE_PAYLOAD":
                // Use identical content as the seeded claims file
                fileName = "retransmitted_duplicate_claims.csv";
                content = "ClaimID,PatientID,ProviderID,BilledAmount,DiagnosisCode,ServiceDate\nCLM-90812,PAT-4401,PRV-091,1420.50,I10,2026-10-01\nCLM-90813,PAT-8812,PRV-091,890.00,E11.9,2026-10-01\nCLM-90814,PAT-1204,PRV-104,3200.75,M54.5,2026-10-02\n".getBytes(StandardCharsets.UTF_8);
                contentType = "text/csv";
                break;

            case "SUSPENDED_PARTNER_ATTEMPT":
                partnerId = "PRT-APEX-RETAIL"; // Suspended partner
                fileName = "inventory_q4_feed.json";
                content = "{\"store\":\"101\",\"stock\":[{\"sku\":\"APX-990\",\"qty\":450}]}".getBytes(StandardCharsets.UTF_8);
                contentType = "application/json";
                break;

            case "OVERSIZED_XML":
                fileName = "oversized_bulk_dataset.xml";
                // Generate a payload that exceeds partner quota (simulated flag)
                partnerId = "PRT-APEX-RETAIL";
                content = new byte[16 * 1024 * 1024]; // 16MB exceeds 15MB limit
                Arrays.fill(content, (byte) 'A');
                contentType = "application/xml";
                break;

            case "ENCRYPTED_PGP":
                partnerId = "PRT-FINTECH-GLOBAL";
                fileName = "wire_clearing_settlement_" + System.currentTimeMillis() + ".pgp";
                content = ("-----BEGIN PGP MESSAGE-----\nVersion: BCPG v1.70\nhQGMA5rU92zX8w==\n[Encrypted settlement transfer payload: " + UUID.randomUUID() + "]\n-----END PGP MESSAGE-----").getBytes(StandardCharsets.UTF_8);
                contentType = "application/pgp-encrypted";
                break;

            case "VALID_CLAIMS_CSV":
            default:
                partnerId = "PRT-HEALTHCORP";
                fileName = "medicaid_claims_batch_" + (System.currentTimeMillis() % 100000) + ".csv";
                content = ("ClaimID,PatientID,ProviderID,BilledAmount,DiagnosisCode,ServiceDate\nCLM-" + UUID.randomUUID().toString().substring(0, 5).toUpperCase() + ",PAT-991,PRV-332,1950.00,Z00.00," + Instant.now() + "\n").getBytes(StandardCharsets.UTF_8);
                contentType = "text/csv";
                break;
        }

        FileTransfer result = validationService.processFileUpload(partnerId, fileName, content, contentType, clientIp, "INCOMING");
        return ResponseEntity.ok(result);
    }

    @GetMapping("/s3-explorer")
    public ResponseEntity<List<S3ObjectInfo>> getS3ExplorerObjects(
            @RequestParam(value = "partnerId", required = false) String partnerId,
            @RequestParam(value = "category", required = false) String category) {

        if (partnerId != null && !partnerId.isBlank()) {
            return ResponseEntity.ok(storageService.listByPartner(partnerId));
        }
        if (category != null && !category.isBlank()) {
            return ResponseEntity.ok(storageService.listByCategory(category));
        }
        return ResponseEntity.ok(storageService.listAllObjects());
    }

    @GetMapping("/download")
    public ResponseEntity<byte[]> downloadFile(@RequestParam("key") String key) {
        byte[] data = storageService.getFileBytes(key);
        if (data == null) {
            return ResponseEntity.notFound().build();
        }
        String fileName = key.substring(key.lastIndexOf('/') + 1);
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + fileName + "\"")
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(data);
    }

    @DeleteMapping
    public ResponseEntity<Map<String, Object>> deleteFile(@RequestParam("key") String key) {
        boolean deleted = storageService.delete(key);
        return ResponseEntity.ok(Map.of("deleted", deleted, "key", key));
    }
}
