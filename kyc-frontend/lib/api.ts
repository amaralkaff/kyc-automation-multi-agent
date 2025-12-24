import axios from 'axios';

// ============================================================================
// Types matching Java Backend Entities
// ============================================================================

// Enum: KycStatus
export type KycStatus = 
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'APPROVED'
  | 'REJECTED'
  | 'ACTION_REQUIRED';

// Enum: DocumentType (Indonesian KYC Documents)
export type DocumentType = 
  | 'KTP_FRONT'           // Kartu Tanda Penduduk - depan
  | 'KTP_BACK'            // Kartu Tanda Penduduk - belakang
  | 'PASSPORT'
  | 'KITAS'               // Kartu Izin Tinggal Terbatas (temporary stay permit)
  | 'KITAP'               // Kartu Izin Tinggal Tetap (permanent stay permit)
  | 'SELFIE_WITH_KTP'     // Selfie holding KTP
  | 'BANK_STATEMENT'
  | 'REKENING_KORAN'      // Bank statement (Indonesian term)
  | 'SPT_PAJAK'           // Surat Pemberitahuan Tahunan (annual tax return)
  | 'SLIP_GAJI'           // Salary slip
  | 'KARTU_KELUARGA'      // Family card
  | 'SURAT_DOMISILI'      // Domicile letter
  | 'RESUME'              // CV/Resume for crosschecking
  | 'SURAT_KETERANGAN_KERJA' // Employment certificate
  | 'NPWP';               // Nomor Pokok Wajib Pajak (tax ID)

// Enum: RiskLevel
export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

// Enum: Citizenship
export type Citizenship = 'WNI' | 'WNA'; // Warga Negara Indonesia / Asing

// Entity: Customer (Indonesian KYC)
export interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string; // ISO date string
  
  // Indonesian Identity
  nik: string;                // Nomor Induk Kependudukan (16 digits)
  nationalId?: string;        // Passport number for WNA
  citizenship: Citizenship;
  
  // Contact
  phoneNumber: string;
  
  // Indonesian Address Hierarchy
  address: string;            // Street address
  kelurahan?: string;         // Village/Sub-district
  kecamatan?: string;         // District
  kabupaten?: string;         // Regency/City
  provinsi?: string;          // Province
  postalCode?: string;
  
  // Employment Info (for wealth verification)
  occupation?: string;
  companyName?: string;
  linkedinUrl?: string;
  
  // Risk Assessment
  riskLevel?: RiskLevel;
  netWorth?: number;
  
  kycApplications?: KycApplication[];
}

// Entity: KycDocument
export interface KycDocument {
  id: number;
  documentType: DocumentType;
  fileName: string;
  fileUrl: string;
}

// Entity: KycApplication (with ADK Agent Results)
export interface KycApplication {
  id: number;
  customer?: Customer;
  status: KycStatus;
  
  // Overall Risk Assessment
  riskScore: number | null;          // 0-100 (High score = Low Risk)
  riskLabels: string | null;
  
  // ADK Agent Results
  caseId: string | null;             // From ADK Agent
  agentReport: string | null;        // Full JSON report from Agent
  
  // Sub-Agent Results (Google ADK Pattern)
  documentCheckerResult: string | null;     // Document_Checker agent output
  resumeCrosscheckerResult: string | null;  // Resume_Crosschecker agent output
  externalSearchResult: string | null;      // External_Search agent output
  wealthCalculatorResult: string | null;    // Wealth_Calculator agent output
  
  // External Search Flags
  pepMatch: boolean;                 // Politically Exposed Person
  sanctionsMatch: boolean;           // OFAC/UN Sanctions list
  adverseMediaFound: boolean;        // Negative news
  adverseMediaSources: string | null;
  
  // Manual Review
  requiresManualReview: boolean | null;
  adminComments: string | null;
  rejectionReason: string | null;
  reviewedBy: string | null;
  reviewedAt: string | null;
  
  // Provider Integration
  providerApplicantId: string | null;
  
  // Documents & Timestamps
  documents: KycDocument[];
  createdAt: string;
  updatedAt: string;
}

// Enum: Role (User roles)
export type Role = 'USER' | 'ADMIN';

// Entity: User (matches Java User entity)
export interface User {
  id: number;
  username: string;
  role: Role;
}

