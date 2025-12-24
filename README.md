# KYC Automation Multi-Agent System

AI-powered Know Your Customer (KYC) verification using Google's Agent Development Kit (ADK) pattern with multi-agent orchestration.

## Tech Stack

| Layer | Technology |
|-------|------------|
| **AI Agents** | Python + Vertex AI (Gemini 2.0 Flash) + FastAPI |
| **Backend** | Java 17 + Spring Boot 3 + PostgreSQL |
| **Frontend** | Next.js 15 + TypeScript + shadcn/ui |

## Architecture

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Next.js UI    │────▶│  Spring Boot    │────▶│  Agent Service  │
│   (Port 3000)   │     │   (Port 8080)   │     │  (Cloud Run)    │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                                                        │
                              ┌─────────────────────────┼─────────────────────────┐
                              ▼                         ▼                         ▼
                    ┌──────────────────┐     ┌──────────────────┐     ┌──────────────────┐
                    │ Document_Checker │     │ External_Search  │     │ Wealth_Calculator│
                    │ Resume_Crosscheck│     │ (PEP/Sanctions)  │     │                  │
                    └──────────────────┘     └──────────────────┘     └──────────────────┘
```

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
