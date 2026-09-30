"use client";

import React, { useState } from "react";
import { Lead } from "@/lib/types";

type DiscoveryModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onLeadAdded: (lead: Lead) => void;
  onToast: (msg: string) => void;
};

export default function DiscoveryModal({
  isOpen,
  onClose,
  onLeadAdded,
  onToast
}: DiscoveryModalProps) {
  const [city, setCity] = useState("Dubai");
  const [category, setCategory] = useState("Dental");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any[]>([]);
  const [searched, setSearched] = useState(false);
  const [addingIdx, setAddingIdx] = useState<number | null>(null);

  if (!isOpen) return null;

  async function handleSearch() {
    setLoading(true);
    setSearched(true);
    setResults([]);
    try {
      const res = await fetch(`/api/discovery?city=${encodeURIComponent(city)}&category=${encodeURIComponent(category)}`);
      const data = await res.json();
      setResults(data.results || []);
      if ((data.results || []).length === 0) {
        onToast(data.notice || "No free OpenStreetMap results found for this area.");
      } else {
        onToast(`Discovered ${data.results.length} local businesses via OpenStreetMap`);
      }
    } catch {
      onToast("Free discovery request timed out. You can paste Google Maps leads directly.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAddLead(item: any, idx: number) {
    setAddingIdx(idx);
    try {
      const payload: Partial<Lead> = {
        businessName: item.businessName,
        category: item.category,
        city: item.city,
        area: item.area,
        country: "United Arab Emirates",
        phone: item.phone,
        website: item.website,
        source: "OpenStreetMap Discovery",
        websiteStatus: item.website ? "UNKNOWN" : "NONE",
        status: "NEW"
      };

      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const lead = await res.json();
      onLeadAdded(lead);
      onToast(`Added ${lead.businessName} to pipeline`);
    } catch {
      onToast("Failed to add lead");
    } finally {
      setAddingIdx(null);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 750 }}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Free Business Discovery</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Optional search powered by OpenStreetMap Community Data · ₹0 cost
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div
            style={{
              background: "#eff6ff",
              border: "1px solid #bfdbfe",
              borderRadius: "var(--radius-md)",
              padding: 12,
              fontSize: 12,
              color: "#1e40af"
            }}
          >
            <strong>Note on Discovery:</strong> For primary targeting, manually search Google Maps for top-rated clinics/cafes and paste the links into the engine. This optional tool queries free OpenStreetMap data without paid Google Places keys.
          </div>

          <div className="discovery-search-grid">
            <div className="form-group">
              <label className="form-label">City</label>
              <input
                className="form-input"
                value={city}
                onChange={e => setCity(e.target.value)}
                placeholder="Dubai / London / Sydney"
              />
            </div>

            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-select"
                value={category}
                onChange={e => setCategory(e.target.value)}
              >
                <option value="Dental">Dental Clinic</option>
                <option value="Cafe">Cafe / Coffee</option>
                <option value="Restaurant">Restaurant</option>
                <option value="Clinic">Medical Clinic</option>
                <option value="Salon">Salon</option>
                <option value="Gym">Gym</option>
              </select>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleSearch}
              disabled={loading || !city.trim()}
              style={{ height: 38 }}
            >
              {loading ? "Searching OSM…" : "🔍 Search"}
            </button>
          </div>

          {/* Results list */}
          {searched && (
            <div style={{ marginTop: 8 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 8, color: "var(--text-main)" }}>
                Results ({results.length})
              </div>

              {results.length === 0 && !loading && (
                <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)", fontSize: 13 }}>
                  No open records returned. Try a different city or paste businesses from Google Maps directly.
                </div>
              )}

              <div style={{ display: "flex", flexDirection: "column", gap: 8, maxHeight: 340, overflowY: "auto" }}>
                {results.map((r, idx) => (
                  <div
                    key={idx}
                    style={{
                      background: "#f8fafc",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-md)",
                      padding: "10px 14px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 8
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: 13 }}>{r.businessName}</div>
                      <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                        {r.area ? `${r.area}, ` : ""}{r.city}
                        {r.phone ? ` · 📞 ${r.phone}` : ""}
                        {r.website ? ` · 🌐 ${r.website}` : " · No website"}
                      </div>
                    </div>

                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleAddLead(r, idx)}
                      disabled={addingIdx === idx}
                    >
                      {addingIdx === idx ? "Adding…" : "+ Add to Pipeline"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
