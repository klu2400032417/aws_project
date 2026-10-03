package com.aws.partner.fileexchange.service;

import com.aws.partner.fileexchange.model.FileTransfer;
import com.aws.partner.fileexchange.model.Partner;
import com.aws.partner.fileexchange.model.SecurityEvent;
import com.aws.partner.fileexchange.model.ValidationResult;
import com.aws.partner.fileexchange.repository.FileTransferRepository;
import com.aws.partner.fileexchange.repository.PartnerRepository;
import com.aws.partner.fileexchange.repository.SecurityEventRepository;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

@Service
public class DemoSeedDataService {
    private static final Logger log = LoggerFactory.getLogger(DemoSeedDataService.class);

    private final PartnerRepository partnerRepository;
    private final FileTransferRepository transferRepository;
    private final SecurityEventRepository securityEventRepository;
    private final StorageService storageService;
    private final CloudWatchMonitoringService cloudWatchService;

    @Autowired
    public DemoSeedDataService(PartnerRepository partnerRepository,
                               FileTransferRepository transferRepository,
                               SecurityEventRepository securityEventRepository,
                               StorageService storageService,
                               CloudWatchMonitoringService cloudWatchService) {
        this.partnerRepository = partnerRepository;
        this.transferRepository = transferRepository;
        this.securityEventRepository = securityEventRepository;
        this.storageService = storageService;
        this.cloudWatchService = cloudWatchService;
    }

