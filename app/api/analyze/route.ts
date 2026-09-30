import { NextRequest, NextResponse } from "next/server";
import { analyzeWebsite, scoreLead } from "@/lib/analyze";

export async function POST(req: NextRequest) {
  try {
    const lead = await req.json();
    const website = lead.website ? String(lead.website).trim() : "";
    const analysis = await analyzeWebsite(website);
    const score = scoreLead(lead, analysis);
    return NextResponse.json({ analysis, score });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to analyze website" },
      { status: 500 }
    );
  }
}
