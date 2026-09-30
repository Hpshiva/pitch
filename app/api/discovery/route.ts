import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const city = url.searchParams.get("city") || "Dubai";
  const category = (url.searchParams.get("category") || "Dental").toLowerCase();

  // Map category to OpenStreetMap amenity/tag
  let amenityTag = 'amenity="cafe"';
  if (category.includes("dent")) {
    amenityTag = 'amenity="dentist"';
  } else if (category.includes("cafe") || category.includes("coffee")) {
    amenityTag = 'amenity="cafe"';
  } else if (category.includes("restaurant")) {
    amenityTag = 'amenity="restaurant"';
  } else if (category.includes("clinic") || category.includes("medical")) {
    amenityTag = 'amenity="clinic"';
  } else if (category.includes("salon")) {
    amenityTag = 'shop="hairdresser"';
  } else if (category.includes("gym") || category.includes("fitness")) {
    amenityTag = 'leisure="fitness_centre"';
  }

  // Construct Overpass QL query
  const query = `
    [out:json][timeout:15];
    area["name"="${city}"]->.searchArea;
    (
      node[${amenityTag}](area.searchArea);
      way[${amenityTag}](area.searchArea);
    );
    out center 25;
  `;

  try {
    const res = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      signal: AbortSignal.timeout(12000)
    });

    if (!res.ok) {
      return NextResponse.json({
        source: "OpenStreetMap (Overpass)",
        results: [],
        notice: "Free public OpenStreetMap query reached capacity or timed out. You can paste Google Maps leads directly."
      });
    }

    const data = await res.json();
    const elements = Array.isArray(data.elements) ? data.elements : [];

    const results = elements
      .filter((el: any) => el.tags && (el.tags.name || el.tags["name:en"]))
      .map((el: any) => {
        const tags = el.tags;
        const name = tags["name:en"] || tags.name;
        const phone = tags["contact:phone"] || tags.phone || tags["contact:mobile"] || "";
        const website = tags["contact:website"] || tags.website || "";
        const street = tags["addr:street"] || "";
        const housenumber = tags["addr:housenumber"] || "";
        const area = tags["addr:suburb"] || tags["addr:district"] || street;

        return {
          businessName: name,
          category: category.includes("dent") ? "Dental Clinic" : category.includes("cafe") ? "Cafe" : "Local Business",
          city,
          area: area ? `${housenumber} ${area}`.trim() : "",
          phone,
          website,
          source: "OpenStreetMap (Free Community Discovery)"
        };
      })
      .slice(0, 20);

    return NextResponse.json({
      source: "OpenStreetMap (Free Community Discovery)",
      results,
      count: results.length
    });
  } catch (error: any) {
    return NextResponse.json({
      source: "OpenStreetMap",
      results: [],
      error: "Could not complete free OpenStreetMap discovery query. You can add leads manually from Google Maps."
    });
  }
}
