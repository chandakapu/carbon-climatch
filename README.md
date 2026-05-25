# Carbon Climatch: Carbon Regulatory Analytics Platform

## 1. Overview
Carbon Climatch is a comprehensive analytics platform designed for Chief Financial Officers (CFOs) and sustainability executives in Indonesia. The platform provides data-driven insights into the evolving carbon regulatory landscape, enabling organizations to quantify their financial exposure to domestic and international carbon pricing mechanisms.

By integrating market data from IDXCarbon with global benchmarks and the European Union's Carbon Border Adjustment Mechanism (CBAM), Carbon Climatch serves as a strategic decision-support tool for navigating the transition to a low-carbon economy.

## 2. Core Modules

### 2.1 IDXCarbon Market Analytics
The platform tracks and visualizes Indonesia's domestic carbon exchange (IDXCarbon) data. 
- **Monthly Trading Insights**: Analysis of trading volumes and price trends based on historical data.
- **Liquidity Monitoring**: Assessment of market depth and participation levels within the Indonesian Emissions Trading System (ETS).

### 2.2 Global Carbon Pricing Benchmarks
Carbon Climatch provides a consolidated view of international carbon pricing instruments.
- **Instrument Comparison**: Benchmarking the Indonesian carbon price against major global systems, such as the EU ETS.
- **Coverage Analysis**: Detailed data on the percentage of jurisdictional emissions covered by various instruments.

### 2.3 CBAM Exposure Calculator
A specialized tool for Indonesian exporters to the European Union.
- **Financial Impact Estimation**: Calculates potential liabilities under the EU CBAM based on sector-specific emission factors (e.g., Cement, Iron & Steel, Aluminum, Fertilizers, Electricity, Hydrogen).
- **Carbon Credit Deductions**: Factors in carbon prices already paid in Indonesia to provide accurate net-cost projections.

### 2.4 Strategy Optimization Model
An interactive modeling matrix comparing:
- **Strategy A (OPEX)**: Purchasing carbon credits exclusively.
- **Strategy B (CAPEX)**: Funding permanent green technology upgrades.
- **Strategy C (Mixed)**: A blended optimization path calculating tax shield depreciations and optimal allocations.

### 2.5 Carbon Action Hub & Financial ledger
The execution layer for compliance decisions:
- **Off-setting Projects**: Retiring high-quality credits from domestic (Rimba Raya, Lahendong, IDX-C1) and international registries.
- **Green Technology Deployment**: Integrating Rooftop Solar PV, EV logistics fleets, and Biomass Boiler conversions.
- **Green Financing Integration**: Structuring corporate green loan amortizations (Mandiri, BRI, BCA) to offset CAPEX down payments.
- **Dual PDF Reporting Engine**: 
  - **Export Compliance Covenant**: An official legal certificate aligned with Presidential Decree No. 98/2021 and UU HPP.
  - **Carbon Action Ledger**: An internal corporate accounting statement detailing cash flows and transaction logs.

### 2.6 YOLO Compliance Optimization
- **AI-Guided Batch Transactions**: Integrates a dynamic Gemini optimizer to analyze the remaining emission gaps and instantly propose the lowest-cost configuration of green tech and offsets.
- **One-Click PDF Audit Upload**: Allows users to download a mock audit PDF and re-upload it. The system automatically reads emission parameters, configures baseline assumptions, and routes the CFO directly to the Action Hub.

## 3. Technical Architecture

### 3.1 Technology Stack
- **Frontend Framework**: Next.js (App Router architecture)
- **Programming Language**: TypeScript
- **Styling**: Tailwind CSS
- **Data Visualization**: Recharts
- **AI Integration**: Google Generative AI SDK (`@google/generative-ai`)

### 3.2 Directory Structure
```text
carbon-climatch/
├── data/               # Processed JSON datasets for application use
├── raw_data/           # Source documents and processing scripts
│   ├── carbon_prices/  # World Bank pricing data and Python transformation scripts
│   └── Monthly Data.../ # Original PDF reports from IDXCarbon
├── src/
│   ├── app/            # Next.js routes and page components
│   ├── components/     # Reusable UI elements (AI, Dashboard, Layout)
│   ├── lib/            # Core business logic (Calculations, Data loading, AI)
│   └── types/          # TypeScript interface definitions
└── public/             # Static assets
```

### 3.3 Data Processing Pipeline
The repository includes automated scripts for data transformation:
- **`process_worldbank.py`**: A Python-based utility that extracts, cleans, and transforms World Bank carbon pricing data into structured JSON formats.

## 4. Implementation Details

### 4.1 CBAM Calculation Methodology
The exposure is calculated using the following logical sequence:
1. **Total Emissions Calculation**: Determined by multiplying export volume (tons) by sector-specific emission factors.
2. **Gross Liability**: Total emissions multiplied by the current EU ETS carbon price.
3. **Domestic Credit Offset**: Deducts the value of carbon prices already paid in the country of origin.
4. **Net Liability**: The final projected financial obligation to the EU.

### 4.2 AI Orchestration
The AI analyst utilizes specialized system prompts to ensure professional, accurate, and concise financial advice. It is configured to handle four distinct request types: `dashboard_summary`, `cbam_result`, `regulation_explainer`, and `strategy_optimizer`.

## 5. Data Governance
The platform relies on authoritative data sources:
- **World Bank**: Global carbon pricing data.
- **IDX Carbon**: Monthly Indonesian trading reports.
- **European Commission**: CBAM sector rates and regulatory schedules.

## 6. Setup and Installation

### 6.1 Prerequisites
- Node.js 18.17.0 or higher.
- A Google AI Studio API Key.

### 6.2 Installation Steps
1. **Clone the Repository**:
   ```bash
   git clone https://github.com/chandakapu/carbon-climatch.git
   cd carbon-climatch
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Configure Environment Variables**:
   Create a `.env.local` file in the root directory:
   ```env
   GEMINI_API_KEY=your_google_api_key_here
   ```
4. **Launch Development Environment**:
   ```bash
   npm run dev
   ```
   Access the application at `http://localhost:3000`.

## 7. License
This project is licensed under the MIT License.
