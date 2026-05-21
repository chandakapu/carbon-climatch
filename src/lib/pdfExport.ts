import jsPDF from "jspdf";
import type { StrategyInputs, StrategyResults } from "@/types";

/* ══════════════════════════════════════════════════════════════
 * Design tokens — formal report palette
 * ══════════════════════════════════════════════════════════════ */
const NAVY = [26, 54, 93] as const;        // #1a365d — headings & accent
const BLACK = [0, 0, 0] as const;
const DARK_GRAY = [74, 85, 104] as const;  // #4a5568 — muted text
const MED_GRAY = [203, 213, 225] as const; // #cbd5e1 — table borders
const LIGHT_GRAY = [241, 245, 249] as const; // #f1f5f9 — table header bg

const USD_TO_IDR = 16000;

/* ── Formatting helpers ──────────────────────────────────────── */
function fmtIdr(v: number): string {
    return `IDR ${v.toLocaleString("id-ID", { maximumFractionDigits: 0 })}`;
}

function fmtUsd(v: number): string {
    return `~USD ${(v / USD_TO_IDR).toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
}

function fmtBillions(v: number): string {
    const b = v / 1e9;
    if (Math.abs(b) >= 1) return `${b.toFixed(2)}B`;
    const m = v / 1e6;
    return `${m.toFixed(1)}M`;
}

function fmtPercent(v: number): string {
    return `${v}%`;
}

function todayStr(): string {
    const d = new Date();
    return d.toISOString().split("T")[0];
}

function todayFormatted(): string {
    return new Date().toLocaleDateString("en-US", {
        year: "numeric", month: "long", day: "numeric",
    });
}

/* ══════════════════════════════════════════════════════════════
 * PDF drawing helpers
 * ══════════════════════════════════════════════════════════════ */

const MARGIN_LEFT = 25;
const MARGIN_RIGHT = 25;
const MARGIN_TOP = 25;
const PAGE_NUM_Y = 285; // footer position

type RGB = readonly [number, number, number];

/** Draw the report header on each page */
function drawHeader(pdf: jsPDF, pageNum: number, totalPages: number): number {
    const pageW = pdf.internal.pageSize.getWidth();

    // Branding — top right
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(10);
    pdf.setTextColor(...NAVY);
    pdf.text("carbon-climatch", pageW - MARGIN_RIGHT, MARGIN_TOP, { align: "right" });

    // Thin separator line
    const lineY = MARGIN_TOP + 4;
    pdf.setDrawColor(...MED_GRAY);
    pdf.setLineWidth(0.5);
    pdf.line(MARGIN_LEFT, lineY, pageW - MARGIN_RIGHT, lineY);

    // Page number footer
    pdf.setFont("times", "normal");
    pdf.setFontSize(9);
    pdf.setTextColor(...DARK_GRAY);
    pdf.text(`Page ${pageNum} of ${totalPages}`, pageW / 2, PAGE_NUM_Y, { align: "center" });

    return lineY + 8; // return Y cursor after header
}

/** Draw a section title with an underline accent */
function drawSectionTitle(pdf: jsPDF, title: string, y: number): number {
    const pageW = pdf.internal.pageSize.getWidth();

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(13);
    pdf.setTextColor(...NAVY);
    pdf.text(title, MARGIN_LEFT, y);

    const underY = y + 2;
    pdf.setDrawColor(...NAVY);
    pdf.setLineWidth(0.8);
    pdf.line(MARGIN_LEFT, underY, pageW - MARGIN_RIGHT, underY);

    return underY + 8;
}

/** Draw a sub-section title (no underline) */
function drawSubTitle(pdf: jsPDF, title: string, y: number): number {
    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(11);
    pdf.setTextColor(...DARK_GRAY);
    pdf.text(title, MARGIN_LEFT, y);
    return y + 7;
}

/** Draw body text (single line) */
function drawText(pdf: jsPDF, text: string, y: number, options?: {
    color?: RGB; size?: number; font?: string; style?: string; indent?: number;
}): number {
    const { color = BLACK, size = 11, font = "times", style = "normal", indent = 0 } = options ?? {};
    pdf.setFont(font, style);
    pdf.setFontSize(size);
    pdf.setTextColor(...color);
    pdf.text(text, MARGIN_LEFT + indent, y);
    return y + (size * 0.45 + 2);
}

interface StyledChunk {
    text: string;
    bold: boolean;
    italic: boolean;
    code: boolean;
}

interface StyledToken {
    text: string;
    bold: boolean;
    italic: boolean;
    code: boolean;
}

function parseStyledChunks(text: string): StyledChunk[] {
    const chunks: StyledChunk[] = [];
    let index = 0;
    let isBold = false;
    let isItalic = false;
    let isCode = false;
    let currentText = "";

    while (index < text.length) {
        if (text.startsWith("**", index)) {
            if (currentText) {
                chunks.push({ text: currentText, bold: isBold, italic: isItalic, code: isCode });
                currentText = "";
            }
            isBold = !isBold;
            index += 2;
        } else if (text.startsWith("*", index)) {
            if (currentText) {
                chunks.push({ text: currentText, bold: isBold, italic: isItalic, code: isCode });
                currentText = "";
            }
            isItalic = !isItalic;
            index += 1;
        } else if (text.startsWith("`", index)) {
            if (currentText) {
                chunks.push({ text: currentText, bold: isBold, italic: isItalic, code: isCode });
                currentText = "";
            }
            isCode = !isCode;
            index += 1;
        } else {
            currentText += text[index];
            index += 1;
        }
    }
    if (currentText) {
        chunks.push({ text: currentText, bold: isBold, italic: isItalic, code: isCode });
    }
    return chunks;
}

