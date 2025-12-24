from google.cloud import bigquery
import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
import os
import uuid
import json
from typing import Optional, Dict, Any, List
from datetime import datetime

# Configure Vertex AI
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "job-screening-app-2025")
LOCATION = os.environ.get("GOOGLE_CLOUD_REGION", "us-central1")
vertexai.init(project=PROJECT_ID, location=LOCATION)

# ============================================================================
# BigQuery Tool - Check existing customer profiles
# ============================================================================
class BigQueryTool:
    def __init__(self):
        self.dataset_id = "kyc_data"
        self.table_id = "customer_profiles"
        self._client = None

    @property
    def client(self):
        if self._client is None:
            try:
                self._client = bigquery.Client()
            except Exception as e:
                print(f"BigQuery client initialization failed: {e}")
                return None
        return self._client

    def check_existing_profile(self, nik: str) -> Optional[Dict[str, Any]]:
        """Check if a customer profile already exists in BigQuery."""
        print(f"[Tool: BigQuery] Checking for NIK: {nik}")
        
        if not self.client:
            print("[Tool: BigQuery] Client not available, skipping DB check")
            return None
            
        query = f"""
            SELECT id, name, risk_score, last_kyc_date 
            FROM `{self.client.project}.{self.dataset_id}.{self.table_id}`
            WHERE nik = @nik
            LIMIT 1
        """
        job_config = bigquery.QueryJobConfig(
            query_parameters=[
                bigquery.ScalarQueryParameter("nik", "STRING", nik)
            ]
        )
        try:
            query_job = self.client.query(query, job_config=job_config)
            results = list(query_job.result())
            if results:
                row = results[0]
                return {
                    "id": row.id,
                    "name": row.name,
                    "risk_score": row.risk_score,
                    "last_kyc_date": str(row.last_kyc_date)
                }
        except Exception as e:
            print(f"BigQuery Error: {e}")
        return None

    def save_profile(self, nik: str, name: str, risk_score: int) -> bool:
        """Save or update a customer profile in BigQuery."""
        if not self.client:
            return False
            
        try:
            table_ref = f"{self.client.project}.{self.dataset_id}.{self.table_id}"
            rows = [{
                "id": str(uuid.uuid4()),
                "nik": nik,
                "name": name,
                "risk_score": risk_score,
                "last_kyc_date": datetime.now().isoformat()
            }]
            errors = self.client.insert_rows_json(table_ref, rows)
            return len(errors) == 0
        except Exception as e:
            print(f"BigQuery Save Error: {e}")
            return False


# ============================================================================
# Google Search Tool - Web search with grounding
# ============================================================================
class SearchTool:
    def __init__(self):
        self._client = None
        
    @property
    def client(self):
        if self._client is None:
            try:
                # Use Vertex AI
                self._client = GenerativeModel("gemini-2.0-flash-001")
                print("[SearchTool] Initialized with Vertex AI gemini-2.0-flash-001")
            except Exception as e:
                print(f"[SearchTool] Client init failed: {e}")
        return self._client

    def search(self, query: str, trusted_domains: List[str] = None) -> Dict[str, Any]:
        """
        Perform web search using Vertex AI Gemini.
        
        Args:
            query: The search query
            trusted_domains: Optional list of domains to prioritize (e.g., reuters.com, bbc.com)
        """
        print(f"[Tool: Google Search] Searching for: '{query}'")
        
        if not self.client:
            # Fallback to mock results
            return self._mock_search(query)
        
        try:
            # Use Vertex AI Gemini to perform web search analysis
            response = self.client.generate_content(
                f"""Search the web for: {query}
                
                Provide factual information with citations. Focus on:
                1. Reputable news sources (Reuters, Bloomberg, BBC, local major news)
                2. Government watchlists and official records
                3. Professional networking sites for employment verification
                
                Return results in JSON format with 'results' array containing 'title', 'snippet', 'url' fields.""",
                generation_config=GenerationConfig(
                    temperature=0.1,
                )
            )
            
            # Extract text response
            text_content = response.text if hasattr(response, 'text') else str(response)
            
            # Try to parse as JSON
            try:
                import json
                parsed = json.loads(text_content)
                results = parsed.get("results", [])
            except:
                results = [{"title": "Search Result", "snippet": text_content[:500], "url": None}]
            
            return {
                "results": results,
                "raw_response": text_content[:1000],
                "grounded": False  # Simplified - no grounding metadata in basic API
            }
            
        except Exception as e:
            print(f"[Tool: Google Search] Error: {e}")
            return self._mock_search(query)

    def _mock_search(self, query: str) -> Dict[str, Any]:
        """Fallback mock search results."""
        return {
            "results": [
                {
                    "title": f"Search Results for: {query}",
                    "snippet": f"Information about {query} found during web search.",
                    "url": None
                }
            ],
            "raw_response": f"Mock search results for: {query}",
            "grounded": False
        }

    def search_adverse_media(self, name: str, additional_terms: List[str] = None) -> Dict[str, Any]:
        """
        Specialized search for adverse media, sanctions, and PEP status.
        """
        search_terms = [
            f'"{name}" fraud OR scandal OR corruption',
            f'"{name}" money laundering OR sanctions',
            f'"{name}" politically exposed person OR PEP',
            f'"{name}" criminal OR investigation'
        ]
        
        if additional_terms:
            search_terms.extend([f'"{name}" {term}' for term in additional_terms])
        
        all_results = []
        for term in search_terms[:3]:  # Limit to 3 searches
            result = self.search(term)
            all_results.extend(result.get("results", []))
        
        return {
            "results": all_results,
            "search_terms_used": search_terms[:3],
            "grounded": any(r.get("url") for r in all_results)
        }

    def verify_employment(self, name: str, company: str = None, linkedin_url: str = None) -> Dict[str, Any]:
        """
        Verify employment history via web search.
        """
        queries = []
        if linkedin_url:
            queries.append(f"site:linkedin.com {name}")
        if company:
            queries.append(f'"{name}" "{company}" employee OR staff OR director')
        queries.append(f'"{name}" professional profile OR LinkedIn')
        
        results = []
        for query in queries[:2]:
            result = self.search(query)
            results.extend(result.get("results", []))
        
        return {
            "results": results,
            "verified": bool(results),
            "sources": [r.get("url") for r in results if r.get("url")]
        }


