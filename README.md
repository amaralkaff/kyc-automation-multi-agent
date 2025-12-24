# KYC Automation Multi-Agent System

AI-powered Know Your Customer (KYC) verification using Google's Agent Development Kit (ADK) pattern with multi-agent orchestration.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **AI Agents** | Python + Vertex AI (Gemini 2.0 Flash) + FastAPI |
| **Backend** | Java 21 + Spring Boot 3 + PostgreSQL |
| **Frontend** | Next.js 16 + TypeScript + shadcn/ui |

## Architecture

![KYC Multi-Agent Architecture](docs/KYC_Agentic_Workflow_Architecture.png)

### Agent Workflow
1. **User Request** → Initiates KYC verification
2. **Root KYC Agent Orchestrator** → Coordinates all sub-agents
3. **Sub-Agents** (parallel execution):
   - **Internal DB Check** → BigQuery lookup for existing records
   - **Document Checker** → Analyzes KTP, passport, bank statements
   - **Resume Crosschecker** → Verifies employment via LinkedIn
   - **External Search Agent** → PEP/Sanctions screening + adverse media
   - **Wealth Calculator** → Assesses financial profile
4. **Google Search Grounding** → Real-time public data verification
5. **Final KYC Report** → Consolidated risk assessment

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