function tokenizeChunk(chunk: StyledChunk): StyledToken[] {
    const tokens: StyledToken[] = [];
    const matches = chunk.text.match(/\s+|\S+/g);
    if (matches) {
        for (const m of matches) {
            tokens.push({
                text: m,
                bold: chunk.bold,
                italic: chunk.italic,
                code: chunk.code
            });
        }
    }
    return tokens;
}

function getStyledTextWidth(pdf: jsPDF, text: string, bold: boolean, italic: boolean, code: boolean, fontSize: number): number {
    const prevFont = pdf.getFont();
    let style = "normal";
    if (bold && italic) style = "bolditalic";
    else if (bold) style = "bold";
    else if (italic) style = "italic";

    const fontName = code ? "courier" : "times";
    pdf.setFont(fontName, style);
    pdf.setFontSize(fontSize);
    const w = pdf.getTextWidth(text);
    pdf.setFont(prevFont.fontName, prevFont.fontStyle);
    return w;
}

/** Draw body text with basic markdown formatting support (bold, italic, lists, inline code) */
function drawMarkdownText(
    pdf: jsPDF,
    text: string,
    y: number,
    options?: {
        color?: RGB;
        size?: number;
        indent?: number;
        maxWidth?: number;
        lineHeight?: number;
    }
): number {
    const pageW = pdf.internal.pageSize.getWidth();
    const { color = BLACK, size = 10, indent = 0 } = options ?? {};
    const maxWidth = options?.maxWidth ?? (pageW - MARGIN_LEFT - MARGIN_RIGHT - indent);
    const lineHeight = options?.lineHeight ?? (size * 0.45 + 1.5);

    const paragraphs = text.split(/\r?\n/);
    let currentY = y;

    for (const para of paragraphs) {
        if (!para.trim()) {
            currentY += lineHeight * 0.5;
            continue;
        }

        let isListItem = false;
        let cleanPara = para;
        let currentIndent = indent;

        if (para.trim().startsWith("- ") || para.trim().startsWith("* ")) {
            isListItem = true;
            // Trim leading spaces and remove the list marker
            cleanPara = para.trim().replace(/^[\-\*]\s+/, "");
            currentIndent = indent + 5;
        }

        const chunks = parseStyledChunks(cleanPara);
        const tokens: StyledToken[] = [];
        for (const chunk of chunks) {
            tokens.push(...tokenizeChunk(chunk));
        }

        let currentLineTokens: { token: StyledToken; width: number }[] = [];
        let currentLineWidth = 0;
        const linesOfTokens: typeof currentLineTokens[] = [];
        const paraMaxWidth = maxWidth - (currentIndent - indent);

        for (const token of tokens) {
            const w = getStyledTextWidth(pdf, token.text, token.bold, token.italic, token.code, size);
            if (currentLineWidth + w > paraMaxWidth && currentLineTokens.length > 0) {
                linesOfTokens.push(currentLineTokens);
                currentLineTokens = [];
                currentLineWidth = 0;
                if (token.text === " ") {
                    continue;
                }
            }
            currentLineTokens.push({ token, width: w });
            currentLineWidth += w;
        }
        if (currentLineTokens.length > 0) {
            linesOfTokens.push(currentLineTokens);
        }

        for (let i = 0; i < linesOfTokens.length; i++) {
            const line = linesOfTokens[i];
            let currentX = MARGIN_LEFT + currentIndent;

            if (isListItem && i === 0) {
                pdf.setFont("helvetica", "bold");
                pdf.setFontSize(size);
                pdf.setTextColor(16, 185, 129); // emerald/green bullet
                pdf.text("•", MARGIN_LEFT + indent + 1.5, currentY);
            }

            pdf.setTextColor(...color);
            pdf.setFontSize(size);

            for (const item of line) {
                let style = "normal";
                if (item.token.bold && item.token.italic) style = "bolditalic";
                else if (item.token.bold) style = "bold";
                else if (item.token.italic) style = "italic";

                const fontName = item.token.code ? "courier" : "times";
                pdf.setFont(fontName, style);
                
                if (item.token.code) {
                    pdf.setTextColor(16, 185, 129);
                } else {
                    pdf.setTextColor(...color);
                }

                pdf.text(item.token.text, currentX, currentY);
                currentX += item.width;
            }

            currentY += lineHeight;
        }

        currentY += 1.5;
    }

    return currentY;
}


