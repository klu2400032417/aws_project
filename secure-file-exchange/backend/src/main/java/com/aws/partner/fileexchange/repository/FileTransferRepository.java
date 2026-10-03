package com.aws.partner.fileexchange.repository;

import com.aws.partner.fileexchange.model.FileTransfer;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileTransferRepository extends JpaRepository<FileTransfer, String> {

    List<FileTransfer> findByPartnerIdIgnoreCaseOrderByCreatedAtDesc(String partnerId);

    List<FileTransfer> findByStatusIgnoreCaseOrderByCreatedAtDesc(String status);

    List<FileTransfer> findAllBySha256HashIgnoreCase(String sha256Hash);

    List<FileTransfer> findAllByOrderByCreatedAtDesc(Pageable pageable);

    List<FileTransfer> findAllByOrderByCreatedAtDesc();

    long countByStatusIgnoreCase(String status);
}
