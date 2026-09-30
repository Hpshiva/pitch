import { NextRequest, NextResponse } from "next/server";
import { parseGoogleMapsBlock } from "@/lib/parser";

export async function POST(req: NextRequest) {
  try {
    const { url, rawText } = await req.json();

    // If user pasted a block of raw text, parse it with our text parser
    if (rawText && typeof rawText === "string") {
      const parsed = parseGoogleMapsBlock(rawText);
      return NextResponse.json({ parsed });
    }

    if (!url || typeof url !== "string") {
      return NextResponse.json({ error: "Maps URL is required." }, { status: 400 });
    }

    const cleanUrl = url.trim();

    // Fetch Google Maps URL with redirect follow
    const res = await fetch(cleanUrl, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
        "Accept-Language": "en-US,en;q=0.9"
      },
      signal: AbortSignal.timeout(12000)
    });

    const finalUrl = res.url || cleanUrl;
    const html = await res.text();

    // 1. Business Name Extraction
    let businessName = "";
    const placeMatch = finalUrl.match(/\/place\/([^\/@?#]+)/);
    if (placeMatch) {
      businessName = decodeURIComponent(placeMatch[1].replace(/\+/g, " ")).trim();
    }
    if (!businessName) {
      const titleMatch =
        html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] ||
        html.match(/<title[^>]*>([^<]+)/i)?.[1] ||
        "";
      businessName = titleMatch.replace(/\s*[-·|]\s*Google Maps.*$/i, "").trim();
    }

    // 2. Coordinates & City / Country Detection
    let city = "Dubai";
    let country = "United Arab Emirates";
    let area = "";
    const coordMatch = finalUrl.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      if (lat >= 24.8 && lat <= 25.5 && lng >= 54.9 && lng <= 55.6) {
        city = "Dubai";
        country = "United Arab Emirates";
      } else if (lat >= 24.1 && lat <= 24.7 && lng >= 54.2 && lng <= 54.8) {
        city = "Abu Dhabi";
        country = "United Arab Emirates";
      } else if (lat >= 25.25 && lat <= 25.45 && lng >= 55.35 && lng <= 55.65) {
        city = "Sharjah";
        country = "United Arab Emirates";
      } else if (lat >= 51.3 && lat <= 51.7 && lng >= -0.5 && lng <= 0.3) {
        city = "London";
        country = "United Kingdom";
      } else if (lat >= 40.5 && lat <= 40.9 && lng >= -74.2 && lng <= -73.7) {
        city = "New York";
        country = "United States";
      } else if (lat >= 1.2 && lat <= 1.5 && lng >= 103.6 && lng <= 104.0) {
        city = "Singapore";
        country = "Singapore";
      } else if (lat >= -34.0 && lat <= -33.6 && lng >= 150.8 && lng <= 151.3) {
        city = "Sydney";
        country = "Australia";
      }
    }

    // 3. Category Detection from name & metadata
    let category = "Local Services";
    const nameLower = businessName.toLowerCase();
    if (/dental|dentist|orthodont|teeth|implant|veneer/i.test(nameLower)) category = "Dental Clinic";
    else if (/aesthetic|cosmetic|dermatolog|skin|botox/i.test(nameLower)) category = "Aesthetic Clinic";
    else if (/clinic|medical|health|doctor|hospital|polyclinic/i.test(nameLower)) category = "Medical Clinic";
    else if (/coffee|roaster|espresso|barista/i.test(nameLower)) category = "Coffee Shop";
    else if (/cafe|café|bakery|bistro/i.test(nameLower)) category = "Cafe";
    else if (/restaurant|dining|kitchen|grill|pizzeria|sushi/i.test(nameLower)) category = "Restaurant";
    else if (/salon|barber|hair|lashes|nail/i.test(nameLower)) category = "Salon";
    else if (/spa|massage|wellness/i.test(nameLower)) category = "Spa";
    else if (/gym|fitness|crossfit|workout/i.test(nameLower)) category = "Gym";
    else if (/auto\s*repair|car\s*service|garage|mechanic/i.test(nameLower)) category = "Auto Service";
    else if (/car\s*dealer|automotive|motors/i.test(nameLower)) category = "Auto Dealer";
    else if (/real\s*estate|properties|realty|broker/i.test(nameLower)) category = "Real Estate";
    else if (/hotel|resort|suites/i.test(nameLower)) category = "Hotel";
    else if (/law\s*firm|lawyer|advocate|attorney|legal/i.test(nameLower)) category = "Law Firm";

    // 4. Rating & Reviews in HTML or Description
    let rating: number | null = null;
    let reviews: number | null = null;

    const ratingReviewMatch =
      html.match(/aria-label="([1-5]\.[0-9])\s*stars(?:\s*,?\s*(\d[\d,]*)\s*reviews?)?"/i) ||
      html.match(/\b([1-5]\.[0-9])\s*(?:★|stars?|\*)\s*\(?(\d[\d,]*)\s*(?:Google\s*)?reviews?\)?/i) ||
      html.match(/\[null,null,\[([1-5]\.[0-9]),(\d+)/);

    if (ratingReviewMatch) {
      rating = parseFloat(ratingReviewMatch[1]);
      if (ratingReviewMatch[2]) {
        reviews = parseInt(ratingReviewMatch[2].replace(/,/g, ""), 10);
      }
    }

    // 5. Phone Detection from HTML
    const phoneCandidates = [
      ...new Set(
        (html.match(/(?:\+?\d{1,4}[\s-]?)?\(?\d{2,4}\)?[\s-]?\d{3,4}[\s-]?\d{3,4}/g) || [])
          .map(x => x.replace(/\s+/g, " ").trim())
          .filter(p => {
            if (p.includes(".")) return false;
            const clean = p.replace(/\D/g, "");
            return clean.length >= 8 && clean.length <= 15 && !clean.startsWith("202") && !clean.startsWith("201") && !clean.startsWith("144");
          })
          .slice(0, 3)
      )
    ];
    let phone = phoneCandidates[0] || "";

    // 6. External Website Lookup (Zero-API DuckDuckGo lookup)
    let website = "";
    if (businessName) {
      try {
        const ddgQuery = `${businessName} ${city} official website`;
        const ddgRes = await fetch(
          `https://html.duckduckgo.com/html/?q=${encodeURIComponent(ddgQuery)}`,
          {
            headers: {
              "User-Agent":
                "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
            },
            signal: AbortSignal.timeout(6000)
          }
        );
        if (ddgRes.ok) {
          const ddgHtml = await ddgRes.text();
          const uddgMatches = [...ddgHtml.matchAll(/uddg=([^&"]+)/g)].map(m =>
            decodeURIComponent(m[1])
          );
          for (const cand of uddgMatches) {
            if (
              !cand.includes("facebook.com") &&
              !cand.includes("instagram.com") &&
              !cand.includes("tripadvisor") &&
              !cand.includes("yelp.") &&
              !cand.includes("yellowpages") &&
              !cand.includes("google.com") &&
              !cand.includes("wikipedia.org") &&
              !cand.includes("linkedin.com") &&
              !cand.includes("mapquest.com")
            ) {
              website = cand.replace(/\/$/, "");
              break;
            }
          }
        }
      } catch {}
    }

    // 7. If website found, inspect website for WhatsApp, direct phone, and email
    let whatsapp = phone;
    let email = "";
    if (website) {
      try {
        const siteRes = await fetch(website, {
          headers: {
            "User-Agent":
              "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
          },
          signal: AbortSignal.timeout(6000)
        });
        if (siteRes.ok) {
          const siteHtml = await siteRes.text();

          // Phone from tel:
          const telMatch = siteHtml.match(/href=["']tel:([^"']+)["']/i);
          if (telMatch && !phone) {
            phone = telMatch[1].trim();
          }

          // WhatsApp from wa.me
          const waMatch = siteHtml.match(
            /(?:https?:\/\/)?(?:wa\.me|api\.whatsapp\.com\/send\?phone=)(\d+)/i
          );
          if (waMatch) {
            whatsapp = `+${waMatch[1]}`;
            if (!phone) phone = whatsapp;
          }

          // Email from mailto:
          const mailtoMatch = siteHtml.match(/href=["']mailto:([^"'\?]+)["']/i);
          if (mailtoMatch) {
            const cand = mailtoMatch[1].trim();
            if (cand.includes("@") && !cand.includes("{") && !cand.includes("example") && !cand.includes("domain")) {
              email = cand;
            }
          }
        }
      } catch {}
    }

    // Sanitize phone if it captured a year or timestamp
    if (phone) {
      const digits = phone.replace(/\D/g, "");
      if (digits.startsWith("202") || digits.startsWith("201") || digits.length < 8) {
        phone = "";
      }
    }
    if (whatsapp) {
      const digits = whatsapp.replace(/\D/g, "");
      if (digits.startsWith("202") || digits.startsWith("201") || digits.length < 8) {
        whatsapp = phone || "";
      }
    }

    // 8. Auto-populate category-specific services
    let services: string[] = [];
    if (category === "Dental Clinic") {
      services = ["Dental Implants", "Veneers", "Invisalign", "Cosmetic Dentistry"];
    } else if (category === "Cafe" || category === "Coffee Shop") {
      services = ["Specialty Coffee", "Breakfast & Brunch", "Bakery", "Table Reservation"];
    } else if (category === "Restaurant") {
      services = ["Fine Dining", "Chef Specials", "Private Events", "Online Reservations"];
    } else if (category === "Aesthetic Clinic") {
      services = ["Injectables", "Skin Therapy", "Laser Treatments", "Consultations"];
    } else if (category === "Salon") {
      services = ["Hair Styling", "Coloring", "Nail Care", "VIP Treatments"];
    } else if (category === "Gym") {
      services = ["Personal Training", "Group Classes", "Free Day Pass", "Fitness Assessment"];
    }

    const buyingSignals: string[] = [];
    if (rating && rating >= 4.6) buyingSignals.push("High Google rating (4.7+)");
    if (reviews && reviews >= 30) buyingSignals.push("Strong review volume (50+)");
    if (category === "Dental Clinic" || category === "Aesthetic Clinic") {
      buyingSignals.push("High-ticket services (Implants/Cosmetic)");
    }
    if (!website) {
      buyingSignals.push("Lacks owned modern website");
    }

    const extracted = {
      businessName: businessName || "New Local Business",
      category,
      city,
      area: area || city,
      country,
      mapsUrl: finalUrl,
      rating,
      reviews,
      phone,
      whatsapp: whatsapp || phone,
      email,
      website,
      services,
      buyingSignals,
      websiteStatus: website ? "UNKNOWN" : "NONE",
      status: "NEW"
    };

    return NextResponse.json({
      success: true,
      resolvedUrl: finalUrl,
      title: businessName,
      extracted
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        error: "Could not fetch details automatically. Enter details manually.",
        details: err?.message
      },
      { status: 200 }
    );
  }
}