interface TableOptions {
    colWidths: number[];
    headerBg?: RGB;
    headerColor?: RGB;
    fontSize?: number;
    rowHeight?: number;
    highlightRow?: number; // 0-indexed row to highlight
}

/** Draw a table with headers and rows */
function drawTable(
    pdf: jsPDF,
    headers: string[],
    rows: string[][],
    startY: number,
    options: TableOptions,
): number {
    const {
        colWidths,
        headerBg = LIGHT_GRAY,
        headerColor = NAVY,
        fontSize = 9,
        rowHeight = 7,
    } = options;

    const totalWidth = colWidths.reduce((a, b) => a + b, 0);
    let y = startY;

    pdf.setLineWidth(0.3);
    pdf.setDrawColor(...MED_GRAY);

    // Draw header row
    pdf.setFillColor(...headerBg);
    pdf.rect(MARGIN_LEFT, y, totalWidth, rowHeight, "FD");

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(fontSize);
    pdf.setTextColor(...headerColor);

    let x = MARGIN_LEFT;
    for (let i = 0; i < headers.length; i++) {
        pdf.text(headers[i], x + 2, y + rowHeight * 0.65);
        x += colWidths[i];
    }

    // Draw column dividers in header
    x = MARGIN_LEFT;
    for (let i = 0; i < colWidths.length; i++) {
        pdf.line(x, y, x, y + rowHeight);
        x += colWidths[i];
    }
    pdf.line(x, y, x, y + rowHeight); // right edge

    y += rowHeight;

    // Draw data rows
    pdf.setFont("times", "normal");
    pdf.setFontSize(fontSize);

    for (let r = 0; r < rows.length; r++) {
        const row = rows[r];
        const isHighlight = options.highlightRow === r;

        // Alternating row bg
        if (r % 2 === 0) {
            pdf.setFillColor(250, 250, 250);
            pdf.rect(MARGIN_LEFT, y, totalWidth, rowHeight, "F");
        }

        if (isHighlight) {
            pdf.setFillColor(230, 244, 241);
            pdf.rect(MARGIN_LEFT, y, totalWidth, rowHeight, "F");
        }

        // Draw cell borders
        pdf.setDrawColor(...MED_GRAY);
        pdf.rect(MARGIN_LEFT, y, totalWidth, rowHeight, "S");

        x = MARGIN_LEFT;
        for (let i = 0; i < colWidths.length; i++) {
            pdf.line(x, y, x, y + rowHeight); // vertical divider
            x += colWidths[i];
        }
        pdf.line(x, y, x, y + rowHeight); // right edge

        // Draw cell text
        x = MARGIN_LEFT;
        const cellColor: RGB = isHighlight ? NAVY : BLACK;
        pdf.setTextColor(...cellColor);
        if (isHighlight) pdf.setFont("times", "bold");
        else pdf.setFont("times", "normal");

        for (let i = 0; i < row.length; i++) {
            pdf.text(row[i], x + 2, y + rowHeight * 0.65);
            x += colWidths[i];
        }

        y += rowHeight;
    }

    return y + 4;
}

