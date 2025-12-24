package com.kyc.automation.entity;

/**
 * Document types for Indonesian KYC verification
 */
public enum DocumentType {
    // Indonesian ID Documents
    KTP_FRONT,           // Kartu Tanda Penduduk (Front)
    KTP_BACK,            // Kartu Tanda Penduduk (Back)
    
    // Legacy support
    NATIONAL_ID_FRONT,
    NATIONAL_ID_BACK,
    
    // Passport
    PASSPORT,
    KITAS,               // Kartu Izin Tinggal Terbatas (for foreigners)
    KITAP,               // Kartu Izin Tinggal Tetap (permanent resident)
    
    // Selfie/Liveness
    SELFIE,
    SELFIE_WITH_KTP,     // Selfie holding KTP
    
    // Financial Documents (for Wealth Calculator agent)
    BANK_STATEMENT,
    REKENING_KORAN,      // Indonesian bank statement
    SPT_PAJAK,           // Tax return (Surat Pemberitahuan Pajak)
    SLIP_GAJI,           // Salary slip
    
    // Address Proof (for Document Checker agent)
    UTILITY_BILL,
    KARTU_KELUARGA,      // Family Card
    SURAT_DOMISILI,      // Domicile letter
    
    // Employment (for Resume Crosschecker agent)
    RESUME,
    SURAT_KETERANGAN_KERJA,  // Employment letter
    NPWP                 // Tax ID (Nomor Pokok Wajib Pajak)
}
