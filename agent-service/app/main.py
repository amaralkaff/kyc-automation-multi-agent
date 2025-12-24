from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime

# Lazy import to handle startup issues
kyc_agent = None

def get_kyc_agent():
    global kyc_agent
    if kyc_agent is None:
        try:
            from app.agents.root_agent import kyc_agent as agent
            kyc_agent = agent
        except Exception as e:
            print(f"Failed to initialize KYC agent: {e}")
            raise
    return kyc_agent

app = FastAPI(
    title="KYC Agent Service",
    description="Google ADK-powered KYC verification service with multi-agent workflow",
    version="2.0.0"
)

# CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============================================================================
# Request/Response Models
# ============================================================================

class KycRequest(BaseModel):
    customer_id: str = Field(..., description="Unique customer identifier")
    name: str = Field(..., description="Full name of the customer")
    nik: Optional[str] = Field(None, description="Indonesian NIK (16-digit ID number)")
    files: Optional[List[str]] = Field(None, description="List of document URLs/paths")
    linkedin_url: Optional[str] = Field(None, description="LinkedIn profile URL for employment verification")
    company_name: Optional[str] = Field(None, description="Claimed company for employment verification")

class RiskBreakdown(BaseModel):
    document_risk: str = "UNKNOWN"
    employment_verified: Optional[bool] = None
    adverse_media: bool = False
    pep_status: str = "UNKNOWN"
    sanctions_flag: bool = False
    wealth_status: str = "UNKNOWN"

class Finding(BaseModel):
    agent: str
    severity: str
    finding: str
    source: Optional[str] = None

class KycDetails(BaseModel):
    sub_agent_results: Optional[Dict[str, Any]] = None
    findings: Optional[List[Finding]] = None
    citations: Optional[List[str]] = None
    risk_breakdown: Optional[RiskBreakdown] = None

class KycResponse(BaseModel):
    risk_score: int = Field(..., ge=0, le=100, description="Risk score from 0-100")
    status: str = Field(..., description="APPROVED, UNDER_REVIEW, or REJECTED")
    reasoning: str = Field(..., description="Human-readable explanation")
    found_in_db: bool = Field(..., description="Whether customer was found in existing database")
    case_id: Optional[str] = Field(None, description="Unique case identifier")
    details: Optional[Dict[str, Any]] = Field(None, description="Detailed agent results")
    requires_manual_review: Optional[bool] = Field(None, description="Whether HITL review is needed")
    processing_time_ms: Optional[int] = Field(None, description="Processing time in milliseconds")

class HealthResponse(BaseModel):
    status: str
    service: str
    version: str
    timestamp: str
    agents_available: List[str]

class AgentInfo(BaseModel):
    name: str
    model: str
    description: str
    tools: List[str]

class ServiceInfo(BaseModel):
    service: str
    version: str
    description: str
    agents: List[AgentInfo]
    endpoints: Dict[str, str]

# ============================================================================
# API Endpoints
# ============================================================================

@app.get("/", response_model=HealthResponse, tags=["Health"])
def health_check():
    """
    Health check endpoint.
    Returns service status and available agents.
    """
    return HealthResponse(
        status="ok",
        service="kyc-agent-service",
        version="2.0.0",
        timestamp=datetime.now().isoformat(),
        agents_available=[
            "KYC_Manager",
            "Document_Checker",
            "Resume_Crosschecker",
            "External_Search",
            "Wealth_Calculator"
        ]
    )

