package com.kyc.automation.controller;

import com.kyc.automation.entity.DocumentType;
import com.kyc.automation.entity.KycApplication;
import com.kyc.automation.entity.KycDocument;
import com.kyc.automation.entity.KycStatus;
import com.kyc.automation.service.AgenticKycService;
import com.kyc.automation.service.KycService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/kyc")
@RequiredArgsConstructor
@Tag(name = "KYC", description = "KYC Application management endpoints")
public class KycController {

    private final KycService kycService;
    private final AgenticKycService agenticKycService;

    // ========================================================================
    // Application Lifecycle
    // ========================================================================

    @PostMapping("/initiate/{customerId}")
    @Operation(summary = "Start a new KYC application for a customer")
    public ResponseEntity<KycApplication> initiateApplication(@PathVariable Long customerId) {
        return ResponseEntity.ok(kycService.initiateApplication(customerId));
    }

    @PostMapping(value = "/{applicationId}/upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @Operation(summary = "Upload a KYC document")
    public ResponseEntity<KycDocument> uploadDocument(
            @PathVariable Long applicationId,
            @Parameter(description = "Document file", content = @Content(mediaType = MediaType.MULTIPART_FORM_DATA_VALUE))
            @RequestParam("file") MultipartFile file,
            @RequestParam("type") DocumentType type
    ) throws IOException {
        return ResponseEntity.ok(kycService.uploadDocument(applicationId, file, type));
    }

    @PostMapping("/{applicationId}/submit")
    @Operation(summary = "Submit application for ADK agent verification")
    public ResponseEntity<KycApplication> submitApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(kycService.submitApplication(applicationId));
    }

    @GetMapping("/{applicationId}")
    @Operation(summary = "Get KYC application details")
    public ResponseEntity<KycApplication> getApplication(@PathVariable Long applicationId) {
        return ResponseEntity.ok(kycService.getApplication(applicationId));
    }

    @GetMapping("/customer/{customerId}")
    @Operation(summary = "Get all KYC applications for a customer")
    public ResponseEntity<List<KycApplication>> getCustomerApplications(@PathVariable Long customerId) {
        return ResponseEntity.ok(kycService.getCustomerApplications(customerId));
    }

    // ========================================================================
    // Applications List & Review Queue
    // ========================================================================

    @GetMapping("/applications")
    @Operation(summary = "Get all KYC applications")
    public ResponseEntity<List<KycApplication>> getAllApplications() {
        return ResponseEntity.ok(kycService.getAllApplications());
    }

    @GetMapping("/applications/status/{status}")
    @Operation(summary = "Get applications by status")
    public ResponseEntity<List<KycApplication>> getApplicationsByStatus(@PathVariable KycStatus status) {
        return ResponseEntity.ok(kycService.getApplicationsByStatus(status));
    }

    @GetMapping("/review-queue")
    @Operation(summary = "Get applications requiring manual review (HITL)")
    public ResponseEntity<List<KycApplication>> getReviewQueue() {
        return ResponseEntity.ok(kycService.getReviewQueue());
    }

    // ========================================================================
    // Manual Review Actions (HITL)
    // ========================================================================

    @PostMapping("/{applicationId}/approve")
    @Operation(summary = "Manually approve an application (admin only)")
    public ResponseEntity<KycApplication> approveApplication(
            @PathVariable Long applicationId,
            @RequestParam(required = false) String comment,
            @RequestParam String reviewerName
    ) {
        return ResponseEntity.ok(kycService.approveApplication(applicationId, comment, reviewerName));
    }

    @PostMapping("/{applicationId}/reject")
    @Operation(summary = "Manually reject an application (admin only)")
    public ResponseEntity<KycApplication> rejectApplication(
            @PathVariable Long applicationId,
            @RequestParam String reason,
            @RequestParam String reviewerName
    ) {
        return ResponseEntity.ok(kycService.rejectApplication(applicationId, reason, reviewerName));
    }

    @PostMapping("/{applicationId}/request-info")
    @Operation(summary = "Request additional information from customer")
    public ResponseEntity<KycApplication> requestAdditionalInfo(
            @PathVariable Long applicationId,
            @RequestParam String comment,
            @RequestParam String reviewerName
    ) {
        return ResponseEntity.ok(kycService.requestAdditionalInfo(applicationId, comment, reviewerName));
    }

    // ========================================================================
    // Agent Service Integration
    // ========================================================================

    @GetMapping("/agent/health")
    @Operation(summary = "Check KYC Agent Service health")
    public ResponseEntity<AgenticKycService.HealthCheck> getAgentHealth() {
        try {
            return ResponseEntity.ok(agenticKycService.checkHealth());
        } catch (Exception e) {
            return ResponseEntity.status(503).body(
                    new AgenticKycService.HealthCheck("error", "kyc-agent-service", "unknown", null, List.of())
            );
        }
    }

    @GetMapping("/agent/info")
    @Operation(summary = "Get KYC Agent Service info")
    public ResponseEntity<AgenticKycService.ServiceInfo> getAgentInfo() {
        return ResponseEntity.ok(agenticKycService.getServiceInfo());
    }

    // ========================================================================
    // Analytics
    // ========================================================================

    @GetMapping("/analytics/summary")
    @Operation(summary = "Get KYC analytics summary")
    public ResponseEntity<Map<String, Object>> getAnalyticsSummary() {
        return ResponseEntity.ok(kycService.getAnalyticsSummary());
    }
}
