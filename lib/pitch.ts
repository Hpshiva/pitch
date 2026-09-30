import { Lead, PitchPack, PitchOptions, UserSettings } from "./types";
import { readSettings } from "./db";

export function getCategoryDemoSections(category: string): string[] {
  const cat = (category || "").toLowerCase();
  if (cat.includes("dental") || cat.includes("dentist") || cat.includes("orthodont")) {
    return [
      "Hero Section (Doctor Credentials & Clinic Welcome)",
      "High-Value Treatments (Implants, Veneers, Invisalign)",
      "Doctor Profile & Certifications",
      "Patient Reviews & Social Proof",
      "Before & After Case Gallery",
      "Direct 1-Click WhatsApp Enquiry Button",
      "Online Appointment Booking Journey",
      "Interactive Location Map & Clinic Timings"
    ];
  }
  if (cat.includes("cafe") || cat.includes("coffee") || cat.includes("bakery")) {
    return [
      "Hero with Signature Brews & Atmosphere",
      "Curated Food & Drink Menu (Categorized)",
      "Signature Specialties & Roastery Highlights",
      "Instagram Live Gallery & Aesthetic Showcase",
      "Customer Reviews & Rating Highlights",
      "Instant WhatsApp Table Reservation / Pre-order",
      "Opening Hours, Parking Info & Location Map"
    ];
  }
  if (cat.includes("restaurant") || cat.includes("dining") || cat.includes("bistro")) {
    return [
      "Hero with Ambiance & Chef Signature Dishes",
      "Interactive Digital Menu with Dietary Filters",
      "Online Table Booking & WhatsApp Concierge",
      "Google Reviews & Press Recognition",
      "Private Dining & Events Enquiry Form",
      "Hours, Valet / Parking & Google Maps Directions"
    ];
  }
  if (cat.includes("aesthetic") || cat.includes("cosmetic") || cat.includes("dermatology")) {
    return [
      "Hero with Specialist Doctor Credentials",
      "Treatment Menu (Injectables, Skin Therapy, Lasers)",
      "Doctor Profiles & Clinical Expertise",
      "Confidential Consultation Booking Journey",
      "Patient Testimonials & Clinical Standards",
      "Discreet WhatsApp Consultation Line",
      "Clinic Tour & Location Details"
    ];
  }
  if (cat.includes("salon") || cat.includes("spa") || cat.includes("barber")) {
    return [
      "Hero with Salon Aesthetic & Styling Portfolio",
      "Service Menu with Transparent Pricing",
      "Senior Stylists / Therapists Directory",
      "Instant 1-Click WhatsApp Booking",
      "Client Transformations & Reviews",
      "VIP Memberships & Package Offers",
      "Location Map & Easy Parking Guide"
    ];
  }
  if (cat.includes("gym") || cat.includes("fitness") || cat.includes("crossfit")) {
    return [
      "Hero with Dynamic Gym Energy & Free Trial CTA",
      "Membership Plans & Flexible Passes",
      "Class Schedule & Timetable Filter",
      "Certified Personal Trainers Roster",
      "Member Success Stories & Transformations",
      "WhatsApp Instant Join / Pass Request",
      "Facility Showcase & Location Details"
    ];
  }
  if (cat.includes("real estate") || cat.includes("properties")) {
    return [
      "Hero with Featured Premium Listings",
      "Property Search by Area & Budget",
      "Neighborhood Guides & Market Insights",
      "Agent Trust Signals & Transaction Record",
      "WhatsApp Direct Broker Connect",
      "VIP Buyer Consultation Booking"
    ];
  }
  if (cat.includes("law") || cat.includes("legal") || cat.includes("attorney")) {
    return [
      "Hero with Firm Reputation & Practice Areas",
      "Specialized Legal Practice Profiles",
      "Senior Partner & Attorney Credentials",
      "Confidential Case Assessment Form",
      "Client Testimonials & Industry Recognition",
      "Direct WhatsApp / Call Line for Urgent Consultations"
    ];
  }
  return [
    "Hero Section with Core Value Proposition",
    "Services & Products Showcase",
    "Client Trust & Google Review Badges",
    "Direct WhatsApp / Call Contact Buttons",
    "Customer Enquiry Form",
    "Interactive Location Map & Business Hours"
  ];
}

