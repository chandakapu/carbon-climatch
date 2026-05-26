import jsPDF from "jspdf";

/**
 * Generates a mock Ledger/Invoice report PDF for Strategy parameter extraction.
 */
export function generateMockupLedgerReport(companyName: string) {
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
  pdf.text("carbon-climatch Financial Services", 20, 20);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(74, 85, 104);
  pdf.text("FISCAL YEAR: 2026", w - 20, 20, { align: "right" });

  // Document Title
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(16);
  pdf.setTextColor(26, 54, 93);
  pdf.text("LEDGER & EMISSIONS INVOICE FOR STRATEGY OPTIMIZATION", 20, 32);

  // Divider
  pdf.setDrawColor(200, 200, 200);
  pdf.setLineWidth(0.5);
  pdf.line(20, 36, w - 20, 36);

  // Meta Section
  let y = 44;
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(74, 85, 104);
  pdf.text("COMPANY INFORMATION", 20, y);
  y += 5;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9);
  pdf.setTextColor(33, 33, 33);
  pdf.text(`Company Name: ${companyName}`, 20, y);
  y += 6;
  pdf.text("Document Type: Annual Ledger & Emissions Declaration", 20, y);
  pdf.text("Date: May 2026", w - 20, y, { align: "right" });

  y += 12;

  // Key stats table layout
  pdf.setFillColor(245, 247, 250);
  pdf.roundedRect(20, y, w - 40, 48, 2, 2, "F");
  pdf.setDrawColor(220, 225, 230);
  pdf.roundedRect(20, y, w - 40, 48, 2, 2, "D");

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(10);
  pdf.setTextColor(26, 54, 93);
  pdf.text("EXTRACTABLE PARAMETERS (OCR DATA):", 25, y + 8);

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(9.5);
  pdf.setTextColor(33, 33, 33);
  
  pdf.text("- Total Annual Emissions (tCO2e):", 25, y + 18);
  pdf.setFont("helvetica", "bold");
  pdf.text("85000", w - 25, y + 18, { align: "right" });
  
  pdf.setFont("helvetica", "normal");
  pdf.text("- Allocated CAPEX Investment (IDR):", 25, y + 27);
  pdf.setFont("helvetica", "bold");
  pdf.text("15000000000", w - 25, y + 27, { align: "right" });

  pdf.setFont("helvetica", "normal");
  pdf.text("- Prevailing Carbon Price (IDR/tCO2e):", 25, y + 36);
  pdf.setFont("helvetica", "bold");
  pdf.setTextColor(220, 50, 50);
  pdf.text("80000", w - 25, y + 36, { align: "right" });

  y += 62;

  // Auditor notes
  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(9);
  pdf.setTextColor(26, 54, 93);
  pdf.text("NOTES:", 20, y);
  y += 5;
  
  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(8);
  pdf.setTextColor(74, 85, 104);
  const noteText = "This sample document is used for demonstrating OCR-based auto-filling in the Strategy Optimizer. Uploading this file will trigger an automatic extraction of the parameters listed above, saving time and ensuring data consistency.";
  const splitNote = pdf.splitTextToSize(noteText, w - 40);
  pdf.text(splitNote, 20, y);

  // Save the report
  const filename = `Mockup-Ledger-${companyName.replace(/\s+/g, "-")}.pdf`;
  pdf.save(filename);
}
