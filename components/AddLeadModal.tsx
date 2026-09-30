"use client";

import React, { useState } from "react";
import { Lead, WebsiteStatus } from "@/lib/types";
import { parseGoogleMapsBlock, ExtractedMapsData } from "@/lib/parser";

type AddLeadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: (lead: Lead) => void;
  defaultCity?: string;
  defaultCategory?: string;
  onToast: (msg: string) => void;
};

const CATEGORIES = [
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

const BUYING_SIGNALS = [
  "Active Instagram/social presence",
  "Multiple branches",
  "Recently opened / new branch",
  "High Google rating (4.7+)",
  "Strong review volume (50+)",
  "Premium physical location",
  "High-ticket services (Implants/Cosmetic)",
  "Hiring staff",
  "Running promotions/offers",
  "Professional photography",
  "WhatsApp active contact",
  "Lacks owned modern website"
];

export default function AddLeadModal({
  isOpen,
  onClose,
  onLeadAdded,
  defaultCity = "Dubai",
  defaultCategory = "Dental Clinic",
  onToast
}: AddLeadModalProps) {
  const [tab, setTab] = useState<"form" | "paste">("form");

  // Form State
  const [businessName, setBusinessName] = useState("");
  const [category, setCategory] = useState(defaultCategory);
  const [country, setCountry] = useState("United Arab Emirates");
  const [city, setCity] = useState(defaultCity);
  const [area, setArea] = useState("");
  const [mapsUrl, setMapsUrl] = useState("");
  const [rating, setRating] = useState("");
  const [reviews, setReviews] = useState("");
  const [phone, setPhone] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [email, setEmail] = useState("");
  const [website, setWebsite] = useState("");
  const [instagram, setInstagram] = useState("");
  const [facebook, setFacebook] = useState("");
  const [services, setServices] = useState("");
  const [branches, setBranches] = useState("1");
  const [notes, setNotes] = useState("");
  const [buyingSignals, setBuyingSignals] = useState<string[]>([]);

  // Text block paste parser state
  const [pasteBlock, setPasteBlock] = useState("");
  const [extractedData, setExtractedData] = useState<ExtractedMapsData | null>(null);

  // Busy states
  const [resolving, setResolving] = useState(false);
  const [saving, setSaving] = useState(false);

  if (!isOpen) return null;

  function toggleSignal(sig: string) {
    setBuyingSignals(prev =>
      prev.includes(sig) ? prev.filter(s => s !== sig) : [...prev, sig]
    );
  }

  async function handleResolveMaps() {
    if (!mapsUrl.trim()) {
      onToast("Enter a Google Maps URL first");
      return;
    }
    setResolving(true);
    try {
      const res = await fetch("/api/resolve-maps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: mapsUrl })
      });
      const data = await res.json();
      if (data.title && !businessName) {
        setBusinessName(data.title);
      }
      if (data.possiblePhones && data.possiblePhones.length > 0 && !phone) {
        setPhone(data.possiblePhones[0]);
        if (!whatsapp) setWhatsapp(data.possiblePhones[0]);
      }
      onToast(data.error ? "Checked Maps link (manual review recommended)" : "Resolved Maps info");
    } catch {
      onToast("Could not resolve link automatically. Fill in details manually.");
    } finally {
      setResolving(false);
    }
  }

  function handleParseBlock() {
    if (!pasteBlock.trim()) {
      onToast("Paste text copied from Google Maps");
      return;
    }
    const parsed = parseGoogleMapsBlock(pasteBlock);
    setExtractedData(parsed);

    // Populate form fields
    if (parsed.businessName) setBusinessName(parsed.businessName);
    if (parsed.phone) {
      setPhone(parsed.phone);
      if (!whatsapp) setWhatsapp(parsed.phone);
    }
    if (parsed.rating) setRating(parsed.rating);
    if (parsed.reviews) setReviews(parsed.reviews);
    if (parsed.city) setCity(parsed.city);
    if (parsed.area) setArea(parsed.area);
    if (parsed.website) setWebsite(parsed.website);
    if (parsed.mapsUrl) setMapsUrl(parsed.mapsUrl);
    if (parsed.category && parsed.category !== "Other") setCategory(parsed.category);

    onToast("Extracted Google Maps text. Please verify fields.");
  }

  async function handleSubmit(analyzeImmediately: boolean) {
    if (!businessName.trim()) {
      onToast("Business name is required");
      return;
    }

    setSaving(true);
    try {
      const parsedServices = services
        .split(",")
        .map(s => s.trim())
        .filter(Boolean);

      const websiteStatus: WebsiteStatus = !website.trim() ? "NONE" : "UNKNOWN";

      const payload: Partial<Lead> = {
        businessName: businessName.trim(),
        category,
        country,
        city,
        area,
        mapsUrl,
        rating: rating ? Number(rating) : null,
        reviews: reviews ? Number(reviews) : null,
        phone,
        whatsapp: whatsapp || phone,
        email,
        website: website.trim(),
        instagram,
        facebook,
        services: parsedServices,
        branches: Number(branches || 1),
        buyingSignals,
        websiteStatus,
        status: "NEW",
        notes
      };

      // If user wants to analyze immediately on save
      if (analyzeImmediately) {
        const analyzeRes = await fetch("/api/analyze", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const analyzeData = await analyzeRes.json();
        payload.analysis = analyzeData.analysis;
        payload.score = analyzeData.score;
        if (!website.trim()) {
          payload.websiteStatus = "NONE";
        } else if (analyzeData.analysis?.basicScore < 60) {
          payload.websiteStatus = "NEEDS_IMPROVEMENT";
        } else {
          payload.websiteStatus = "GOOD";
        }
      }

      // Save lead to database
      const saveRes = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const savedLead = await saveRes.json();

      onToast(`Saved ${savedLead.businessName} to pipeline`);
      onLeadAdded(savedLead);
      onClose();
    } catch {
      onToast("Failed to save lead");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 840 }}>
        {/* Modal Header */}
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Add Local Business Lead</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Manual Google Maps discovery workflow · ₹0 recurring cost
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="tabs-nav">
          <button
            className={`tab-btn ${tab === "form" ? "active" : ""}`}
            onClick={() => setTab("form")}
          >
            📋 Lead Details Form
          </button>
          <button
            className={`tab-btn ${tab === "paste" ? "active" : ""}`}
            onClick={() => setTab("paste")}
          >
            📋 Paste from Google Maps
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body">
          {tab === "paste" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              <div style={{ fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
                Copy text from Google Maps search result or business card window and paste it below. Our local parser will extract the business name, phone, rating, reviews, address, and website without guessing.
              </div>

              <textarea
                className="form-textarea"
                rows={6}
                value={pasteBlock}
                onChange={e => setPasteBlock(e.target.value)}
                placeholder={`Example pasted text:\nSmile Dental Clinic Dubai\n4.9 ★★★★★ (184 reviews)\nDental clinic in Dubai, United Arab Emirates\nAddress: Villa 12, Al Wasl Rd, Jumeirah 1, Dubai\nPhone: +971 4 344 5566\nWebsite: https://www.smiledentaldubai.com`}
              />

              <div style={{ display: "flex", gap: 8 }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={handleParseBlock}
                >
                  ⚡ Extract & Populate Form
                </button>
              </div>

              {extractedData && (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-md)",
                    padding: 14,
                    fontSize: 12
                  }}
                >
                  <div style={{ fontWeight: 700, marginBottom: 8, color: "var(--text-main)" }}>
                    Extracted Preview (Review & Confirm):
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 8 }}>
                    <div><strong>Name:</strong> {extractedData.businessName || "Not found"}</div>
                    <div><strong>Category:</strong> {extractedData.category || "Not found"}</div>
                    <div><strong>Rating:</strong> {extractedData.rating ? `${extractedData.rating}★` : "Not found"}</div>
                    <div><strong>Reviews:</strong> {extractedData.reviews || "Not found"}</div>
                    <div><strong>Phone:</strong> {extractedData.phone || "Not found"}</div>
                    <div><strong>Website:</strong> {extractedData.website || "No website"}</div>
                    <div><strong>City/Area:</strong> {[extractedData.area, extractedData.city].filter(Boolean).join(", ") || "Not found"}</div>
                  </div>
                  <div style={{ marginTop: 10, fontSize: 11, color: "var(--text-muted)" }}>
                    Switch to the "Lead Details Form" tab to make any corrections before saving.
                  </div>
                </div>
              )}
            </div>
          )}

          {tab === "form" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {/* Row 1: Name & Category */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Business Name *</label>
                  <input
                    className="form-input"
                    value={businessName}
                    onChange={e => setBusinessName(e.target.value)}
                    placeholder="e.g. Apex Dental Clinic"
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select
                    className="form-select"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                  >
                    {CATEGORIES.map(c => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Row 2: Location */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">City</label>
                  <input
                    className="form-input"
                    value={city}
                    onChange={e => setCity(e.target.value)}
                    placeholder="Dubai"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Area / District</label>
                  <input
                    className="form-input"
                    value={area}
                    onChange={e => setArea(e.target.value)}
                    placeholder="e.g. Jumeirah 1 / Downtown"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Country</label>
                  <input
                    className="form-input"
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    placeholder="United Arab Emirates"
                  />
                </div>
              </div>

              {/* Google Maps URL + 1-click Resolve */}
              <div className="form-group">
                <label className="form-label">Google Maps URL</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="form-input"
                    value={mapsUrl}
                    onChange={e => setMapsUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl/... or full maps URL"
                  />
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={handleResolveMaps}
                    disabled={resolving || !mapsUrl.trim()}
                  >
                    {resolving ? "Resolving…" : "Resolve Link"}
                  </button>
                </div>
              </div>

              {/* Rating, Reviews, Branches */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Google Rating (0-5)</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.1"
                    min="0"
                    max="5"
                    value={rating}
                    onChange={e => setRating(e.target.value)}
                    placeholder="4.9"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Reviews Count</label>
                  <input
                    className="form-input"
                    type="number"
                    min="0"
                    value={reviews}
                    onChange={e => setReviews(e.target.value)}
                    placeholder="184"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Branches Count</label>
                  <input
                    className="form-input"
                    type="number"
                    min="1"
                    value={branches}
                    onChange={e => setBranches(e.target.value)}
                    placeholder="1"
                  />
                </div>
              </div>

              {/* Contact Channels: Phone, WhatsApp, Email */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Phone Number</label>
                  <input
                    className="form-input"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+971 4 123 4567"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">WhatsApp Number</label>
                  <input
                    className="form-input"
                    value={whatsapp}
                    onChange={e => setWhatsapp(e.target.value)}
                    placeholder="+971 50 123 4567"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Email Address</label>
                  <input
                    className="form-input"
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="info@business.com"
                  />
                </div>
              </div>

              {/* Website & Socials */}
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
                <div className="form-group">
                  <label className="form-label">Website (Leave blank if none)</label>
                  <input
                    className="form-input"
                    value={website}
                    onChange={e => setWebsite(e.target.value)}
                    placeholder="https://example.com"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Instagram Handle</label>
                  <input
                    className="form-input"
                    value={instagram}
                    onChange={e => setInstagram(e.target.value)}
                    placeholder="@business"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Facebook</label>
                  <input
                    className="form-input"
                    value={facebook}
                    onChange={e => setFacebook(e.target.value)}
                    placeholder="facebook.com/..."
                  />
                </div>
              </div>

              {/* Services & Products */}
              <div className="form-group">
                <label className="form-label">Services / High-Value Products</label>
                <input
                  className="form-input"
                  value={services}
                  onChange={e => setServices(e.target.value)}
                  placeholder="e.g. Dental Implants, Veneers, Invisalign, Teeth Whitening"
                />
              </div>

              {/* Buying Signals Multi-Select */}
              <div className="form-group">
                <label className="form-label">Verified Commercial Buying Signals</label>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {BUYING_SIGNALS.map(sig => {
                    const active = buyingSignals.includes(sig);
                    return (
                      <button
                        key={sig}
                        type="button"
                        className={active ? "btn btn-sm btn-primary" : "btn btn-sm btn-secondary"}
                        onClick={() => toggleSignal(sig)}
                        style={{ fontSize: 11 }}
                      >
                        {active ? "✓ " : "+ "}
                        {sig}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Notes */}
              <div className="form-group">
                <label className="form-label">Commercial Notes</label>
                <textarea
                  className="form-textarea"
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Observations from Google Maps, photos, staff, or Instagram..."
                />
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button
            className="btn btn-secondary"
            onClick={() => handleSubmit(false)}
            disabled={saving || !businessName.trim()}
          >
            {saving ? "Saving…" : "Save Lead Only"}
          </button>
          <button
            className="btn btn-accent"
            onClick={() => handleSubmit(true)}
            disabled={saving || !businessName.trim()}
          >
            {saving ? "Analyzing & Saving…" : "⚡ Analyze & Save Lead"}
          </button>
        </div>
      </div>
    </div>
  );
}
