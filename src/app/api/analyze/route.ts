import { NextRequest, NextResponse } from "next/server";
import { generateAnalysis, type AnalysisRequest } from "@/lib/gemini";

export async function POST(request: NextRequest) {
    try {
        const body: AnalysisRequest = await request.json();

        if (!body.type || !body.data) {
            return NextResponse.json(
                { error: "Missing required fields: type, data" },
                { status: 400 }
            );
        }

        const analysis = await generateAnalysis(body);
        return NextResponse.json({ analysis });

    } catch (error) {
        console.error("Gemini API error:", error);
        return NextResponse.json(
            { error: "Failed to generate analysis. Please try again." },
            { status: 500 }
        );
    }
}
