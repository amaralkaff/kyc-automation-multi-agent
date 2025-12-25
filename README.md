# KYC Automation Multi-Agent System

AI-powered Know Your Customer (KYC) verification using Google's Agent Development Kit (ADK) pattern with multi-agent orchestration.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **AI Agents** | Python + Vertex AI (Gemini 2.0 Flash) + FastAPI |
| **Backend** | Java 21 + Spring Boot 4 + PostgreSQL |
| **Frontend** | Next.js 16 + TypeScript + shadcn/ui |

## Architecture

![KYC Multi-Agent Architecture](docs/KYC_Agentic_Workflow_Architecture.png)

### Agent Workflow (ADK Pattern)

Based on the architecture described in [Build KYC agentic workflows with Google’s ADK](https://cloud.google.com/blog/products/ai-machine-learning/build-kyc-agentic-workflows-with-googles-adk).

1. **User Request** → Initiates KYC verification.
2. **Root Agent (KYC_Manager)** → Orchestrates the workflow, managing state and delegating to sub-agents.
   - *Tools*: `search_internal_database` (BigQuery), `generate_case_id`.
3. **Sub-Agents** (Task-Specialized):
   - **Document Checker** → Analyzes uploaded documents (ID, proof of address, bank statements) for consistency, validity, and discrepancies using Gemini 1.5 Pro.
   - **Resume Crosschecker** → Verifies customer resume info against public sources (LinkedIn, company sites) using **Search Grounding**.
   - **External Search** → Conducts due diligence for Adverse Media, PEP status, and Sanctions lists using real-time **Google Search**.
   - **Wealth Calculator** → Assesses financial position by analyzing bank statements/tax docs to calculate net worth and verify source of funds.
4. **Result Aggregation** → Root agent compiles findings into a comprehensive risk assessment.
5. **Human-in-the-Loop (HITL)** → High-risk cases are flagged for manual review; low-risk cases are auto-approved.

## Quick Start

```bash
# Backend
./gradlew bootRun

# Frontend
cd kyc-frontend && npm run dev

# Agent Service (deploy to Cloud Run)
cd agent-service && gcloud run deploy kyc-agent-service --source .
```

## Environment Variables

Copy `.env.example` files and configure:
- `kyc-frontend/.env.local` - Frontend config
- `src/main/resources/application-local.properties` - Backend config

## License

MIT
