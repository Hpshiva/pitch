import { NextRequest, NextResponse } from "next/server";
import { parseGoogleMapsBlock } from "@/lib/parser";

export async function POST(req: NextRequest) {
  try {
    const { url, rawText } = await req.json();

    // If user pasted a block of raw text, parse it with our parser
    if (rawText && typeof rawText === "string") {
      const parsed = parseGoogleMapsBlock(rawText);
      return NextResponse.json({ parsed });
    }

    if (!url) {
      return NextResponse.json({ error: "Maps URL is required." }, { status: 400 });
    }

    const res = await fetch(url, {
      redirect: "follow",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
      },
      signal: AbortSignal.timeout(10000)
    });

    const html = await res.text();
    const finalUrl = res.url || url;

    // Title extraction
    let title =
      html.match(/<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)/i)?.[1] ||
      html.match(/<title[^>]*>([^<]+)/i)?.[1] ||
      "";

    // Clean up title suffixes like "- Google Maps"
    title = title.replace(/\s*[-·|]\s*Google Maps.*$/i, "").trim();

    // Canonical link
    const canonical =
      html.match(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']+)/i)?.[1] || finalUrl;

    // Phone numbers detection
    const phones = [
      ...new Set(
        (html.match(/(?:\+?\d{1,4}[\s.-]?)?\(?\d{2,4}\)?[\s.-]?\d{3,4}[\s.-]?\d{3,4}/g) || [])
          .map(x => x.replace(/\s+/g, " ").trim())
          .filter(p => p.replace(/\D/g, "").length >= 8 && p.replace(/\D/g, "").length <= 15)
          .slice(0, 5)
      )
    ];

    return NextResponse.json({
      resolvedUrl: finalUrl,
      title: title || "",
      canonical,
      possiblePhones: phones
    });
  } catch {
    return NextResponse.json(
      { error: "Could not resolve the Maps link automatically. You can confirm or enter details manually." },
      { status: 200 }
    );
  }
}
