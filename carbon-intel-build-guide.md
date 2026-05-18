# Carbon Intelligence Platform — Complete Build Guide
**Project:** carbon-climatch
**Stack:** Next.js · Tailwind CSS · Gemini API · Vercel
**Tools:** Google Antigravity · Cursor · Gemini CLI

---

## Table of Contents
1. [Mental model & project overview](#1-mental-model--project-overview)
2. [Environment setup](#2-environment-setup)
3. [Tool setup: Antigravity, Cursor, Gemini CLI](#3-tool-setup)
4. [Data preparation](#4-data-preparation)
5. [Project scaffold](#5-project-scaffold)
6. [Project structure](#6-project-structure)
7. [Building the data layer](#7-building-the-data-layer)
8. [Building the frontend](#8-building-the-frontend)
9. [Integrating Gemini AI](#9-integrating-gemini-ai)
10. [AGENTS.md & GEMINI.md — teaching your tools about the project](#10-agentsmd--geminimd)
11. [Deployment to Vercel](#11-deployment-to-vercel)
12. [Recommended workflow between tools](#12-recommended-workflow-between-tools)
13. [Additional tools to consider](#13-additional-tools-to-consider)
14. [Phased build plan](#14-phased-build-plan)

---

## 1. Mental model & project overview

Before touching any code, internalize what you're building:

**What it is:** A web platform for CFOs and finance teams at Indonesian companies to understand their carbon regulatory exposure — domestically (IDXCarbon, NEK/ETS, carbon tax) and internationally (EU CBAM).

**What it is NOT:** A real-time trading platform, a data scraper, or a news aggregator. Those are all harder and not necessary for a course prototype.

**The three pillars of your prototype:**

| Pillar | What it shows | Data source |
|---|---|---|
| Price dashboard | Carbon prices globally and in Indonesia | World Bank download + IDXCarbon PDFs |
| CBAM exposure calculator | Estimated CBAM liability for Indonesian exporters | Hardcoded CBAM rates + user input |
| AI analyst | Plain-language explanation of what the data means | Gemini API |

**The one sentence pitch for your assignment:** "A platform that translates complex, multi-jurisdictional carbon regulation into financial exposure numbers that Indonesian CFOs can actually act on."

---

## 2. Environment setup

### 2.1 Prerequisites — install these first

**Node.js v20+** (required for Gemini CLI and Next.js)
- Download from https://nodejs.org — choose the LTS version
- Verify: `node --version` and `npm --version`

**Git**
- Download from https://git-scm.com
- Verify: `git --version`

**A Google account** — needed for Antigravity (free) and Gemini CLI auth

**A Gemini API key** — for the AI layer inside your app
- Go to https://aistudio.google.com
- Click "Get API key" → Create API key
- Save it somewhere safe — you'll use it in your `.env.local` file

### 2.2 Create your project folder

```bash
mkdir carbon-climatch
cd carbon-climatch
```

Keep this folder open throughout. Every tool you use will operate inside it.

---

## 3. Tool setup

### 3.1 Google Antigravity

Antigravity is your primary IDE for this project. It's agent-first, free for individuals, and powered by Gemini 3 models. Think of it as VS Code but with an AI that can autonomously write, test, and fix entire features.

**Install:**
1. Download from https://antigravity.google/download
2. Install for your OS (Windows/macOS/Linux — all supported)
3. Sign in with your Google account when prompted

**Two modes to know:**
- **Editor view** — looks like VS Code. Use this for hands-on reading and editing code.
- **Manager view** — mission control for AI agents. Use this when you want to delegate a whole feature to the agent.

**Key settings for your project:**
- Set autonomy profile to **"Review-driven development"** — it gives the agent freedom but stops for your approval on important steps. Good for learning.
- Create an `AGENTS.md` file in your project root (covered in step 10) — this teaches the agent your project's conventions.

**How you'll use it:**
- Scaffolding new components and pages
- Delegating full features ("build the CBAM calculator page with inputs for sector, export volume, and product type")
- Debugging visual issues via its built-in browser agent

### 3.2 Cursor

Cursor is your precision editor — use it when you want fine-grained control over specific files, need to do surgical edits, or want to use a different model for a specific task.

**Install:** https://cursor.sh — free tier is sufficient

**How you'll use it:**
- Reviewing and manually tweaking code Antigravity generated
- Working on sensitive files like API routes and environment configs
- Quick targeted edits ("fix this TypeScript error", "add error handling here")

**Practical tip:** Use Antigravity for greenfield work (new pages, new features). Switch to Cursor for refinements and precision edits. They complement each other well.

### 3.3 Gemini CLI

Gemini CLI runs in your terminal and is particularly good for file operations, data transformation, and codebase-wide questions. It's open-source and free with a personal Google account.

**Install:**
```bash
npm install -g @google/gemini-cli
```

**Authenticate:**
```bash
gemini
```
On first run, select "Sign in with Google" and follow the browser prompt.

**Free tier limits:** 60 requests/minute, 1,000 requests/day — more than enough for a prototype.

**How you'll use it specifically for this project:**

```bash
# Ask it to help clean a CSV file
gemini "Read the worldbank_carbon_prices.csv in ./data and tell me which columns are relevant for our dashboard"

# Ask it to generate a data transformation script
gemini "Write a Node.js script that reads ./data/worldbank_carbon_prices.csv and outputs a cleaned JSON file with only: jurisdiction, instrument_type, year, price_usd"

# Ask it to review your Gemini API prompt
gemini "Review the prompt in ./lib/gemini.ts and suggest improvements for making it more accurate for Indonesian CFO users"
```

**Create a GEMINI.md file** in your project root — Gemini CLI reads this as persistent context for all sessions (covered in step 10).

---

## 4. Data preparation

This is the most important step before writing any app code. Do this first.

### 4.1 World Bank Carbon Pricing Dashboard

1. Go to https://carbonpricingdashboard.worldbank.org/about#download-data
2. Download the main dataset (usually an Excel file with multiple sheets)
3. The sheets you care about: carbon prices by jurisdiction, instrument type (ETS vs tax), and year

**What to extract into your own JSON:**
```json
[
  {
    "jurisdiction": "Indonesia",
    "instrument": "ETS",
    "instrument_name": "Indonesia NEK ETS",
    "year": 2024,
    "price_usd": 4.0,
    "coverage_pct": 55
  },
  {
    "jurisdiction": "European Union",
    "instrument": "ETS",
    "instrument_name": "EU ETS",
    "year": 2024,
    "price_usd": 65.0,
    "coverage_pct": 40
  },
  {
    "jurisdiction": "Singapore",
    "instrument": "Carbon Tax",
    "instrument_name": "Singapore Carbon Tax",
    "year": 2024,
    "price_usd": 19.0,
    "coverage_pct": 80
  }
  // Add more jurisdictions as needed
]
```

Save this as `/data/carbon_prices.json`.

### 4.2 IDXCarbon monthly data

Go to https://idxcarbon.co.id/data-monthly and download the PDF reports for the last 6–12 months. From each PDF, extract:
- Month/year
- Total transaction volume (tCO2e)
- Average price (IDR/tCO2e)
- Number of transactions

Build this into:
```json
[
  { "month": "2025-01", "avg_price_idr": 67000, "volume_tco2e": 8200, "transactions": 14 },
  { "month": "2025-02", "avg_price_idr": 68500, "volume_tco2e": 9100, "transactions": 17 },
  // continue for each month
]
```

Save as `/data/idxcarbon_monthly.json`.

### 4.3 Regulatory timeline — write this manually

This is your domain knowledge layer. Hardcode it as structured data:

```json
[
  {
    "id": "nek-phase2",
    "title": "Indonesia NEK ETS Phase 2 begins",
    "date": "2025-01-01",
    "type": "domestic",
    "status": "active",
    "description": "ETS expands to captive coal plants and gas-fired power plants, total coverage rises to 563 installations.",
    "affected_sectors": ["energy", "manufacturing"],
    "source_url": "https://icapcarbonaction.com/en/ets/indonesian-economic-value-carbon"
  },
  {
    "id": "cbam-definitive",
    "title": "EU CBAM definitive phase begins",
    "date": "2026-01-01",
    "type": "international",
    "status": "upcoming",
    "description": "Financial adjustments now required. Indonesian exporters of steel, cement, aluminum, fertilizers, hydrogen must surrender CBAM certificates.",
    "affected_sectors": ["steel", "cement", "aluminum", "fertilizers"],
    "source_url": "https://taxation-customs.ec.europa.eu/carbon-border-adjustment-mechanism_en"
  },
  {
    "id": "pr110-2025",
    "title": "Presidential Regulation No. 110/2025 issued",
    "date": "2025-01-01",
    "type": "domestic",
    "status": "active",
    "description": "Establishes national carbon pricing governance framework, distinguishes domestic vs international carbon trading, introduces SRUK registry.",
    "affected_sectors": ["all"],
    "source_url": "https://www.arma-law.com/news-event/newsflash/reshaping-indonesias-carbon-governance"
  }
  // Add more events
]
```

Save as `/data/regulatory_timeline.json`.

### 4.4 CBAM sector rates — hardcode this

```json
{
  "eu_ets_price_usd": 65,
  "sectors": [
    { "id": "steel", "name": "Iron & Steel", "emission_factor_tco2_per_ton": 1.85, "cbam_applicable": true },
    { "id": "cement", "name": "Cement", "emission_factor_tco2_per_ton": 0.83, "cbam_applicable": true },
    { "id": "aluminum", "name": "Aluminium", "emission_factor_tco2_per_ton": 11.5, "cbam_applicable": true },
    { "id": "fertilizers", "name": "Fertilizers", "emission_factor_tco2_per_ton": 2.1, "cbam_applicable": true },
    { "id": "hydrogen", "name": "Hydrogen", "emission_factor_tco2_per_ton": 10.0, "cbam_applicable": true },
    { "id": "palm_oil", "name": "Palm Oil", "emission_factor_tco2_per_ton": 0.5, "cbam_applicable": false }
  ]
}
```

Save as `/data/cbam_config.json`.

**Use Gemini CLI to help process data:**
```bash
cd carbon-climatch
gemini "I have a World Bank Excel file at ./data/worldbank_raw.xlsx. Write me a Node.js script using the 'xlsx' npm package to extract carbon price data by jurisdiction and year, and save it as ./data/carbon_prices.json matching this schema: [{ jurisdiction, instrument, instrument_name, year, price_usd, coverage_pct }]"
```

---

## 5. Project scaffold

### 5.1 Initialize Next.js

```bash
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

When prompted:
- Use TypeScript: **Yes**
- Use ESLint: **Yes**
- Use Tailwind CSS: **Yes**
- Use `src/` directory: **Yes**
- Use App Router: **Yes**
- Customize import alias: **Yes** (`@/*`)

### 5.2 Install dependencies

```bash
npm install @google/generative-ai recharts papaparse
npm install -D @types/papaparse
```

- `@google/generative-ai` — official Gemini SDK for the AI layer
- `recharts` — charts for price history and comparisons
- `papaparse` — if you need to parse CSV files client-side

### 5.3 Environment variables

Create `.env.local` in your project root:

```env
GEMINI_API_KEY=your_api_key_here
```

Add `.env.local` to `.gitignore` immediately — never commit API keys.

---

## 6. Project structure

After scaffolding, your folder structure should look like this:

```
carbon-climatch/
├── AGENTS.md                    ← Instructions for Antigravity agents
├── GEMINI.md                    ← Instructions for Gemini CLI
├── .env.local                   ← API keys (never commit)
├── .gitignore
├── data/                        ← All your static JSON datasets
│   ├── carbon_prices.json
│   ├── idxcarbon_monthly.json
│   ├── regulatory_timeline.json
│   └── cbam_config.json
├── public/
├── src/
│   ├── app/
│   │   ├── layout.tsx           ← Root layout, nav
│   │   ├── page.tsx             ← Home / dashboard
│   │   ├── globals.css
│   │   ├── calculator/
│   │   │   └── page.tsx         ← CBAM exposure calculator
│   │   ├── timeline/
│   │   │   └── page.tsx         ← Regulatory timeline
│   │   └── api/
│   │       └── analyze/
│   │           └── route.ts     ← Gemini API endpoint
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Navbar.tsx
│   │   │   └── Footer.tsx
│   │   ├── dashboard/
│   │   │   ├── PriceComparisonChart.tsx
│   │   │   ├── IDXCarbonChart.tsx
│   │   │   └── RegulationAlertBanner.tsx
│   │   ├── calculator/
│   │   │   ├── CBAMCalculator.tsx
│   │   │   └── ResultsCard.tsx
│   │   └── ai/
│   │       └── AIAnalystPanel.tsx
│   ├── lib/
│   │   ├── gemini.ts            ← Gemini API helper
│   │   ├── data.ts              ← Data loading utilities
│   │   └── calculations.ts     ← CBAM exposure math
│   └── types/
│       └── index.ts             ← TypeScript type definitions
└── package.json
```

---

## 7. Building the data layer

### 7.1 Type definitions (`src/types/index.ts`)

```typescript
export interface CarbonPrice {
  jurisdiction: string;
  instrument: string;
  instrument_name: string;
  year: number;
  price_usd: number;
  coverage_pct: number;
}

export interface IDXCarbonMonthly {
  month: string; // "YYYY-MM"
  avg_price_idr: number;
  volume_tco2e: number;
  transactions: number;
}

export interface RegulatoryEvent {
  id: string;
  title: string;
  date: string;
  type: "domestic" | "international";
  status: "active" | "upcoming" | "past";
  description: string;
  affected_sectors: string[];
  source_url: string;
}

export interface CBAMSector {
  id: string;
  name: string;
  emission_factor_tco2_per_ton: number;
  cbam_applicable: boolean;
}

export interface CBAMConfig {
  eu_ets_price_usd: number;
  sectors: CBAMSector[];
}

export interface CBAMCalculationResult {
  sector: string;
  export_volume_tons: number;
  total_emissions_tco2: number;
  cbam_liability_usd: number;
  cbam_liability_idr: number;
  indonesia_carbon_credit_usd: number;
  net_liability_usd: number;
}
```

### 7.2 Data loader (`src/lib/data.ts`)

```typescript
import carbonPrices from "@/../../data/carbon_prices.json";
import idxCarbonMonthly from "@/../../data/idxcarbon_monthly.json";
import regulatoryTimeline from "@/../../data/regulatory_timeline.json";
import cbamConfig from "@/../../data/cbam_config.json";
import type { CarbonPrice, IDXCarbonMonthly, RegulatoryEvent, CBAMConfig } from "@/types";

export function getCarbonPrices(): CarbonPrice[] {
  return carbonPrices as CarbonPrice[];
}

export function getLatestPriceByJurisdiction(): Record<string, CarbonPrice> {
  const prices = getCarbonPrices();
  return prices.reduce((acc, price) => {
    const existing = acc[price.jurisdiction];
    if (!existing || price.year > existing.year) {
      acc[price.jurisdiction] = price;
    }
    return acc;
  }, {} as Record<string, CarbonPrice>);
}

export function getIDXCarbonMonthly(): IDXCarbonMonthly[] {
  return idxCarbonMonthly as IDXCarbonMonthly[];
}

export function getRegulatoryTimeline(): RegulatoryEvent[] {
  return (regulatoryTimeline as RegulatoryEvent[]).sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
}

export function getUpcomingEvents(): RegulatoryEvent[] {
  return getRegulatoryTimeline().filter(e => e.status === "upcoming");
}

export function getCBAMConfig(): CBAMConfig {
  return cbamConfig as CBAMConfig;
}
```

### 7.3 CBAM calculation logic (`src/lib/calculations.ts`)

```typescript
import type { CBAMCalculationResult, CBAMSector } from "@/types";

const USD_TO_IDR = 16000; // Update periodically or fetch live

export function calculateCBAMExposure(
  sector: CBAMSector,
  exportVolumeTons: number,
  euEtsPriceUsd: number,
  indonesiaCarbonPriceUsd: number
): CBAMCalculationResult {
  const totalEmissions = exportVolumeTons * sector.emission_factor_tco2_per_ton;
  const grossCBAMUsd = totalEmissions * euEtsPriceUsd;
  
  // CBAM deducts any carbon price already paid in country of origin
  const indonesiaCredit = totalEmissions * indonesiaCarbonPriceUsd;
  const netLiabilityUsd = Math.max(0, grossCBAMUsd - indonesiaCredit);

  return {
    sector: sector.name,
    export_volume_tons: exportVolumeTons,
    total_emissions_tco2: totalEmissions,
    cbam_liability_usd: grossCBAMUsd,
    cbam_liability_idr: grossCBAMUsd * USD_TO_IDR,
    indonesia_carbon_credit_usd: indonesiaCredit,
    net_liability_usd: netLiabilityUsd,
  };
}
```

---

## 8. Building the frontend

### 8.1 Let Antigravity scaffold pages for you

Open Antigravity, switch to Agent mode, and give it this prompt for each page:

**For the dashboard (home page):**
```
Build the main dashboard page at src/app/page.tsx for a carbon intelligence 
platform called carbon-climatch targeting Indonesian CFOs. 

The page should have:
1. A hero section with a brief explanation of what the platform does
2. An alert banner showing upcoming regulatory events (data from 
   src/lib/data.ts getUpcomingEvents())
3. A price comparison bar chart using recharts showing carbon prices 
   in USD across Indonesia, EU, Singapore, South Korea — use 
   getLatestPriceByJurisdiction() from data.ts
4. A line chart of IDXCarbon monthly prices over the last 12 months — 
   use getIDXCarbonMonthly() from data.ts
5. A "Get AI Analysis" button that links to a section below where the 
   AI analyst panel will go

Use Tailwind CSS. Design should be clean, professional, dark navy or 
dark slate color scheme with green accents (green = good/credit, 
amber = warning, red = high liability). All text should be in English.
```

**For the CBAM calculator:**
```
Build a CBAM exposure calculator page at src/app/calculator/page.tsx.

The form should have:
- Dropdown: Select your sector (populated from getCBAMConfig() sectors 
  where cbam_applicable is true)
- Number input: Annual export volume to EU (in tons)
- The form should NOT use HTML <form> tags — use React state and 
  onClick handlers instead

On calculation, display a results card showing:
- Total estimated emissions (tCO2e)
- Gross CBAM liability (USD and IDR)
- Indonesia carbon credit deduction (based on current IDXCarbon price)
- Net CBAM liability (USD and IDR)
- A plain-language summary generated by the AI analyst (call the 
  /api/analyze endpoint with the results)

Import calculateCBAMExposure from src/lib/calculations.ts and 
getCBAMConfig from src/lib/data.ts.
```

### 8.2 Navigation (`src/components/layout/Navbar.tsx`)

Keep this simple — three links: Dashboard, Calculator, Regulatory Timeline.

```typescript
import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-white font-semibold text-lg">
        🌱 carbon-climatch
      </Link>
      <div className="flex gap-6 text-sm text-slate-300">
        <Link href="/" className="hover:text-white transition-colors">Dashboard</Link>
        <Link href="/calculator" className="hover:text-white transition-colors">CBAM Calculator</Link>
        <Link href="/timeline" className="hover:text-white transition-colors">Regulatory Timeline</Link>
      </div>
    </nav>
  );
}
```

---

## 9. Integrating Gemini AI

### 9.1 Gemini API helper (`src/lib/gemini.ts`)

```typescript
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

export interface AnalysisRequest {
  type: "dashboard_summary" | "cbam_result" | "regulation_explainer";
  data: Record<string, unknown>;
  context?: string;
}

export async function generateAnalysis(request: AnalysisRequest): Promise<string> {
  const systemContext = `
You are a carbon finance analyst assistant for carbon-climatch, a platform that helps 
Indonesian CFOs understand their carbon regulatory exposure. Your role is to translate 
complex regulatory and financial data into clear, actionable insights.

Always:
- Use plain, professional English
- Quantify impacts in both USD and IDR where relevant
- Be specific about which regulation applies (NEK ETS, CBAM, carbon tax)
- Keep responses to 3-5 sentences maximum
- Flag urgency if a deadline is within 12 months
- Never make up numbers — only use data provided to you
  `.trim();

  let userPrompt = "";

  if (request.type === "cbam_result") {
    const d = request.data;
    userPrompt = `
A CFO has just calculated their CBAM exposure using our calculator. Here are the results:
- Sector: ${d.sector}
- Annual export volume to EU: ${d.export_volume_tons} tons
- Total emissions: ${d.total_emissions_tco2} tCO2e
- Gross CBAM liability: USD ${d.cbam_liability_usd?.toLocaleString()}
- Indonesia carbon credit deduction: USD ${d.indonesia_carbon_credit_usd?.toLocaleString()}
- Net CBAM liability: USD ${d.net_liability_usd?.toLocaleString()} (IDR ${d.net_liability_idr?.toLocaleString()})
- EU ETS price used: USD ${d.eu_ets_price_usd}/tCO2e
- Indonesia carbon price used: USD ${d.indonesia_carbon_price_usd}/tCO2e

Provide a brief, plain-language interpretation of what these numbers mean for the company 
and what actions the CFO should consider, given that CBAM full enforcement started January 2026.
    `.trim();
  } else if (request.type === "dashboard_summary") {
    userPrompt = `
Here is the current state of carbon pricing data for the platform dashboard:
${JSON.stringify(request.data, null, 2)}

Write a 3-sentence executive summary of what Indonesian companies should know 
about the current carbon pricing landscape, with emphasis on the gap between 
Indonesia's carbon price and international benchmarks.
    `.trim();
  } else if (request.type === "regulation_explainer") {
    userPrompt = `
Explain this regulatory event in plain language for an Indonesian CFO 
who is not a climate expert:
${JSON.stringify(request.data, null, 2)}

Focus on: what it means financially, who is affected, and what they should do now.
    `.trim();
  }

  const result = await model.generateContent(`${systemContext}\n\n${userPrompt}`);
  return result.response.text();
}
```

### 9.2 API route (`src/app/api/analyze/route.ts`)

```typescript
import { NextRequest, NextResponse } from "next/server";
import { generateAnalysis, type AnalysisRequest } from "@/lib/gemini";

export async function POST(request: NextRequest) {
  try {
    const body: AnalysisRequest = await request.json();
    
    if (!body.type || !body.data) {
      return NextResponse.json(
        { error: "Missing required fields: type, data" },
        { status: 400 }
      );
    }

    const analysis = await generateAnalysis(body);
    return NextResponse.json({ analysis });
    
  } catch (error) {
    console.error("Gemini API error:", error);
    return NextResponse.json(
      { error: "Failed to generate analysis. Please try again." },
      { status: 500 }
    );
  }
}
```

### 9.3 AI Analyst Panel component (`src/components/ai/AIAnalystPanel.tsx`)

```typescript
"use client";
import { useState } from "react";

interface AIAnalystPanelProps {
  requestType: "dashboard_summary" | "cbam_result" | "regulation_explainer";
  data: Record<string, unknown>;
  triggerLabel?: string;
}

export default function AIAnalystPanel({ 
  requestType, 
  data, 
  triggerLabel = "Get AI Analysis" 
}: AIAnalystPanelProps) {
  const [analysis, setAnalysis] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");
    
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: requestType, data }),
      });
      
      if (!response.ok) throw new Error("Analysis failed");
      
      const result = await response.json();
      setAnalysis(result.analysis);
    } catch {
      setError("Could not generate analysis. Check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-600 rounded-xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-green-400 text-lg">🤖</span>
        <h3 className="text-white font-medium">AI Carbon Analyst</h3>
        <span className="text-xs text-slate-400 bg-slate-700 px-2 py-0.5 rounded-full">
          Powered by Gemini
        </span>
      </div>
      
      {!analysis && !loading && (
        <button
          onClick={handleAnalyze}
          className="bg-green-600 hover:bg-green-500 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors"
        >
          {triggerLabel}
        </button>
      )}
      
      {loading && (
        <div className="flex items-center gap-2 text-slate-400 text-sm">
          <div className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
          Analyzing regulatory data...
        </div>
      )}
      
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
      
      {analysis && (
        <div>
          <p className="text-slate-200 text-sm leading-relaxed">{analysis}</p>
          <button
            onClick={handleAnalyze}
            className="mt-3 text-xs text-slate-400 hover:text-slate-300 underline"
          >
            Regenerate
          </button>
        </div>
      )}
    </div>
  );
}
```

---

## 10. AGENTS.md & GEMINI.md

These files are critical for getting good output from your AI tools. They act as persistent instructions.

### AGENTS.md (for Antigravity — place in project root)

```markdown
# carbon-climatch — Agent Instructions

## Project overview
carbon-climatch is a Next.js web app that helps Indonesian CFOs understand their carbon 
regulatory exposure under Indonesia's NEK ETS and the EU's CBAM.

## Stack
- Next.js 14 (App Router)
- TypeScript (strict mode)
- Tailwind CSS
- Gemini 1.5 Flash (via @google/generative-ai)
- Recharts for data visualization

## Design system
- Background: slate-900 (page), slate-800 (cards)
- Text: white (headings), slate-300 (body), slate-400 (muted)
- Accent: green-500 (positive/credits), amber-500 (warning), red-500 (liability)
- Border: slate-700
- Radius: rounded-xl for cards, rounded-lg for buttons

## Code conventions
- Never use HTML <form> tags — always use React state + onClick handlers
- All data loading from /data/*.json via src/lib/data.ts
- All Gemini calls go through src/lib/gemini.ts → /api/analyze route
- Never hardcode API keys — use process.env.GEMINI_API_KEY
- Components are in src/components/, pages in src/app/
- Types are in src/types/index.ts

## Key domain rules
- Carbon prices are in USD/tCO2e internationally, IDR/tCO2e for IDXCarbon
- CBAM allows deduction of domestic carbon price paid (Indonesia ETS/tax)
- The Indonesia carbon tax is ~IDR 30,000/tCO2e (~USD 2) — still being implemented
- EU ETS price is ~USD 65/tCO2e (update from World Bank data)

## What NOT to do
- Do not fetch live carbon prices in real-time — use local JSON data files
- Do not add authentication (this is a prototype)
- Do not use external CSS frameworks other than Tailwind
- Do not create database connections
```

### GEMINI.md (for Gemini CLI — place in project root)

```markdown
# carbon-climatch — Gemini CLI Context

## What this project is
A Next.js web app helping Indonesian CFOs understand carbon regulation exposure.
Tech stack: Next.js, TypeScript, Tailwind CSS, Gemini 1.5 Flash API, Recharts.

## Data files
All static data lives in /data/:
- carbon_prices.json — global carbon prices from World Bank
- idxcarbon_monthly.json — Indonesia IDXCarbon monthly trading data
- regulatory_timeline.json — key regulatory events and deadlines
- cbam_config.json — EU CBAM sector rates and emission factors

## Key files to be aware of
- src/lib/data.ts — all data loading functions
- src/lib/calculations.ts — CBAM exposure math
- src/lib/gemini.ts — Gemini API wrapper
- src/app/api/analyze/route.ts — API endpoint for AI analysis
- src/types/index.ts — TypeScript interfaces

## Common tasks you may be asked to help with
- Cleaning and transforming CSV/Excel data into JSON
- Reviewing and improving Gemini prompts in src/lib/gemini.ts
- Writing Node.js scripts to process raw data files
- Explaining what code does in context of the carbon finance domain
```

---

## 11. Deployment to Vercel

### 11.1 Initialize Git and push to GitHub

```bash
git init
git add .
git commit -m "initial commit — carbon-climatch prototype"
```

Create a new repo on https://github.com, then:

```bash
git remote add origin https://github.com/yourusername/carbon-climatch.git
git push -u origin main
```

### 11.2 Deploy to Vercel

1. Go to https://vercel.com and sign up with your GitHub account
2. Click "Add New Project" → Import your `carbon-climatch` repo
3. Vercel auto-detects Next.js — no configuration needed
4. **Add environment variable:** Go to Settings → Environment Variables → Add `GEMINI_API_KEY`
5. Click Deploy

Your app will be live at `carbon-climatch.vercel.app` (or similar) within 2 minutes.

**Every time you push to GitHub, Vercel automatically redeploys.** This is your dev → prod pipeline.

---

## 12. Recommended workflow between tools

```
Phase          → Use this tool
──────────────────────────────────────────────────────────
Data cleaning  → Gemini CLI ("read this CSV and write a script to clean it")
New page/feat  → Antigravity Agent mode ("build the timeline page with X, Y, Z")
Precise edits  → Cursor (fixing TS errors, tweaking specific logic)
Prompt tuning  → Gemini CLI ("review my Gemini prompt and improve it")
Visual debug   → Antigravity browser agent (sees your running app, fixes styling)
Code review    → Cursor or Antigravity editor view
```

**Practical tip:** When giving Antigravity a task, be specific and reference your AGENTS.md conventions. Bad prompt: "build a chart". Good prompt: "build a Recharts LineChart component in src/components/dashboard/IDXCarbonChart.tsx that takes IDXCarbonMonthly[] as props and shows avg_price_idr on Y-axis, month on X-axis, with the color scheme from AGENTS.md".

---

## 13. Additional tools to consider

These are optional but each solves a real problem you'll likely hit:

**Tabula** (https://tabula.technology) — free desktop app for extracting tables from PDFs. You'll need this for IDXCarbon PDF reports. Much better than doing it manually.

**shadcn/ui** (https://ui.shadcn.com) — pre-built Tailwind components (dropdowns, cards, badges). Saves time on UI polish. Install specific components as needed: `npx shadcn@latest add select card badge`.

**Postman or Hoppscotch** — test your `/api/analyze` endpoint before connecting the frontend. Hoppscotch (https://hoppscotch.io) is free and browser-based.

**Mockaroo or json-generator** — if you want to generate realistic fake IDXCarbon data to fill gaps in your dataset.

**Carbon Interface API** (https://www.carboninterface.com/api) — has a free tier with 200 requests/month and lets you calculate emissions by material/transport. Useful if you want to make the CBAM calculator more precise.

---

## 14. Phased build plan

Do this in order. Don't jump ahead.

### Phase 1 — Foundation (do this first, ~2–3 days)
- [ ] Set up all tools (Antigravity, Cursor, Gemini CLI)
- [ ] Download and clean all data sources
- [ ] Build all JSON data files in `/data/`
- [ ] Initialize Next.js project
- [ ] Write AGENTS.md and GEMINI.md
- [ ] Define all TypeScript types in `src/types/index.ts`
- [ ] Write `src/lib/data.ts` and `src/lib/calculations.ts`
- [ ] Get Gemini API key and test it works

### Phase 2 — Core UI (~2–3 days)
- [ ] Build Navbar
- [ ] Build dashboard home page with price comparison chart
- [ ] Build IDXCarbon monthly chart
- [ ] Build regulatory timeline page
- [ ] Ensure all pages render correctly with real data

### Phase 3 — CBAM Calculator (~1–2 days)
- [ ] Build calculator form (sector dropdown + export volume input)
- [ ] Wire up `calculateCBAMExposure()` function
- [ ] Display results card with breakdown
- [ ] Add disclaimer about estimates

### Phase 4 — AI Layer (~1 day)
- [ ] Build `/api/analyze` route
- [ ] Build `AIAnalystPanel` component
- [ ] Add AI analysis to calculator results
- [ ] Add "Get market summary" AI button to dashboard

### Phase 5 — Polish & Deploy (~1 day)
- [ ] Review all pages for visual consistency
- [ ] Add loading states everywhere
- [ ] Add error handling for Gemini failures
- [ ] Deploy to Vercel
- [ ] Test on mobile (Tailwind responsive classes)

---

*Guide version: May 2026. Tools and API details reflect current versions — verify against official docs if significant time has passed.*
