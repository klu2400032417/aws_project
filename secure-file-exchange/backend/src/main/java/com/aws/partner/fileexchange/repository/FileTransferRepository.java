package com.aws.partner.fileexchange.repository;

import com.aws.partner.fileexchange.model.FileTransfer;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;

import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class FileTransferRepository {
    private static final Logger log = LoggerFactory.getLogger(FileTransferRepository.class);

    private final Map<String, FileTransfer> inMemoryStore = new ConcurrentHashMap<>();
    private final DynamoDbClient dynamoDbClient;

    @Autowired
    public FileTransferRepository(@Autowired(required = false) DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    public List<FileTransfer> findAll() {
        return inMemoryStore.values().stream()
                .sorted((a, b) -> Objects.compare(b.getCreatedAt(), a.getCreatedAt(), Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    public Optional<FileTransfer> findById(String transferId) {
        return Optional.ofNullable(inMemoryStore.get(transferId));
    }

    public List<FileTransfer> findByPartnerId(String partnerId) {
        return inMemoryStore.values().stream()
                .filter(t -> partnerId.equalsIgnoreCase(t.getPartnerId()))
                .sorted((a, b) -> Objects.compare(b.getCreatedAt(), a.getCreatedAt(), Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    public List<FileTransfer> findByStatus(String status) {
        return inMemoryStore.values().stream()
                .filter(t -> status.equalsIgnoreCase(t.getStatus()))
                .sorted((a, b) -> Objects.compare(b.getCreatedAt(), a.getCreatedAt(), Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    public Optional<FileTransfer> findBySha256Hash(String hash) {
        if (hash == null || hash.isBlank()) return Optional.empty();
        return inMemoryStore.values().stream()
                .filter(t -> hash.equalsIgnoreCase(t.getSha256Hash()))
                .findFirst();
    }

    public List<FileTransfer> findRecent(int limit) {
        return inMemoryStore.values().stream()
                .sorted((a, b) -> Objects.compare(b.getCreatedAt(), a.getCreatedAt(), Comparator.nullsLast(Comparator.naturalOrder())))
                .limit(limit)
                .collect(Collectors.toList());
    }

    public long count() {
        return inMemoryStore.size();
    }

    public long countByStatus(String status) {
        return inMemoryStore.values().stream()
                .filter(t -> status.equalsIgnoreCase(t.getStatus()))
                .count();
    }

    public FileTransfer save(FileTransfer transfer) {
        if (transfer.getTransferId() == null || transfer.getTransferId().isBlank()) {
            transfer.setTransferId("TX-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
        }
        inMemoryStore.put(transfer.getTransferId(), transfer);

        if (dynamoDbClient != null) {
            try {
                Map<String, AttributeValue> item = new HashMap<>();
                item.put("transferId", AttributeValue.builder().s(transfer.getTransferId()).build());
                item.put("partnerId", AttributeValue.builder().s(transfer.getPartnerId() != null ? transfer.getPartnerId() : "UNKNOWN").build());
                item.put("fileName", AttributeValue.builder().s(transfer.getFileName() != null ? transfer.getFileName() : "").build());
                item.put("fileSize", AttributeValue.builder().n(String.valueOf(transfer.getFileSize())).build());
                item.put("sha256Hash", AttributeValue.builder().s(transfer.getSha256Hash() != null ? transfer.getSha256Hash() : "").build());
                item.put("status", AttributeValue.builder().s(transfer.getStatus() != null ? transfer.getStatus() : "INCOMING").build());
                item.put("direction", AttributeValue.builder().s(transfer.getDirection() != null ? transfer.getDirection() : "INCOMING").build());
                item.put("s3Key", AttributeValue.builder().s(transfer.getS3Key() != null ? transfer.getS3Key() : "").build());
                item.put("createdAt", AttributeValue.builder().s(transfer.getCreatedAt() != null ? transfer.getCreatedAt() : "").build());

                PutItemRequest request = PutItemRequest.builder()
                        .tableName("PartnerFileTransfers")
                        .item(item)
                        .build();
                dynamoDbClient.putItem(request);
                log.info("Recorded transfer {} to DynamoDB PartnerFileTransfers table", transfer.getTransferId());
            } catch (Exception e) {
                log.debug("DynamoDB save skipped/failed (in-memory active): {}", e.getMessage());
            }
        }
        return transfer;
    }

    public void clear() {
        inMemoryStore.clear();
    }
}
