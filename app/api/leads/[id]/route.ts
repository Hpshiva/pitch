import { NextRequest, NextResponse } from "next/server";
import { getLeadById, updateLead, deleteLead, readActivities, logActivity } from "@/lib/db";
import { LeadStatus } from "@/lib/types";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const lead = getLeadById(id);
  if (!lead) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  const activities = readActivities(id);
  return NextResponse.json({ lead, activities });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const current = getLeadById(id);
  if (!current) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }

  try {
    const body = await req.json();
    const updated = updateLead(id, body);

    // Automatic activity logging based on what changed
    if (body.status && body.status !== current.status) {
      logActivity(
        id,
        "STATUS_CHANGED",
        `Status updated from ${current.status} to ${body.status}`,
        body.notes ? `Note: ${body.notes}` : undefined
      );
    }
    if (body.contactedAt && body.contactedAt !== current.contactedAt) {
      logActivity(id, "CONTACTED", `Outreach sent via ${body.contactMethod || "WhatsApp/Email"}`);
    }
    if (body.nextFollowUpAt && body.nextFollowUpAt !== current.nextFollowUpAt) {
      logActivity(id, "FOLLOW_UP_SCHEDULED", `Follow-up scheduled for ${body.nextFollowUpAt.slice(0, 10)}`);
    }
    if (body.demoStatus && body.demoStatus !== current.demoStatus) {
      logActivity(id, "DEMO_UPDATED", `Demo status set to ${body.demoStatus}`, body.demoUrl ? `URL: ${body.demoUrl}` : undefined);
    }
    if (body.analysis && !current.analysis) {
      logActivity(id, "ANALYZED", `Website analyzed. Score: ${body.analysis.basicScore}/100`);
    }
    if (body.pitch && !current.pitch) {
      logActivity(id, "PITCH_GENERATED", `Personalized pitch generated using ${body.pitch.engine}`);
    }

    return NextResponse.json(updated);
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to update lead" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const success = deleteLead(id);
  if (!success) {
    return NextResponse.json({ error: "Lead not found" }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}
