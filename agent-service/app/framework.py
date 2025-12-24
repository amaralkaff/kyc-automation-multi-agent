import vertexai
from vertexai.generative_models import GenerativeModel, GenerationConfig
import os
import json
from typing import List, Any, Dict, Optional
from datetime import datetime

# Configure Vertex AI
PROJECT_ID = os.environ.get("GOOGLE_CLOUD_PROJECT", "job-screening-app-2025")
LOCATION = os.environ.get("GOOGLE_CLOUD_REGION", "us-central1")
vertexai.init(project=PROJECT_ID, location=LOCATION)


class Agent:
    """
    ADK-style Agent class for orchestrating KYC verification workflows.
    
    Supports:
    - Multi-agent delegation (manager -> sub-agents)
    - Tool execution (BigQuery, Search, Document Analysis)
    - Vertex AI Gemini integration
    """
    
    def __init__(
        self, 
        name: str, 
        model: str, 
        tools: List[Any] = None, 
        instructions: str = "", 
        sub_agents: List['Agent'] = None
    ):
        self.name = name
        self.model_name = model
        self.tools = tools or []
        self.instructions = instructions
        self.sub_agents = sub_agents or []
        self._client = None
        
    @property
    def client(self):
        """Lazy initialization of Vertex AI Gemini client."""
        if self._client is None:
            try:
                self._client = GenerativeModel(self.model_name)
                print(f"[{self.name}] Initialized with Vertex AI model: {self.model_name}")
            except Exception as e:
                print(f"[{self.name}] Failed to init model: {e}")
        return self._client

    def run(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute the agent's workflow.
        
        For Manager agents: Orchestrate sub-agents
        For Worker agents: Execute tools and generate analysis
        """
        print(f"[{self.name}] Running with model: {self.model_name}")
        start_time = datetime.now()
        
        context = {
            "agent_name": self.name,
            "started_at": start_time.isoformat()
        }
        
        try:
            # 1. Pre-processing: Execute tools (like BigQuery check)
            tool_results = self._execute_tools(input_data)
            
            # Check if we found existing profile (early return)
            if tool_results.get("found_existing"):
                return {
                    "status": "APPROVED",
                    "reasoning": "Existing verified profile found in database",
                    "found_in_db": True,
                    "risk_score": tool_results.get("existing_risk_score", 0),
                    "details": tool_results.get("existing_profile"),
                    "case_id": tool_results.get("case_id"),
                    "processing_time_ms": self._get_elapsed_ms(start_time)
                }
            
            context.update(tool_results)
            
            # 2. Sub-Agent Delegation (if this is a manager agent)
            if self.sub_agents:
                sub_results = self._delegate_to_sub_agents(input_data)
                return self._aggregate_results(sub_results, context)
            
            # 3. Direct AI Analysis (for worker agents)
            analysis = self._generate_analysis(input_data)
            analysis["processing_time_ms"] = self._get_elapsed_ms(start_time)
            return analysis
            
        except Exception as e:
            print(f"[{self.name}] Error: {e}")
            return {
                "status": "ERROR",
                "error": str(e),
                "agent": self.name,
                "processing_time_ms": self._get_elapsed_ms(start_time)
            }

    def _execute_tools(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Execute all configured tools and collect results."""
        results = {}
        
        for tool in self.tools:
            tool_name = type(tool).__name__
            
            # BigQuery profile check
            if hasattr(tool, "check_existing_profile") and input_data.get("nik"):
                profile = tool.check_existing_profile(input_data["nik"])
                if profile:
                    results["found_existing"] = True
                    results["existing_profile"] = profile
                    results["existing_risk_score"] = profile.get("risk_score", 0)
            
            # Case ID generation
            if hasattr(tool, "generate"):
                results["case_id"] = tool.generate()
            
            # Search tool execution
            if hasattr(tool, "search") and input_data.get("name"):
                # Don't auto-execute search here - let sub-agents handle it
                pass
            
            # Sanctions screening
            if hasattr(tool, "screen") and input_data.get("name"):
                screening = tool.screen(
                    name=input_data.get("name"),
                    nik=input_data.get("nik"),
                    country="ID"
                )
                results["sanctions_screening"] = screening
        
        return results

    def _delegate_to_sub_agents(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Delegate work to sub-agents and collect their results."""
        results = {}
        
        for agent in self.sub_agents:
            print(f"[{self.name}] Delegating to: {agent.name}")
            try:
                agent_result = agent.run(input_data)
                results[agent.name] = agent_result
            except Exception as e:
                print(f"[{self.name}] Sub-agent {agent.name} failed: {e}")
                results[agent.name] = {
                    "status": "ERROR",
                    "error": str(e)
                }
        
        return results

    def _generate_analysis(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate AI analysis using Gemini with retry logic."""
        import time
        
        # Try to get client
        client = self.client
        if not client:
            print(f"[{self.name}] No client available, using fallback")
            return self._fallback_analysis(input_data)
        
        prompt = f"""
Role: {self.name}
Instructions: {self.instructions}

Input Data:
{json.dumps(input_data, indent=2, default=str)}

Analyze the provided data and respond with a valid JSON object.
Your response MUST be valid JSON - no markdown, no code blocks, just the JSON object.
"""
        
        # Retry logic for rate limiting
        max_retries = 3
        for attempt in range(max_retries):
            try:
                print(f"[{self.name}] Calling Vertex AI (attempt {attempt + 1})")
                response = client.generate_content(
                    prompt,
                    generation_config=GenerationConfig(
                        temperature=0.1,
                        max_output_tokens=2048,
                    )
                )
            
                # Extract text from response
                text = response.text if hasattr(response, 'text') else str(response)
                print(f"[{self.name}] Got response: {text[:200]}...")
            
                # Clean up response - remove markdown code blocks if present
                text = text.strip()
                if text.startswith("```json"):
                    text = text[7:]
                if text.startswith("```"):
                    text = text[3:]
                if text.endswith("```"):
                    text = text[:-3]
                text = text.strip()
            
                # Try to parse JSON
                try:
                    return json.loads(text)
                except json.JSONDecodeError:
                    # Return raw text if not valid JSON
                    return {
                        "status": "NEEDS_REVIEW",
                        "raw_analysis": text[:1000],
                        "parse_error": "Response was not valid JSON"
                    }
                
            except Exception as e:
                error_msg = str(e)
                print(f"[{self.name}] Attempt {attempt + 1} failed: {error_msg}")
                if "429" in error_msg or "quota" in error_msg.lower() or "rate" in error_msg.lower():
                    # Rate limited - wait and retry
                    wait_time = (attempt + 1) * 2
                    print(f"[{self.name}] Rate limited, waiting {wait_time}s...")
                    time.sleep(wait_time)
                    continue
                else:
                    # Other error - don't retry
                    break
        
        print(f"[{self.name}] All retries exhausted, using fallback")
        return self._fallback_analysis(input_data)

    def _fallback_analysis(self, input_data: Dict[str, Any]) -> Dict[str, Any]:
        """Fallback when AI is unavailable."""
        return {
            "status": "NEEDS_REVIEW",
            "confidence": 0,
            "details": "AI analysis unavailable - requires manual review",
            "input_received": list(input_data.keys())
        }

    def _aggregate_results(self, sub_results: Dict[str, Any], context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Aggregate sub-agent results into a final KYC decision.
        
        Implements Human-in-the-Loop (HITL) policy:
        - APPROVED: Only for very low risk (< 20 score)
        - UNDER_REVIEW: Everything else goes to human review
        - Never auto-reject
        """
        risk_score = 0
        reasons = []
        findings = []
        citations = []
        
        # Document Checker Analysis
        doc_result = sub_results.get("Document_Checker", {})
        if doc_result.get("status") == "REJECTED":
            risk_score += 50
            reasons.append("Document verification failed")
            findings.append({
                "agent": "Document_Checker",
                "severity": "HIGH",
                "finding": doc_result.get("details", "Document inconsistency detected")
            })
        elif doc_result.get("status") == "NEEDS_REVIEW":
            risk_score += 20
            reasons.append("Documents require manual verification")
        
        # Resume/Employment Verification
        resume_result = sub_results.get("Resume_Crosschecker", {})
        if resume_result.get("employment_status") == "DISCREPANCY_FOUND":
            risk_score += 30
            reasons.append("Employment history discrepancy")
            findings.append({
                "agent": "Resume_Crosschecker",
                "severity": "MEDIUM",
                "finding": resume_result.get("details", "Employment verification failed")
            })
        if resume_result.get("sources"):
            citations.extend(resume_result.get("sources", []))
        
        # External Search (Adverse Media)
        search_result = sub_results.get("External_Search", {})
        if search_result.get("adverse_media_found"):
            risk_score += 100  # Critical finding
            reasons.append("Adverse media found in public records")
            for finding in search_result.get("findings", []):
                findings.append({
                    "agent": "External_Search",
                    "severity": finding.get("severity", "HIGH"),
                    "finding": finding.get("summary", "Adverse media detected"),
                    "source": finding.get("url")
                })
                if finding.get("url"):
                    citations.append(finding.get("url"))
        
        if search_result.get("pep_status") in ["POTENTIAL_PEP", "CONFIRMED_PEP"]:
            risk_score += 50
            reasons.append(f"PEP status: {search_result.get('pep_status')}")
        
        if search_result.get("sanctions_flag"):
            risk_score += 200  # Automatic high priority
            reasons.append("Potential sanctions list match")
        
        # Wealth Calculator
        wealth_result = sub_results.get("Wealth_Calculator", {})
        if wealth_result.get("wealth_verification") == "QUESTIONABLE":
            risk_score += 40
            reasons.append("Source of wealth could not be verified")
        for flag in wealth_result.get("flags", []):
            if flag.get("severity") == "HIGH":
                risk_score += 25
                findings.append({
                    "agent": "Wealth_Calculator",
                    "severity": "MEDIUM",
                    "finding": flag.get("description", "Financial concern flagged")
                })
        
        # Sanctions Screening
        sanctions_result = sub_results.get("Sanctions_Screener", {})
        if sanctions_result.get("sanctions_hit"):
            risk_score += 200
            reasons.append("Sanctions list match detected")
        if sanctions_result.get("pep_hit"):
            risk_score += 50
            reasons.append("PEP database match")
        
        # ============================================================
        # HITL Policy: Determine final status
        # ============================================================
        # Low risk = APPROVED automatically
        # Medium+ risk = UNDER_REVIEW (human decides)
        # NEVER auto-reject (even for sanctions - human must confirm)
        
        if risk_score < 20:
            status = "APPROVED"
            requires_manual_review = False
        elif risk_score >= 100:
            status = "UNDER_REVIEW"
            requires_manual_review = True
            reasons.append("HIGH PRIORITY: Requires immediate compliance review")
        else:
            status = "UNDER_REVIEW"
            requires_manual_review = True
        
        # Cap risk score at 100 for display
        display_score = min(risk_score, 100)
        
        return {
            "case_id": context.get("case_id"),
            "risk_score": display_score,
            "status": status,
            "reasoning": "; ".join(reasons) if reasons else "Clean profile based on all automated checks.",
            "found_in_db": False,
            "requires_manual_review": requires_manual_review,
            "details": {
                "sub_agent_results": sub_results,
                "findings": findings,
                "citations": citations,
                "risk_breakdown": {
                    "document_risk": doc_result.get("status", "UNKNOWN"),
                    "employment_verified": resume_result.get("verified", None),
                    "adverse_media": search_result.get("adverse_media_found", False),
                    "pep_status": search_result.get("pep_status", "UNKNOWN"),
                    "sanctions_flag": search_result.get("sanctions_flag", False) or sanctions_result.get("sanctions_hit", False),
                    "wealth_status": wealth_result.get("wealth_verification", "UNKNOWN")
                }
            },
            "processing_time_ms": self._get_elapsed_ms(datetime.fromisoformat(context["started_at"]))
        }

    def _get_elapsed_ms(self, start_time: datetime) -> int:
        """Calculate elapsed time in milliseconds."""
        return int((datetime.now() - start_time).total_seconds() * 1000)