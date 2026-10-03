package com.aws.partner.fileexchange.repository;

import com.aws.partner.fileexchange.model.SecurityEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SecurityEventRepository extends JpaRepository<SecurityEvent, String> {

    List<SecurityEvent> findAllByOrderByTimestampDesc();

    List<SecurityEvent> findBySeverityIgnoreCaseOrderByTimestampDesc(String severity);

    long countByResolvedFalse();
}
