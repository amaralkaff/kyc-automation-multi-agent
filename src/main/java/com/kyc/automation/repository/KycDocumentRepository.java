package com.kyc.automation.repository;

import com.kyc.automation.entity.KycDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface KycDocumentRepository extends JpaRepository<KycDocument, Long> {
}