// DTO: AuthenticationRequest
export interface AuthenticationRequest {
  username: string;
  password: string;
}

// DTO: RegisterRequest
export interface RegisterRequest {
  username: string;
  password: string;
}

// DTO: AuthenticationResponse (matches Java DTO)
export interface AuthenticationResponse {
  token: string;
  userId: number;
  username: string;
  role: Role;
}

// DTO: CreateCustomer (for POST/PUT - Indonesian KYC)
export interface CreateCustomerRequest {
  firstName: string;
  lastName: string;
  email: string;
  dateOfBirth: string;
  
  // Indonesian Identity
  nik: string;                // Required: 16-digit NIK
  nationalId?: string;        // Optional: Passport for WNA
  citizenship: Citizenship;
  
  // Contact
  phoneNumber: string;
  
  // Indonesian Address
  address: string;
  kelurahan?: string;
  kecamatan?: string;
  kabupaten?: string;
  provinsi?: string;
  postalCode?: string;
  
  // Employment (Optional)
  occupation?: string;
  companyName?: string;
  linkedinUrl?: string;
}

// ============================================================================
// API Configuration
// ============================================================================

const api = axios.create({
  baseURL: '/api',
});

// Separate instance for auth to avoid interceptor loops
const authApi = axios.create({
  baseURL: '/api',
});

// ============================================================================
// Authentication Helper
// ============================================================================

const getToken = (): string | null => {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('token');
  }
  return null;
};

