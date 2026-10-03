package com.aws.partner.fileexchange.repository;

import com.aws.partner.fileexchange.model.Partner;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.List;

@Repository
public interface PartnerRepository extends JpaRepository<Partner, String> {

    long countByStatusIgnoreCase(String status);

    List<Partner> findByStatusIgnoreCase(String status);

    @Modifying
    @Transactional
    @Query("UPDATE Partner p SET p.totalTransfers = p.totalTransfers + 1, p.updatedAt = :now WHERE p.partnerId = :partnerId")
    void updateTransferCountDirect(@Param("partnerId") String partnerId, @Param("now") String now);

    default void incrementTransferCount(String partnerId) {
        updateTransferCountDirect(partnerId, Instant.now().toString());
    }
}
