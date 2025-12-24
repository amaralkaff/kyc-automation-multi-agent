package com.kyc.automation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDateTime;
import java.util.List;

/**
 * KYC Application entity following Google ADK multi-agent workflow
 * Sub-agents: Document_Checker, Resume_Crosschecker, External_Search, Wealth_Calculator
 */
@Entity
@Table(name = "kyc_applications")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycApplication {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "customer_id", nullable = false)
    @JsonIgnoreProperties({"kycApplications", "hibernateLazyInitializer", "handler"})
    private Customer customer;

    @Enumerated(EnumType.STRING)
    private KycStatus status;

    // Risk Assessment (from ADK Agent)
    private Integer riskScore; // 0-100 (High score = Low Risk)
    
    @Column(columnDefinition = "text")
    private String riskLabels; // JSON array of risk labels
    
    // Human-in-the-Loop (HITL)
    private Boolean requiresManualReview;
    private String adminComments;
    private String rejectionReason;
    
    // ADK Agent Metadata
    private String caseId; // Unique case ID from ADK Agent
    
    @Column(columnDefinition = "text")
    private String agentReport; // Full JSON report from Agent
    
    // Sub-Agent Results (from Google ADK workflow)
    @Column(columnDefinition = "text")
    private String documentCheckerResult;  // Document_Checker agent output
    
    @Column(columnDefinition = "text")
    private String resumeCrosscheckerResult; // Resume_Crosschecker agent output
    
    @Column(columnDefinition = "text")
    private String externalSearchResult;  // External_Search agent output (PEP, sanctions, adverse media)
    
    @Column(columnDefinition = "text")
    private String wealthCalculatorResult; // Wealth_Calculator agent output
    
    // External Checks (from External_Search agent)
    private Boolean pepMatch;              // Politically Exposed Person
    private Boolean sanctionsMatch;        // Sanctions list match
    private Boolean adverseMediaFound;     // Adverse media found
    
    @Column(columnDefinition = "text")
    private String adverseMediaSources;    // JSON array of sources with URLs
    
    // Vendor Integration
    private String providerApplicantId;
    
    @JsonIgnore
    @OneToMany(mappedBy = "application", cascade = CascadeType.ALL, fetch = FetchType.LAZY)
    private List<KycDocument> documents;

    @CreationTimestamp
    private LocalDateTime createdAt;

    @UpdateTimestamp
    private LocalDateTime updatedAt;
    
    // Reviewer tracking
    private String reviewedBy;
    private LocalDateTime reviewedAt;
}
