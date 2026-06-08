import { NextRequest, NextResponse } from "next/server";
import { generateAnalysis, type AnalysisRequest } from "@/lib/gemini";

// --- In-memory rate limiting ---
const RATE_LIMIT_MAX = 10;
const RATE_LIMIT_WINDOW_MS = 60_000; // 60 seconds
const rateLimitMap = new Map<string, { count: number; timestamp: number }>();

const VALID_TYPES = new Set([
    "dashboard_summary",
    "cbam_result",
    "regulation_explainer",
    "strategy_optimizer",
    "yolo_optimizer",
]);

const MAX_PAYLOAD_SIZE = 50_000; // 50 KB

/** Strip control characters (U+0000–U+001F except \t \n \r) from all string values */
function stripControlChars(obj: Record<string, unknown>): Record<string, unknown> {
    const cleaned: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(obj)) {
        if (typeof value === "string") {
            cleaned[key] = value.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "");
        } else if (value !== null && typeof value === "object" && !Array.isArray(value)) {
            cleaned[key] = stripControlChars(value as Record<string, unknown>);
        } else if (Array.isArray(value)) {
            cleaned[key] = value.map((v) =>
                v !== null && typeof v === "object"
                    ? stripControlChars(v as Record<string, unknown>)
                    : typeof v === "string"
                        ? v.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g, "")
                        : v
            );
        } else {
            cleaned[key] = value;
        }
    }
    return cleaned;
}

// Dev mode: skip aggressive rate limiting for localhost or single anonymous user
const isDev = process.env.NODE_ENV === "development";

export async function POST(request: NextRequest) {
    // --- Rate limiting ---
    const forwarded = request.headers.get("x-forwarded-for");
    const ip = forwarded || request.headers.get("x-real-ip") || "anonymous";
    const now = Date.now();
    const entry = rateLimitMap.get(ip);

    // In dev mode, use a higher limit (100 req/min) to avoid blocking single dev users
    const effectiveMax = forwarded || ip !== "anonymous" ? RATE_LIMIT_MAX : isDev ? 100 : RATE_LIMIT_MAX;

    if (entry) {
        if (now - entry.timestamp > RATE_LIMIT_WINDOW_MS) {
            rateLimitMap.set(ip, { count: 1, timestamp: now });
        } else if (entry.count >= effectiveMax) {
            return NextResponse.json(
                { error: "Rate limit exceeded. Please wait before making more requests." },
                { status: 429 }
            );
        } else {
            entry.count += 1;
        }
    } else {
        rateLimitMap.set(ip, { count: 1, timestamp: now });
    }

    try {
        const body: AnalysisRequest = await request.json();

        if (!body.type || !body.data) {
            return NextResponse.json(
                { error: "Missing required fields: type, data" },
                { status: 400 }
            );
        }

        // --- Validate type ---
        if (!VALID_TYPES.has(body.type)) {
            return NextResponse.json(
                { error: `Invalid analysis type: ${body.type}` },
                { status: 400 }
            );
        }

        // --- Validate payload size ---
        if (JSON.stringify(body.data).length > MAX_PAYLOAD_SIZE) {
            return NextResponse.json(
                { error: "Payload too large. Maximum data size is 10 KB." },
                { status: 400 }
            );
        }

        // --- Strip control characters ---
        const sanitizedData = stripControlChars(body.data);
        const sanitizedBody: AnalysisRequest = { ...body, data: sanitizedData };

        const analysis = await generateAnalysis(sanitizedBody);
        return NextResponse.json({ analysis });

    } catch (error) {
        console.error("Gemini API error:", error);
        return NextResponse.json(
            { error: "Failed to generate analysis. Please try again." },
            { status: 500 }
        );
    }
}