    @PostConstruct
    public void seedInitialData() {
        if (!partnerRepository.findAll().isEmpty()) {
            return;
        }

        log.info("Initializing Enterprise Demo Seed Data for Secure Partner File Exchange Platform...");

        Instant now = Instant.now();

        // 1. Seed Partners
        Partner p1 = new Partner("PRT-HEALTHCORP", "HealthCorp Systems", "HealthCorp International",
                "integrations@healthcorp.com", "READ_WRITE", "ACTIVE",
                List.of(".csv", ".json", ".xml", ".pdf", ".pgp"), 25,
                "sftp-healthcorp", "partner/PRT-HEALTHCORP/", "198.51.100.24/32",
                "4A8B-29DF-C71E-9041", 42,
                now.minus(45, ChronoUnit.DAYS).toString(), now.toString());

        Partner p2 = new Partner("PRT-FINTECH-GLOBAL", "FinTech Global Clearing", "FinTech Global B.V.",
                "transfers@fintechglobal.io", "ENCRYPTED_ONLY", "ACTIVE",
                List.of(".pgp", ".json", ".csv", ".xml"), 50,
                "sftp-fintech-global", "partner/PRT-FINTECH-GLOBAL/", "203.0.113.88/28",
                "89EF-781A-D452-1109", 89,
                now.minus(90, ChronoUnit.DAYS).toString(), now.toString());

        Partner p3 = new Partner("PRT-LOGIX-SUPPLY", "Logix Supply Freight", "Logix Logistics Corp",
                "edi@logixsupply.com", "READ_WRITE", "ACTIVE",
                List.of(".xml", ".csv", ".xlsx", ".pdf"), 30,
                "sftp-logix-supply", "partner/PRT-LOGIX-SUPPLY/", "192.0.2.140/32",
                "B671-0023-FA39-8422", 64,
                now.minus(30, ChronoUnit.DAYS).toString(), now.toString());

        Partner p4 = new Partner("PRT-APEX-RETAIL", "Apex Retail Brands", "Apex Retail Holdings",
                "sec-ops@apexretail.com", "READ_ONLY", "SUSPENDED",
                List.of(".csv", ".json"), 15,
                "sftp-apex-retail", "partner/PRT-APEX-RETAIL/", "198.51.100.99/32",
                "7710-CC88-3490-9921", 18,
                now.minus(120, ChronoUnit.DAYS).toString(), now.minus(2, ChronoUnit.DAYS).toString());

        partnerRepository.save(p1);
        partnerRepository.save(p2);
        partnerRepository.save(p3);
        partnerRepository.save(p4);

        // 2. Seed Stored Files & Transfers
        // A. Validated Health Claims CSV
        byte[] claimsData = "ClaimID,PatientID,ProviderID,BilledAmount,DiagnosisCode,ServiceDate\nCLM-90812,PAT-4401,PRV-091,1420.50,I10,2026-10-01\nCLM-90813,PAT-8812,PRV-091,890.00,E11.9,2026-10-01\nCLM-90814,PAT-1204,PRV-104,3200.75,M54.5,2026-10-02\n".getBytes(StandardCharsets.UTF_8);
        String claimsHash = FileValidationService.calculateSha256(claimsData);
        storageService.storeValidated("PRT-HEALTHCORP", "claims_batch_20261001.csv", claimsData, "text/csv", claimsHash);

        FileTransfer tx1 = new FileTransfer();
        tx1.setTransferId("TX-HLTH-88401");
        tx1.setPartnerId("PRT-HEALTHCORP");
        tx1.setPartnerName("HealthCorp Systems");
        tx1.setFileName("claims_batch_20261001.csv");
        tx1.setFileSize(claimsData.length);
        tx1.setSha256Hash(claimsHash);
        tx1.setDirection("INCOMING");
        tx1.setStatus("VALIDATED");
        tx1.setS3Bucket(storageService.getBucketName());
        tx1.setS3Key("partner/PRT-HEALTHCORP/validated/claims_batch_20261001.csv");
        tx1.setMimeType("text/csv");
        tx1.setUploadedBy("sftp-healthcorp");
        tx1.setCreatedAt(now.minus(4, ChronoUnit.HOURS).toString());
        tx1.setCompletedAt(now.minus(4, ChronoUnit.HOURS).plusSeconds(2).toString());
        tx1.setProductionConceptNote("Ingested via AWS Transfer Family SFTP Gateway -> S3 Ingestion prefix");

        ValidationResult vr1 = new ValidationResult(true, "VALIDATED", "Passed all security filters, allowed MIME type verified, SHA-256 integrity confirmed.", claimsHash);
        vr1.setValidatedS3Key("partner/PRT-HEALTHCORP/validated/claims_batch_20261001.csv");
        vr1.setProcessingTimeMs(84);
        vr1.setSecurityFlags(List.of("ANTIVIRUS_CLEAN", "WHITELIST_VERIFIED", "INTEGRITY_CONFIRMED"));
        tx1.setValidationResult(vr1);
        transferRepository.save(tx1);

        // B. Validated Settlement Ledger PGP
        byte[] ledgerData = "-----BEGIN PGP MESSAGE-----\nVersion: BCPG v1.70\nhQGMA5rU92zX8w==\n[Encrypted Financial Settlement Payload: EUR/USD Batch Settlement]\n-----END PGP MESSAGE-----".getBytes(StandardCharsets.UTF_8);
        String ledgerHash = FileValidationService.calculateSha256(ledgerData);
        storageService.storeValidated("PRT-FINTECH-GLOBAL", "fx_settlement_eod_20261002.pgp", ledgerData, "application/pgp-encrypted", ledgerHash);

        FileTransfer tx2 = new FileTransfer();
        tx2.setTransferId("TX-FNTK-19402");
        tx2.setPartnerId("PRT-FINTECH-GLOBAL");
        tx2.setPartnerName("FinTech Global Clearing");
        tx2.setFileName("fx_settlement_eod_20261002.pgp");
        tx2.setFileSize(ledgerData.length);
        tx2.setSha256Hash(ledgerHash);
        tx2.setDirection("INCOMING");
        tx2.setStatus("VALIDATED");
        tx2.setS3Bucket(storageService.getBucketName());
        tx2.setS3Key("partner/PRT-FINTECH-GLOBAL/validated/fx_settlement_eod_20261002.pgp");
        tx2.setMimeType("application/pgp-encrypted");
        tx2.setUploadedBy("sftp-fintech-global");
        tx2.setCreatedAt(now.minus(2, ChronoUnit.HOURS).toString());
        tx2.setCompletedAt(now.minus(2, ChronoUnit.HOURS).plusSeconds(3).toString());
        tx2.setProductionConceptNote("Ingested via AWS Transfer Family SFTP Gateway -> S3 Ingestion prefix");

        ValidationResult vr2 = new ValidationResult(true, "VALIDATED", "Encrypted payload cryptographic verification confirmed, PGP header intact.", ledgerHash);
        vr2.setValidatedS3Key("partner/PRT-FINTECH-GLOBAL/validated/fx_settlement_eod_20261002.pgp");
        vr2.setProcessingTimeMs(112);
        vr2.setSecurityFlags(List.of("PGP_ARMORED_VERIFIED", "WHITELIST_VERIFIED"));
        tx2.setValidationResult(vr2);
        transferRepository.save(tx2);

        // C. Quarantined Malicious Executable Attempt
        byte[] exeData = new byte[]{0x4D, 0x5A, (byte) 0x90, 0x00, 0x03, 0x00, 0x00, 0x00, 0x04, 0x00, 0x00, 0x00, (byte) 0xFF, (byte) 0xFF, 0x53, 0x49, 0x4D, 0x55, 0x4C, 0x41, 0x54, 0x45, 0x44};
        String exeHash = FileValidationService.calculateSha256(exeData);
        storageService.storeQuarantine("PRT-LOGIX-SUPPLY", "customs_update_patch.exe", exeData, "application/octet-stream", exeHash, "Prohibited executable extension .exe");

        FileTransfer tx3 = new FileTransfer();
        tx3.setTransferId("TX-LGX-77301");
        tx3.setPartnerId("PRT-LOGIX-SUPPLY");
        tx3.setPartnerName("Logix Supply Freight");
        tx3.setFileName("customs_update_patch.exe");
        tx3.setFileSize(exeData.length);
        tx3.setSha256Hash(exeHash);
        tx3.setDirection("INCOMING");
        tx3.setStatus("QUARANTINED");
        tx3.setS3Bucket(storageService.getBucketName());
        tx3.setS3Key("partner/PRT-LOGIX-SUPPLY/quarantine/customs_update_patch.exe");
        tx3.setMimeType("application/x-msdownload");
        tx3.setUploadedBy("sftp-logix-supply");
        tx3.setCreatedAt(now.minus(90, ChronoUnit.MINUTES).toString());
        tx3.setCompletedAt(now.minus(90, ChronoUnit.MINUTES).plusSeconds(1).toString());
        tx3.setProductionConceptNote("Triggered automatic Lambda quarantine isolation rule");

        ValidationResult vr3 = new ValidationResult(false, "QUARANTINED", "Security Violation: Restricted executable or script extension (.exe) is strictly prohibited", exeHash);
        vr3.setQuarantinedS3Key("partner/PRT-LOGIX-SUPPLY/quarantine/customs_update_patch.exe");
        vr3.setProcessingTimeMs(35);
        vr3.setSecurityFlags(List.of("SECURITY_ISOLATION_APPLIED", "EXECUTABLE_PROHIBITED"));
        tx3.setValidationResult(vr3);
        transferRepository.save(tx3);

        // D. Duplicate File Transfer
        FileTransfer tx4 = new FileTransfer();
        tx4.setTransferId("TX-HLTH-99014");
        tx4.setPartnerId("PRT-HEALTHCORP");
        tx4.setPartnerName("HealthCorp Systems");
        tx4.setFileName("claims_batch_20261001_copy.csv");
        tx4.setFileSize(claimsData.length);
        tx4.setSha256Hash(claimsHash); // Identical hash to tx1!
        tx4.setDirection("INCOMING");
        tx4.setStatus("DUPLICATE");
        tx4.setS3Bucket(storageService.getBucketName());
        tx4.setS3Key("partner/PRT-HEALTHCORP/quarantine/claims_batch_20261001_copy.csv");
        tx4.setMimeType("text/csv");
        tx4.setUploadedBy("sftp-healthcorp");
        tx4.setCreatedAt(now.minus(30, ChronoUnit.MINUTES).toString());
        tx4.setCompletedAt(now.minus(30, ChronoUnit.MINUTES).plusSeconds(1).toString());

        ValidationResult vr4 = new ValidationResult(false, "DUPLICATE",
                "Duplicate payload detected. Matches existing transfer TX-HLTH-88401 ('claims_batch_20261001.csv') with identical SHA-256 checksum.", claimsHash);
        vr4.setQuarantinedS3Key("partner/PRT-HEALTHCORP/quarantine/claims_batch_20261001_copy.csv");
        vr4.setProcessingTimeMs(42);
        vr4.setSecurityFlags(List.of("DUPLICATE_SHA256", "HASH_COLLISION_VERIFIED"));
        tx4.setValidationResult(vr4);
        transferRepository.save(tx4);

        // E. Outgoing dispatch sample
        byte[] dispatchData = "OrderRef,DispatchDate,TrackingCode,Carrier,DestinationPort\nORD-2026-991,2026-10-03,TRK-8812903,Maersk,Rotterdam\n".getBytes(StandardCharsets.UTF_8);
        String dispatchHash = FileValidationService.calculateSha256(dispatchData);
        storageService.storeOutgoing("PRT-LOGIX-SUPPLY", "export_manifest_dispatch_1003.csv", dispatchData, "text/csv", dispatchHash);

        FileTransfer tx5 = new FileTransfer();
        tx5.setTransferId("TX-OUT-44102");
        tx5.setPartnerId("PRT-LOGIX-SUPPLY");
        tx5.setPartnerName("Logix Supply Freight");
        tx5.setFileName("export_manifest_dispatch_1003.csv");
        tx5.setFileSize(dispatchData.length);
        tx5.setSha256Hash(dispatchHash);
        tx5.setDirection("OUTGOING");
        tx5.setStatus("VALIDATED");
        tx5.setS3Bucket(storageService.getBucketName());
        tx5.setS3Key("partner/PRT-LOGIX-SUPPLY/outgoing/export_manifest_dispatch_1003.csv");
        tx5.setMimeType("text/csv");
        tx5.setUploadedBy("AdminDispatchWorker");
        tx5.setCreatedAt(now.minus(15, ChronoUnit.MINUTES).toString());
        tx5.setCompletedAt(now.minus(15, ChronoUnit.MINUTES).plusSeconds(2).toString());

        ValidationResult vr5 = new ValidationResult(true, "VALIDATED", "Outbound partner payload verified and staged for partner SFTP retrieval.", dispatchHash);
        vr5.setValidatedS3Key("partner/PRT-LOGIX-SUPPLY/outgoing/export_manifest_dispatch_1003.csv");
        vr5.setProcessingTimeMs(65);
        tx5.setValidationResult(vr5);
        transferRepository.save(tx5);

        // 3. Seed Security Events
        securityEventRepository.save(new SecurityEvent(
                "SEC-MAL-101", now.minus(90, ChronoUnit.MINUTES).toString(), "CRITICAL",
                "SUSPICIOUS_EXTENSION_BLOCKED", "PRT-LOGIX-SUPPLY", "Logix Supply Freight",
                "customs_update_patch.exe", "Restricted executable payload (.exe) intercepted by Lambda validation filter",
                exeHash, "Isolated into S3 quarantine path; blocked execution", "192.0.2.140"
        ));

        securityEventRepository.save(new SecurityEvent(
                "SEC-DUP-102", now.minus(30, ChronoUnit.MINUTES).toString(), "WARNING",
                "DUPLICATE_FILE_DETECTED", "PRT-HEALTHCORP", "HealthCorp Systems",
                "claims_batch_20261001_copy.csv", "Duplicate SHA-256 payload (" + claimsHash.substring(0, 10) + "...) matched prior transfer TX-HLTH-88401",
                claimsHash, "Marked as DUPLICATE, security notification dispatched", "198.51.100.24"
        ));

        securityEventRepository.save(new SecurityEvent(
                "SEC-SUSP-103", now.minus(10, ChronoUnit.MINUTES).toString(), "HIGH",
                "SUSPENDED_PARTNER_ATTEMPT", "PRT-APEX-RETAIL", "Apex Retail Brands",
                "october_sales_batch.json", "Access attempt by suspended partner PRT-APEX-RETAIL (Compliance audit hold)",
                "d84f8821901aef34", "Session rejected, transfer blocked", "198.51.100.99"
        ));

        // 4. Seed Initial CloudWatch EMF logs
        cloudWatchService.recordFileReceived("PRT-HEALTHCORP", "claims_batch_20261001.csv", claimsData.length);
        cloudWatchService.recordValidationPassed("PRT-HEALTHCORP", "claims_batch_20261001.csv", claimsHash);
        cloudWatchService.recordSecurityViolation("PRT-LOGIX-SUPPLY", "SUSPICIOUS_EXTENSION_BLOCKED", "CRITICAL", "Prohibited executable intercepted");
        cloudWatchService.recordDuplicateRejected("PRT-HEALTHCORP", "claims_batch_20261001_copy.csv", claimsHash);

        log.info("Enterprise Demo Seed Data successfully loaded: 4 partners, 5 file transfers, 3 security events.");
    }
}
