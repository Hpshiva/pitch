import { Lead, LeadStatus, WebsiteStatus } from "./types";

function escapeCsvField(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val);
  if (str.includes('"') || str.includes(',') || str.includes('\n') || str.includes('\r')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return `"${str}"`;
}

export function leadsToCsv(leads: Lead[]): string {
  const headers = [
    "ID",
    "Business Name",
    "Category",
    "City",
    "Area",
    "Country",
    "Rating",
    "Reviews",
    "Phone",
    "WhatsApp",
    "Email",
    "Website",
    "Instagram",
    "Facebook",
    "Services",
    "Branches",
    "Website Status",
    "Website Score",
    "Priority",
    "Commercial Score",
    "Buying Signal",
    "CRM Status",
    "Contacted Date",
    "Next Follow-up",
    "Demo Status",
    "Demo URL",
    "Deal Value",
    "Notes",
    "Maps URL",
    "Created At"
  ];

  const rows = leads.map(l => [
    escapeCsvField(l.id),
    escapeCsvField(l.businessName),
    escapeCsvField(l.category),
    escapeCsvField(l.city),
    escapeCsvField(l.area),
    escapeCsvField(l.country || ""),
    escapeCsvField(l.rating ?? ""),
    escapeCsvField(l.reviews ?? ""),
    escapeCsvField(l.phone),
    escapeCsvField(l.whatsapp),
    escapeCsvField(l.email),
    escapeCsvField(l.website),
    escapeCsvField(l.instagram),
    escapeCsvField(l.facebook),
    escapeCsvField((l.services || []).join("; ")),
    escapeCsvField(l.branches ?? 1),
    escapeCsvField(l.websiteStatus),
    escapeCsvField(l.analysis?.basicScore ?? ""),
    escapeCsvField(l.score?.priority ?? ""),
    escapeCsvField(l.score?.total ?? ""),
    escapeCsvField(l.score?.buyingSignal ?? ""),
    escapeCsvField(l.status),
    escapeCsvField(l.contactedAt ?? ""),
    escapeCsvField(l.nextFollowUpAt ?? ""),
    escapeCsvField(l.demoStatus ?? "NOT_STARTED"),
    escapeCsvField(l.demoUrl ?? ""),
    escapeCsvField(l.dealValue ?? ""),
    escapeCsvField(l.notes ?? ""),
    escapeCsvField(l.mapsUrl ?? ""),
    escapeCsvField(l.createdAt)
  ]);

  return [headers.join(","), ...rows.map(r => r.join(","))].join("\n");
}

export function parseCsvToLeads(csvText: string): Partial<Lead>[] {
  const lines: string[] = [];
  let currentLine = "";
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    if (char === '"') {
      insideQuotes = !insideQuotes;
      currentLine += char;
    } else if ((char === '\n' || char === '\r') && !insideQuotes) {
      if (currentLine.trim()) {
        lines.push(currentLine.trim());
      }
      currentLine = "";
      if (char === '\r' && csvText[i + 1] === '\n') {
        i++;
      }
    } else {
      currentLine += char;
    }
  }
  if (currentLine.trim()) {
    lines.push(currentLine.trim());
  }

  if (lines.length < 2) return [];

  function parseRow(row: string): string[] {
    const fields: string[] = [];
    let field = "";
    let inQuote = false;
    for (let i = 0; i < row.length; i++) {
      const c = row[i];
      if (c === '"') {
        if (inQuote && row[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuote = !inQuote;
        }
      } else if (c === ',' && !inQuote) {
        fields.push(field.trim());
        field = "";
      } else {
        field += c;
      }
    }
    fields.push(field.trim());
    return fields;
  }

  const rawHeaders = parseRow(lines[0]).map(h => h.toLowerCase().replace(/[^a-z0-9]/g, ""));
  const leads: Partial<Lead>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    const lead: Record<string, any> = {};

    rawHeaders.forEach((header, idx) => {
      const val = values[idx] ?? "";
      if (header.includes("name") || header === "businessname") lead.businessName = val;
      else if (header === "category") lead.category = val;
      else if (header === "city") lead.city = val;
      else if (header === "area") lead.area = val;
      else if (header === "country") lead.country = val;
      else if (header === "rating") lead.rating = val ? Number(val) : null;
      else if (header === "reviews") lead.reviews = val ? Number(val) : null;
      else if (header === "phone") lead.phone = val;
      else if (header === "whatsapp") lead.whatsapp = val;
      else if (header === "email") lead.email = val;
      else if (header === "website") lead.website = val;
      else if (header === "instagram") lead.instagram = val;
      else if (header === "facebook") lead.facebook = val;
      else if (header === "services") lead.services = val ? val.split(/[;,]/).map((s: string) => s.trim()).filter(Boolean) : [];
      else if (header === "branches") lead.branches = Number(val || 1);
      else if (header.includes("status") && (header.includes("crm") || header === "status")) lead.status = (val as LeadStatus) || "NEW";
      else if (header === "notes") lead.notes = val;
      else if (header.includes("maps") || header === "mapsurl") lead.mapsUrl = val;
      else if (header.includes("demo") && header.includes("url")) lead.demoUrl = val;
    });

    if (lead.businessName) {
      leads.push({
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        businessName: lead.businessName,
        category: lead.category || "Other",
        country: lead.country || "",
        city: lead.city || "",
        area: lead.area || "",
        mapsUrl: lead.mapsUrl || "",
        rating: lead.rating ?? null,
        reviews: lead.reviews ?? null,
        phone: lead.phone || "",
        whatsapp: lead.whatsapp || "",
        email: lead.email || "",
        website: lead.website || "",
        instagram: lead.instagram || "",
        facebook: lead.facebook || "",
        services: Array.isArray(lead.services) ? lead.services : [],
        branches: Number(lead.branches || 1),
        buyingSignals: [],
        websiteStatus: (lead.website ? "UNKNOWN" : "NONE") as WebsiteStatus,
        status: (lead.status || "NEW") as LeadStatus,
        notes: lead.notes || "",
        demoUrl: lead.demoUrl || ""
      });
    }
  }

  return leads;
}
