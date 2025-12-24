package com.kyc.automation.repository;

import com.kyc.automation.entity.KycApplication;
import com.kyc.automation.entity.KycStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface KycApplicationRepository extends JpaRepository<KycApplication, Long> {
    
    List<KycApplication> findByCustomerId(Long customerId);
    
    List<KycApplication> findByStatus(KycStatus status);
    
    Optional<KycApplication> findByProviderApplicantId(String providerApplicantId);
    
    Optional<KycApplication> findByCaseId(String caseId);
    
    /**
     * Find applications that need manual review.
     * Either status is UNDER_REVIEW or requiresManualReview is true.
     */
    @Query("SELECT a FROM KycApplication a WHERE a.status = :status OR a.requiresManualReview = true")
    List<KycApplication> findByStatusOrRequiresManualReviewTrue(@Param("status") KycStatus status);
    
    /**
     * Count applications by status.
     */
    long countByStatus(KycStatus status);
    
    /**
     * Find applications with PEP matches.
     */
    List<KycApplication> findByPepMatchTrue();
    
    /**
     * Find applications with sanctions matches.
     */
    List<KycApplication> findBySanctionsMatchTrue();
    
    /**
     * Find applications with adverse media.
     */
    List<KycApplication> findByAdverseMediaFoundTrue();
}
