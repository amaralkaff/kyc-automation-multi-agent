package com.kyc.automation.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.kyc.automation.entity.*;
import com.kyc.automation.event.KycCompletedEvent;
import com.kyc.automation.repository.CustomerRepository;
import com.kyc.automation.repository.KycApplicationRepository;
import com.kyc.automation.repository.KycDocumentRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;

@Service
@RequiredArgsConstructor
public class KycService {

    private final KycApplicationRepository applicationRepository;
    private final KycDocumentRepository documentRepository;
    private final CustomerRepository customerRepository;
    private final StorageService storageService;
    private final KycVendorService kycVendorService;
    private final AgenticKycService agenticKycService; // Added
    private final ApplicationEventPublisher eventPublisher;
    private final ObjectMapper objectMapper;

    @Transactional
    public KycApplication initiateApplication(Long customerId) {
        Customer customer = customerRepository.findById(customerId)
                .orElseThrow(() -> new RuntimeException("Customer not found"));

        // Generate SDK token from vendor
        String sdkToken = kycVendorService.generateSdkToken(String.valueOf(customerId));

        KycApplication application = KycApplication.builder()
                .customer(customer)
                .status(KycStatus.DRAFT)
                .riskScore(0)
                .providerApplicantId(sdkToken) // Store the token or ID reference
                .build();

        return applicationRepository.save(application);
    }

    // uploadDocument method remains unchanged...

    @Transactional
    public KycDocument uploadDocument(Long applicationId, MultipartFile file, DocumentType type) throws IOException {
        KycApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        if (application.getStatus() != KycStatus.DRAFT && application.getStatus() != KycStatus.UNDER_REVIEW
                && application.getStatus() != KycStatus.ACTION_REQUIRED) {
            throw new RuntimeException("Cannot upload documents to a finalized application");
        }

        String path = storageService.store(file);

        KycDocument document = KycDocument.builder()
                .application(application)
                .documentType(type)
                .fileName(file.getOriginalFilename())
                .fileUrl(path)
                .build();

        return documentRepository.save(document);
    }

    @Transactional
    public KycApplication submitApplication(Long applicationId) {
        KycApplication application = applicationRepository.findById(applicationId)
                .orElseThrow(() -> new RuntimeException("Application not found"));

        application.setStatus(KycStatus.SUBMITTED);
        applicationRepository.save(application);

        // Call Python Agent Service via AgenticKycService
        try {
            Customer customer = application.getCustomer();

            // Collect all document URLs associated with this application
            List<String> docUrls = application.getDocuments().stream()
                    .map(KycDocument::getFileUrl)
                    .toList();

            // Run full agent analysis with employment data if available
            AgenticKycService.KycReport report = agenticKycService.runAnalysis(
                    String.valueOf(customer.getId()),
                    customer.getFirstName() + " " + customer.getLastName(),
                    customer.getNationalId(),
                    docUrls,
                    customer.getLinkedinUrl(),
                    customer.getCompanyName());

            // HITL Logic:
            // Agent will only return APPROVED for very low risk.
            // Everything else (Medium/High Risk) comes back as UNDER_REVIEW.

            KycStatus newStatus;
            boolean manualReview = report.requiresManualReview() != null ? report.requiresManualReview() : true;

            if ("APPROVED".equalsIgnoreCase(report.status()) && report.riskScore() <= 30) {
                newStatus = KycStatus.APPROVED;
                manualReview = false;
            } else {
                newStatus = KycStatus.UNDER_REVIEW;
            }

            application.setStatus(newStatus);
            application.setRiskScore(report.riskScore());
            application.setAdminComments(report.reasoning());
            application.setCaseId(report.caseId());
            application.setRequiresManualReview(manualReview);

            // Store full details/citations as JSON
            if (report.details() != null) {
                application.setAgentReport(objectMapper.writeValueAsString(report.details()));

                // Parse and store sub-agent results separately for easy querying
                AgenticKycService.SubAgentResults subResults = agenticKycService.parseSubAgentResults(report.details());
                if (subResults != null) {
                    application.setDocumentCheckerResult(subResults.documentChecker());
                    application.setResumeCrosscheckerResult(subResults.resumeCrosschecker());
                    application.setExternalSearchResult(subResults.externalSearch());
                    application.setWealthCalculatorResult(subResults.wealthCalculator());
                }

                // Extract risk breakdown flags
                Object riskBreakdown = report.details().get("risk_breakdown");
                if (riskBreakdown instanceof java.util.Map<?, ?> rb) {
                    application.setAdverseMediaFound(Boolean.TRUE.equals(rb.get("adverse_media")));
                    application.setSanctionsMatch(Boolean.TRUE.equals(rb.get("sanctions_flag")));

                    String pepStatus = rb.get("pep_status") != null ? rb.get("pep_status").toString() : null;
                    application.setPepMatch("POTENTIAL_PEP".equals(pepStatus) || "CONFIRMED_PEP".equals(pepStatus));
                }

                // Extract citations for display
                Object citations = report.details().get("citations");
                if (citations instanceof java.util.List<?> citationList && !citationList.isEmpty()) {
                    application.setAdverseMediaSources(objectMapper.writeValueAsString(citationList));
                }
            }

        } catch (Exception e) {
            // If Agent fails, force manual review
            application.setAdminComments("Agent Analysis Failed: " + e.getMessage());
            application.setStatus(KycStatus.UNDER_REVIEW);
            application.setRequiresManualReview(true);
        }

        return applicationRepository.save(application);
    }

