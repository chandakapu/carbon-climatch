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