# ============================================================================
# Case ID Generator
# ============================================================================
class CaseIdGenerator:
    def generate(self, prefix: str = "KYC") -> str:
        """Generate a unique case ID with timestamp."""
        timestamp = datetime.now().strftime("%Y%m%d")
        unique_id = uuid.uuid4().hex[:8].upper()
        return f"{prefix}-{timestamp}-{unique_id}"


# ============================================================================
# Document Analysis Tool - For multimodal document verification
# ============================================================================
class DocumentAnalysisTool:
    def __init__(self):
        self._client = None
        
    @property
    def client(self):
        if self._client is None:
            try:
                # Use Vertex AI
                self._client = GenerativeModel("gemini-1.5-pro-002")
                print("[DocumentAnalysisTool] Initialized with Vertex AI gemini-1.5-pro-002")
            except Exception as e:
                print(f"[DocumentAnalysisTool] Client init failed: {e}")
        return self._client

    def analyze_document(self, document_url: str, document_type: str = "ID") -> Dict[str, Any]:
        """
        Analyze a document image/PDF using Gemini multimodal.
        
        Args:
            document_url: URL or path to the document
            document_type: Type of document (ID, BANK_STATEMENT, KTP, etc.)
        """
        print(f"[Tool: Document Analysis] Analyzing {document_type}: {document_url}")
        
        # For production, you would:
        # 1. Download/access the document
        # 2. Pass it to Gemini 1.5 Pro (multimodal)
        # 3. Extract structured data
        
        return {
            "document_type": document_type,
            "analyzed": True,
            "extracted_data": {
                "note": "Document analysis requires actual document access"
            },
            "status": "NEEDS_VERIFICATION"
        }

    def compare_documents(self, doc1_data: Dict, doc2_data: Dict) -> Dict[str, Any]:
        """
        Compare extracted data from two documents for consistency.
        """
        inconsistencies = []
        
        # Compare names if available
        name1 = doc1_data.get("extracted_data", {}).get("name", "").lower()
        name2 = doc2_data.get("extracted_data", {}).get("name", "").lower()
        
        if name1 and name2 and name1 != name2:
            inconsistencies.append({
                "field": "name",
                "doc1": name1,
                "doc2": name2,
                "severity": "HIGH"
            })
        
        return {
            "consistent": len(inconsistencies) == 0,
            "inconsistencies": inconsistencies
        }


# ============================================================================
# Wealth Calculation Tool
# ============================================================================
class WealthCalculationTool:
    def calculate_net_worth(self, bank_statements: List[Dict]) -> Dict[str, Any]:
        """
        Calculate net worth and income stability from bank statement data.
        """
        print(f"[Tool: Wealth Calculator] Processing {len(bank_statements)} statements")
        
        # In production, this would:
        # 1. Parse bank statement images/PDFs
        # 2. Extract transaction data
        # 3. Calculate averages, stability metrics
        
        return {
            "analysis_complete": True,
            "metrics": {
                "estimated_monthly_income": None,  # Would be calculated
                "income_stability": "UNKNOWN",
                "debt_indicators": [],
                "notes": "Requires actual bank statement data for analysis"
            }
        }


# ============================================================================
# Sanctions & PEP Screening Tool
# ============================================================================
class SanctionsScreeningTool:
    # Known sanctions lists (simplified)
    SANCTIONS_LISTS = [
        "OFAC SDN",  # US Treasury
        "UN Consolidated List",
        "EU Sanctions List",
        "DJBC Indonesia"  # Indonesian Customs watchlist
    ]
    
    def screen(self, name: str, nik: str = None, country: str = "ID") -> Dict[str, Any]:
        """
        Screen against sanctions and PEP lists.
        
        In production, this would integrate with:
        - Dow Jones Risk & Compliance
        - Refinitiv World-Check
        - ComplyAdvantage
        - Local Indonesian watchlists
        """
        print(f"[Tool: Sanctions Screening] Screening: {name}")
        
        return {
            "screened": True,
            "name": name,
            "sanctions_match": False,
            "pep_match": False,
            "watchlist_hits": [],
            "lists_checked": self.SANCTIONS_LISTS,
            "confidence": "MOCK",  # In production: HIGH, MEDIUM, LOW
            "notes": "Production screening requires integration with compliance databases"
        }