    @Transactional
    public void processWebhookEvent(String rawPayload) {
        try {
            JsonNode root = objectMapper.readTree(rawPayload);

            // Assume payload has: providerApplicantId, status, riskScore
            String providerId = root.path("providerApplicantId").asText();
            String statusStr = root.path("status").asText().toUpperCase();
            int riskScore = root.path("riskScore").asInt(0);

            // Find application by provider ID (In a real app, you'd index this field)
            // For now, we might need a way to find it.
            // Simplified: we assume the payload includes our internal applicationId for
            // this demo,
            // OR we'd need to add findByProviderApplicantId to the repository.
            // Let's assume the payload sends back our "externalUserId" which matches our
            // Customer ID,
            // or we use a repository method.

            // Fallback for this demo: Try to find by ID if passed, or just update the
            // latest for a customer?
            // Let's add findByProviderApplicantId to Repo in next step if needed, or
            // iterate.
            // BETTER: The initiateApplication stored 'sdkToken' in providerApplicantId.

            KycApplication application = applicationRepository.findAll().stream()
                    .filter(app -> providerId.equals(app.getProviderApplicantId()))
                    .findFirst()
                    .orElseThrow(() -> new RuntimeException("Application not found for provider ID: " + providerId));

            KycStatus newStatus = switch (statusStr) {
                case "GREEN", "APPROVED" -> KycStatus.APPROVED;
                case "RED", "REJECTED" -> KycStatus.REJECTED;
                case "RESUBMIT" -> KycStatus.ACTION_REQUIRED;
                default -> KycStatus.UNDER_REVIEW;
            };

            application.setStatus(newStatus);
            application.setRiskScore(riskScore);
            application.setRiskLabels(root.path("riskLabels").toString());

            applicationRepository.save(application);

            // Publish Event
            eventPublisher.publishEvent(
                    new KycCompletedEvent(this, application.getId(), application.getCustomer().getId(), newStatus));

        } catch (Exception e) {
            throw new RuntimeException("Failed to process webhook", e);
        }
    }

    // ========================================================================
    // Query Methods
    // ========================================================================

    public KycApplication getApplication(Long id) {
        return applicationRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Application not found"));
    }

    public List<KycApplication> getCustomerApplications(Long customerId) {
        return applicationRepository.findByCustomerId(customerId);
    }

    public List<KycApplication> getAllApplications() {
        return applicationRepository.findAll();
    }

    public List<KycApplication> getApplicationsByStatus(KycStatus status) {
        return applicationRepository.findByStatus(status);
    }

