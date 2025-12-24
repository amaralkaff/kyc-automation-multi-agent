package com.kyc.automation.service;

import com.fasterxml.jackson.annotation.JsonProperty;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.util.Map;

@Service
public class KycVendorService {

    private final RestClient restClient;

    public KycVendorService(@Value("${kyc.vendor.url}") String baseUrl,
                            @Value("${kyc.vendor.token}") String apiToken) {
        this.restClient = RestClient.builder()
                .baseUrl(baseUrl)
                .defaultHeader("Authorization", "Bearer " + apiToken)
                .build();
    }

    public String generateSdkToken(String userId) {
        // Mock token generation for frontend compatibility
        return "agent-session-" + userId;
    }

    public AgentAnalysisResponse analyzeKyc(String customerId, String name, String nik, Map<String, String> files) {
        AgentKycRequest request = new AgentKycRequest(customerId, name, nik, files);
        
        return restClient.post()
                .uri("/analyze")
                .contentType(MediaType.APPLICATION_JSON)
                .body(request)
                .retrieve()
                .body(AgentAnalysisResponse.class);
    }
    
    // DTOs matching Python Service
    public record AgentKycRequest(
            @JsonProperty("customer_id") String customerId,
            String name,
            String nik,
            Map<String, String> files
    ) {}

    public record AgentAnalysisResponse(
            @JsonProperty("risk_score") int riskScore,
            String status,
            String reasoning,
            @JsonProperty("found_in_db") boolean foundInDb
    ) {}
}