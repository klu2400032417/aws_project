package com.aws.partner.fileexchange.controller;

import com.aws.partner.fileexchange.model.Partner;
import com.aws.partner.fileexchange.model.S3ObjectInfo;
import com.aws.partner.fileexchange.repository.PartnerRepository;
import com.aws.partner.fileexchange.service.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

@RestController
@RequestMapping("/api/partners")
public class PartnerController {

    private final PartnerRepository partnerRepository;
    private final StorageService storageService;

    @Autowired
    public PartnerController(PartnerRepository partnerRepository, StorageService storageService) {
        this.partnerRepository = partnerRepository;
        this.storageService = storageService;
    }

    @GetMapping
    public ResponseEntity<List<Partner>> getAllPartners() {
        return ResponseEntity.ok(partnerRepository.findAll());
    }

    @GetMapping("/{partnerId}")
    public ResponseEntity<Partner> getPartnerById(@PathVariable String partnerId) {
        return partnerRepository.findById(partnerId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    public ResponseEntity<Partner> createPartner(@RequestBody Partner partner) {
        if (partner.getName() == null || partner.getName().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        partner.setName(partner.getName().trim());
        if (partner.getPartnerId() == null || partner.getPartnerId().isBlank()) {
            partner.setPartnerId("PRT-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        } else {
            partner.setPartnerId(partner.getPartnerId().trim());
        }
        if (partnerRepository.existsById(partner.getPartnerId())) {
            return ResponseEntity.status(HttpStatus.CONFLICT).build();
        }
        if (partner.getAccessLevel() == null || !List.of("READ_ONLY", "READ_WRITE", "ADMIN", "ENCRYPTED_ONLY")
                .contains(partner.getAccessLevel().trim().toUpperCase())) {
            return ResponseEntity.badRequest().build();
        }
        if (partner.getMaxFileSizeMb() <= 0
                || partner.getAllowedFileTypes() == null
                || partner.getAllowedFileTypes().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (partner.getStatus() == null) {
            partner.setStatus("ACTIVE");
        } else if (!isValidStatus(partner.getStatus())) {
            return ResponseEntity.badRequest().build();
        } else {
            partner.setStatus(partner.getStatus().trim().toUpperCase());
        }
        partner.setAccessLevel(partner.getAccessLevel().trim().toUpperCase());
        partner.setS3HomePrefix("partner/" + partner.getPartnerId() + "/");
        String now = Instant.now().toString();
        partner.setTotalTransfers(0);
        partner.setCreatedAt(now);
        partner.setUpdatedAt(now);

        Partner saved = partnerRepository.save(partner);
        return ResponseEntity.status(HttpStatus.CREATED).body(saved);
    }

    @PutMapping("/{partnerId}")
    public ResponseEntity<Partner> updatePartner(@PathVariable String partnerId, @RequestBody Partner updated) {
        Optional<Partner> existing = partnerRepository.findById(partnerId);
        if (existing.isEmpty()) {
            return ResponseEntity.notFound().build();
        }
        Partner p = existing.get();
        if (updated.getName() != null) p.setName(updated.getName());
        if (updated.getCompany() != null) p.setCompany(updated.getCompany());
        if (updated.getContactEmail() != null) p.setContactEmail(updated.getContactEmail());
        if (updated.getAccessLevel() != null) p.setAccessLevel(updated.getAccessLevel());
        if (updated.getStatus() != null) {
            if (!isValidStatus(updated.getStatus())) return ResponseEntity.badRequest().build();
            p.setStatus(updated.getStatus().trim().toUpperCase());
        }
        if (updated.getAllowedFileTypes() != null) p.setAllowedFileTypes(updated.getAllowedFileTypes());
        if (updated.getMaxFileSizeMb() > 0) p.setMaxFileSizeMb(updated.getMaxFileSizeMb());
        if (updated.getIpWhitelist() != null) p.setIpWhitelist(updated.getIpWhitelist());
        if (updated.getPgpKeyFingerprint() != null) p.setPgpKeyFingerprint(updated.getPgpKeyFingerprint());
        p.setUpdatedAt(Instant.now().toString());

        Partner saved = partnerRepository.save(p);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{partnerId}/status")
    public ResponseEntity<Partner> updateStatus(@PathVariable String partnerId, @RequestBody Map<String, String> body) {
        String newStatus = body == null ? null : body.get("status");
        if (!isValidStatus(newStatus)) {
            return ResponseEntity.badRequest().build();
        }
        Optional<Partner> p = partnerRepository.findById(partnerId);
        if (p.isEmpty()) return ResponseEntity.notFound().build();

        Partner partner = p.get();
        partner.setStatus(newStatus.trim().toUpperCase());
        partner.setUpdatedAt(Instant.now().toString());
        partnerRepository.save(partner);
        return ResponseEntity.ok(partner);
    }

    @GetMapping("/{partnerId}/files")
    public ResponseEntity<List<S3ObjectInfo>> getPartnerFiles(@PathVariable String partnerId) {
        return ResponseEntity.ok(storageService.listByPartner(partnerId));
    }

    private boolean isValidStatus(String status) {
        return status != null
                && ("ACTIVE".equalsIgnoreCase(status.trim()) || "SUSPENDED".equalsIgnoreCase(status.trim()));
    }
}
