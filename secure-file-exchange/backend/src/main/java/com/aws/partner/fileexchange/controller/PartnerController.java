package com.aws.partner.fileexchange.controller;

import com.aws.partner.fileexchange.model.Partner;
import com.aws.partner.fileexchange.model.S3ObjectInfo;
import com.aws.partner.fileexchange.repository.PartnerRepository;
import com.aws.partner.fileexchange.service.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

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
        if (partner.getPartnerId() == null || partner.getPartnerId().isBlank()) {
            String slug = partner.getName().replaceAll("[^a-zA-Z0-9]", "").toUpperCase();
            partner.setPartnerId("PRT-" + (slug.length() > 8 ? slug.substring(0, 8) : slug));
        }
        if (partner.getStatus() == null) {
            partner.setStatus("ACTIVE");
        }
        if (partner.getAccessLevel() == null) {
            partner.setAccessLevel("READ_WRITE");
        }
        if (partner.getMaxFileSizeMb() <= 0) {
            partner.setMaxFileSizeMb(25);
        }
        if (partner.getAllowedFileTypes() == null || partner.getAllowedFileTypes().isEmpty()) {
            partner.setAllowedFileTypes(List.of(".csv", ".json", ".xml", ".pdf"));
        }
        partner.setS3HomePrefix("partner/" + partner.getPartnerId() + "/");
        if (partner.getSftpUsername() == null) {
            partner.setSftpUsername("sftp-" + partner.getPartnerId().toLowerCase());
        }
        partner.setCreatedAt(Instant.now().toString());

        Partner saved = partnerRepository.save(partner);
        return ResponseEntity.ok(saved);
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
        if (updated.getStatus() != null) p.setStatus(updated.getStatus());
        if (updated.getAllowedFileTypes() != null) p.setAllowedFileTypes(updated.getAllowedFileTypes());
        if (updated.getMaxFileSizeMb() > 0) p.setMaxFileSizeMb(updated.getMaxFileSizeMb());
        if (updated.getIpWhitelist() != null) p.setIpWhitelist(updated.getIpWhitelist());
        if (updated.getPgpKeyFingerprint() != null) p.setPgpKeyFingerprint(updated.getPgpKeyFingerprint());

        Partner saved = partnerRepository.save(p);
        return ResponseEntity.ok(saved);
    }

    @PatchMapping("/{partnerId}/status")
    public ResponseEntity<Partner> updateStatus(@PathVariable String partnerId, @RequestBody Map<String, String> body) {
        String newStatus = body.get("status");
        if (newStatus == null || (!newStatus.equalsIgnoreCase("ACTIVE") && !newStatus.equalsIgnoreCase("SUSPENDED"))) {
            return ResponseEntity.badRequest().build();
        }
        Optional<Partner> p = partnerRepository.findById(partnerId);
        if (p.isEmpty()) return ResponseEntity.notFound().build();

        Partner partner = p.get();
        partner.setStatus(newStatus.toUpperCase());
        partnerRepository.save(partner);
        return ResponseEntity.ok(partner);
    }

    @GetMapping("/{partnerId}/files")
    public ResponseEntity<List<S3ObjectInfo>> getPartnerFiles(@PathVariable String partnerId) {
        return ResponseEntity.ok(storageService.listByPartner(partnerId));
    }
}
