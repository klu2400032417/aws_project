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

import java.time.Instant;
import java.time.ZoneOffset;
import java.util.*;
import java.util.stream.Collectors;
import org.springframework.data.domain.PageRequest;

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
        stats.setTotalPartners(partnerRepository.count());
        stats.setActivePartners(partnerRepository.countByStatusIgnoreCase("ACTIVE"));
        stats.setSuspendedPartners(partnerRepository.countByStatusIgnoreCase("SUSPENDED"));

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

        double rate = transfers.isEmpty() ? 0.0 : ((double) validated / transfers.size()) * 100.0;
        stats.setSuccessRatePercent(Math.round(rate * 10.0) / 10.0);

        // Chart 1: Status distribution
        List<Map<String, Object>> statusBreakdown = List.of(
                Map.of("name", "Validated", "value", validated, "color", "#10b981"),
                Map.of("name", "Quarantined", "value", quarantined, "color", "#ef4444"),
                Map.of("name", "Duplicate", "value", duplicates, "color", "#f59e0b"),
                Map.of("name", "Failed", "value", failed, "color", "#64748b")
        );
        stats.setFilesByStatus(statusBreakdown);

        // Chart 2: Activity grouped from persisted transfer timestamps.
        Map<String, Map<String, Object>> hourlyByTime = new TreeMap<>();
        for (FileTransfer transfer : transfers) {
            if (transfer.getCreatedAt() == null) continue;
            try {
                Instant createdAt = Instant.parse(transfer.getCreatedAt());
                String hour = createdAt.atZone(ZoneOffset.UTC).truncatedTo(java.time.temporal.ChronoUnit.HOURS).toString();
                Map<String, Object> point = hourlyByTime.computeIfAbsent(hour, key -> {
                    Map<String, Object> bucket = new HashMap<>();
                    bucket.put("time", key);
                    bucket.put("transfers", 0L);
                    bucket.put("bytes", 0L);
                    bucket.put("violations", 0L);
                    return bucket;
                });
                point.compute("transfers", (key, value) -> (Long) value + 1);
                point.compute("bytes", (key, value) -> (Long) value + transfer.getFileSize());
                if ("QUARANTINED".equalsIgnoreCase(transfer.getStatus())) {
                    point.compute("violations", (key, value) -> (Long) value + 1);
                }
            } catch (java.time.format.DateTimeParseException e) {
                // Ignore legacy records without a parseable timestamp in the time-series chart.
            }
        }
        List<Map<String, Object>> hourly = new ArrayList<>(hourlyByTime.values());
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
        return ResponseEntity.ok(transferRepository.findAllByOrderByCreatedAtDesc(PageRequest.of(0, 10)));
    }
}
