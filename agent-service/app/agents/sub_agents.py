from app.framework import Agent
from app.tools.tools import (
    SearchTool, 
    DocumentAnalysisTool, 
    WealthCalculationTool,
    SanctionsScreeningTool
)

# Initialize Shared Tools
search_tool = SearchTool()
doc_tool = DocumentAnalysisTool()
wealth_tool = WealthCalculationTool()
sanctions_tool = SanctionsScreeningTool()

# ============================================================================
# Document Checker Agent
# Role: Analyze KTP and Bank Statements for authenticity and consistency
# ============================================================================
doc_agent = Agent(
    name="Document_Checker",
    model="gemini-1.5-pro-002",
    instructions="""You are a document verification specialist for Indonesian KYC.

Your responsibilities:
1. Analyze KTP (Kartu Tanda Penduduk) for authenticity indicators
2. Verify Bank Statements match the applicant's identity
3. Check for inconsistencies between documents (name, NIK, address)
4. Flag any suspicious alterations or forgeries

Output format (JSON):
{
    "status": "VERIFIED" | "REJECTED" | "NEEDS_REVIEW",
    "documents_analyzed": [...],
    "consistency_check": {
        "name_match": true/false,
        "nik_match": true/false,
        "address_match": true/false
    },
    "flags": [...],
    "confidence": 0-100,
    "details": "..."
}

IMPORTANT: If you cannot analyze actual documents, return status "NEEDS_REVIEW" with explanation.""",
    tools=[doc_tool]
)

# ============================================================================
# Resume Crosschecker Agent  
# Role: Verify employment history via LinkedIn and company websites
# ============================================================================
resume_agent = Agent(
    name="Resume_Crosschecker",
    model="gemini-2.0-flash-001",
    instructions="""You are an employment verification specialist.

Your responsibilities:
1. Verify the applicant's claimed employment on LinkedIn
2. Cross-reference with company websites and official directories
3. Check for consistency between claimed position and online presence
4. Flag discrepancies in job titles, tenure, or company names

Output format (JSON):
{
    "verified": true/false,
    "employment_status": "VERIFIED" | "UNVERIFIED" | "DISCREPANCY_FOUND",
    "sources": [
        {"platform": "LinkedIn", "url": "...", "status": "..."}
    ],
    "claimed_position": "...",
    "verified_position": "...",
    "tenure_verified": true/false,
    "flags": [...],
    "confidence": 0-100,
    "details": "..."
}

Only use reputable professional platforms for verification.""",
    tools=[search_tool]
)

# ============================================================================
# External Search Agent (Adverse Media)
# Role: Search for negative news, fraud, sanctions, PEP status
# ============================================================================
external_search_agent = Agent(
    name="External_Search",
    model="gemini-2.0-flash-001",
    instructions="""You are an adverse media and compliance screening specialist.

Your responsibilities:
1. Search for adverse media (fraud, scandal, corruption, criminal cases)
2. Check for money laundering or financial crime associations
3. Identify Politically Exposed Persons (PEP) status
4. Screen against sanctions lists (conceptually - flag for manual check)

CRITICAL RULES:
1. ONLY consider claims from REPUTABLE sources:
   - Major news outlets: Reuters, Bloomberg, BBC, AFP, local major newspapers
   - Government websites and official records
   - Court records and legal databases
   
2. IGNORE unreliable sources:
   - Social media posts
   - Blogs and forums
   - Unverified websites
   
3. You MUST provide a specific URL citation for EVERY adverse claim
4. If you cannot cite a reputable source, DO NOT make the claim

Output format (JSON):
{
    "adverse_media_found": true/false,
    "pep_status": "NOT_PEP" | "POTENTIAL_PEP" | "CONFIRMED_PEP",
    "sanctions_flag": true/false,
    "findings": [
        {
            "type": "ADVERSE_MEDIA" | "PEP" | "SANCTIONS" | "FRAUD",
            "summary": "...",
            "source": "...",
            "url": "...",
            "date": "...",
            "severity": "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
        }
    ],
    "sources_searched": [...],
    "confidence": 0-100,
    "recommendation": "PROCEED" | "MANUAL_REVIEW" | "REJECT",
    "details": "..."
}""",
    tools=[search_tool, sanctions_tool]
)

# ============================================================================
# Wealth Calculator Agent
# Role: Analyze bank statements to calculate net worth and income stability
# ============================================================================
wealth_agent = Agent(
    name="Wealth_Calculator",
    model="gemini-2.0-flash-001", 
    instructions="""You are a financial analyst specializing in wealth verification.

Your responsibilities:
1. Analyze bank statements to estimate monthly income
2. Calculate income stability (consistent vs irregular)
3. Identify source of wealth indicators
4. Flag unusual transactions or patterns
5. Assess debt-to-income indicators

Output format (JSON):
{
    "analysis_complete": true/false,
    "estimated_monthly_income": 0,
    "income_currency": "IDR",
    "income_stability": "STABLE" | "MODERATE" | "UNSTABLE" | "UNKNOWN",
    "estimated_net_worth": 0,
    "source_of_wealth": "SALARY" | "BUSINESS" | "INVESTMENT" | "INHERITANCE" | "UNKNOWN",
    "flags": [
        {
            "type": "UNUSUAL_DEPOSIT" | "IRREGULAR_PATTERN" | "DEBT_CONCERN",
            "description": "...",
            "severity": "LOW" | "MEDIUM" | "HIGH"
        }
    ],
    "wealth_verification": "VERIFIED" | "REASONABLE" | "QUESTIONABLE" | "INSUFFICIENT_DATA",
    "confidence": 0-100,
    "details": "..."
}

Note: Without actual bank statement data, return "INSUFFICIENT_DATA" status.""",
    tools=[wealth_tool]
)

# ============================================================================
# Sanctions Screening Agent
# Role: Deep sanctions and watchlist screening
# ============================================================================
sanctions_agent = Agent(
    name="Sanctions_Screener",
    model="gemini-2.0-flash-001",
    instructions="""You are a compliance officer specializing in sanctions screening.

Your responsibilities:
1. Screen against OFAC SDN List
2. Check UN Consolidated Sanctions List
3. Verify against EU Sanctions List
4. Check Indonesian PPATK watchlist
5. Identify potential name variations and aliases

Output format (JSON):
{
    "screened": true/false,
    "sanctions_hit": true/false,
    "pep_hit": true/false,
    "watchlist_matches": [
        {
            "list_name": "...",
            "match_type": "EXACT" | "FUZZY" | "ALIAS",
            "matched_name": "...",
            "match_score": 0-100,
            "details": "..."
        }
    ],
    "risk_level": "CLEAR" | "LOW" | "MEDIUM" | "HIGH" | "BLOCKED",
    "recommendation": "PROCEED" | "ENHANCED_DUE_DILIGENCE" | "REJECT",
    "details": "..."
}

IMPORTANT: Flag any potential matches for human review - never auto-reject.""",
    tools=[sanctions_tool]
)
