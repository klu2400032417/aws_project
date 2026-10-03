package com.aws.partner.fileexchange.controller;

import com.aws.partner.fileexchange.model.FileTransfer;
import com.aws.partner.fileexchange.repository.FileTransferRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/transfers")
public class TransferHistoryController {

    private final FileTransferRepository transferRepository;

    @Autowired
    public TransferHistoryController(FileTransferRepository transferRepository) {
        this.transferRepository = transferRepository;
    }

    @GetMapping
    public ResponseEntity<List<FileTransfer>> getTransfers(
            @RequestParam(value = "partnerId", required = false) String partnerId,
            @RequestParam(value = "status", required = false) String status,
            @RequestParam(value = "direction", required = false) String direction,
            @RequestParam(value = "search", required = false) String search) {

        List<FileTransfer> list = transferRepository.findAllByOrderByCreatedAtDesc();

        if (partnerId != null && !partnerId.isBlank()) {
            list = list.stream().filter(t -> partnerId.equalsIgnoreCase(t.getPartnerId())).collect(Collectors.toList());
        }
        if (status != null && !status.isBlank()) {
            list = list.stream().filter(t -> status.equalsIgnoreCase(t.getStatus())).collect(Collectors.toList());
        }
        if (direction != null && !direction.isBlank()) {
            list = list.stream().filter(t -> direction.equalsIgnoreCase(t.getDirection())).collect(Collectors.toList());
        }
        if (search != null && !search.isBlank()) {
            String q = search.toLowerCase();
            list = list.stream().filter(t ->
                    (t.getFileName() != null && t.getFileName().toLowerCase().contains(q)) ||
                    (t.getTransferId() != null && t.getTransferId().toLowerCase().contains(q)) ||
                    (t.getSha256Hash() != null && t.getSha256Hash().toLowerCase().contains(q)) ||
                    (t.getPartnerName() != null && t.getPartnerName().toLowerCase().contains(q))
            ).collect(Collectors.toList());
        }

        return ResponseEntity.ok(list);
    }

    @GetMapping("/{transferId}")
    public ResponseEntity<FileTransfer> getTransferById(@PathVariable String transferId) {
        return transferRepository.findById(transferId)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/duplicate-check")
    public ResponseEntity<Map<String, Object>> checkDuplicate(@RequestParam("hash") String hash) {
        List<FileTransfer> existingTransfers = transferRepository.findAllBySha256HashIgnoreCase(hash);
        if (!existingTransfers.isEmpty()) {
            FileTransfer existing = existingTransfers.get(0);
            return ResponseEntity.ok(Map.of(
                    "isDuplicate", true,
                    "existingTransferId", existing.getTransferId(),
                    "existingFileName", existing.getFileName(),
                    "partnerId", existing.getPartnerId(),
                    "createdAt", existing.getCreatedAt()
            ));
        }
        return ResponseEntity.ok(Map.of("isDuplicate", false));
    }
}
