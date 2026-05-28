import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const model = genAI.getGenerativeModel({ model: "gemini-3.1-flash-lite" });

export interface AnalysisRequest {
    type: "dashboard_summary" | "cbam_result" | "regulation_explainer" | "strategy_optimizer" | "yolo_optimizer";
    data: Record<string, unknown>;
    context?: string;
    language?: string;
}

export async function generateAnalysis(request: AnalysisRequest): Promise<string> {
    const langInstructions = request.language === "id"
        ? "Always write your response in fluent, professional Indonesian language (Bahasa Indonesia). Use standard Indonesian corporate finance terms (e.g., use 'liabilitas' for liability, 'pajak karbon' for carbon tax, 'dekarbonisasi' for decarbonization)."
        : "Always write your response in plain, professional English.";

    const systemContext = `
You are a carbon finance analyst assistant for carbon-climatch, a platform that helps 
Indonesian CFOs understand their carbon regulatory exposure. Your role is to translate 
complex regulatory and financial data into clear, actionable insights.

${langInstructions}

Always:
- Quantify impacts in both USD and IDR where relevant
- Be specific about which regulation applies (NEK ETS, CBAM, carbon tax)
- Keep responses to 3-5 sentences maximum
- Flag urgency if a deadline is within 12 months
- Never make up numbers — only use data provided to you
  `.trim();

    let userPrompt = "";

    if (request.type === "cbam_result") {
        const d = request.data;
        
        let portfolioBreakdown = "";
        if (Array.isArray(d.items) && d.items.length > 0) {
            portfolioBreakdown = "Portfolio Sector Breakdown:\n" + d.items.map((item: { sector: string; export_volume_tons?: number; total_emissions_tco2?: number; net_liability_usd?: number; }) => 
                `- ${item.sector}: Export Volume ${item.export_volume_tons?.toLocaleString()} tons, Emissions ${item.total_emissions_tco2?.toLocaleString()} tCO2e, Net Liability: USD ${item.net_liability_usd?.toLocaleString()}`
            ).join("\n");
        } else {
            portfolioBreakdown = `- Sector: ${d.sector}\n- Export Volume: ${d.export_volume_tons?.toLocaleString()} tons\n- Emissions: ${d.total_emissions_tco2?.toLocaleString()} tCO2e\n- Net Liability: USD ${d.net_liability_usd?.toLocaleString()}`;
        }

        userPrompt = `
A CFO has calculated their EU CBAM exposure for their export portfolio. Here are the results:
${portfolioBreakdown}

Aggregated Totals:
- Total Export Volume: ${d.total_export_volume_tons?.toLocaleString() ?? d.export_volume_tons?.toLocaleString()} tons
- Total Emissions: ${d.total_emissions_tco2?.toLocaleString() ?? d.total_emissions_tco2?.toLocaleString()} tCO2e
- Total Gross CBAM Liability: USD ${(d.total_cbam_liability_usd ?? d.cbam_liability_usd)?.toLocaleString()}
- Total Indonesia Carbon Credit Deduction: USD ${(d.total_indonesia_carbon_credit_usd ?? d.indonesia_carbon_credit_usd)?.toLocaleString()}
- Total Net CBAM Liability: USD ${(d.total_net_liability_usd ?? d.net_liability_usd)?.toLocaleString()} (IDR ${(d.total_net_liability_idr ?? d.net_liability_idr)?.toLocaleString()})
- EU ETS price used: USD ${d.eu_ets_price_usd}/tCO2e
- Indonesia carbon price used: USD ${d.indonesia_carbon_price_usd}/tCO2e

In exactly 3-5 sentences, provide a strategic risk analysis for the CFO. Identify which sector poses the highest exposure, discuss the buffering effect of domestic pricing offsets, and propose one immediate action to mitigate exposure (given that CBAM full enforcement started January 2026).
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
    } else if (request.type === "strategy_optimizer") {
        const d = request.data;
        userPrompt = `
A CFO has modeled three carbon compliance strategies over a ${d.horizon_years}-year horizon.
Given:
- Strategy A (OPEX — buy credits only): Total cost IDR ${Number(d.strategy_a_total).toLocaleString()}
- Strategy B (CAPEX — green investment): Total cost IDR ${Number(d.strategy_b_total).toLocaleString()}
- Strategy C (Mixed): Total cost IDR ${Number(d.strategy_c_total).toLocaleString()}
- CAPEX break-even year vs OPEX: ${d.break_even_year ?? "No break-even within horizon"}
- Recommended strategy: ${d.recommended_strategy}
- Carbon price escalation assumption: ${d.carbon_price_escalation_pct}% per year
- Emission reduction from CAPEX: ${d.emission_reduction_pct}%

In 4 sentences: state which strategy is cheapest over the horizon, when CAPEX breaks even, 
what risk the carbon price escalation assumption carries, and one specific action to take 
in the next 90 days.
    `.trim();
    } else if (request.type === "yolo_optimizer") {
        const d = request.data;
        userPrompt = `
You are the YOLO Carbon Optimizer. Your objective is to return a strict JSON payload that represents the absolute lowest-cost combination of offsets and green technologies to completely cover a carbon exposure gap.
Remaining Gap to cover: ${d.remainingGap} tCO2e.
Available Carbon Offsets (prices in IDR/tCO2e):
${JSON.stringify(d.creditProjects, null, 2)}
Available Green Tech (reductions per unit, cost per unit in IDR):
${JSON.stringify(d.greenTechs, null, 2)}

Instructions:
1. Make a combination of green technologies and carbon offsets that reduces the remaining gap to 0.
2. Order them so that we get the best ROI (lowest total cost). Green tech offsets baseline emissions permanently but has higher CAPEX. Carbon credits are OPEX.
3. You must respond ONLY with a raw JSON block. Do not include markdown wraps or backticks, just raw JSON.
4. The JSON must match the following structure:
{
  "credits": [
    { "id": "project-id", "quantity": 1234 }
  ],
  "tech": [
    { "id": "tech-id", "capacity": 10 }
  ]
}
`.trim();
    }

    const result = await model.generateContent(`${systemContext}\n\n${userPrompt}`);
    return result.response.text();
}