@app.get("/info", response_model=ServiceInfo, tags=["Info"])
def service_info():
    """
    Get detailed service information including agent capabilities.
    """
    return ServiceInfo(
        service="KYC Agent Service",
        version="2.0.0",
        description="Multi-agent KYC verification powered by Google ADK and Gemini 2.0",
        agents=[
            AgentInfo(
                name="KYC_Manager",
                model="gemini-2.0-flash",
                description="Root agent that orchestrates the KYC workflow",
                tools=["BigQuery", "CaseIdGenerator"]
            ),
            AgentInfo(
                name="Document_Checker",
                model="gemini-1.5-pro",
                description="Analyzes KTP and bank statements for authenticity",
                tools=["DocumentAnalysis"]
            ),
            AgentInfo(
                name="Resume_Crosschecker",
                model="gemini-2.0-flash",
                description="Verifies employment via LinkedIn and web search",
                tools=["GoogleSearch"]
            ),
            AgentInfo(
                name="External_Search",
                model="gemini-2.0-flash",
                description="Searches for adverse media, PEP status, sanctions",
                tools=["GoogleSearch", "SanctionsScreening"]
            ),
            AgentInfo(
                name="Wealth_Calculator",
                model="gemini-2.0-flash",
                description="Calculates net worth from bank statements",
                tools=["WealthCalculation"]
            )
        ],
        endpoints={
            "/": "Health check",
            "/info": "Service information",
            "/analyze": "Run KYC analysis (POST)",
            "/analyze/quick": "Quick risk assessment (POST)"
        }
    )

@app.post("/analyze", response_model=KycResponse, tags=["KYC Analysis"])
def analyze_kyc(request: KycRequest):
    """
    Run full KYC analysis using multi-agent workflow.
    
    This triggers the following agents:
    1. **KYC_Manager**: Checks BigQuery for existing profiles, generates case ID
    2. **Document_Checker**: Analyzes uploaded documents for authenticity
    3. **Resume_Crosschecker**: Verifies employment via web search
    4. **External_Search**: Screens for adverse media, PEP, sanctions
    5. **Wealth_Calculator**: Analyzes bank statements for wealth verification
    
    Returns:
    - risk_score: 0-100 (higher = more risk)
    - status: APPROVED (low risk) or UNDER_REVIEW (requires human decision)
    - reasoning: Human-readable explanation of findings
    - details: Full sub-agent results with citations
    """
    try:
        # Prepare input for agents
        input_data = request.model_dump()
        
        # Add additional context if available
        if request.linkedin_url:
            input_data["linkedin_url"] = request.linkedin_url
        if request.company_name:
            input_data["company_name"] = request.company_name
        
        # Run the KYC agent workflow
        agent = get_kyc_agent()
        result = agent.run(input_data)
        
        # Ensure response matches schema
        return KycResponse(
            risk_score=min(result.get("risk_score", 0), 100),
            status=result.get("status", "UNDER_REVIEW"),
            reasoning=result.get("reasoning", "Analysis complete"),
            found_in_db=result.get("found_in_db", False),
            case_id=result.get("case_id"),
            details=result.get("details"),
            requires_manual_review=result.get("requires_manual_review", True),
            processing_time_ms=result.get("processing_time_ms")
        )
        
    except Exception as e:
        print(f"Error processing KYC: {e}")
        raise HTTPException(
            status_code=500, 
            detail=f"KYC analysis failed: {str(e)}"
        )

@app.post("/analyze/quick", tags=["KYC Analysis"])
def quick_analyze(request: KycRequest):
    """
    Quick risk assessment without full agent delegation.
    Useful for initial screening before full KYC.
    
    Returns basic risk indicators without detailed sub-agent analysis.
    """
    try:
        # Quick assessment logic
        risk_indicators = []
        risk_score = 0
        
        # Basic validation
        if not request.nik or len(request.nik) != 16:
            risk_indicators.append("Invalid or missing NIK")
            risk_score += 20
        
        if not request.files or len(request.files) == 0:
            risk_indicators.append("No documents provided")
            risk_score += 30
        
        return {
            "quick_assessment": True,
            "risk_score": min(risk_score, 100),
            "risk_indicators": risk_indicators,
            "recommendation": "PROCEED_TO_FULL_ANALYSIS" if risk_score < 50 else "REQUIRES_ADDITIONAL_DOCS",
            "message": "This is a quick assessment. Use /analyze for full KYC verification."
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ============================================================================
# Run Server
# ============================================================================

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