api.interceptors.request.use(async (config) => {
  // Don't intercept auth requests
  if (config.url?.includes('/auth/')) {
    return config;
  }

  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // If 401/403, redirect to login
    if (error.response?.status === 401 || error.response?.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================================================
// Auth API - POST /api/auth/*
// ============================================================================

/**
 * Register a new user
 * POST /api/auth/register
 */
export const registerUser = async (request: RegisterRequest): Promise<AuthenticationResponse> => {
  const response = await authApi.post<AuthenticationResponse>('/auth/register', request);
  return response.data;
};

/**
 * Authenticate user and get JWT token
 * POST /api/auth/authenticate
 */
export const authenticateUser = async (request: AuthenticationRequest): Promise<AuthenticationResponse> => {
  const response = await authApi.post<AuthenticationResponse>('/auth/authenticate', request);
  return response.data;
};

// ============================================================================
// Customer API - /api/customers
// ============================================================================

/**
 * Get all customers
 * GET /api/customers
 */
export const getCustomers = async (): Promise<Customer[]> => {
  const response = await api.get<Customer[]>('/customers');
  return response.data;
};

/**
 * Get customer by ID
 * GET /api/customers/{id}
 */
export const getCustomerById = async (id: number): Promise<Customer> => {
  const response = await api.get<Customer>(`/customers/${id}`);
  return response.data;
};

/**
 * Create a new customer
 * POST /api/customers
 */
export const createCustomer = async (customer: CreateCustomerRequest): Promise<Customer> => {
  const response = await api.post<Customer>('/customers', customer);
  return response.data;
};

/**
 * Update an existing customer
 * PUT /api/customers/{id}
 */
export const updateCustomer = async (id: number, customer: CreateCustomerRequest): Promise<Customer> => {
  const response = await api.put<Customer>(`/customers/${id}`, customer);
  return response.data;
};

/**
 * Delete a customer
 * DELETE /api/customers/{id}
 */
export const deleteCustomer = async (id: number): Promise<void> => {
  await api.delete(`/customers/${id}`);
};

// ============================================================================
// KYC Application API - /api/kyc
// ============================================================================

/**
 * Initiate a new KYC application for a customer
 * POST /api/kyc/initiate/{customerId}
 */
export const initiateKyc = async (customerId: number): Promise<KycApplication> => {
  const response = await api.post<KycApplication>(`/kyc/initiate/${customerId}`);
  return response.data;
};

/**
 * Upload a KYC document
 * POST /api/kyc/{applicationId}/upload
 * Content-Type: multipart/form-data
 */
export const uploadKycDocument = async (
  applicationId: number,
  file: File,
  documentType: DocumentType
): Promise<KycDocument> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('type', documentType);

  const response = await api.post<KycDocument>(
    `/kyc/${applicationId}/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }
  );
  return response.data;
};

/**
 * Submit KYC application for verification
 * POST /api/kyc/{applicationId}/submit
 */
export const submitKyc = async (applicationId: number): Promise<KycApplication> => {
  const response = await api.post<KycApplication>(`/kyc/${applicationId}/submit`);
  return response.data;
};

/**
 * Get KYC application details by ID
 * GET /api/kyc/{applicationId}
 */
export const getApplicationDetails = async (applicationId: number): Promise<KycApplication> => {
  const response = await api.get<KycApplication>(`/kyc/${applicationId}`);
  return response.data;
};

/**
 * Get all KYC applications for a specific customer
 * GET /api/kyc/customer/{customerId}
 */
export const getCustomerApplications = async (customerId: number): Promise<KycApplication[]> => {
  const response = await api.get<KycApplication[]>(`/kyc/customer/${customerId}`);
  return response.data;
};

/**
 * Get all KYC applications
 * GET /api/kyc/applications
 */
export const getAllApplications = async (): Promise<KycApplication[]> => {
  const response = await api.get<KycApplication[]>('/kyc/applications');
  return response.data;
};

/**
 * Get applications by status
 * GET /api/kyc/applications/status/{status}
 */
export const getApplicationsByStatus = async (status: KycStatus): Promise<KycApplication[]> => {
  const response = await api.get<KycApplication[]>(`/kyc/applications/status/${status}`);
  return response.data;
};

/**
 * Get review queue (applications requiring manual review)
 * GET /api/kyc/review-queue
 */
export const getReviewQueue = async (): Promise<KycApplication[]> => {
  const response = await api.get<KycApplication[]>('/kyc/review-queue');
  return response.data;
};

/**
 * Approve an application (HITL action)
 * POST /api/kyc/{applicationId}/approve
 */
export const approveApplication = async (
  applicationId: number,
  reviewerName: string,
  comment?: string
): Promise<KycApplication> => {
  const params = new URLSearchParams({ reviewerName });
  if (comment) params.append('comment', comment);
  
  const response = await api.post<KycApplication>(
    `/kyc/${applicationId}/approve?${params.toString()}`
  );
  return response.data;
};

/**
 * Reject an application (HITL action)
 * POST /api/kyc/{applicationId}/reject
 */
export const rejectApplication = async (
  applicationId: number,
  reason: string,
  reviewerName: string
): Promise<KycApplication> => {
  const params = new URLSearchParams({ reason, reviewerName });
  
  const response = await api.post<KycApplication>(
    `/kyc/${applicationId}/reject?${params.toString()}`
  );
  return response.data;
};

/**
 * Request additional information (HITL action)
 * POST /api/kyc/{applicationId}/request-info
 */
export const requestAdditionalInfo = async (
  applicationId: number,
  comment: string,
  reviewerName: string
): Promise<KycApplication> => {
  const params = new URLSearchParams({ comment, reviewerName });
  
  const response = await api.post<KycApplication>(
    `/kyc/${applicationId}/request-info?${params.toString()}`
  );
  return response.data;
};

// Analytics Summary Type
export interface AnalyticsSummary {
  total: number;
  approved: number;
  rejected: number;
  underReview: number;
  pendingManualReview: number;
  pepMatches: number;
  sanctionsMatches: number;
  adverseMediaCases: number;
  averageRiskScore: number;
}

/**
 * Get KYC analytics summary
 * GET /api/kyc/analytics/summary
 */
export const getAnalyticsSummary = async (): Promise<AnalyticsSummary> => {
  const response = await api.get<AnalyticsSummary>('/kyc/analytics/summary');
  return response.data;
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get status badge color based on KYC status
 */
export const getStatusColor = (status: KycStatus): string => {
  const colors: Record<KycStatus, string> = {
    DRAFT: 'bg-gray-500',
    SUBMITTED: 'bg-blue-500',
    UNDER_REVIEW: 'bg-yellow-500',
    APPROVED: 'bg-green-500',
    REJECTED: 'bg-red-500',
    ACTION_REQUIRED: 'bg-orange-500',
  };
  return colors[status] || 'bg-gray-500';
};

/**
 * Get human-readable status label
 */
export const getStatusLabel = (status: KycStatus): string => {
  const labels: Record<KycStatus, string> = {
    DRAFT: 'Draft',
    SUBMITTED: 'Submitted',
    UNDER_REVIEW: 'Under Review',
    APPROVED: 'Approved',
    REJECTED: 'Rejected',
    ACTION_REQUIRED: 'Action Required',
  };
  return labels[status] || status;
};

/**
 * Get human-readable document type label (Indonesian KYC)
 */
export const getDocumentTypeLabel = (type: DocumentType): string => {
  const labels: Record<DocumentType, string> = {
    KTP_FRONT: 'KTP (Depan)',
    KTP_BACK: 'KTP (Belakang)',
    PASSPORT: 'Passport',
    KITAS: 'KITAS',
    KITAP: 'KITAP',
    SELFIE_WITH_KTP: 'Selfie dengan KTP',
    BANK_STATEMENT: 'Bank Statement',
    REKENING_KORAN: 'Rekening Koran',
    SPT_PAJAK: 'SPT Pajak',
    SLIP_GAJI: 'Slip Gaji',
    KARTU_KELUARGA: 'Kartu Keluarga',
    SURAT_DOMISILI: 'Surat Domisili',
    RESUME: 'Resume/CV',
    SURAT_KETERANGAN_KERJA: 'Surat Keterangan Kerja',
    NPWP: 'NPWP',
  };
  return labels[type] || type;
};

/**
 * Calculate risk level from score
 */
export const getRiskLevel = (score: number | null): { level: string; color: string } => {
  if (score === null) return { level: 'Unknown', color: 'gray' };
  if (score >= 70) return { level: 'Low Risk', color: 'green' };
  if (score >= 40) return { level: 'Medium Risk', color: 'yellow' };
  return { level: 'High Risk', color: 'red' };
};

// ============================================================================
// KYC Agent Service API (Google ADK - Cloud Run)
// Configure via NEXT_PUBLIC_KYC_AGENT_URL environment variable
// ============================================================================

const KYC_AGENT_URL = process.env.NEXT_PUBLIC_KYC_AGENT_URL;

// Agent Service Types
export interface KycAgentRequest {
  customer_id: string;
  name: string;
  nik?: string;
  files?: string[]; // List of document URLs/paths
}

export interface KycAgentResponse {
  risk_score: number;
  status: 'APPROVED' | 'UNDER_REVIEW' | 'REJECTED';
  reasoning: string;
  found_in_db: boolean;
  case_id?: string;
  details?: {
    Document_Checker?: {
      status: string;
      details?: string;
    };
    Resume_Crosschecker?: {
      verified: boolean;
      details?: string;
    };
    External_Search?: {
      adverse_media_found: boolean;
      sources?: string[];
    };
    Wealth_Calculator?: {
      net_worth?: number;
      source_of_wealth?: string;
    };
  };
}

export interface AgentHealthCheck {
  status: string;
  service: string;
}

/**
 * Check KYC Agent Service health
 * GET /
 */
export const checkAgentHealth = async (): Promise<AgentHealthCheck> => {
  const response = await axios.get<AgentHealthCheck>(KYC_AGENT_URL);
  return response.data;
};

/**
 * Analyze customer using KYC Agent (Google ADK Multi-Agent)
 * POST /analyze
 * 
 * This triggers the full KYC workflow:
 * 1. BigQuery check for existing profiles
 * 2. Document_Checker - Analyzes ID documents
 * 3. Resume_Crosschecker - Verifies employment via web search
 * 4. External_Search - Adverse media, PEP, sanctions screening
 * 5. Wealth_Calculator - Calculates net worth from bank statements
 */
export const analyzeKycWithAgent = async (request: KycAgentRequest): Promise<KycAgentResponse> => {
  const response = await axios.post<KycAgentResponse>(`${KYC_AGENT_URL}/analyze`, request);
  return response.data;
};

/**
 * Convenience function to run agent analysis for a customer
 */
export const runAgentAnalysis = async (customer: Customer, documentUrls?: string[]): Promise<KycAgentResponse> => {
  const request: KycAgentRequest = {
    customer_id: customer.id.toString(),
    name: `${customer.firstName} ${customer.lastName}`,
    nik: customer.nationalId || undefined,
    files: documentUrls,
  };
  return analyzeKycWithAgent(request);
};

export default api;