export function buildDeterministicPitch(
  lead: Lead,
  options?: PitchOptions,
  settings?: UserSettings
): PitchPack {
  const user = settings || readSettings();
  const tone = options?.tone || user.defaultTone || "friendly";
  const target = options?.target || "receptionist";
  const cat = (options?.category || lead.category || "Local Business").toLowerCase();

  const isDental = /dental|dentist|orthodont|implant/i.test(`${cat} ${(lead.services || []).join(" ")}`);
  const isCafe = /cafe|coffee|roaster|bakery/i.test(`${cat} ${(lead.services || []).join(" ")}`);
  const isRestaurant = /restaurant|dining|kitchen|bistro/i.test(`${cat} ${(lead.services || []).join(" ")}`);
  const isClinic = /aesthetic|cosmetic|clinic|medical|dermatolog/i.test(`${cat} ${(lead.services || []).join(" ")}`);
  const isSalon = /salon|spa|barber/i.test(`${cat} ${(lead.services || []).join(" ")}`);

  const bizName = lead.businessName || "your team";
  const locationPhrase = lead.area ? `in ${lead.area}` : lead.city ? `in ${lead.city}` : "";
  const ratingNotice = lead.rating && lead.rating >= 4.5 ? `love the ${lead.rating}★ rating on Google` : "";

  // Category specific value propositions
  let nicheValue = "focused on your brand, customer journey, and making it effortless for clients to reach you";
  let highTicketMention = "";
  if (isDental) {
    nicheValue = "designed to highlight your top treatments (implants, veneers, cosmetic dentistry), showcase doctor trust, and capture high-intent patient bookings directly on WhatsApp";
    highTicketMention = "treatment discovery & patient trust";
  } else if (isCafe || isRestaurant) {
    nicheValue = "showcasing your signature menu, vibe, and making it 1-tap easy for customers to reserve a table or order on WhatsApp";
    highTicketMention = "table reservations & signature menu highlights";
  } else if (isClinic) {
    nicheValue = "focused on patient trust, specialist doctor credibility, and confidential consultation booking";
    highTicketMention = "consultation conversion & treatments";
  } else if (isSalon) {
    nicheValue = "showcasing your styling portfolio, transparent service menu, and 1-click WhatsApp appointment booking";
    highTicketMention = "instant stylist bookings & service showcase";
  }

  // Target greeting
  let targetIntro = `Hi ${bizName} team 👋`;
  let forwardAsk = `Could you please share this with the owner or practice manager?`;
  if (target === "owner") {
    targetIntro = `Hi ${bizName} team 👋 Hope you're doing well.`;
    forwardAsk = `I'd love to share the live concept preview with you.`;
  } else if (target === "manager") {
    targetIntro = `Hi ${bizName} management team 👋`;
    forwardAsk = `Could you please review this with the manager?`;
  } else if (target === "marketing") {
    targetIntro = `Hi ${bizName} marketing team 👋`;
    forwardAsk = `Would love to share this digital concept with your marketing lead.`;
  }

  // Tones
  let whatsapp = "";
  if (tone === "short") {
    whatsapp = `${targetIntro}

I noticed ${bizName}${locationPhrase ? ` ${locationPhrase}` : ""}${ratingNotice ? ` (${ratingNotice})` : ""}.

I'm a local frontend developer and I built a FREE custom website concept for ${bizName} — ${nicheValue}.

There is completely zero payment or commitment to see it.
${forwardAsk} I'm happy to send the preview link right here.`;
  } else if (tone === "professional") {
    whatsapp = `${targetIntro}

I came across ${bizName}${locationPhrase ? ` ${locationPhrase}` : ""}${ratingNotice ? ` and noticed your strong Google reviews` : ""}.

As a web specialist, I've created a complimentary, interactive website demonstration tailored for ${bizName}, ${nicheValue}.

There is no cost, invoice, or obligation involved. The goal is simply to showcase how a high-converting digital presence can drive more enquiries to your team.

${forwardAsk} I would be glad to share the preview link for feedback.`;
  } else if (tone === "premium") {
    whatsapp = `${targetIntro}

Congratulations on the strong reputation ${bizName} has built${locationPhrase ? ` ${locationPhrase}` : ""}.

To match your premium standard, I've designed an exclusive, high-performance website concept specifically for ${bizName} — ${nicheValue}.

Viewing the concept is completely free of charge with zero obligation.

${forwardAsk} I would be delighted to provide the preview link for you to explore.`;
  } else {
    // friendly (default)
    whatsapp = `${targetIntro}

I came across ${bizName}${locationPhrase ? ` ${locationPhrase}` : ""}${ratingNotice ? ` — impressive reviews!` : ""} and had an idea for your digital presence.

I'm a frontend developer and I'd love to share a FREE custom website concept I prepared for ${bizName} — ${nicheValue}.

There is absolutely no payment or commitment to see it.
${forwardAsk} I'd love to send over the link! ${isDental ? "🦷✨" : isCafe ? "☕✨" : "🚀"}`;
  }

  // Email Subject & Body
  const emailSubject = isDental
    ? `Complimentary website concept for ${bizName} — high-intent patient enquiries`
    : isCafe || isRestaurant
    ? `Free interactive website demo for ${bizName} — menu & reservations`
    : `A complimentary custom website concept for ${bizName}`;

  const email = `Hi ${bizName} team,

I hope this note finds you well.

I came across ${bizName}${locationPhrase ? ` ${locationPhrase}` : ""}${ratingNotice ? ` and was impressed by your reviews and client feedback` : ""}.

I am a frontend developer specializing in building modern, high-converting web experiences for local businesses. To demonstrate what is possible for ${bizName}, I've put together a complimentary, custom interactive website concept ${nicheValue}.

Key highlights included in the concept:
• Fast mobile-first experience with zero clutter
• Prominent 1-click WhatsApp and call conversion channels
• ${highTicketMention || "Clear service presentation and customer trust badges"}
• Optimized Google search visibility structure

There is no cost, payment, or commitment required to view the concept. I'd simply welcome the opportunity to share the preview link with the owner or manager.

If this sounds interesting, please reply to this email or reach me on WhatsApp at ${user.userWhatsApp || "this number"}.

Warm regards,

${user.userName}
${user.userRole}${user.agencyName ? `\n${user.agencyName}` : ""}${user.portfolioUrl ? `\n${user.portfolioUrl}` : ""}`;

  // Follow-ups
  const followUp1 = `Hi ${bizName} team 👋 Just following up on my note from a few days ago regarding the free custom website concept for ${bizName}.

I've put together a live preview showing how ${bizName} can capture more direct WhatsApp enquiries and bookings. Completely free with zero commitment to see it.

Could you please let the owner or manager know? Happy to send the link whenever convenient!`;

  const followUp2 = `Hi ${bizName} team 👋 Final polite follow-up from me!

If the team is open to seeing the free website demonstration I put together for ${bizName}, I'd be delighted to share the link. If the timing isn't right, no problem at all and I wish ${bizName} continued success!`;

  // Sales angle
  const angle = isDental
    ? `Angle: Patient Trust & High-Ticket Treatment Discovery. Frame the demo around turning Google Maps searchers into WhatsApp dental consultations (implants, veneers, Invisalign). Emphasize that patients choose clinics with modern mobile UX and verified doctor credibility.`
    : isCafe || isRestaurant
    ? `Angle: Sensory Menu Showcase & Table Reservations. Frame around capturing hungry visitors searching Maps and Instagram, guiding them directly to signature items and instant table booking via WhatsApp.`
    : `Angle: Commercial Conversion Gap. The business already has demand and positive reputation on Google, but lacks an optimized digital funnel. Frame the free demo as a risk-free way to capture enquiries competitors might otherwise get.`;

  return {
    whatsapp,
    emailSubject,
    email,
    followUp1,
    followUp2,
    angle,
    suggestedDemoSections: getCategoryDemoSections(lead.category),
    engine: "Built-in Free Template Engine",
    toneUsed: tone,
    targetUsed: target
  };
}

