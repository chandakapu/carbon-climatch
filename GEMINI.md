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