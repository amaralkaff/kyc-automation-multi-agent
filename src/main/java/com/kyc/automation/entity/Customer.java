package com.kyc.automation.entity;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.Data;
import lombok.NoArgsConstructor;
import lombok.AllArgsConstructor;
import lombok.Builder;

import java.time.LocalDate;
import java.util.List;

@Entity
@Table(name = "customers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Customer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Personal Information
    private String firstName;
    private String lastName;
    private String email;
    private LocalDate dateOfBirth;
    private String phoneNumber;
    
    // Indonesian Identification (NIK - Nomor Induk Kependudukan)
    @Column(unique = true, length = 16)
    private String nik; // 16-digit Indonesian National ID
    
    // Legacy field for backward compatibility
    @Column(name = "national_id")
    private String nationalId;
    
    // Address Information (Indonesian format)
    private String address;
    private String kelurahan; // Village/Sub-district
    private String kecamatan; // District  
    private String kabupaten; // Regency/City
    private String provinsi;  // Province
    private String postalCode;
    
    // Employment Information (for Resume Crosschecker agent)
    private String occupation;
    private String companyName;
    private String linkedinUrl;
    
    // Citizenship
    @Column(length = 50)
    private String citizenship; // e.g., "Indonesian", "WNA"
    
    // Risk Classification (from ADK Agent)
    private String riskLevel; // LOW, MEDIUM, HIGH
    private Double netWorth;  // From Wealth Calculator agent

    @JsonIgnore
    @OneToMany(mappedBy = "customer", cascade = CascadeType.ALL)
    private List<KycApplication> kycApplications;
}
