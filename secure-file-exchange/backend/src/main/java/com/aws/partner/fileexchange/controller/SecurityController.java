package com.aws.partner.fileexchange.controller;

import com.aws.partner.fileexchange.model.FileTransfer;
import com.aws.partner.fileexchange.model.S3ObjectInfo;
import com.aws.partner.fileexchange.model.SecurityEvent;
import com.aws.partner.fileexchange.repository.FileTransferRepository;
import com.aws.partner.fileexchange.repository.SecurityEventRepository;
import com.aws.partner.fileexchange.service.StorageService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/security")
public class SecurityController {

    private final SecurityEventRepository securityEventRepository;
    private final FileTransferRepository fileTransferRepository;
    private final StorageService storageService;

    @Autowired
    public SecurityController(SecurityEventRepository securityEventRepository,
                              FileTransferRepository fileTransferRepository,
                              StorageService storageService) {
        this.securityEventRepository = securityEventRepository;
        this.fileTransferRepository = fileTransferRepository;
        this.storageService = storageService;
    }

    @GetMapping("/events")
    public ResponseEntity<List<SecurityEvent>> getSecurityEvents(
            @RequestParam(value = "severity", required = false) String severity) {
        if (severity != null && !severity.isBlank()) {
            return ResponseEntity.ok(securityEventRepository.findBySeverity(severity));
        }
        return ResponseEntity.ok(securityEventRepository.findAll());
    }

    @GetMapping("/quarantined")
    public ResponseEntity<List<FileTransfer>> getQuarantinedTransfers() {
        return ResponseEntity.ok(fileTransferRepository.findByStatus("QUARANTINED"));
    }

    @GetMapping("/quarantined-s3")
    public ResponseEntity<List<S3ObjectInfo>> getQuarantinedS3Objects() {
        return ResponseEntity.ok(storageService.listByCategory("quarantine"));
    }

    @PostMapping("/events/{eventId}/resolve")
    public ResponseEntity<Map<String, Object>> resolveSecurityEvent(@PathVariable String eventId) {
        boolean resolved = securityEventRepository.markResolved(eventId);
        return ResponseEntity.ok(Map.of("eventId", eventId, "resolved", resolved));
    }
}
