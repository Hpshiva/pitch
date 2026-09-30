import { WebsiteAnalysis, Lead, LeadScore, BrokenLinksResult, ScoreReason } from "./types";

function stripTags(html: string) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function analyzeWebsite(url: string): Promise<WebsiteAnalysis> {
  const analyzedAt = new Date().toISOString();

  if (!url || !url.trim()) {
    return {
      reachable: false,
      https: false,
      mobileMeta: false,
      title: false,
      metaDescription: false,
      h1: false,
      favicon: false,
      responsive: false,
      phoneCta: false,
      whatsappCta: false,
      bookingCta: false,
      orderCta: false,
      contactCta: false,
      contactForm: false,
      menuOrServices: false,
      addressDetected: false,
      mapsLink: false,
      socialLinks: [],
      performanceLatencyMs: 0,
      payloadSizeKb: 0,
      accessibilitySignals: { hasLang: false, imageAltRatio: 0, hasAria: false },
      findings: ["No website provided for this business."],
      strengths: [],
      gaps: ["Business has no live website — losing high-intent Google Maps and local search visitors."],
      opportunities: [
        "Create a clean, modern high-converting website showcasing treatments/services and direct WhatsApp bookings.",
        "Capture local search traffic that currently goes to competitors with websites."
      ],
      basicScore: 0,
      analyzedAt
    };
  }

  const startTime = Date.now();
  let normalized = url.trim();
  if (!/^https?:\/\//i.test(normalized)) {
    normalized = `https://${normalized}`;
  }

  try {
    const res = await fetch(normalized, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8"
      },
      signal: AbortSignal.timeout(12000)
    });

    const latency = Date.now() - startTime;
    const finalUrl = res.url || normalized;
    const html = await res.text();
    const payloadKb = Math.round(Buffer.byteLength(html, "utf8") / 1024);
    const text = stripTags(html).toLowerCase();

    // 1. Core Structure & Tags
    const isHttps = new URL(finalUrl).protocol === "https:";
    const hasViewport = /name=["']viewport["']/i.test(html);
    const titleMatch = html.match(/<title[^>]*>([^<]{2,})<\/title>/i);
    const titleText = titleMatch ? titleMatch[1].trim() : undefined;
    const metaDescMatch = html.match(/name=["']description["'][^>]*content=["']([^"']+)["']/i) ||
      html.match(/content=["']([^"']+)["'][^>]*name=["']description["']/i);
    const metaDescText = metaDescMatch ? metaDescMatch[1].trim() : undefined;
    const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
    const h1Text = h1Match ? stripTags(h1Match[1]).slice(0, 80) : undefined;
    const hasFavicon = /rel=["'](?:shortcut )?icon["']/i.test(html);

    // 2. CTAs
    const hasWhatsapp = /wa\.me|api\.whatsapp\.com|whatsapp/i.test(html);
    const hasPhoneCta = /tel:/i.test(html) || /(?:call\s*(?:us|now)|phone|get\s*in\s*touch)/i.test(text);
    const hasBookingCta = /book|appointment|reserve|schedule|consultation/i.test(text);
    const hasOrderCta = /order\s*online|order\s*now|delivery|takeaway|menu/i.test(text);
    const hasContactCta = /contact\s*us|reach\s*us|inquir|get\s*in\s*touch/i.test(text);
    const hasContactForm = /<form\b[^>]*>/i.test(html) && /<input\b/i.test(html);

    // 3. Content & Location Signals
    const hasMenuOrServices = /menu|services|treatments|offerings|packages|specialties/i.test(text);
    const hasAddress = /address|location|villa|floor|tower|street|road|dubai|uae|p\.o\.box|postal/i.test(text) ||
      /itemtype=["']https?:\/\/schema\.org\/(?:PostalAddress|LocalBusiness)/i.test(html);
    const hasMapsLink = /google\.[a-z.]+\/maps|goo\.gl\/maps|maps\.app\.goo\.gl|iframe[^>]+src=["'][^"']*google\.com\/maps/i.test(html);

    // 4. Social Links
    const socialLinks: string[] = [];
    if (/instagram\.com\/[a-zA-Z0-9._-]+/i.test(html)) socialLinks.push("Instagram");
    if (/facebook\.com\/[a-zA-Z0-9._-]+/i.test(html)) socialLinks.push("Facebook");
    if (/linkedin\.com\/(?:company|in)\//i.test(html)) socialLinks.push("LinkedIn");
    if (/tiktok\.com\/@/i.test(html)) socialLinks.push("TikTok");
    if (/youtube\.com\/(?:channel|c|user|@)/i.test(html)) socialLinks.push("YouTube");

    // 5. Accessibility Signals
    const hasLang = /<html[^>]+lang=["'][a-zA-Z]{2,5}["']/i.test(html);
    const imgMatches = html.match(/<img\b[^>]*>/gi) || [];
    let altCount = 0;
    for (const img of imgMatches) {
      if (/alt=["'][^"']*["']/i.test(img)) altCount++;
    }
    const altRatio = imgMatches.length > 0 ? Math.round((altCount / imgMatches.length) * 100) : 100;
    const hasAria = /aria-[a-z]+=["'][^"']+["']/i.test(html);

    // 6. Quick Broken Link Check (sample up to 4 internal links)
    const brokenLinksResult: BrokenLinksResult = { checked: 0, broken: 0, brokenUrls: [] };
    const linkMatches = html.match(/href=["'](\/[a-zA-Z0-9_\-\/]{2,50})["']/gi) || [];
    const uniqueHrefs = [...new Set(linkMatches.map(m => {
      const match = m.match(/href=["']([^"']+)["']/i);
      return match ? match[1] : "";
    }))].filter(h => h && !h.startsWith("//") && !h.includes("#")).slice(0, 4);

    if (uniqueHrefs.length > 0) {
      const baseOrigin = new URL(finalUrl).origin;
      await Promise.all(
        uniqueHrefs.map(async href => {
          try {
            brokenLinksResult.checked++;
            const checkUrl = `${baseOrigin}${href}`;
            const subRes = await fetch(checkUrl, {
              method: "HEAD",
              signal: AbortSignal.timeout(2500),
              headers: { "User-Agent": "Mozilla/5.0" }
            });
            if (subRes.status >= 400) {
              brokenLinksResult.broken++;
              brokenLinksResult.brokenUrls.push(href);
            }
          } catch {
            // Ignore sub-request timeouts
          }
        })
      );
    }

    // 7. Calculate Basic Automated Website Score (0–100)
    const checkItems = [
      { name: "Website reachable", ok: res.ok, weight: 15 },
      { name: "HTTPS security", ok: isHttps, weight: 10 },
      { name: "Mobile viewport", ok: hasViewport, weight: 10 },
      { name: "Page title", ok: Boolean(titleMatch), weight: 8 },
      { name: "Meta description", ok: Boolean(metaDescMatch), weight: 7 },
      { name: "H1 heading", ok: Boolean(h1Match), weight: 6 },
      { name: "WhatsApp CTA", ok: hasWhatsapp, weight: 10 },
      { name: "Phone CTA", ok: hasPhoneCta, weight: 6 },
      { name: "Booking / Appointment CTA", ok: hasBookingCta, weight: 8 },
      { name: "Menu or services section", ok: hasMenuOrServices, weight: 6 },
      { name: "Address / location details", ok: hasAddress, weight: 5 },
      { name: "Social profile links", ok: socialLinks.length > 0, weight: 4 },
      { name: "Contact form", ok: hasContactForm, weight: 5 }
    ];

    let earnedWeight = 0;
    const totalWeight = checkItems.reduce((acc, c) => acc + c.weight, 0);
    const strengths: string[] = [];
    const gaps: string[] = [];

    for (const item of checkItems) {
      if (item.ok) {
        earnedWeight += item.weight;
        strengths.push(item.name);
      } else {
        gaps.push(`Missing / not detected: ${item.name}`);
      }
    }

    const basicScore = Math.min(100, Math.round((earnedWeight / totalWeight) * 100));

    // 8. Generate Specific Commercial Opportunities
    const opportunities: string[] = [];
    if (!hasWhatsapp) {
      opportunities.push("Add a prominent 1-click WhatsApp enquiry button for mobile visitors.");
    }
    if (!hasBookingCta) {
      opportunities.push("Add an online appointment / consultation booking journey to turn visitors into leads.");
    }
    if (!hasViewport) {
      opportunities.push("Fix mobile responsiveness; current viewport signals may hurt mobile search rankings.");
    }
    if (!metaDescMatch) {
      opportunities.push("Optimize Google snippet with targeted local meta description and service keywords.");
    }
    if (socialLinks.length === 0) {
      opportunities.push("Connect active Instagram/social proof directly to website to build client credibility.");
    }
    if (latency > 2500) {
      opportunities.push(`Improve slow response time (currently ${latency}ms) to reduce bounce rate.`);
    }
    if (opportunities.length === 0) {
      opportunities.push("Modernize layout with faster mobile-first UX, video testimonials and higher-converting copy.");
    }

    return {
      reachable: res.ok,
      https: isHttps,
      mobileMeta: hasViewport,
      title: Boolean(titleMatch),
      titleText,
      metaDescription: Boolean(metaDescMatch),
      metaDescriptionText: metaDescText,
      h1: Boolean(h1Match),
      h1Text,
      favicon: hasFavicon,
      responsive: hasViewport,
      phoneCta: hasPhoneCta,
      whatsappCta: hasWhatsapp,
      bookingCta: hasBookingCta,
      orderCta: hasOrderCta,
      contactCta: hasContactCta,
      contactForm: hasContactForm,
      menuOrServices: hasMenuOrServices,
      addressDetected: hasAddress,
      mapsLink: hasMapsLink,
      socialLinks,
      performanceLatencyMs: latency,
      payloadSizeKb: payloadKb,
      accessibilitySignals: {
        hasLang,
        imageAltRatio: altRatio,
        hasAria
      },
      brokenLinks: brokenLinksResult.checked > 0 ? brokenLinksResult : undefined,
      findings: gaps,
      strengths,
      gaps,
      opportunities,
      basicScore,
      analyzedAt
    };
  } catch (error: any) {
    return {
      reachable: false,
      https: false,
      mobileMeta: false,
      title: false,
      metaDescription: false,
      h1: false,
      favicon: false,
      responsive: false,
      phoneCta: false,
      whatsappCta: false,
      bookingCta: false,
      orderCta: false,
      contactCta: false,
      contactForm: false,
      menuOrServices: false,
      addressDetected: false,
      mapsLink: false,
      socialLinks: [],
      performanceLatencyMs: 0,
      payloadSizeKb: 0,
      accessibilitySignals: { hasLang: false, imageAltRatio: 0, hasAria: false },
      findings: [`Could not connect to ${normalized} (${error?.message || "connection failed"}).`],
      strengths: [],
      gaps: ["Website is down, extremely slow, or blocking automated inspection."],
      opportunities: [
        "Present a reliable, fast modern website hosted on a high-speed CDN.",
        "Fix downtime issues costing the business daily prospective clients."
      ],
      basicScore: 0,
      analyzedAt
    };
  }
}

export function scoreLead(lead: Lead, analysis?: WebsiteAnalysis): LeadScore {
  const rating = Number(lead.rating || 0);
  const reviews = Number(lead.reviews || 0);
  const reasons: ScoreReason[] = [];

  // 1. Website Need (0–10)
  let websiteNeed = 0;
  let websiteNeedReason = "";
  if (!lead.website || lead.websiteStatus === "NONE") {
    websiteNeed = 10;
    websiteNeedReason = "No live website detected. Maximum need for an owned digital storefront.";
  } else if (lead.websiteStatus === "NEEDS_IMPROVEMENT" || (analysis && analysis.basicScore < 60)) {
    const score = analysis ? analysis.basicScore : 50;
    websiteNeed = Math.min(10, Math.max(6, Math.round(10 - score / 25)));
    websiteNeedReason = `Existing website has significant gaps (Score: ${score}/100) in mobile, CTAs or speed.`;
  } else if (lead.websiteStatus === "GOOD" || (analysis && analysis.basicScore >= 80)) {
    websiteNeed = 3;
    websiteNeedReason = "Website is already decent; pitch can focus on custom interactive features or redesign.";
  } else {
    websiteNeed = 6;
    websiteNeedReason = "Standard improvement potential identified on website.";
  }
  reasons.push({ category: "Website Need", score: websiteNeed, max: 10, reason: websiteNeedReason });

  // 2. Business Growth Potential (0–10)
  let growthPotential = 4;
  const growthFactors: string[] = ["Base viable local business"];
  if (lead.branches > 1) {
    growthPotential += Math.min(2, lead.branches);
    growthFactors.push(`${lead.branches} branches indicate active expansion`);
  }
  if (lead.instagram || lead.facebook) {
    growthPotential += 2;
    growthFactors.push("Active social media presence proves demand");
  }
  if (lead.services && lead.services.length >= 3) {
    growthPotential += 1;
    growthFactors.push("Multiple commercial service offerings");
  }
  if (lead.buyingSignals && lead.buyingSignals.length >= 2) {
    growthPotential += 1;
    growthFactors.push(`${lead.buyingSignals.length} verified commercial buying signals`);
  }
  growthPotential = Math.min(10, growthPotential);
  reasons.push({
    category: "Business Growth Potential",
    score: growthPotential,
    max: 10,
    reason: growthFactors.join("; ") + "."
  });

  // 3. Online Presence Gap (0–10)
  let onlineGap = 0;
  const gapFactors: string[] = [];
  if (!lead.website || lead.websiteStatus === "NONE") {
    onlineGap += 6;
    gapFactors.push("Complete absence of website despite active business");
  } else if (analysis) {
    if (!analysis.whatsappCta) {
      onlineGap += 2;
      gapFactors.push("No WhatsApp CTA button for mobile users");
    }
    if (!analysis.bookingCta && !analysis.orderCta) {
      onlineGap += 2;
      gapFactors.push("No direct appointment or order booking journey");
    }
    if (!analysis.mobileMeta) {
      onlineGap += 2;
      gapFactors.push("Lacks mobile responsive configuration");
    }
    if (!analysis.metaDescription) {
      onlineGap += 1;
      gapFactors.push("Missing Google search meta description");
    }
  } else {
    onlineGap = 5;
    gapFactors.push("Unoptimized conversion channels identified");
  }
  onlineGap = Math.min(10, Math.max(1, onlineGap));
  reasons.push({
    category: "Online Presence Gap",
    score: onlineGap,
    max: 10,
    reason: gapFactors.length > 0 ? gapFactors.join("; ") + "." : "Minor digital conversion gaps."
  });

  // 4. Google Presence (0–10)
  let googlePresence = 0;
  const googleFactors: string[] = [];
  if (rating > 0) {
    const ratingScore = Math.min(6, (rating / 5) * 6);
    googlePresence += ratingScore;
    googleFactors.push(`${rating}★ rating demonstrates solid client satisfaction`);
  }
  if (reviews > 0) {
    const reviewScore = Math.min(4, Math.round(reviews / 35));
    googlePresence += reviewScore;
    googleFactors.push(`${reviews} Google reviews prove established customer volume`);
  }
  if (googlePresence === 0) {
    googlePresence = 2;
    googleFactors.push("Google presence details not yet verified");
  }
  googlePresence = Math.min(10, Math.round(googlePresence));
  reasons.push({
    category: "Google Presence",
    score: googlePresence,
    max: 10,
    reason: googleFactors.join("; ") + "."
  });

  // 5. Potential Revenue Impact (0–10)
  const isHighTicket = /dental|implant|veneer|invisalign|orthodont|aesthetic|clinic|doctor|law|real estate|auto dealer|plastic surgery|cosmetic/i.test(
    `${lead.category} ${(lead.services || []).join(" ")}`
  );
  let revenueImpact = isHighTicket ? 9 : 6;
  const revFactors: string[] = [isHighTicket ? "High-ticket client value industry" : "Steady-volume consumer business"];
  if (lead.branches > 1) {
    revenueImpact += 1;
    revFactors.push("Multi-location multiplier");
  }
  if (rating >= 4.7 && reviews >= 30) {
    revenueImpact += 1;
    revFactors.push("Strong existing demand accelerates conversion");
  }
  revenueImpact = Math.min(10, revenueImpact);
  reasons.push({
    category: "Potential Revenue Impact",
    score: revenueImpact,
    max: 10,
    reason: revFactors.join("; ") + "."
  });

  // 6. Ease of Contact (0–5)
  let easeOfContact = 0;
  const contactFactors: string[] = [];
  if (lead.whatsapp) {
    easeOfContact += 2;
    contactFactors.push("Direct WhatsApp available");
  } else if (lead.phone) {
    easeOfContact += 2;
    contactFactors.push("Direct phone available");
  }
  if (lead.email) {
    easeOfContact += 1;
    contactFactors.push("Direct email listed");
  }
  if (lead.instagram) {
    easeOfContact += 1;
    contactFactors.push("Instagram DM channel open");
  }
  if (lead.mapsUrl) {
    easeOfContact += 1;
    contactFactors.push("Verified Google Maps listing");
  }
  easeOfContact = Math.min(5, easeOfContact);
  reasons.push({
    category: "Ease of Contact",
    score: easeOfContact,
    max: 5,
    reason: contactFactors.length > 0 ? contactFactors.join("; ") + "." : "No direct contact method entered yet."
  });

  // Total Score (0–55)
  const total = websiteNeed + growthPotential + onlineGap + googlePresence + revenueImpact + easeOfContact;
  const priority: "A" | "B" | "C" = total >= 44 ? "A" : total >= 34 ? "B" : "C";
  const priorityLabel =
    priority === "A"
      ? "High opportunity"
      : priority === "B"
      ? "Moderate opportunity"
      : "Low opportunity";

  const buyingSignal: "Strong" | "Moderate" | "Weak" =
    (lead.buyingSignals && lead.buyingSignals.length >= 3) || (reviews >= 50 && rating >= 4.6 && !lead.website)
      ? "Strong"
      : (lead.buyingSignals && lead.buyingSignals.length >= 1) || (rating >= 4.0 && reviews >= 10)
      ? "Moderate"
      : "Weak";

  return {
    websiteNeed,
    growthPotential,
    onlinePresenceGap: onlineGap,
    googlePresence,
    revenueImpact,
    easeOfContact,
    total,
    priority,
    priorityLabel,
    buyingSignal,
    reasons
  };
}
