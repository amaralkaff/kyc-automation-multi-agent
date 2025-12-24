package com.kyc.automation.service;

import com.kyc.automation.entity.KycApplication;
import com.kyc.automation.entity.KycStatus;
import org.springframework.stereotype.Service;

import java.util.Random;

@Service
public class MockVerificationService {

    public VerificationResult verify(KycApplication application) {
        // Simulate external API latency
        try {
            Thread.sleep(1000);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        // Simple mock logic:
        // Random risk score 0-100
        int score = new Random().nextInt(101);
        
        KycStatus status;
        String comments;

        if (score > 80) {
            status = KycStatus.APPROVED;
            comments = "Automated Approval: Low Risk";
        } else if (score < 40) {
            status = KycStatus.REJECTED;
            comments = "Automated Rejection: High Risk detected";
        } else {
            status = KycStatus.UNDER_REVIEW;
            comments = "Manual Review Required: Medium Risk";
        }

        return new VerificationResult(status, score, comments);
    }

    public record VerificationResult(KycStatus status, int riskScore, String comments) {}
}
