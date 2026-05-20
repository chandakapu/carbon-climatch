import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Generates a multi-page PDF from a list of element IDs.
 * Each element in the list will be rendered on a new page.
 */
export async function generateMultiPagePdf(
    elementIds: string[],
    filename: string = "carbon-strategy-report.pdf"
) {
    const pdf = new jsPDF({
        orientation: "portrait",
        unit: "px",
        format: "a4",
    });

    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();

    for (let i = 0; i < elementIds.length; i++) {
        const elementId = elementIds[i];
        const element = document.getElementById(elementId);

        if (!element) {
            console.error(`Element with ID ${elementId} not found`);
            continue;
        }

        // Add a new page if it's not the first element
        if (i > 0) {
            pdf.addPage();
        }

        try {
            const canvas = await html2canvas(element, {
                scale: 2, // Higher resolution
                useCORS: true,
                backgroundColor: "#0b1120", // Match app background
                logging: false,
            });

            const imgData = canvas.toDataURL("image/png");
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;

            // Calculate scaling to fit page width
            const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
            const displayWidth = imgWidth * ratio;
            const displayHeight = imgHeight * ratio;

            // Center the image on the page
            const xOffset = (pageWidth - displayWidth) / 2;
            const yOffset = 20; // Slight top margin

            pdf.addImage(imgData, "PNG", xOffset, yOffset, displayWidth, displayHeight);
        } catch (error) {
            console.error(`Error generating PDF for element ${elementId}:`, error);
        }
    }

    pdf.save(filename);
}
