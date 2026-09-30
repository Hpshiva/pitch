export type ExtractedMapsData = {
  businessName: string;
  category: string;
  city: string;
  area: string;
  rating: string;
  reviews: string;
  phone: string;
  website: string;
  mapsUrl: string;
  rawText: string;
  confidence: {
    businessName: boolean;
    phone: boolean;
    rating: boolean;
    reviews: boolean;
    website: boolean;
    mapsUrl: boolean;
  };
};

const KNOWN_CATEGORIES = [
  "Dental Clinic",
  "Aesthetic Clinic",
  "Medical Clinic",
  "Cafe",
  "Coffee Shop",
  "Restaurant",
  "Salon",
  "Spa",
  "Gym",
  "Auto Dealer",
  "Auto Service",
  "Real Estate",
  "Hotel",
  "Law Firm",
  "Local Services",
  "Other"
];

export function parseGoogleMapsBlock(raw: string): ExtractedMapsData {
  const text = raw.trim();
  const lines = text
    .split(/\r?\n/)
    .map(l => l.trim())
    .filter(Boolean);

  let businessName = "";
  let category = "";
  let city = "";
  let area = "";
  let rating = "";
  let reviews = "";
  let phone = "";
  let website = "";
  let mapsUrl = "";

  // 1. Detect Maps URL
  const mapsMatch = text.match(/https?:\/\/(?:maps\.app\.goo\.gl|www\.google\.[a-z.]+\/maps|goo\.gl\/maps)[^\s]+/i);
  if (mapsMatch) {
    mapsUrl = mapsMatch[0];
  }

  // 2. Detect Website URL (excluding maps)
  const urlMatches = text.match(/https?:\/\/[^\s"'<>]+/gi) || [];
  for (const url of urlMatches) {
    if (!url.includes("google.com/maps") && !url.includes("maps.app.goo.gl") && !url.includes("goo.gl/maps")) {
      website = url;
      break;
    }
  }
  if (!website) {
    const wwwMatch = text.match(/\bwww\.[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/i);
    if (wwwMatch) {
      website = `https://${wwwMatch[0]}`;
    }
  }

  // 3. Detect Phone Number
  // Look for line starting with Phone: or standard phone format
  const phonePrefixMatch = text.match(/(?:phone|tel|call|contact|mobile)[:\s]+([+0-9\s().-]{7,20})/i);
  if (phonePrefixMatch) {
    phone = phonePrefixMatch[1].trim();
  } else {
    // International pattern like +971 4 344 5566 or +1 (555) 123-4567 or 050 123 4567
    const phoneCandidates = text.match(/(?:\+?\d{1,4}[\s.-]?)?\(?\d{1,4}\)?[\s.-]?\d{2,4}[\s.-]?\d{3,5}/g) || [];
    for (const cand of phoneCandidates) {
      const clean = cand.replace(/\D/g, "");
      if (clean.length >= 7 && clean.length <= 15) {
        phone = cand.trim();
        break;
      }
    }
  }

  // 4. Detect Rating & Reviews
  // Examples: "4.9 ★★★★★ (184 reviews)", "4.8 (120)", "4.9 · 85 Google reviews", "4.7 stars 300 reviews"
  const ratingReviewMatch =
    text.match(/\b([1-5]\.[0-9])\s*(?:★|stars?|\*)?\s*\(?(\d[\d,]*)\s*(?:Google\s*)?reviews?\)?/i) ||
    text.match(/\b([1-5]\.[0-9])\s*(?:★|stars?|\*)\s*\(?(\d[\d,]*)\)?/i) ||
    text.match(/\b([1-5]\.[0-9])\s*·\s*(\d[\d,]*)/i) ||
    text.match(/\b([1-5]\.[0-9])\s*\((\d[\d,]*)\)/);

  if (ratingReviewMatch) {
    rating = ratingReviewMatch[1];
    reviews = ratingReviewMatch[2].replace(/,/g, "");
  } else {
    const standaloneRating = text.match(/\b([1-5]\.[0-9])\b(?:\s*★)?/);
    if (standaloneRating) {
      rating = standaloneRating[1];
    }
    const standaloneReviews = text.match(/\b(\d[\d,]*)\s+reviews?\b/i);
    if (standaloneReviews) {
      reviews = standaloneReviews[1].replace(/,/g, "");
    }
  }

  // 5. Detect Category
  const lowerText = text.toLowerCase();
  for (const cat of KNOWN_CATEGORIES) {
    if (lowerText.includes(cat.toLowerCase())) {
      category = cat;
      break;
    }
  }
  if (!category) {
    if (/dental|dentist|orthodont|teeth|implant/i.test(text)) category = "Dental Clinic";
    else if (/aesthetic|cosmetic|dermatolog|botox/i.test(text)) category = "Aesthetic Clinic";
    else if (/clinic|polyclinic|medical|doctor/i.test(text)) category = "Medical Clinic";
    else if (/coffee|roaster|espresso|barista/i.test(text)) category = "Coffee Shop";
    else if (/cafe|bakery|bistro/i.test(text)) category = "Cafe";
    else if (/restaurant|dining|kitchen|grill|pizzeria/i.test(text)) category = "Restaurant";
    else if (/salon|barber|hair|lashes|nail/i.test(text)) category = "Salon";
    else if (/spa|massage|wellness/i.test(text)) category = "Spa";
    else if (/gym|fitness|crossfit|workout/i.test(text)) category = "Gym";
    else if (/auto\s*repair|car\s*service|garage|mechanic/i.test(text)) category = "Auto Service";
    else if (/car\s*dealer|automotive|motors/i.test(text)) category = "Auto Dealer";
    else if (/real\s*estate|properties|realty|broker/i.test(text)) category = "Real Estate";
    else if (/law\s*firm|lawyer|advocate|attorney|legal/i.test(text)) category = "Law Firm";
    else if (/hotel|resort|suites/i.test(text)) category = "Hotel";
  }

  // 6. Detect Business Name
  // Typically, in Google Maps paste, the first non-empty line that isn't a URL or rating is the business name.
  for (const line of lines) {
    if (
      !line.startsWith("http") &&
      !line.match(/^[1-5]\.[0-9]/) &&
      !line.toLowerCase().startsWith("open") &&
      !line.toLowerCase().startsWith("closes") &&
      !line.toLowerCase().startsWith("address:") &&
      !line.toLowerCase().startsWith("phone:") &&
      !line.match(/^\+?[0-9\s().-]{7,}$/) &&
      line.length > 2 &&
      line.length < 90
    ) {
      businessName = line.replace(/^[•\-\d.\s]+/, "").trim();
      break;
    }
  }

  // 7. Detect City and Area
  // Check for common cities
  const cityMatch = text.match(/\b(Dubai|Abu Dhabi|Sharjah|Ajman|Doha|Riyadh|Jeddah|London|New York|Los Angeles|Toronto|Sydney|Singapore|Berlin|Paris|Mumbai|Delhi|Bangalore)\b/i);
  if (cityMatch) {
    city = cityMatch[1];
  }

  // Check address line for area
  const addressMatch = text.match(/(?:address|location)[:\s]+([^,\n]+)(?:,\s*([^,\n]+))?/i);
  if (addressMatch) {
    area = addressMatch[1].trim();
    if (!city && addressMatch[2]) {
      city = addressMatch[2].trim();
    }
  } else {
    // Try lines with street/road/avenue
    for (const line of lines) {
      if (/st\b|street\b|rd\b|road\b|ave\b|avenue\b|blvd\b|tower\b|building\b|villa\b|mall\b|downtown\b|marina\b|al\s+[a-z]+/i.test(line)) {
        if (!line.includes("http") && line !== businessName) {
          area = line.slice(0, 60).trim();
          break;
        }
      }
    }
  }

  return {
    businessName,
    category: category || "Other",
    city,
    area,
    rating,
    reviews,
    phone,
    website,
    mapsUrl,
    rawText: raw,
    confidence: {
      businessName: Boolean(businessName),
      phone: Boolean(phone),
      rating: Boolean(rating),
      reviews: Boolean(reviews),
      website: Boolean(website),
      mapsUrl: Boolean(mapsUrl)
    }
  };
}
