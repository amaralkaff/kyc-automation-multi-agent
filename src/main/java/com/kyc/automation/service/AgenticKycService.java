package com.kyc.automation.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.List;
import java.util.Map;

/**
 * Service for communicating with the Google ADK KYC Agent Service.
 * 
 * The agent service runs on Cloud Run and provides multi-agent KYC verification:
 * - KYC_Manager: Root orchestrator
 * - Document_Checker: ID/document verification
 * - Resume_Crosschecker: Employment verification
 * - External_Search: Adverse media, PEP, sanctions screening
 * - Wealth_Calculator: Source of wealth verification
 */
@Service
public class AgenticKycService {

    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public AgenticKycService(
            @Value("${kyc.vendor.url}") String baseUrl,
            ObjectMapper objectMapper
    ) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .build();
        this.objectMapper = objectMapper;
    }

    /**
     * Run full KYC analysis using the multi-agent workflow.
     */
    public KycReport runAnalysis(String userId, String name, String nik, List<String> docUrls) {
        return runAnalysis(userId, name, nik, docUrls, null, null);
    }

    /**
     * Run full KYC analysis with employment verification data.
     */
    public KycReport runAnalysis(
            String userId, 
            String name, 
            String nik, 
            List<String> docUrls,
            String linkedinUrl,
            String companyName
    ) {
        KycRequest request = new KycRequest(userId, name, nik, docUrls, linkedinUrl, companyName);

        return restClient.post()
                .uri("/analyze")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(KycReport.class);
    }

    /**
     * Quick risk assessment without full agent delegation.
     */
    public QuickAssessment quickAssess(String userId, String name, String nik, List<String> docUrls) {
        KycRequest request = new KycRequest(userId, name, nik, docUrls, null, null);

        return restClient.post()
                .uri("/analyze/quick")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(QuickAssessment.class);
    }

    /**
     * Check agent service health.
     */
    public HealthCheck checkHealth() {
        return restClient.get()
                .uri("/")
                .retrieve()
                .body(HealthCheck.class);
    }

    /**
     * Get service info including available agents.
     */
    public ServiceInfo getServiceInfo() {
        return restClient.get()
                .uri("/info")
                .retrieve()
                .body(ServiceInfo.class);
    }

    /**
     * Parse sub-agent results from the details map.
     */
    public SubAgentResults parseSubAgentResults(Map<String, Object> details) {
        if (details == null) return null;
        
        try {
            Object subResults = details.get("sub_agent_results");
            if (subResults == null) return null;
            
            JsonNode node = objectMapper.valueToTree(subResults);
            return new SubAgentResults(
                    getNodeAsString(node, "Document_Checker"),
                    getNodeAsString(node, "Resume_Crosschecker"),
                    getNodeAsString(node, "External_Search"),
                    getNodeAsString(node, "Wealth_Calculator"),
                    getNodeAsString(node, "Sanctions_Screener")
            );
        } catch (Exception e) {
            return null;
        }
    }

    private String getNodeAsString(JsonNode node, String field) {
        JsonNode child = node.get(field);
        return child != null ? child.toString() : null;
    }

    // ============================================================================
    // DTOs matching the ADK API Contract
    // ============================================================================

    public record KycRequest(
            @JsonProperty("customer_id") String customerId,
            String name,
            String nik,
            @JsonProperty("files") List<String> docUrls,
            @JsonProperty("linkedin_url") String linkedinUrl,
            @JsonProperty("company_name") String companyName
    ) {}

    public record KycReport(
            @JsonProperty("case_id") String caseId,
            @JsonProperty("risk_score") int riskScore,
            String status,
            String reasoning,
            @JsonProperty("found_in_db") boolean foundInDb,
            @JsonProperty("requires_manual_review") Boolean requiresManualReview,
            @JsonProperty("processing_time_ms") Integer processingTimeMs,
            @JsonProperty("details") Map<String, Object> details
    ) {}

    public record QuickAssessment(
            @JsonProperty("quick_assessment") boolean quickAssessment,
            @JsonProperty("risk_score") int riskScore,
            @JsonProperty("risk_indicators") List<String> riskIndicators,
            String recommendation,
            String message
    ) {}

    public record HealthCheck(
            String status,
            String service,
            String version,
            String timestamp,
            @JsonProperty("agents_available") List<String> agentsAvailable
    ) {}

    public record AgentInfo(
            String name,
            String model,
            String description,
            List<String> tools
    ) {}

    public record ServiceInfo(
            String service,
            String version,
            String description,
            List<AgentInfo> agents,
            Map<String, String> endpoints
    ) {}

    public record SubAgentResults(
            String documentChecker,
            String resumeCrosschecker,
            String externalSearch,
            String wealthCalculator,
            String sanctionsScreener
    ) {}
}