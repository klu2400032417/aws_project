package com.aws.partner.fileexchange.controller;

import com.aws.partner.fileexchange.model.FileTransfer;
import com.aws.partner.fileexchange.model.S3ObjectInfo;
import com.aws.partner.fileexchange.repository.PartnerRepository;
import com.aws.partner.fileexchange.service.FileValidationService;
import com.aws.partner.fileexchange.service.StorageService;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@RestController
@RequestMapping("/api/files")
public class FileUploadController {
    private static final Logger log = LoggerFactory.getLogger(FileUploadController.class);

    private final FileValidationService validationService;
    private final StorageService storageService;
    private final PartnerRepository partnerRepository;

    @Autowired
    public FileUploadController(FileValidationService validationService,
                                StorageService storageService,
                                PartnerRepository partnerRepository) {
        this.validationService = validationService;
        this.storageService = storageService;
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
        if (file.getOriginalFilename() == null || file.getOriginalFilename().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        if (!partnerRepository.existsById(partnerId)) {
            return ResponseEntity.notFound().build();
        }
        if (!"INCOMING".equalsIgnoreCase(direction) && !"OUTGOING".equalsIgnoreCase(direction)) {
            return ResponseEntity.badRequest().build();
        }

        try {
            FileTransfer result = validationService.processFileUpload(
                    partnerId,
                    file.getOriginalFilename(),
                    file.getBytes(),
                    file.getContentType(),
                    request.getRemoteAddr(),
                    direction.toUpperCase(Locale.ROOT)
            );
            return ResponseEntity.ok(result);
        } catch (IOException e) {
            log.error("Unable to read uploaded file for partner {}", partnerId, e);
            return ResponseEntity.internalServerError().build();
        }
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
