import { NextRequest, NextResponse } from "next/server";
import { readLeads, writeLeads, logActivity } from "@/lib/db";
import { Lead, LeadStatus, WebsiteStatus } from "@/lib/types";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const search = url.searchParams.get("search")?.toLowerCase();
  const category = url.searchParams.get("category");
  const priority = url.searchParams.get("priority");
  const status = url.searchParams.get("status");
  const city = url.searchParams.get("city");
  const buyingSignal = url.searchParams.get("buyingSignal");
  const followUpDue = url.searchParams.get("followUpDue"); // "today", "tomorrow", "overdue"

  let leads = readLeads();

  if (search) {
    leads = leads.filter(l =>
      l.businessName.toLowerCase().includes(search) ||
      l.city.toLowerCase().includes(search) ||
      l.area.toLowerCase().includes(search) ||
      l.phone.includes(search) ||
      l.whatsapp.includes(search) ||
      l.email.toLowerCase().includes(search) ||
      l.website.toLowerCase().includes(search)
    );
  }

  if (category && category !== "ALL") {
    leads = leads.filter(l => l.category.toLowerCase() === category.toLowerCase());
  }

  if (priority && priority !== "ALL") {
    leads = leads.filter(l => l.score?.priority === priority);
  }

  if (status && status !== "ALL") {
    leads = leads.filter(l => l.status === status);
  }

  if (city && city !== "ALL") {
    leads = leads.filter(l => l.city.toLowerCase() === city.toLowerCase());
  }

  if (buyingSignal && buyingSignal !== "ALL") {
    leads = leads.filter(l => l.score?.buyingSignal === buyingSignal);
  }

  if (followUpDue) {
    const now = new Date();
    const todayStr = now.toISOString().slice(0, 10);
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    leads = leads.filter(l => {
      if (!l.nextFollowUpAt) return false;
      const fDate = l.nextFollowUpAt.slice(0, 10);
      if (followUpDue === "today") return fDate === todayStr;
      if (followUpDue === "tomorrow") return fDate === tomorrowStr;
      if (followUpDue === "overdue") return fDate < todayStr && !["WON", "LOST", "NOT_A_FIT"].includes(l.status);
      return true;
    });
  }

  return NextResponse.json(leads);
}

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const leads = readLeads();
    const now = new Date().toISOString();

    const lead: Lead = {
      id: crypto.randomUUID(),
      createdAt: now,
      updatedAt: now,
      businessName: payload.businessName?.trim() || "Unnamed Business",
      category: payload.category?.trim() || "Other",
      country: payload.country?.trim() || "",
      city: payload.city?.trim() || "",
      area: payload.area?.trim() || "",
      mapsUrl: payload.mapsUrl?.trim() || "",
      rating: payload.rating ? Number(payload.rating) : null,
      reviews: payload.reviews ? Number(payload.reviews) : null,
      phone: payload.phone?.trim() || "",
      whatsapp: payload.whatsapp?.trim() || "",
      email: payload.email?.trim() || "",
      website: payload.website?.trim() || "",
      instagram: payload.instagram?.trim() || "",
      facebook: payload.facebook?.trim() || "",
      services: Array.isArray(payload.services) ? payload.services : [],
      branches: Number(payload.branches || 1),
      buyingSignals: Array.isArray(payload.buyingSignals) ? payload.buyingSignals : [],
      websiteStatus: (payload.websiteStatus || (payload.website ? "UNKNOWN" : "NONE")) as WebsiteStatus,
      status: (payload.status || "NEW") as LeadStatus,
      notes: payload.notes?.trim() || "",
      analysis: payload.analysis,
      score: payload.score,
      pitch: payload.pitch,
      demoUrl: payload.demoUrl?.trim() || "",
      demoStatus: payload.demoStatus || "NOT_STARTED",
      dealValue: payload.dealValue ? Number(payload.dealValue) : undefined,
      nextFollowUpAt: payload.nextFollowUpAt
    };

    leads.unshift(lead);
    writeLeads(leads);

    logActivity(lead.id, "LEAD_CREATED", `Added ${lead.businessName} (${lead.category}) to lead pipeline`);

    return NextResponse.json(lead, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error?.message || "Failed to create lead" }, { status: 500 });
  }
}