/** Draw confidentiality disclaimer */
function drawDisclaimer(pdf: jsPDF, y: number): number {
    const pageW = pdf.internal.pageSize.getWidth();

    pdf.setDrawColor(...MED_GRAY);
    pdf.setLineWidth(0.3);
    pdf.line(MARGIN_LEFT, y, pageW - MARGIN_RIGHT, y);

    y += 5;
    pdf.setFont("times", "italic");
    pdf.setFontSize(8);
    pdf.setTextColor(...DARK_GRAY);

    const disclaimer = "CONFIDENTIAL — For Internal Use Only. This report is generated by carbon-climatch and contains estimates based on market assumptions. This calculator uses simplified financial models for planning purposes. Consult a financial advisor for investment decisions.";
    const lines = pdf.splitTextToSize(disclaimer, pageW - MARGIN_LEFT - MARGIN_RIGHT);
    pdf.text(lines, MARGIN_LEFT, y);

    return y + lines.length * 4;
}

/* ══════════════════════════════════════════════════════════════
 * Main report generator
 * ══════════════════════════════════════════════════════════════ */

export interface ChartImages {
    barChart: string | null;  // data URI
    lineChart: string | null; // data URI
}

export async function generateFormalReport(
    inputs: StrategyInputs,
    results: StrategyResults,
    aiAnalysis: string,
    chartImages: ChartImages,
): Promise<void> {
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: "a4",
    });

    const pageW = pdf.internal.pageSize.getWidth();
    const TOTAL_PAGES = 4;

    /* ─── PAGE 1: Cover & Executive Summary ─────────────────── */
    let y = drawHeader(pdf, 1, TOTAL_PAGES);

    // Title block
    pdf.setFont("times", "bold");
    pdf.setFontSize(24);
    pdf.setTextColor(...NAVY);
    pdf.text("Carbon Strategy", MARGIN_LEFT, y + 10);
    pdf.text("Compliance Report", MARGIN_LEFT, y + 20);

    pdf.setFont("times", "normal");
    pdf.setFontSize(12);
    pdf.setTextColor(...DARK_GRAY);
    pdf.text("Generated for: Indonesian Strategic Finance Team", MARGIN_LEFT, y + 30);
    pdf.text(`Date: ${todayFormatted()}`, MARGIN_LEFT, y + 37);

    y += 48;

    // Horizontal rule
    pdf.setDrawColor(...NAVY);
    pdf.setLineWidth(1);
    pdf.line(MARGIN_LEFT, y, pageW - MARGIN_RIGHT, y);
    y += 10;

    // Recommendation box
    y = drawSectionTitle(pdf, "Executive Summary", y);

    const recKey = `strategy_${results.recommended.toLowerCase() as "a" | "b" | "c"}` as const;
    const recResult = results[recKey];
    const strategyNames: Record<string, string> = {
        A: "Strategy A — OPEX (Carbon Credits Only)",
        B: "Strategy B — CAPEX (Green Investment)",
        C: "Strategy C — Mixed (Hybrid Approach)",
    };

    y = drawText(pdf, `Recommended Strategy:  ${strategyNames[results.recommended]}`, y, {
        font: "helvetica", style: "bold", size: 12, color: NAVY,
    });
    y += 1;
    y = drawText(pdf, `Total Cost Over ${inputs.planning_horizon_years}-Year Horizon:  ${fmtIdr(recResult.total_cost)}  (${fmtUsd(recResult.total_cost)})`, y, {
        size: 11,
    });
    y += 1;

    if (results.break_even_year) {
        y = drawText(pdf, `CAPEX investment breaks even versus OPEX-only approach at Year ${results.break_even_year}.`, y, {
            size: 11,
        });
    } else {
        y = drawText(pdf, "CAPEX investment does not break even within the planning horizon.", y, {
            size: 11,
        });
    }

    y += 3;

    // Strategy comparison summary (compact)
    const summaryHeaders = ["Metric", "Strategy A (OPEX)", "Strategy B (CAPEX)", "Strategy C (Mixed)"];
    const summaryColWidths = [40, 40, 40, 40];

    const summaryRows = [
        ["Total Cost", fmtIdr(results.strategy_a.total_cost), fmtIdr(results.strategy_b.total_cost), fmtIdr(results.strategy_c.total_cost)],
        ["USD Equivalent", fmtUsd(results.strategy_a.total_cost), fmtUsd(results.strategy_b.total_cost), fmtUsd(results.strategy_c.total_cost)],
        ["Avg. Annual", fmtBillions(results.strategy_a.total_cost / inputs.planning_horizon_years), fmtBillions(results.strategy_b.total_cost / inputs.planning_horizon_years), fmtBillions(results.strategy_c.total_cost / inputs.planning_horizon_years)],
    ];

    y = drawTable(pdf, summaryHeaders, summaryRows, y, { colWidths: summaryColWidths, fontSize: 8.5 });

    y += 4;

    // AI Analysis section
    y = drawSectionTitle(pdf, "AI Strategic Analysis", y);

    const analysisText = aiAnalysis || "AI analysis was not generated. Run the AI Strategy Analysis on the dashboard to populate this section.";
    y = drawMarkdownText(pdf, analysisText, y, {
        size: 10, color: DARK_GRAY,
    });

    // Page 1 disclaimer
    drawDisclaimer(pdf, Math.max(y + 5, 268));

    /* ─── PAGE 2: Key Assumptions & Strategy Comparison ──────── */
    pdf.addPage();
    y = drawHeader(pdf, 2, TOTAL_PAGES);

    y = drawSectionTitle(pdf, "1. Financial Assumptions", y);

    const assumptionHeaders = ["Parameter", "Value"];
    const assumptionColWidths = [85, 75];
    const assumptionRows = [
        ["Annual Emissions", `${inputs.annual_emissions.toLocaleString()} tCO2e/year`],
        ["Carbon Price", `${fmtIdr(inputs.carbon_price_idr)} per tCO2e`],
        ["Carbon Price Escalation", `${inputs.carbon_price_escalation_pct}% per year`],
        ["Planning Horizon", `${inputs.planning_horizon_years} years`],
        ["CAPEX Investment", fmtIdr(inputs.capex_amount_idr)],
        ["Emission Reduction from CAPEX", fmtPercent(inputs.emission_reduction_pct)],
        ["Down Payment", fmtPercent(inputs.down_payment_pct)],
        ["Interest Rate", `${inputs.interest_rate_pct}% p.a.`],
        ["Loan Term", `${inputs.loan_term_years} years`],
        ["Annual Maintenance", `${inputs.maintenance_pct}% of CAPEX`],
        ["Depreciation Method", inputs.depreciation_method],
        ["Depreciation Life", `${inputs.depreciation_life_years} years`],
        ["Mixed Strategy CAPEX Allocation", fmtPercent(inputs.mixed_capex_allocation_pct)],
        ["Corporate Tax Rate", fmtPercent(inputs.corporate_tax_rate_pct)],
    ];

    y = drawTable(pdf, assumptionHeaders, assumptionRows, y, {
        colWidths: assumptionColWidths,
        fontSize: 9,
        rowHeight: 6.5,
    });

    y += 6;

    // Detailed strategy comparison
    y = drawSectionTitle(pdf, "2. Strategy Comparison — Detailed", y);

    const detailHeaders = ["Component", "Strategy A", "Strategy B", "Strategy C"];
    const detailColWidths = [55, 35, 35, 35];

    const totalCreditsA = results.strategy_a.yearly.reduce((s, yr) => s + yr.credit_cost, 0);
    const totalCreditsB = results.strategy_b.yearly.reduce((s, yr) => s + yr.credit_cost, 0);
    const totalCreditsC = results.strategy_c.yearly.reduce((s, yr) => s + yr.credit_cost, 0);
    const totalCapexB = results.strategy_b.yearly.reduce((s, yr) => s + yr.capex_repayment, 0);
    const totalCapexC = results.strategy_c.yearly.reduce((s, yr) => s + yr.capex_repayment, 0);
    const totalMaintB = results.strategy_b.yearly.reduce((s, yr) => s + yr.maintenance, 0);
    const totalMaintC = results.strategy_c.yearly.reduce((s, yr) => s + yr.maintenance, 0);
    const totalShieldB = results.strategy_b.yearly.reduce((s, yr) => s + yr.tax_shield, 0);
    const totalShieldC = results.strategy_c.yearly.reduce((s, yr) => s + yr.tax_shield, 0);

    const detailRows = [
        ["Carbon Credit Costs", fmtBillions(totalCreditsA), fmtBillions(totalCreditsB), fmtBillions(totalCreditsC)],
        ["CAPEX Repayment", "—", fmtBillions(totalCapexB), fmtBillions(totalCapexC)],
        ["Maintenance Costs", "—", fmtBillions(totalMaintB), fmtBillions(totalMaintC)],
        ["Tax Shield (Savings)", "—", `(${fmtBillions(totalShieldB)})`, `(${fmtBillions(totalShieldC)})`],
        ["Total Net Cost", fmtBillions(results.strategy_a.total_cost), fmtBillions(results.strategy_b.total_cost), fmtBillions(results.strategy_c.total_cost)],
        ["Break-even Year", "—", results.break_even_year ? `Year ${results.break_even_year}` : "N/A", "—"],
        ["Recommendation", results.recommended === "A" ? "✓ Optimal" : "", results.recommended === "B" ? "✓ Optimal" : "", results.recommended === "C" ? "✓ Optimal" : ""],
    ];

    y = drawTable(pdf, detailHeaders, detailRows, y, {
        colWidths: detailColWidths,
        fontSize: 9,
        highlightRow: 4, // Total Net Cost row
    });

    drawDisclaimer(pdf, Math.max(y + 5, 268));

    /* ─── PAGE 3: Detailed Yearly Breakdown ──────────────────── */
    pdf.addPage();
    y = drawHeader(pdf, 3, TOTAL_PAGES);

    y = drawSectionTitle(pdf, "3. Yearly Cost Breakdown by Strategy", y);

    // Strategy A table
    y = drawSubTitle(pdf, "Strategy A — OPEX (Carbon Credits Only)", y);

    const yearlyHeaders = ["Year", "Credit Cost", "CAPEX Repay", "Maintenance", "Tax Shield", "Net Cost"];
    const yearlyColWidths = [15, 35, 30, 28, 28, 30];

    const stratARows = results.strategy_a.yearly.map(yr => [
        `${yr.year}`,
        fmtBillions(yr.credit_cost),
        yr.capex_repayment ? fmtBillions(yr.capex_repayment) : "—",
        yr.maintenance ? fmtBillions(yr.maintenance) : "—",
        yr.tax_shield ? `(${fmtBillions(yr.tax_shield)})` : "—",
        fmtBillions(yr.net_cost),
    ]);

    y = drawTable(pdf, yearlyHeaders, stratARows, y, {
        colWidths: yearlyColWidths,
        fontSize: 8.5,
        rowHeight: 6,
    });

    y += 4;

    // Strategy B table
    y = drawSubTitle(pdf, "Strategy B — CAPEX (Green Investment)", y);

    const stratBRows = results.strategy_b.yearly.map(yr => [
        `${yr.year}`,
        fmtBillions(yr.credit_cost),
        yr.capex_repayment ? fmtBillions(yr.capex_repayment) : "—",
        yr.maintenance ? fmtBillions(yr.maintenance) : "—",
        yr.tax_shield ? `(${fmtBillions(yr.tax_shield)})` : "—",
        fmtBillions(yr.net_cost),
    ]);

    y = drawTable(pdf, yearlyHeaders, stratBRows, y, {
        colWidths: yearlyColWidths,
        fontSize: 8.5,
        rowHeight: 6,
    });

    y += 4;

    // Strategy C table
    y = drawSubTitle(pdf, "Strategy C — Mixed (Hybrid Approach)", y);

    const stratCRows = results.strategy_c.yearly.map(yr => [
        `${yr.year}`,
        fmtBillions(yr.credit_cost),
        yr.capex_repayment ? fmtBillions(yr.capex_repayment) : "—",
        yr.maintenance ? fmtBillions(yr.maintenance) : "—",
        yr.tax_shield ? `(${fmtBillions(yr.tax_shield)})` : "—",
        fmtBillions(yr.net_cost),
    ]);

    y = drawTable(pdf, yearlyHeaders, stratCRows, y, {
        colWidths: yearlyColWidths,
        fontSize: 8.5,
        rowHeight: 6,
    });

    drawDisclaimer(pdf, Math.max(y + 5, 268));

    /* ─── PAGE 4: Charts & Disclaimer ────────────────────────── */
    pdf.addPage();
    y = drawHeader(pdf, 4, TOTAL_PAGES);

    y = drawSectionTitle(pdf, "4. Visual Analysis", y);

    // Bar chart
    if (chartImages.barChart) {
        y = drawSubTitle(pdf, "Annual Cost Breakdown", y);
        y = drawText(pdf, "Comparative breakdown of costs (Credits vs. Investment vs. Tax Shield) per year.", y, {
            size: 9, color: DARK_GRAY,
        });
        y += 1;

        const chartW = pageW - MARGIN_LEFT - MARGIN_RIGHT;
        const chartH = chartW * 0.45; // maintain aspect ratio
        pdf.addImage(chartImages.barChart, "PNG", MARGIN_LEFT, y, chartW, chartH);
        y += chartH + 6;
    }

    // Line chart
    if (chartImages.lineChart) {
        y = drawSubTitle(pdf, "Cumulative Cost & Break-even Analysis", y);

        let breakEvenText: string;
        if (results.break_even_year) {
            breakEvenText = `Total financial exposure over time. CAPEX breaks even vs. OPEX at Year ${results.break_even_year}.`;
        } else {
            breakEvenText = "Total financial exposure over time. CAPEX does not break even within the planning horizon.";
        }
        y = drawText(pdf, breakEvenText, y, { size: 9, color: DARK_GRAY });
        y += 1;

        const chartW = pageW - MARGIN_LEFT - MARGIN_RIGHT;
        const chartH = chartW * 0.45;
        pdf.addImage(chartImages.lineChart, "PNG", MARGIN_LEFT, y, chartW, chartH);
        y += chartH + 6;
    }

    drawDisclaimer(pdf, Math.max(y + 5, 268));

    /* ─── Save ───────────────────────────────────────────────── */
    const filename = `Carbon-Strategy-Report-${todayStr()}.pdf`;
    pdf.save(filename);
}
