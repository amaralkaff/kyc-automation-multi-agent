package com.kyc.automation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "kyc_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class KycDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @JsonIgnore
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "application_id", nullable = false)
    private KycApplication application;

    @Enumerated(EnumType.STRING)
    private DocumentType documentType;

    private String fileName;
    private String fileUrl; // Path to storage
}
