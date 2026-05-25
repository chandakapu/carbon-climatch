import jsPDF from "jspdf";

/**
 * Generates a mock Corporate Carbon Emissions and Compliance Audit report PDF.
 */
export function generateMockupAuditReport(companyName: string) {
  const pdf = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const w = 210;
  const h = 297;

  // Header branding
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(26, 54, 93);
  pdf.text("carbon-climatch Audit Services", 20, 20);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(74, 85, 104);
  pdf.text("AUDIT YEAR: 2026", w - 20, 20, { align: "right" });

  // Document Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(26, 54, 93);
  pdf.text("CORPORATE CARBON INVENTORY & CBAM EXPOSURE STATEMENT", 20, 32);

  // Divider
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(20, 36, w - 20, 36);

  // Meta Section
  let y = 44;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(74, 85, 104);
  pdf.text("AUDITEE INFORMATION", 20, y);
  y += 5;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(33, 33, 33);
  pdf.text(`Entity Name: ${companyName}`, 20, y);
  pdf.text("Auditor registration: KAN-KLHK-992A", w - 20, y, { align: "right" });
  y += 6;
  pdf.text("Audit standard: ISO 14064-1:2018 (Carbon Footprint verification)", 20, y);
  pdf.text("Date of Audit: May 2026", w - 20, y, { align: "right" });

  y += 12;

  // Key stats table layout
  pdf.setFillColor(245, 247, 250);
  pdf.roundedRect(20, y, w - 40, 48, 2, 2, "F");
  pdf.setDrawColor(220, 225, 230);
  pdf.roundedRect(20, y, w - 40, 48, 2, 2, "D");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(26, 54, 93);
  pdf.text("AUDITED VERIFICATION DATA & CBAM TARIFF EXPOSURE:", 25, y + 8);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(33, 33, 33);
  
  pdf.text("- Total Annual Scope 1 & 2 Emissions (Tons CO2e):", 25, y + 18);
  pdf.setFont("helvetica", "bold");
  pdf.text("55,000 tCO2e", w - 25, y + 18, { align: "right" });
  
  pdf.setFont("helvetica", "normal");
  pdf.text("- Total CBAM Tariff Gap (Emissions Gap to offset):", 25, y + 27);
  pdf.setFont("helvetica", "bold");
  pdf.text("55,000 tCO2e", w - 25, y + 27, { align: "right" });

  pdf.setFont("helvetica", "normal");
  pdf.text("- Estimated Net CBAM Carbon Liability (USD):", 25, y + 36);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(220, 50, 50);
  pdf.text("$264,000 USD", w - 25, y + 36, { align: "right" });

  y += 62;

  // Subtitle
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(26, 54, 93);
  pdf.text("DETAILED SECTOR BREAKDOWN:", 20, y);
  y += 5;

  // Table header
  pdf.setFillColor(230, 235, 242);
  pdf.rect(20, y, w - 40, 8, "F");
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(8.5);
  pdf.setTextColor(51, 51, 51);
  pdf.text("Audited Sector Group", 24, y + 5.5);
  pdf.text("Export Volume (Tons)", w / 2, y + 5.5);
  pdf.text("Emissions (tCO2e)", w - 24, y + 5.5, { align: "right" });
  y += 8;

  // Table row
  pdf.setFont("helvetica", "normal");
  pdf.text("Iron & Steel (Baja Paduan)", 24, y + 5.5);
  pdf.text("5,000 Tons", w / 2, y + 5.5);
  pdf.text("55,000", w - 24, y + 5.5, { align: "right" });
  pdf.line(20, y + 8, w - 20, y + 8);
  y += 18;

  // Auditor notes
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(26, 54, 93);
  pdf.text("AUDITOR DISCHARGE NOTE & COMPLIANCE STEPS:", 20, y);
  y += 5;
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(74, 85, 104);
  const noteText = "This document confirms that the auditee has undergone scope validation for CBAM carbon pricing adjustments. Under the carbon-climatch optimization algorithms, the recommended strategy to cover the remaining compliance gap is to retire high-quality carbon offsets and transition logistics fleets. The auditee may present this statement to qualify for tariff discounts under double tax deduction policies.";
  const splitNote = pdf.splitTextToSize(noteText, w - 40);
  pdf.text(splitNote, 20, y);

  // Save the report
  const filename = `Mockup-Carbon-Audit-${companyName.replace(/\s+/g, "-")}.pdf`;
  pdf.save(filename);
}
