package com.kyc.automation.config;

import com.kyc.automation.entity.*;
import com.kyc.automation.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Complete Data Seeder for Indonesian KYC Automation Demo
 * Deletes all existing data and seeds fresh complete data
 */
@Configuration
public class DataSeeder {

    @Bean
    @Transactional
    CommandLineRunner initDatabase(
            CustomerRepository customerRepository,
            UserRepository userRepository,
            KycApplicationRepository kycApplicationRepository,
            KycDocumentRepository kycDocumentRepository,
            PasswordEncoder passwordEncoder
    ) {
        return args -> {
            System.out.println("🔄 Starting data seeding...");
            
            // ==========================================
            // STEP 1: Delete all existing data (order matters due to FK)
            // ==========================================
            System.out.println("🗑️ Clearing existing data...");
            kycDocumentRepository.deleteAll();
            kycApplicationRepository.deleteAll();
            customerRepository.deleteAll();
            userRepository.deleteAll();
            System.out.println("✅ All existing data cleared.");

            // ==========================================
            // STEP 2: Seed Users
            // ==========================================
            System.out.println("👤 Seeding users...");
            
            User admin = User.builder()
                    .username("admin")
                    .password(passwordEncoder.encode("admin123"))
                    .role(Role.ADMIN)
                    .build();
            
            User reviewer = User.builder()
                    .username("reviewer")
                    .password(passwordEncoder.encode("reviewer123"))
                    .role(Role.USER)
                    .build();
            
            User analyst = User.builder()
                    .username("analyst")
                    .password(passwordEncoder.encode("analyst123"))
                    .role(Role.USER)
                    .build();
            
            userRepository.saveAll(List.of(admin, reviewer, analyst));
            System.out.println("✅ Users created: admin, reviewer, analyst");

            // ==========================================
            // STEP 3: Seed Indonesian Customers (10 customers)
            // ==========================================
            System.out.println("👥 Seeding Indonesian customers...");

            // Customer 1 - Low Risk (Approved)
            Customer c1 = Customer.builder()
                    .firstName("Budi")
                    .lastName("Santoso")
                    .email("budi.santoso@gmail.com")
                    .dateOfBirth(LocalDate.of(1990, 3, 15))
                    .nik("3201011503900001")
                    .nationalId("3201011503900001")
                    .phoneNumber("+6281234567890")
                    .address("Jl. Sudirman No. 123, RT 001/RW 005")
                    .kelurahan("Menteng")
                    .kecamatan("Menteng")
                    .kabupaten("Jakarta Pusat")
                    .provinsi("DKI Jakarta")
                    .postalCode("10310")
                    .occupation("Software Engineer")
                    .companyName("PT Tokopedia")
                    .linkedinUrl("https://linkedin.com/in/budisantoso")
                    .citizenship("WNI")
                    .riskLevel("LOW")
                    .netWorth(500000000.0)
                    .build();

            // Customer 2 - Medium Risk (Under Review)
            Customer c2 = Customer.builder()
                    .firstName("Siti")
                    .lastName("Rahayu")
                    .email("siti.rahayu@yahoo.co.id")
                    .dateOfBirth(LocalDate.of(1985, 7, 22))
                    .nik("3275012207850002")
                    .nationalId("3275012207850002")
                    .phoneNumber("+6287654321098")
                    .address("Jl. Gatot Subroto No. 45, Kompleks Permata")
                    .kelurahan("Setiabudi")
                    .kecamatan("Setiabudi")
                    .kabupaten("Jakarta Selatan")
                    .provinsi("DKI Jakarta")
                    .postalCode("12910")
                    .occupation("Business Owner")
                    .companyName("CV Berkah Jaya")
                    .linkedinUrl("https://linkedin.com/in/sitirahayu")
                    .citizenship("WNI")
                    .riskLevel("MEDIUM")
                    .netWorth(2500000000.0)
                    .build();

            // Customer 3 - High Risk (PEP - Government Official)
            Customer c3 = Customer.builder()
                    .firstName("Ahmad")
                    .lastName("Wijaya")
                    .email("ahmad.wijaya@kemenkeu.go.id")
                    .dateOfBirth(LocalDate.of(1970, 11, 5))
                    .nik("3171010511700003")
                    .nationalId("3171010511700003")
                    .phoneNumber("+6281987654321")
                    .address("Jl. Thamrin No. 1, Gedung Utama Lt. 5")
                    .kelurahan("Gambir")
                    .kecamatan("Gambir")
                    .kabupaten("Jakarta Pusat")
                    .provinsi("DKI Jakarta")
                    .postalCode("10110")
                    .occupation("Direktur Jenderal")
                    .companyName("Kementerian Keuangan RI")
                    .linkedinUrl("https://linkedin.com/in/ahmadwijaya")
                    .citizenship("WNI")
                    .riskLevel("HIGH")
                    .netWorth(15000000000.0)
                    .build();

            // Customer 4 - Low Risk (New Application)
            Customer c4 = Customer.builder()
                    .firstName("Dewi")
                    .lastName("Lestari")
                    .email("dewi.lestari@outlook.com")
                    .dateOfBirth(LocalDate.of(1995, 2, 14))
                    .nik("3273011402950004")
                    .nationalId("3273011402950004")
                    .phoneNumber("+6282112345678")
                    .address("Jl. Dago No. 88, Perumahan Dago Asri")
                    .kelurahan("Dago")
                    .kecamatan("Coblong")
                    .kabupaten("Bandung")
                    .provinsi("Jawa Barat")
                    .postalCode("40135")
                    .occupation("Product Manager")
                    .companyName("PT Bukalapak.com")
                    .linkedinUrl("https://linkedin.com/in/dewilestari")
                    .citizenship("WNI")
                    .riskLevel("LOW")
                    .netWorth(750000000.0)
                    .build();

            // Customer 5 - Medium Risk (High Net Worth)
            Customer c5 = Customer.builder()
                    .firstName("Rudi")
                    .lastName("Hartono")
                    .email("rudi.hartono@gmail.com")
                    .dateOfBirth(LocalDate.of(1975, 8, 30))
                    .nik("3578013008750005")
                    .nationalId("3578013008750005")
                    .phoneNumber("+6281345678901")
                    .address("Jl. Raya Darmo No. 100, Darmo Park")
                    .kelurahan("Darmo")
                    .kecamatan("Wonokromo")
                    .kabupaten("Surabaya")
                    .provinsi("Jawa Timur")
                    .postalCode("60241")
                    .occupation("CEO")
                    .companyName("PT Hartono Group")
                    .linkedinUrl("https://linkedin.com/in/rudihartono")
                    .citizenship("WNI")
                    .riskLevel("MEDIUM")
                    .netWorth(50000000000.0)
                    .build();

            // Customer 6 - Critical Risk (Sanctions Match)
            Customer c6 = Customer.builder()
                    .firstName("Michael")
                    .lastName("Tanaka")
                    .email("m.tanaka@mail.com")
                    .dateOfBirth(LocalDate.of(1968, 4, 12))
                    .nik("3174011204680006")
                    .nationalId("A12345678")
                    .phoneNumber("+6281567890123")
                    .address("Jl. Pluit Raya No. 200, Apartemen Pluit Sea View")
                    .kelurahan("Pluit")
                    .kecamatan("Penjaringan")
                    .kabupaten("Jakarta Utara")
                    .provinsi("DKI Jakarta")
                    .postalCode("14450")
                    .occupation("International Trader")
                    .companyName("Tanaka Trading Ltd")
                    .linkedinUrl(null)
                    .citizenship("WNA")
                    .riskLevel("CRITICAL")
                    .netWorth(100000000000.0)
                    .build();

            // Customer 7 - Low Risk (Fresh Graduate)
            Customer c7 = Customer.builder()
                    .firstName("Putri")
                    .lastName("Andini")
                    .email("putri.andini@ui.ac.id")
                    .dateOfBirth(LocalDate.of(2000, 12, 25))
                    .nik("3671012512000007")
                    .nationalId("3671012512000007")
                    .phoneNumber("+6285678901234")
                    .address("Jl. Margonda Raya No. 50, Kost Mahasiswa")
                    .kelurahan("Beji")
                    .kecamatan("Beji")
                    .kabupaten("Depok")
                    .provinsi("Jawa Barat")
                    .postalCode("16424")
                    .occupation("Junior Analyst")
                    .companyName("PT Bank Central Asia Tbk")
                    .linkedinUrl("https://linkedin.com/in/putriandini")
                    .citizenship("WNI")
                    .riskLevel("LOW")
                    .netWorth(50000000.0)
                    .build();

            // Customer 8 - High Risk (Adverse Media)
            Customer c8 = Customer.builder()
                    .firstName("Hendra")
                    .lastName("Gunawan")
                    .email("hendra.gunawan@gmail.com")
                    .dateOfBirth(LocalDate.of(1980, 6, 18))
                    .nik("3603011806800008")
                    .nationalId("3603011806800008")
                    .phoneNumber("+6281678901234")
                    .address("Jl. Raya Serang No. 500, Kawasan Industri")
                    .kelurahan("Cikupa")
                    .kecamatan("Cikupa")
                    .kabupaten("Tangerang")
                    .provinsi("Banten")
                    .postalCode("15710")
                    .occupation("Komisaris")
                    .companyName("PT Gunawan Mining")
                    .linkedinUrl("https://linkedin.com/in/hendragunawan")
                    .citizenship("WNI")
                    .riskLevel("HIGH")
                    .netWorth(25000000000.0)
                    .build();

            // Customer 9 - Medium Risk (Self-Employed)
            Customer c9 = Customer.builder()
                    .firstName("Rina")
                    .lastName("Wijayanti")
                    .email("rina.wijayanti@tokopedia.com")
                    .dateOfBirth(LocalDate.of(1988, 9, 9))
                    .nik("5171010909880009")
                    .nationalId("5171010909880009")
                    .phoneNumber("+6281789012345")
                    .address("Jl. Sunset Road No. 77, Seminyak")
                    .kelurahan("Seminyak")
                    .kecamatan("Kuta")
                    .kabupaten("Badung")
                    .provinsi("Bali")
                    .postalCode("80361")
                    .occupation("E-commerce Seller")
                    .companyName("Rina Boutique Online")
                    .linkedinUrl("https://linkedin.com/in/rinawijayanti")
                    .citizenship("WNI")
                    .riskLevel("MEDIUM")
                    .netWorth(1500000000.0)
                    .build();

            // Customer 10 - Low Risk (Draft Application)
            Customer c10 = Customer.builder()
                    .firstName("Agus")
                    .lastName("Prasetyo")
                    .email("agus.prasetyo@pertamina.com")
                    .dateOfBirth(LocalDate.of(1982, 1, 17))
                    .nik("6471011701820010")
                    .nationalId("6471011701820010")
                    .phoneNumber("+6281890123456")
                    .address("Jl. Jend. Sudirman No. 1, Balikpapan")
                    .kelurahan("Klandasan Ilir")
                    .kecamatan("Balikpapan Kota")
                    .kabupaten("Balikpapan")
                    .provinsi("Kalimantan Timur")
                    .postalCode("76114")
                    .occupation("Senior Engineer")
                    .companyName("PT Pertamina (Persero)")
                    .linkedinUrl("https://linkedin.com/in/agusprasetyo")
                    .citizenship("WNI")
                    .riskLevel("LOW")
                    .netWorth(800000000.0)
                    .build();

            List<Customer> customers = customerRepository.saveAll(
                    List.of(c1, c2, c3, c4, c5, c6, c7, c8, c9, c10)
            );
            System.out.println("✅ 10 Indonesian customers created.");

            // ==========================================
            // STEP 4: Seed KYC Applications with full agent results
            // ==========================================
            System.out.println("📋 Seeding KYC applications...");

            // Application 1 - Approved (Budi Santoso)
            KycApplication app1 = KycApplication.builder()
                    .customer(c1)
                    .status(KycStatus.APPROVED)
                    .riskScore(92)
                    .riskLabels("[\"LOW_RISK\", \"VERIFIED\"]")
                    .requiresManualReview(false)
                    .pepMatch(false)
                    .sanctionsMatch(false)
                    .adverseMediaFound(false)
                    .caseId("KYC-2024-001")
                    .adminComments("All verification checks passed. Auto-approved by ADK Agent.")
                    .documentCheckerResult("{\"status\":\"VERIFIED\",\"ktp_valid\":true,\"face_match_score\":0.98,\"document_authenticity\":\"GENUINE\",\"expiry_valid\":true}")
                    .resumeCrosscheckerResult("{\"verified\":true,\"linkedin_match\":true,\"company_verified\":\"PT Tokopedia\",\"position_match\":true,\"employment_duration\":\"3 years\"}")
                    .externalSearchResult("{\"pep_check\":\"CLEAR\",\"sanctions_check\":\"CLEAR\",\"adverse_media\":\"NONE\",\"sources_checked\":[\"OFAC\",\"UN\",\"EU\",\"DJBC\"]}")
                    .wealthCalculatorResult("{\"declared_income\":500000000,\"verified_income\":480000000,\"income_source\":\"SALARY\",\"consistency\":\"HIGH\",\"tax_compliance\":\"VERIFIED\"}")
                    .reviewedBy("system")
                    .reviewedAt(LocalDateTime.now().minusDays(5))
                    .build();

            // Application 2 - Under Review (Siti Rahayu)
            KycApplication app2 = KycApplication.builder()
                    .customer(c2)
                    .status(KycStatus.UNDER_REVIEW)
                    .riskScore(58)
                    .riskLabels("[\"MEDIUM_RISK\", \"HIGH_NET_WORTH\", \"MANUAL_REVIEW\"]")
                    .requiresManualReview(true)
                    .pepMatch(false)
                    .sanctionsMatch(false)
                    .adverseMediaFound(false)
                    .caseId("KYC-2024-002")
                    .adminComments("High net worth customer. Business ownership requires additional verification.")
                    .documentCheckerResult("{\"status\":\"VERIFIED\",\"ktp_valid\":true,\"face_match_score\":0.95,\"document_authenticity\":\"GENUINE\",\"expiry_valid\":true}")
                    .resumeCrosscheckerResult("{\"verified\":true,\"linkedin_match\":true,\"company_verified\":\"CV Berkah Jaya\",\"business_registration\":\"VERIFIED\",\"npwp_match\":true}")
                    .externalSearchResult("{\"pep_check\":\"CLEAR\",\"sanctions_check\":\"CLEAR\",\"adverse_media\":\"NONE\",\"sources_checked\":[\"OFAC\",\"UN\",\"EU\",\"DJBC\"]}")
                    .wealthCalculatorResult("{\"declared_income\":2500000000,\"verified_income\":2100000000,\"income_source\":\"BUSINESS\",\"consistency\":\"MEDIUM\",\"additional_verification_needed\":true}")
                    .build();

            // Application 3 - Under Review (Ahmad Wijaya - PEP)
            KycApplication app3 = KycApplication.builder()
                    .customer(c3)
                    .status(KycStatus.UNDER_REVIEW)
                    .riskScore(25)
                    .riskLabels("[\"HIGH_RISK\", \"PEP\", \"GOVERNMENT_OFFICIAL\", \"ENHANCED_DUE_DILIGENCE\"]")
                    .requiresManualReview(true)
                    .pepMatch(true)
                    .sanctionsMatch(false)
                    .adverseMediaFound(true)
                    .adverseMediaSources("[{\"source\":\"Kompas\",\"title\":\"Pejabat Kemenkeu dalam Sorotan\",\"url\":\"https://kompas.com/news/123\",\"date\":\"2024-01-15\"},{\"source\":\"Detik\",\"title\":\"Audit BPK Temukan Kejanggalan\",\"url\":\"https://detik.com/news/456\",\"date\":\"2024-02-20\"}]")
                    .caseId("KYC-2024-003")
                    .adminComments("PEP identified - Direktur Jenderal Kemenkeu. Adverse media found. Enhanced Due Diligence required. Escalated to Compliance Head.")
                    .documentCheckerResult("{\"status\":\"VERIFIED\",\"ktp_valid\":true,\"face_match_score\":0.97,\"document_authenticity\":\"GENUINE\",\"expiry_valid\":true}")
                    .resumeCrosscheckerResult("{\"verified\":true,\"government_position\":\"Direktur Jenderal\",\"ministry\":\"Kementerian Keuangan\",\"tenure\":\"5 years\",\"pep_classification\":\"DOMESTIC_PEP\"}")
                    .externalSearchResult("{\"pep_check\":\"MATCH_FOUND\",\"pep_type\":\"Government Official\",\"pep_level\":\"Tier 1\",\"sanctions_check\":\"CLEAR\",\"adverse_media\":\"FOUND\",\"adverse_media_count\":2}")
                    .wealthCalculatorResult("{\"declared_income\":15000000000,\"verified_income\":\"REQUIRES_VERIFICATION\",\"income_source\":\"GOVERNMENT_SALARY_AND_INVESTMENTS\",\"wealth_source_explanation_required\":true}")
                    .build();

            // Application 4 - Submitted (Dewi Lestari)
            KycApplication app4 = KycApplication.builder()
                    .customer(c4)
                    .status(KycStatus.SUBMITTED)
                    .riskScore(null)
                    .requiresManualReview(false)
                    .pepMatch(false)
                    .sanctionsMatch(false)
                    .adverseMediaFound(false)
                    .caseId("KYC-2024-004")
                    .adminComments("Application submitted. Pending agent processing.")
                    .build();

            // Application 5 - Approved (Rudi Hartono)
            KycApplication app5 = KycApplication.builder()
                    .customer(c5)
                    .status(KycStatus.APPROVED)
                    .riskScore(72)
                    .riskLabels("[\"MEDIUM_RISK\", \"HIGH_NET_WORTH\", \"VERIFIED\"]")
                    .requiresManualReview(false)
                    .pepMatch(false)
                    .sanctionsMatch(false)
                    .adverseMediaFound(false)
                    .caseId("KYC-2024-005")
                    .adminComments("High net worth verified through business documentation. All checks passed.")
                    .documentCheckerResult("{\"status\":\"VERIFIED\",\"ktp_valid\":true,\"face_match_score\":0.96,\"document_authenticity\":\"GENUINE\",\"expiry_valid\":true}")
                    .resumeCrosscheckerResult("{\"verified\":true,\"linkedin_match\":true,\"company_verified\":\"PT Hartono Group\",\"position\":\"CEO\",\"company_registration\":\"VERIFIED\"}")
                    .externalSearchResult("{\"pep_check\":\"CLEAR\",\"sanctions_check\":\"CLEAR\",\"adverse_media\":\"NONE\",\"sources_checked\":[\"OFAC\",\"UN\",\"EU\",\"DJBC\",\"WORLDCHECK\"]}")
                    .wealthCalculatorResult("{\"declared_income\":50000000000,\"verified_income\":48500000000,\"income_source\":\"BUSINESS_OWNERSHIP\",\"consistency\":\"HIGH\",\"tax_compliance\":\"VERIFIED\"}")
                    .reviewedBy("reviewer")
                    .reviewedAt(LocalDateTime.now().minusDays(3))
                    .build();

            // Application 6 - Rejected (Michael Tanaka - Sanctions)
            KycApplication app6 = KycApplication.builder()
                    .customer(c6)
                    .status(KycStatus.REJECTED)
                    .riskScore(5)
                    .riskLabels("[\"CRITICAL_RISK\", \"SANCTIONS_MATCH\", \"REJECTED\"]")
                    .requiresManualReview(true)
                    .pepMatch(false)
                    .sanctionsMatch(true)
                    .adverseMediaFound(true)
                    .adverseMediaSources("[{\"source\":\"Reuters\",\"title\":\"Trade Sanctions Violation Investigation\",\"url\":\"https://reuters.com/sanctions/123\",\"date\":\"2023-08-10\"},{\"source\":\"OFAC\",\"title\":\"SDN List Update\",\"url\":\"https://ofac.treasury.gov/sdn\",\"date\":\"2023-09-01\"}]")
                    .caseId("KYC-2024-006")
                    .adminComments("REJECTED - Sanctions list match confirmed. Customer appears on OFAC SDN list. Account opening denied per compliance policy.")
                    .rejectionReason("Customer identified on OFAC Specially Designated Nationals (SDN) list. Trade sanctions violation investigation pending.")
                    .documentCheckerResult("{\"status\":\"VERIFIED\",\"passport_valid\":true,\"face_match_score\":0.94,\"document_authenticity\":\"GENUINE\"}")
                    .resumeCrosscheckerResult("{\"verified\":false,\"company_status\":\"UNDER_INVESTIGATION\",\"business_activities\":\"FLAGGED\"}")
                    .externalSearchResult("{\"pep_check\":\"CLEAR\",\"sanctions_check\":\"MATCH_FOUND\",\"sanctions_list\":\"OFAC_SDN\",\"match_score\":0.99,\"adverse_media\":\"FOUND\",\"adverse_media_count\":5}")
                    .wealthCalculatorResult("{\"declared_income\":100000000000,\"verified_income\":\"BLOCKED\",\"income_source\":\"INTERNATIONAL_TRADE\",\"source_of_funds\":\"UNVERIFIABLE\"}")
                    .reviewedBy("admin")
                    .reviewedAt(LocalDateTime.now().minusDays(1))
                    .build();

            // Application 7 - Approved (Putri Andini)
            KycApplication app7 = KycApplication.builder()
                    .customer(c7)
                    .status(KycStatus.APPROVED)
                    .riskScore(95)
                    .riskLabels("[\"LOW_RISK\", \"VERIFIED\", \"STANDARD\"]")
                    .requiresManualReview(false)
                    .pepMatch(false)
                    .sanctionsMatch(false)
                    .adverseMediaFound(false)
                    .caseId("KYC-2024-007")
                    .adminComments("Standard low-risk profile. All checks passed. Auto-approved.")
                    .documentCheckerResult("{\"status\":\"VERIFIED\",\"ktp_valid\":true,\"face_match_score\":0.99,\"document_authenticity\":\"GENUINE\",\"expiry_valid\":true}")
                    .resumeCrosscheckerResult("{\"verified\":true,\"linkedin_match\":true,\"company_verified\":\"PT Bank Central Asia Tbk\",\"position_match\":true,\"employment_verified\":true}")
                    .externalSearchResult("{\"pep_check\":\"CLEAR\",\"sanctions_check\":\"CLEAR\",\"adverse_media\":\"NONE\"}")
                    .wealthCalculatorResult("{\"declared_income\":50000000,\"verified_income\":48000000,\"income_source\":\"SALARY\",\"consistency\":\"HIGH\"}")
                    .reviewedBy("system")
                    .reviewedAt(LocalDateTime.now().minusDays(2))
                    .build();

            // Application 8 - Under Review (Hendra Gunawan - Adverse Media)
            KycApplication app8 = KycApplication.builder()
                    .customer(c8)
                    .status(KycStatus.UNDER_REVIEW)
                    .riskScore(30)
                    .riskLabels("[\"HIGH_RISK\", \"ADVERSE_MEDIA\", \"MINING_INDUSTRY\", \"MANUAL_REVIEW\"]")
                    .requiresManualReview(true)
                    .pepMatch(false)
                    .sanctionsMatch(false)
                    .adverseMediaFound(true)
                    .adverseMediaSources("[{\"source\":\"Tempo\",\"title\":\"Investigasi Tambang Ilegal di Kalimantan\",\"url\":\"https://tempo.co/mining/789\",\"date\":\"2024-03-01\"},{\"source\":\"CNN Indonesia\",\"title\":\"Dugaan Pelanggaran Lingkungan\",\"url\":\"https://cnnindonesia.com/env/456\",\"date\":\"2024-02-15\"},{\"source\":\"Mongabay\",\"title\":\"Deforestasi di Konsesi Tambang\",\"url\":\"https://mongabay.co.id/forest/123\",\"date\":\"2024-01-20\"}]")
                    .caseId("KYC-2024-008")
                    .adminComments("Multiple adverse media hits related to environmental violations and illegal mining allegations. Requires senior compliance review.")
                    .documentCheckerResult("{\"status\":\"VERIFIED\",\"ktp_valid\":true,\"face_match_score\":0.93,\"document_authenticity\":\"GENUINE\",\"expiry_valid\":true}")
                    .resumeCrosscheckerResult("{\"verified\":true,\"company_verified\":\"PT Gunawan Mining\",\"position\":\"Komisaris\",\"industry\":\"MINING\",\"regulatory_issues\":\"FLAGGED\"}")
                    .externalSearchResult("{\"pep_check\":\"CLEAR\",\"sanctions_check\":\"CLEAR\",\"adverse_media\":\"FOUND\",\"adverse_media_count\":3,\"adverse_media_categories\":[\"ENVIRONMENTAL\",\"REGULATORY\"]}")
                    .wealthCalculatorResult("{\"declared_income\":25000000000,\"verified_income\":\"PARTIAL\",\"income_source\":\"MINING_BUSINESS\",\"source_documentation\":\"INCOMPLETE\"}")
                    .build();

            // Application 9 - Action Required (Rina Wijayanti)
            KycApplication app9 = KycApplication.builder()
                    .customer(c9)
                    .status(KycStatus.ACTION_REQUIRED)
                    .riskScore(65)
                    .riskLabels("[\"MEDIUM_RISK\", \"DOCUMENT_ISSUE\"]")
                    .requiresManualReview(true)
                    .pepMatch(false)
                    .sanctionsMatch(false)
                    .adverseMediaFound(false)
                    .caseId("KYC-2024-009")
                    .adminComments("Bank statement shows inconsistent income pattern. Customer needs to provide additional documentation: 6-month transaction history and business registration.")
                    .documentCheckerResult("{\"status\":\"PARTIAL\",\"ktp_valid\":true,\"face_match_score\":0.96,\"document_authenticity\":\"GENUINE\",\"additional_docs_required\":true}")
                    .resumeCrosscheckerResult("{\"verified\":true,\"linkedin_match\":true,\"business_type\":\"E-COMMERCE\",\"marketplace_verified\":\"TOKOPEDIA_SELLER\"}")
                    .externalSearchResult("{\"pep_check\":\"CLEAR\",\"sanctions_check\":\"CLEAR\",\"adverse_media\":\"NONE\"}")
                    .wealthCalculatorResult("{\"declared_income\":1500000000,\"verified_income\":800000000,\"income_source\":\"E_COMMERCE\",\"consistency\":\"LOW\",\"discrepancy\":\"INCOME_MISMATCH\",\"additional_verification_required\":true}")
                    .build();

            // Application 10 - Draft (Agus Prasetyo)
            KycApplication app10 = KycApplication.builder()
                    .customer(c10)
                    .status(KycStatus.DRAFT)
                    .riskScore(null)
                    .requiresManualReview(false)
                    .pepMatch(false)
                    .sanctionsMatch(false)
                    .adverseMediaFound(false)
                    .caseId("KYC-2024-010")
                    .adminComments("Application initiated. Awaiting document upload.")
                    .build();

            kycApplicationRepository.saveAll(List.of(app1, app2, app3, app4, app5, app6, app7, app8, app9, app10));
            System.out.println("✅ 10 KYC applications created with full agent results.");

            // ==========================================
            // STEP 5: Seed KYC Documents
            // ==========================================
            System.out.println("📄 Seeding KYC documents...");

            // Documents for Application 1 (Budi)
            KycDocument doc1a = KycDocument.builder()
                    .application(app1)
                    .documentType(DocumentType.KTP_FRONT)
                    .fileName("budi_ktp_front.jpg")
                    .fileUrl("/uploads/kyc-2024-001/budi_ktp_front.jpg")
                    .build();
            KycDocument doc1b = KycDocument.builder()
                    .application(app1)
                    .documentType(DocumentType.SELFIE_WITH_KTP)
                    .fileName("budi_selfie_ktp.jpg")
                    .fileUrl("/uploads/kyc-2024-001/budi_selfie_ktp.jpg")
                    .build();
            KycDocument doc1c = KycDocument.builder()
                    .application(app1)
                    .documentType(DocumentType.SLIP_GAJI)
                    .fileName("budi_slip_gaji.pdf")
                    .fileUrl("/uploads/kyc-2024-001/budi_slip_gaji.pdf")
                    .build();

            // Documents for Application 2 (Siti)
            KycDocument doc2a = KycDocument.builder()
                    .application(app2)
                    .documentType(DocumentType.KTP_FRONT)
                    .fileName("siti_ktp_front.jpg")
                    .fileUrl("/uploads/kyc-2024-002/siti_ktp_front.jpg")
                    .build();
            KycDocument doc2b = KycDocument.builder()
                    .application(app2)
                    .documentType(DocumentType.NPWP)
                    .fileName("siti_npwp.jpg")
                    .fileUrl("/uploads/kyc-2024-002/siti_npwp.jpg")
                    .build();
            KycDocument doc2c = KycDocument.builder()
                    .application(app2)
                    .documentType(DocumentType.REKENING_KORAN)
                    .fileName("siti_rekening_koran.pdf")
                    .fileUrl("/uploads/kyc-2024-002/siti_rekening_koran.pdf")
                    .build();

            // Documents for Application 3 (Ahmad - PEP)
            KycDocument doc3a = KycDocument.builder()
                    .application(app3)
                    .documentType(DocumentType.KTP_FRONT)
                    .fileName("ahmad_ktp_front.jpg")
                    .fileUrl("/uploads/kyc-2024-003/ahmad_ktp_front.jpg")
                    .build();
            KycDocument doc3b = KycDocument.builder()
                    .application(app3)
                    .documentType(DocumentType.SPT_PAJAK)
                    .fileName("ahmad_spt_pajak.pdf")
                    .fileUrl("/uploads/kyc-2024-003/ahmad_spt_pajak.pdf")
                    .build();

            // Documents for Application 5 (Rudi)
            KycDocument doc5a = KycDocument.builder()
                    .application(app5)
                    .documentType(DocumentType.KTP_FRONT)
                    .fileName("rudi_ktp_front.jpg")
                    .fileUrl("/uploads/kyc-2024-005/rudi_ktp_front.jpg")
                    .build();
            KycDocument doc5b = KycDocument.builder()
                    .application(app5)
                    .documentType(DocumentType.BANK_STATEMENT)
                    .fileName("rudi_bank_statement.pdf")
                    .fileUrl("/uploads/kyc-2024-005/rudi_bank_statement.pdf")
                    .build();

            // Documents for Application 6 (Michael - Rejected)
            KycDocument doc6a = KycDocument.builder()
                    .application(app6)
                    .documentType(DocumentType.PASSPORT)
                    .fileName("michael_passport.jpg")
                    .fileUrl("/uploads/kyc-2024-006/michael_passport.jpg")
                    .build();

            // Documents for Application 7 (Putri)
            KycDocument doc7a = KycDocument.builder()
                    .application(app7)
                    .documentType(DocumentType.KTP_FRONT)
                    .fileName("putri_ktp_front.jpg")
                    .fileUrl("/uploads/kyc-2024-007/putri_ktp_front.jpg")
                    .build();
            KycDocument doc7b = KycDocument.builder()
                    .application(app7)
                    .documentType(DocumentType.SELFIE_WITH_KTP)
                    .fileName("putri_selfie_ktp.jpg")
                    .fileUrl("/uploads/kyc-2024-007/putri_selfie_ktp.jpg")
                    .build();

            kycDocumentRepository.saveAll(List.of(
                    doc1a, doc1b, doc1c,
                    doc2a, doc2b, doc2c,
                    doc3a, doc3b,
                    doc5a, doc5b,
                    doc6a,
                    doc7a, doc7b
            ));
            System.out.println("✅ 13 KYC documents created.");

            // ==========================================
            // Summary
            // ==========================================
            System.out.println("\n========================================");
            System.out.println("🎉 DATA SEEDING COMPLETE!");
            System.out.println("========================================");
            System.out.println("👤 Users: 3 (admin, reviewer, analyst)");
            System.out.println("👥 Customers: 10");
            System.out.println("📋 KYC Applications: 10");
            System.out.println("   - Approved: 3");
            System.out.println("   - Under Review: 3");
            System.out.println("   - Rejected: 1");
            System.out.println("   - Action Required: 1");
            System.out.println("   - Submitted: 1");
            System.out.println("   - Draft: 1");
            System.out.println("📄 Documents: 13");
            System.out.println("========================================");
            System.out.println("🔑 Login credentials:");
            System.out.println("   admin / admin123");
            System.out.println("   reviewer / reviewer123");
            System.out.println("   analyst / analyst123");
            System.out.println("========================================\n");
        };
    }
}