export async function generatePitch(
  lead: Lead,
  options?: PitchOptions
): Promise<PitchPack> {
  const settings = readSettings();
  const ollamaUrl = settings.ollamaUrl || process.env.OLLAMA_URL || "http://127.0.0.1:11434";
  const model = settings.ollamaModel || process.env.OLLAMA_MODEL || "qwen3:8b";
  const tone = options?.tone || settings.defaultTone || "friendly";
  const target = options?.target || "receptionist";

  // Check if Ollama is accessible with a fast ping (1.5 seconds)
  let ollamaAvailable = false;
  try {
    const pingRes = await fetch(`${ollamaUrl}/api/tags`, {
      method: "GET",
      signal: AbortSignal.timeout(1500)
    });
    if (pingRes.ok) ollamaAvailable = true;
  } catch {
    ollamaAvailable = false;
  }

  if (!ollamaAvailable) {
    return buildDeterministicPitch(lead, options, settings);
  }

  // Construct structured prompt for local Ollama
  const prompt = `You are a respectful B2B outreach specialist for an independent web developer (${settings.userName}, ${settings.userRole}).
Generate personalized, high-converting outreach for the following local business.

CRITICAL RULES:
1. NEVER insult the business or say "your website is bad".
2. Keep the WhatsApp message concise, respectful, and easy for front-desk/reception to forward to the owner or manager.
3. Explicitly state that the custom website concept/demo is 100% FREE with NO payment and NO commitment to view.
4. Target recipient: ${target.toUpperCase()}.
5. Tone: ${tone.toUpperCase()}.
6. Highlight industry-specific value (e.g. for dental: patient trust, implants/veneers, WhatsApp booking; for cafe: menu, reservations; for other: conversions).
7. Return ONLY valid JSON format.

Lead Details:
- Business: ${lead.businessName}
- Category: ${lead.category}
- City: ${lead.city}, Area: ${lead.area}
- Google Rating: ${lead.rating || "N/A"} (${lead.reviews || 0} reviews)
- Website: ${lead.website || "None"} (Status: ${lead.websiteStatus})
- Services: ${(lead.services || []).join(", ") || "Standard services"}
- Buying Signals: ${(lead.buyingSignals || []).join(", ") || "Active local presence"}
- Commercial Score: ${lead.score?.total || "N/A"}/55 (Priority ${lead.score?.priority || "N/A"})

Return a JSON object with EXACT keys:
{
  "whatsapp": "string",
  "emailSubject": "string",
  "email": "string",
  "followUp1": "string",
  "followUp2": "string",
  "angle": "string"
}`;

  try {
    const res = await fetch(`${ollamaUrl}/api/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        prompt,
        stream: false,
        format: "json",
        options: { temperature: 0.7 }
      }),
      signal: AbortSignal.timeout(40000)
    });

    if (!res.ok) {
      return buildDeterministicPitch(lead, options, settings);
    }

    const data = await res.json();
    const parsed = JSON.parse(data.response);

    if (parsed.whatsapp && parsed.email && parsed.emailSubject) {
      return {
        whatsapp: parsed.whatsapp,
        emailSubject: parsed.emailSubject,
        email: parsed.email,
        followUp1: parsed.followUp1 || parsed.followup1 || "",
        followUp2: parsed.followUp2 || parsed.followup2 || "",
        angle: parsed.angle || "Highlight customer trust and zero-friction booking channels.",
        suggestedDemoSections: getCategoryDemoSections(lead.category),
        engine: "Local Ollama",
        modelUsed: model,
        toneUsed: tone,
        targetUsed: target
      };
    }
    return buildDeterministicPitch(lead, options, settings);
  } catch {
    // If Ollama fails or times out, seamlessly return deterministic template
    return buildDeterministicPitch(lead, options, settings);
  }
}
