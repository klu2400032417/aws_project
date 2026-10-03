package com.aws.partner.fileexchange.controller;

import com.aws.partner.fileexchange.model.DashboardStats;
import com.aws.partner.fileexchange.model.FileTransfer;
import com.aws.partner.fileexchange.model.Partner;
import com.aws.partner.fileexchange.repository.FileTransferRepository;
import com.aws.partner.fileexchange.repository.PartnerRepository;
import com.aws.partner.fileexchange.repository.SecurityEventRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.*;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/dashboard")
public class DashboardController {

    private final PartnerRepository partnerRepository;
    private final FileTransferRepository transferRepository;
    private final SecurityEventRepository securityEventRepository;

    @Autowired
    public DashboardController(PartnerRepository partnerRepository,
                               FileTransferRepository transferRepository,
                               SecurityEventRepository securityEventRepository) {
        this.partnerRepository = partnerRepository;
        this.transferRepository = transferRepository;
        this.securityEventRepository = securityEventRepository;
    }

    @GetMapping("/stats")
    public ResponseEntity<DashboardStats> getDashboardStats() {
        DashboardStats stats = new DashboardStats();

        List<Partner> partners = partnerRepository.findAll();
        stats.setTotalPartners(partners.size());
        stats.setActivePartners(partners.stream().filter(p -> "ACTIVE".equalsIgnoreCase(p.getStatus())).count());
        stats.setSuspendedPartners(partners.stream().filter(p -> "SUSPENDED".equalsIgnoreCase(p.getStatus())).count());

        List<FileTransfer> transfers = transferRepository.findAll();
        stats.setTotalTransfers(transfers.size());

        long validated = transfers.stream().filter(t -> "VALIDATED".equalsIgnoreCase(t.getStatus())).count();
        long quarantined = transfers.stream().filter(t -> "QUARANTINED".equalsIgnoreCase(t.getStatus())).count();
        long duplicates = transfers.stream().filter(t -> "DUPLICATE".equalsIgnoreCase(t.getStatus())).count();
        long failed = transfers.stream().filter(t -> "FAILED".equalsIgnoreCase(t.getStatus())).count();

        stats.setSuccessfulTransfers(validated);
        stats.setQuarantinedFiles(quarantined);
        stats.setDuplicateFiles(duplicates);
        stats.setFailedTransfers(failed);

        stats.setTotalSecurityEvents(securityEventRepository.count());

        long totalBytes = transfers.stream().mapToLong(FileTransfer::getFileSize).sum();
        stats.setTotalBytesTransferred(totalBytes);

        double rate = transfers.isEmpty() ? 100.0 : ((double) validated / transfers.size()) * 100.0;
        stats.setSuccessRatePercent(Math.round(rate * 10.0) / 10.0);

        // Chart 1: Status distribution
        List<Map<String, Object>> statusBreakdown = List.of(
                Map.of("name", "Validated", "value", validated, "color", "#10b981"),
                Map.of("name", "Quarantined", "value", quarantined, "color", "#ef4444"),
                Map.of("name", "Duplicate", "value", duplicates, "color", "#f59e0b"),
                Map.of("name", "Failed", "value", failed, "color", "#64748b")
        );
        stats.setFilesByStatus(statusBreakdown);

        // Chart 2: Hourly activity timeline simulation
        List<Map<String, Object>> hourly = List.of(
                Map.of("time", "12:00", "transfers", 12, "bytes", 4500000, "violations", 1),
                Map.of("time", "13:00", "transfers", 19, "bytes", 7200000, "violations", 0),
                Map.of("time", "14:00", "transfers", 15, "bytes", 5800000, "violations", 2),
                Map.of("time", "15:00", "transfers", 28, "bytes", 11200000, "violations", 1),
                Map.of("time", "16:00", "transfers", 35, "bytes", 14500000, "violations", 0),
                Map.of("time", "17:00", "transfers", 22, "bytes", 8900000, "violations", 1),
                Map.of("time", "18:00", "transfers", (int) Math.max(8, transfers.size() * 2), "bytes", (int) Math.max(3000000, totalBytes), "violations", (int) quarantined)
        );
        stats.setTransfersByHour(hourly);

        // Chart 3: Partner Volume
        List<Map<String, Object>> partnerVol = partners.stream().map(p -> {
            long count = transfers.stream().filter(t -> p.getPartnerId().equalsIgnoreCase(t.getPartnerId())).count();
            return Map.<String, Object>of(
                    "partnerId", p.getPartnerId(),
                    "name", p.getName(),
                    "transfers", count,
                    "status", p.getStatus()
            );
        }).collect(Collectors.toList());
        stats.setPartnerVolume(partnerVol);

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/recent")
    public ResponseEntity<List<FileTransfer>> getRecentTransfers() {
        return ResponseEntity.ok(transferRepository.findRecent(10));
    }
}
