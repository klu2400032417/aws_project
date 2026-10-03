package com.aws.partner.fileexchange.repository;

import com.aws.partner.fileexchange.model.SecurityEvent;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Repository;
import software.amazon.awssdk.services.dynamodb.DynamoDbClient;
import software.amazon.awssdk.services.dynamodb.model.AttributeValue;
import software.amazon.awssdk.services.dynamodb.model.PutItemRequest;

import java.time.Instant;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.stream.Collectors;

@Repository
public class SecurityEventRepository {
    private static final Logger log = LoggerFactory.getLogger(SecurityEventRepository.class);

    private final Map<String, SecurityEvent> inMemoryStore = new ConcurrentHashMap<>();
    private final DynamoDbClient dynamoDbClient;

    @Autowired
    public SecurityEventRepository(@Autowired(required = false) DynamoDbClient dynamoDbClient) {
        this.dynamoDbClient = dynamoDbClient;
    }

    public List<SecurityEvent> findAll() {
        return inMemoryStore.values().stream()
                .sorted((a, b) -> Objects.compare(b.getTimestamp(), a.getTimestamp(), Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    public List<SecurityEvent> findRecent(int limit) {
        return inMemoryStore.values().stream()
                .sorted((a, b) -> Objects.compare(b.getTimestamp(), a.getTimestamp(), Comparator.nullsLast(Comparator.naturalOrder())))
                .limit(limit)
                .collect(Collectors.toList());
    }

    public List<SecurityEvent> findBySeverity(String severity) {
        return inMemoryStore.values().stream()
                .filter(e -> severity.equalsIgnoreCase(e.getSeverity()))
                .sorted((a, b) -> Objects.compare(b.getTimestamp(), a.getTimestamp(), Comparator.nullsLast(Comparator.naturalOrder())))
                .collect(Collectors.toList());
    }

    public Optional<SecurityEvent> findById(String eventId) {
        return Optional.ofNullable(inMemoryStore.get(eventId));
    }

    public long count() {
        return inMemoryStore.size();
    }

    public long countUnresolved() {
        return inMemoryStore.values().stream().filter(e -> !e.isResolved()).count();
    }

    public SecurityEvent save(SecurityEvent event) {
        if (event.getEventId() == null || event.getEventId().isBlank()) {
            event.setEventId("SEC-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase());
        }
        if (event.getTimestamp() == null) {
            event.setTimestamp(Instant.now().toString());
        }
        inMemoryStore.put(event.getEventId(), event);

        if (dynamoDbClient != null) {
            try {
                Map<String, AttributeValue> item = new HashMap<>();
                item.put("eventId", AttributeValue.builder().s(event.getEventId()).build());
                item.put("timestamp", AttributeValue.builder().s(event.getTimestamp()).build());
                item.put("severity", AttributeValue.builder().s(event.getSeverity()).build());
                item.put("eventType", AttributeValue.builder().s(event.getEventType()).build());
                item.put("partnerId", AttributeValue.builder().s(event.getPartnerId() != null ? event.getPartnerId() : "").build());
                item.put("description", AttributeValue.builder().s(event.getDescription() != null ? event.getDescription() : "").build());

                PutItemRequest request = PutItemRequest.builder()
                        .tableName("SecurityEvents")
                        .item(item)
                        .build();
                dynamoDbClient.putItem(request);
            } catch (Exception e) {
                log.debug("DynamoDB SecurityEvent save skipped/failed: {}", e.getMessage());
            }
        }
        return event;
    }

    public boolean markResolved(String eventId) {
        SecurityEvent event = inMemoryStore.get(eventId);
        if (event != null) {
            event.setResolved(true);
            return true;
        }
        return false;
    }

    public void clear() {
        inMemoryStore.clear();
    }
}