    /**
     * Get applications that require manual review (HITL queue).
     * Includes: UNDER_REVIEW status OR requiresManualReview=true
     */
    public List<KycApplication> getReviewQueue() {
        return applicationRepository.findByStatusOrRequiresManualReviewTrue(KycStatus.UNDER_REVIEW);
    }

    // ========================================================================
    // Manual Review Actions (HITL)
    // ========================================================================

    @Transactional
    public KycApplication approveApplication(Long applicationId, String comment, String reviewerName) {
        KycApplication application = getApplication(applicationId);

        application.setStatus(KycStatus.APPROVED);
        application.setRequiresManualReview(false);
        application.setReviewedBy(reviewerName);
        application.setReviewedAt(java.time.LocalDateTime.now());

        if (comment != null && !comment.isBlank()) {
            String existingComments = application.getAdminComments();
            application.setAdminComments(
                    (existingComments != null ? existingComments + " | " : "") +
                            "Manual Approval: " + comment);
        }

        KycApplication saved = applicationRepository.save(application);

        // Publish event
        eventPublisher.publishEvent(new KycCompletedEvent(
                this, application.getId(), application.getCustomer().getId(), KycStatus.APPROVED));

        return saved;
    }

    @Transactional
    public KycApplication rejectApplication(Long applicationId, String reason, String reviewerName) {
        KycApplication application = getApplication(applicationId);

        application.setStatus(KycStatus.REJECTED);
        application.setRequiresManualReview(false);
        application.setRejectionReason(reason);
        application.setReviewedBy(reviewerName);
        application.setReviewedAt(java.time.LocalDateTime.now());

        KycApplication saved = applicationRepository.save(application);

        // Publish event
        eventPublisher.publishEvent(new KycCompletedEvent(
                this, application.getId(), application.getCustomer().getId(), KycStatus.REJECTED));

        return saved;
    }

    @Transactional
    public KycApplication requestAdditionalInfo(Long applicationId, String comment, String reviewerName) {
        KycApplication application = getApplication(applicationId);

        application.setStatus(KycStatus.ACTION_REQUIRED);
        application.setReviewedBy(reviewerName);
        application.setReviewedAt(java.time.LocalDateTime.now());
        application.setAdminComments(
                (application.getAdminComments() != null ? application.getAdminComments() + " | " : "") +
                        "Additional Info Requested: " + comment);

        return applicationRepository.save(application);
    }

    // ========================================================================
    // Analytics
    // ========================================================================

    public java.util.Map<String, Object> getAnalyticsSummary() {
        List<KycApplication> allApps = applicationRepository.findAll();

        long total = allApps.size();
        long approved = allApps.stream().filter(a -> a.getStatus() == KycStatus.APPROVED).count();
        long rejected = allApps.stream().filter(a -> a.getStatus() == KycStatus.REJECTED).count();
        long underReview = allApps.stream().filter(a -> a.getStatus() == KycStatus.UNDER_REVIEW).count();
        long pendingReview = allApps.stream().filter(a -> Boolean.TRUE.equals(a.getRequiresManualReview())).count();
        long pepMatches = allApps.stream().filter(a -> Boolean.TRUE.equals(a.getPepMatch())).count();
        long sanctionsMatches = allApps.stream().filter(a -> Boolean.TRUE.equals(a.getSanctionsMatch())).count();
        long adverseMediaCases = allApps.stream().filter(a -> Boolean.TRUE.equals(a.getAdverseMediaFound())).count();

        // Calculate average risk score (only for apps with a score)
        double avgRiskScore = allApps.stream()
                .filter(a -> a.getRiskScore() != null)
                .mapToInt(KycApplication::getRiskScore)
                .average()
                .orElse(0.0);

        return java.util.Map.of(
                "total", total,
                "approved", approved,
                "rejected", rejected,
                "underReview", underReview,
                "pendingManualReview", pendingReview,
                "pepMatches", pepMatches,
                "sanctionsMatches", sanctionsMatches,
                "adverseMediaCases", adverseMediaCases,
                "averageRiskScore", Math.round(avgRiskScore * 100.0) / 100.0);
    }
}
