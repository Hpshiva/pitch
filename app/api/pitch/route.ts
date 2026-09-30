import { NextRequest, NextResponse } from "next/server";
import { generatePitch } from "@/lib/pitch";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { lead, options } = body.lead ? body : { lead: body, options: undefined };
    const pitch = await generatePitch(lead, options);
    return NextResponse.json(pitch);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to generate pitch" },
      { status: 500 }
    );
  }
}
