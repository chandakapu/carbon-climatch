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