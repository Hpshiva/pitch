import { NextRequest, NextResponse } from "next/server";
import { readLeads, writeLeads, restoreDatabaseBackup, logActivity } from "@/lib/db";
import { parseCsvToLeads } from "@/lib/csv";
import { Lead } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("application/json")) {
      const data = await req.json();
      // Check if it's a full backup
      if (data.version && data.leads) {
        const result = restoreDatabaseBackup(data);
        return NextResponse.json({
          message: `Successfully restored database with ${result.leadCount} leads.`,
          count: result.leadCount
        });
      }

      // Check if it's an array of leads
      if (Array.isArray(data)) {
        const existing = readLeads();
        const merged = [...data, ...existing];
        writeLeads(merged);
        return NextResponse.json({
          message: `Imported ${data.length} leads successfully.`,
          count: data.length
        });
      }
    }

    // Handle plain text CSV or multipart
    const rawText = await req.text();
    const parsed = parseCsvToLeads(rawText);

    if (parsed.length === 0) {
      return NextResponse.json(
        { error: "No valid lead records found in the uploaded CSV." },
        { status: 400 }
      );
    }

    const existing = readLeads();
    const newLeads = parsed as Lead[];
    const merged = [...newLeads, ...existing];
    writeLeads(merged);

    newLeads.forEach(l => {
      logActivity(l.id, "LEAD_CREATED", `Imported ${l.businessName} via CSV`);
    });

    return NextResponse.json({
      message: `Successfully imported ${newLeads.length} leads from CSV.`,
      count: newLeads.length
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error?.message || "Failed to process import file" },
      { status: 500 }
    );
  }
}
