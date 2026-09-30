import { NextRequest, NextResponse } from "next/server";
import { readSettings, writeSettings } from "@/lib/db";

export async function GET() {
  const settings = readSettings();
  return NextResponse.json(settings);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const updated = writeSettings(body);
    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to save settings" },
      { status: 500 }
    );
  }
}
