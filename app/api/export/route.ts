import { NextRequest, NextResponse } from "next/server";
import { readLeads, createDatabaseBackup } from "@/lib/db";
import { leadsToCsv } from "@/lib/csv";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "csv";
  const dateStr = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    const backup = createDatabaseBackup();
    return new NextResponse(JSON.stringify(backup, null, 2), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Content-Disposition": `attachment; filename="lead-engine-backup-${dateStr}.json"`
      }
    });
  }

  // Default to CSV
  const leads = readLeads();
  const csv = leadsToCsv(leads);
  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="leads-export-${dateStr}.csv"`
    }
  });
}
