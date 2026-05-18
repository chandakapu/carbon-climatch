# Carbon Climatch

A Next.js-based analytics platform designed for Indonesian CFOs and sustainability officers to understand their company's exposure to evolving carbon regulations, including EU CBAM and domestic carbon pricing (IDX Carbon).

## Features

- **IDXCarbon Monitoring**: Visual analysis of Indonesia's domestic carbon market trends and monthly trading data.
- **Global Price Comparison**: Benchmarking domestic carbon prices against international markets like EU ETS.
- **CBAM Exposure Calculator**: Estimate the potential financial impact of the EU Carbon Border Adjustment Mechanism on exports based on sector-specific rates.
- **AI Analyst Panel**: Integrated AI (powered by Gemini 1.5 Flash) to provide strategic insights on regulatory trends and complex data analysis.

## Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **AI**: Google Gemini 1.5 Flash API

## Data Sources

- **World Bank**: Global carbon pricing data.
- **IDX Carbon**: Indonesian monthly trading data (April 2025 - April 2026).
- **EU Commission**: CBAM sector rates and emission factors.

## Getting Started

### Prerequisites

- Node.js 18+
- A Google AI Studio API Key (for Gemini integration)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/chandakapu/carbon-climatch.git
   cd carbon-climatch
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file with your Gemini API key:
   ```env
   NEXT_PUBLIC_GEMINI_API_KEY=your_api_key_here
   ```
4. Run the development server:
   ```bash
   npm run dev
   ```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Project Structure

- `src/lib/calculations.ts`: Core logic for CBAM and carbon exposure math.
- `src/lib/data.ts`: Data loading and transformation utilities.
- `data/`: Processed JSON datasets.
- `raw_data/`: Original source documents (PDFs/Excel).

## License

MIT
