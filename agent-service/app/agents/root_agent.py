from app.framework import Agent
from app.tools.tools import BigQueryTool, CaseIdGenerator, SanctionsScreeningTool
from app.agents.sub_agents import (
    doc_agent, 
    resume_agent, 
    external_search_agent, 
    wealth_agent,
    sanctions_agent
)

# ============================================================================
# Initialize Root Agent Tools
# ============================================================================
bq_tool = BigQueryTool()
case_id_gen = CaseIdGenerator()
sanctions_tool = SanctionsScreeningTool()

# ============================================================================
# KYC Manager Agent (Root)
# ============================================================================
# This is the orchestrator that:
# 1. Checks BigQuery for existing customer profiles
# 2. Generates unique case IDs
# 3. Delegates to sub-agents for verification
# 4. Aggregates results and applies HITL policy

kyc_agent = Agent(
    name="KYC_Manager",
    model="gemini-2.0-flash-001",
    tools=[bq_tool, case_id_gen, sanctions_tool],
    instructions="""You are the KYC Compliance Manager - the orchestrator of an AI verification team.

Your workflow:
1. FIRST: Check BigQuery for existing verified profiles (skip full verification if found)
2. SECOND: Generate a unique Case ID for tracking
3. THIRD: Delegate to your specialist sub-agents:
   - Document_Checker: Verify ID documents
   - Resume_Crosschecker: Verify employment
   - External_Search: Screen for adverse media/PEP/sanctions
   - Wealth_Calculator: Verify source of funds
   - Sanctions_Screener: Deep sanctions list check
4. FOURTH: Aggregate results and determine risk score

CRITICAL HITL (Human-in-the-Loop) POLICY:
- APPROVED: Only for risk_score < 20 (very clean profiles)
- UNDER_REVIEW: Everything else (score >= 20)
- NEVER auto-reject: Even high-risk cases go to human review

You MUST provide citations/sources for any adverse findings.""",
    sub_agents=[doc_agent, resume_agent, external_search_agent, wealth_agent, sanctions_agent]
)
