# DevMind — Solution Architect Agent Frontend

A sleek dark-themed React frontend for the DevMind AWS Solution Architect Agent, built for **HACK'A'WAR 2025**.

## Tech Stack
- **React 18** + **Vite**
- **axios** — backend API calls
- **mermaid** — live architecture diagram rendering
- **Google Fonts** — Syne (display) + JetBrains Mono (code)

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start the dev server (requires backend on :8000)
npm run dev

# 3. Open in browser
# http://localhost:3000
```

## Backend Contract

The frontend POSTs to `http://localhost:8000/generate`:

```json
// Request
{ "requirement": "Your plain-English system description" }

// Response
{
  "architecture_name": "...",
  "overview": "...",
  "aws_services": [
    { "service": "...", "purpose": "...", "estimated_monthly_cost": "..." }
  ],
  "mermaid_diagram": "graph TD\n  A --> B",
  "implementation_steps": ["step 1", "step 2"],
  "alternative_architectures": ["option 1", "option 2"]
}
```

## Design
- Background: `#0D1B2A` | Accent: `#00D4FF`
- Dark grid + radial glow background
- Animated loading rings with rotating status messages
- Typewriter effect on architecture name
- AWS service cards with cost callout (right-aligned)
- Live Mermaid.js diagram with DevMind dark theme
- Staggered card animations on result load
