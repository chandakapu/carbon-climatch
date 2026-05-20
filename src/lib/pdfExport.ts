import jsPDF from "jspdf";
import html2canvas from "html2canvas";

/**
 * Regex to detect modern CSS color functions that html2canvas cannot parse.
 * Tailwind CSS v4 resolves colors to oklch() and lab() — these must be
 * converted to safe rgb() fallbacks during canvas capture.
 */
const UNSUPPORTED_COLOR_RE = /(oklch|lab|lch|oklab)\([^)]*\)/g;

/**
 * Converts an oklch/lab color string to an rgb() fallback.
 * Uses a temporary DOM element to let the browser resolve the color,
 * then reads it back as an rgb() value.
 */
function resolveColorToRgb(colorStr: string): string {
    try {
        const temp = document.createElement("div");
        temp.style.color = colorStr;
        document.body.appendChild(temp);
        const computed = getComputedStyle(temp).color;
        document.body.removeChild(temp);
        if (computed && !UNSUPPORTED_COLOR_RE.test(computed)) {
            return computed;
        }
    } catch {
        // Fall through to generic fallback
    }
    return "rgb(128, 128, 128)";
}

/**
 * Monkey-patches window.getComputedStyle so that any oklch()/lab() values
 * returned by the browser are transparently replaced with rgb() equivalents.
 * Returns a cleanup function that restores the original implementation.
 *
 * Note: CSSStyleDeclaration properties must be accessed via target[prop]
 * NOT Reflect.get(target, prop, receiver) — the latter causes "Illegal invocation"
 * because CSSStyleDeclaration getters are bound to the native object.
 */
function patchGetComputedStyle(): () => void {
    const original = window.getComputedStyle;
    const colorCache = new Map<string, string>();

    window.getComputedStyle = function (el: Element, pseudoElt?: string | null) {
        const style = original.call(window, el, pseudoElt);
        return new Proxy(style, {
            get(target, prop) {
                // Access via bracket notation to preserve correct `this` binding
                const value = target[prop as keyof CSSStyleDeclaration];

                // Only intercept string property reads that contain unsupported functions
                if (typeof value === "string" && UNSUPPORTED_COLOR_RE.test(value)) {
                    return value.replace(UNSUPPORTED_COLOR_RE, (match) => {
                        if (colorCache.has(match)) return colorCache.get(match)!;
                        const resolved = resolveColorToRgb(match);
                        colorCache.set(match, resolved);
                        return resolved;
                    });
                }
                // For methods (e.g. getPropertyValue), bind to the original target
                if (typeof value === "function") {
                    return value.bind(target);
                }
                return value;
            },
        });
    } as typeof window.getComputedStyle;

    return () => {
        window.getComputedStyle = original;
    };
}

/**
 * Generates a multi-page PDF from a list of element IDs.
 * Each element in the list will be rendered on a new page.
 *
 * Handles two html2canvas compatibility issues:
 * 1. Off-screen elements (left:-9999px) → temporarily repositioned for capture.
 * 2. Tailwind v4 oklch()/lab() colors → monkey-patched to rgb() during capture.
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

    // Find the off-screen wrapper that holds the report pages
    const reportWrapper = document.getElementById(elementIds[0])?.parentElement;

    // --- Step 1: Bring report wrapper on-screen ---
    let wrapperWasMoved = false;
    const origStyle: Partial<CSSStyleDeclaration> = {};

    if (reportWrapper) {
        const rs = reportWrapper.style;
        origStyle.position = rs.position;
        origStyle.left = rs.left;
        origStyle.top = rs.top;
        origStyle.zIndex = rs.zIndex;
        origStyle.visibility = rs.visibility;
        origStyle.pointerEvents = rs.pointerEvents;
        origStyle.opacity = rs.opacity;

        rs.position = "fixed";
        rs.left = "0";
        rs.top = "0";
        rs.zIndex = "-9999";
        rs.visibility = "visible";
        rs.pointerEvents = "none";
        rs.opacity = "1";
        wrapperWasMoved = true;

        // Give the browser time to reflow & render Recharts SVGs
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
        await new Promise((r) => setTimeout(r, 600));
    }

    // --- Step 2: Patch getComputedStyle for oklch/lab compat ---
    const restoreComputedStyle = patchGetComputedStyle();

    try {
        for (let i = 0; i < elementIds.length; i++) {
            const elementId = elementIds[i];
            const element = document.getElementById(elementId);

            if (!element) {
                console.error(`[pdfExport] Element #${elementId} not found`);
                continue;
            }

            if (i > 0) {
                pdf.addPage();
            }

            try {
                const canvas = await html2canvas(element, {
                    scale: 2,
                    useCORS: true,
                    backgroundColor: "#0b1120",
                    logging: false,
                    width: element.scrollWidth,
                    height: element.scrollHeight,
                });

                const imgData = canvas.toDataURL("image/png");
                const imgWidth = canvas.width;
                const imgHeight = canvas.height;

                const ratio = Math.min(pageWidth / imgWidth, pageHeight / imgHeight);
                const displayWidth = imgWidth * ratio;
                const displayHeight = imgHeight * ratio;

                const xOffset = (pageWidth - displayWidth) / 2;
                const yOffset = 20;

                pdf.addImage(imgData, "PNG", xOffset, yOffset, displayWidth, displayHeight);
            } catch (error) {
                console.error(`[pdfExport] Error capturing #${elementId}:`, error);
            }
        }

        pdf.save(filename);
    } finally {
        // --- Cleanup: restore everything ---
        restoreComputedStyle();

        if (wrapperWasMoved && reportWrapper) {
            const rs = reportWrapper.style;
            rs.position = origStyle.position ?? "";
            rs.left = origStyle.left ?? "";
            rs.top = origStyle.top ?? "";
            rs.zIndex = origStyle.zIndex ?? "";
            rs.visibility = origStyle.visibility ?? "";
            rs.pointerEvents = origStyle.pointerEvents ?? "";
            rs.opacity = origStyle.opacity ?? "";
        }
    }
}
