"use client";

import React, { useState, useEffect } from "react";
import { Lead, LeadStatus, PitchPack, PitchOptions, ActivityLog, DemoStatus } from "@/lib/types";

type LeadDetailModalProps = {
  lead: Lead | null;
  isOpen: boolean;
  onClose: () => void;
  onUpdateLead: (updated: Lead) => void;
  onDeleteLead: (leadId: string) => void;
  onToast: (msg: string) => void;
};

const ALL_STATUSES: LeadStatus[] = [
  "NEW",
  "RESEARCHED",
  "READY_TO_CONTACT",
  "CONTACTED",
  "FOLLOW_UP",
  "REPLIED",
  "INTERESTED",
  "DEMO_SENT",
  "CALL_SCHEDULED",
  "NEGOTIATION",
  "WON",
  "LOST",
  "NOT_A_FIT"
];

export default function LeadDetailModal({
  lead,
  isOpen,
  onClose,
  onUpdateLead,
  onDeleteLead,
  onToast
}: LeadDetailModalProps) {
  const [activeTab, setActiveTab] = useState<"overview" | "website" | "opportunity" | "outreach" | "followups" | "activity">("overview");

  // Local state for edits
  const [status, setStatus] = useState<LeadStatus>("NEW");
  const [dealValue, setDealValue] = useState("");
  const [source, setSource] = useState("");
  const [nextFollowUpAt, setNextFollowUpAt] = useState("");
  const [demoUrl, setDemoUrl] = useState("");
  const [demoStatus, setDemoStatus] = useState<DemoStatus>("NOT_STARTED");
  const [notes, setNotes] = useState("");

  // Outreach options
  const [tone, setTone] = useState<"friendly" | "professional" | "premium" | "short">("friendly");
  const [target, setTarget] = useState<"receptionist" | "owner" | "manager" | "marketing">("receptionist");

  // Activity logs
  const [activities, setActivities] = useState<ActivityLog[]>([]);

  // Busy states
  const [analyzing, setAnalyzing] = useState(false);
  const [generatingPitch, setGeneratingPitch] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);

  useEffect(() => {
    if (lead) {
      setStatus(lead.status);
      setDealValue(lead.dealValue ? String(lead.dealValue) : "");
      setSource(lead.source || "Google Maps");
      setNextFollowUpAt(lead.nextFollowUpAt ? lead.nextFollowUpAt.slice(0, 10) : "");
      setDemoUrl(lead.demoUrl || "");
      setDemoStatus(lead.demoStatus || "NOT_STARTED");
      setNotes(lead.notes || "");

      // Fetch activity logs for this lead
      fetch(`/api/leads/${lead.id}`)
        .then(r => r.json())
        .then(d => {
          if (d.activities) setActivities(d.activities);
        })
        .catch(() => {});
    }
  }, [lead]);

  if (!isOpen || !lead) return null;

  function copyText(text: string, label: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    onToast(`Copied ${label}`);
  }

  function getWhatsAppUrl(phone: string, text?: string) {
    const cleanNumber = phone.replace(/[^0-9]/g, "");
    if (!cleanNumber) return "";
    const textParam = text ? `?text=${encodeURIComponent(text)}` : "";
    return `https://wa.me/${cleanNumber}${textParam}`;
  }

  function getMailtoUrl(email: string, subject?: string, body?: string) {
    if (!email) return "";
    const params = new URLSearchParams();
    if (subject) params.set("subject", subject);
    if (body) params.set("body", body);
    const qs = params.toString();
    return `mailto:${email}${qs ? `?${qs}` : ""}`;
  }

  async function handleQuickStatusUpdate(newStatus: LeadStatus) {
    setStatus(newStatus);
    try {
      const res = await fetch(`/api/leads/${lead!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const updated = await res.json();
      onUpdateLead(updated);
      onToast(`Status updated to ${newStatus.replace(/_/g, " ")}`);
      refreshActivities();
    } catch {
      onToast("Failed to update status");
    }
  }

  async function handleSaveNotes() {
    setSavingNotes(true);
    try {
      const res = await fetch(`/api/leads/${lead!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notes,
          dealValue: dealValue ? Number(dealValue) : undefined,
          source,
          demoUrl,
          demoStatus,
          nextFollowUpAt: nextFollowUpAt ? new Date(nextFollowUpAt).toISOString() : undefined
        })
      });
      const updated = await res.json();
      onUpdateLead(updated);
      onToast("Saved changes");
      refreshActivities();
    } catch {
      onToast("Failed to save changes");
    } finally {
      setSavingNotes(false);
    }
  }

  async function refreshActivities() {
    try {
      const res = await fetch(`/api/leads/${lead!.id}`);
      const data = await res.json();
      if (data.activities) setActivities(data.activities);
    } catch {}
  }

  async function handleReAnalyze() {
    setAnalyzing(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      });
      const data = await res.json();

      const patchRes = await fetch(`/api/leads/${lead!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: data.analysis,
          score: data.score,
          websiteStatus: !lead!.website ? "NONE" : data.analysis.basicScore < 60 ? "NEEDS_IMPROVEMENT" : "GOOD"
        })
      });
      const updated = await patchRes.json();
      onUpdateLead(updated);
      onToast("Completed website analysis & lead score update");
      refreshActivities();
    } catch {
      onToast("Failed to analyze website");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleGeneratePitch(customTone?: "friendly" | "professional" | "premium" | "short") {
    const selectedTone = customTone || tone;
    setGeneratingPitch(true);
    try {
      const res = await fetch("/api/pitch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lead,
          options: {
            tone: selectedTone,
            target
          } as PitchOptions
        })
      });
      const pitchPack: PitchPack = await res.json();

      const patchRes = await fetch(`/api/leads/${lead!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pitch: pitchPack })
      });
      const updated = await patchRes.json();
      onUpdateLead(updated);
      onToast(`Generated pitch using ${pitchPack.engine}`);
      refreshActivities();
    } catch {
      onToast("Failed to generate pitch");
    } finally {
      setGeneratingPitch(false);
    }
  }

  // Follow-up helper actions
  async function handleScheduleFollowUp(days: number) {
    const d = new Date();
    d.setDate(d.getDate() + days);
    const dateStr = d.toISOString().slice(0, 10);
    setNextFollowUpAt(dateStr);

    const isFirst = !lead!.contactedAt;
    const patchPayload: Record<string, any> = {
      nextFollowUpAt: d.toISOString(),
      status: isFirst ? "CONTACTED" : "FOLLOW_UP"
    };
    if (isFirst) {
      patchPayload.contactedAt = new Date().toISOString();
      setStatus("CONTACTED");
    } else {
      setStatus("FOLLOW_UP");
    }

    try {
      const res = await fetch(`/api/leads/${lead!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchPayload)
      });
      const updated = await res.json();
      onUpdateLead(updated);
      onToast(`Follow-up scheduled for ${dateStr} (+${days} days)`);
      refreshActivities();
    } catch {
      onToast("Failed to update follow-up");
    }
  }

  async function handleStopFollowUp() {
    setNextFollowUpAt("");
    try {
      const res = await fetch(`/api/leads/${lead!.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nextFollowUpAt: null })
      });
      const updated = await res.json();
      onUpdateLead(updated);
      onToast("Follow-up schedule cleared");
      refreshActivities();
    } catch {
      onToast("Failed to clear follow-up");
    }
  }

  const analysis = lead.analysis;
  const score = lead.score;
  const pitch = lead.pitch;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 960 }}>
        {/* Header */}
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 8 }}>
                <span style={{ fontSize: 18, fontWeight: 800 }}>{lead.businessName}</span>
                <span
                  style={{
                    fontSize: 12,
                    background: "#f1f5f9",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 600
                  }}
                >
                  {lead.category}
                </span>
                {score && (
                  <span className={`badge badge-priority-${score.priority}`}>
                    Priority {score.priority} · {score.total}/55
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                {[lead.area, lead.city, lead.country].filter(Boolean).join(", ")}
                {lead.rating ? ` · ★ ${lead.rating.toFixed(1)} (${lead.reviews ?? 0} reviews)` : ""}
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button
              className="btn btn-sm btn-outline"
              style={{ color: "#991b1b", borderColor: "#fecaca" }}
              onClick={() => {
                if (confirm(`Delete lead "${lead.businessName}"?`)) {
                  onDeleteLead(lead.id);
                  onClose();
                }
              }}
            >
              Delete
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="tabs-nav">
          <button
            className={`tab-btn ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            📌 Overview
          </button>
          <button
            className={`tab-btn ${activeTab === "website" ? "active" : ""}`}
            onClick={() => setActiveTab("website")}
          >
            🌐 Website Analysis {analysis ? `(${analysis.basicScore}/100)` : ""}
          </button>
          <button
            className={`tab-btn ${activeTab === "opportunity" ? "active" : ""}`}
            onClick={() => setActiveTab("opportunity")}
          >
            🎯 Opportunity Score {score ? `(${score.total}/55)` : ""}
          </button>
          <button
            className={`tab-btn ${activeTab === "outreach" ? "active" : ""}`}
            onClick={() => setActiveTab("outreach")}
          >
            ✉️ Outreach Pack
          </button>
          <button
            className={`tab-btn ${activeTab === "followups" ? "active" : ""}`}
            onClick={() => setActiveTab("followups")}
          >
            📅 Follow-ups & Demo
          </button>
          <button
            className={`tab-btn ${activeTab === "activity" ? "active" : ""}`}
            onClick={() => setActiveTab("activity")}
          >
            ⏱️ Activity ({activities.length})
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
              {/* Direct Outreach Bar */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-lg)",
                  padding: 16
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 10, textTransform: "uppercase" }}>
                  Direct Manual Contacting Channels (Click to reach)
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {lead.whatsapp && (
                    <a
                      href={getWhatsAppUrl(lead.whatsapp, pitch?.whatsapp)}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-whatsapp"
                    >
                      💬 Open WhatsApp (Pre-filled)
                    </a>
                  )}
                  {lead.whatsapp && (
                    <button
                      className="btn btn-outline"
                      onClick={() => copyText(pitch?.whatsapp || lead.whatsapp, "WhatsApp message")}
                    >
                      📋 Copy WhatsApp Pitch
                    </button>
                  )}
                  {lead.phone && (
                    <a href={`tel:${lead.phone}`} className="btn btn-secondary">
                      📞 Call {lead.phone}
                    </a>
                  )}
                  {lead.email && (
                    <a
                      href={getMailtoUrl(lead.email, pitch?.emailSubject, pitch?.email)}
                      className="btn btn-secondary"
                    >
                      ✉️ Open Email Client
                    </a>
                  )}
                  {lead.email && (
                    <button
                      className="btn btn-outline"
                      onClick={() => copyText(`${pitch?.emailSubject || ""}\n\n${pitch?.email || ""}`, "Email pitch")}
                    >
                      📋 Copy Email Pitch
                    </button>
                  )}
                  {lead.mapsUrl && (
                    <a href={lead.mapsUrl} target="_blank" rel="noreferrer" className="btn btn-outline">
                      📍 Open Google Maps
                    </a>
                  )}
                  {lead.website && (
                    <a
                      href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline"
                    >
                      🌐 Visit Website
                    </a>
                  )}
                  {lead.instagram && (
                    <a
                      href={`https://instagram.com/${lead.instagram.replace("@", "")}`}
                      target="_blank"
                      rel="noreferrer"
                      className="btn btn-outline"
                    >
                      📸 Instagram
                    </a>
                  )}
                </div>
              </div>

              {/* Pipeline Status & CRM Fields */}
              <div className="form-grid-3">
                <div className="form-group">
                  <label className="form-label">CRM Pipeline Status</label>
                  <select
                    className="form-select"
                    value={status}
                    onChange={e => handleQuickStatusUpdate(e.target.value as LeadStatus)}
                  >
                    {ALL_STATUSES.map(s => (
                      <option key={s} value={s}>
                        {s.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Potential Deal Value</label>
                  <input
                    className="form-input"
                    value={dealValue}
                    onChange={e => setDealValue(e.target.value)}
                    placeholder="e.g. 2500"
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Next Follow-up Date</label>
                  <input
                    className="form-input"
                    type="date"
                    value={nextFollowUpAt}
                    onChange={e => setNextFollowUpAt(e.target.value)}
                  />
                </div>
              </div>

              {/* Services & Buying Signals */}
              <div className="form-grid-2">
                <div
                  style={{
                    background: "white",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-md)",
                    padding: 14
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
                    SERVICES & PRODUCTS
                  </div>
                  <div style={{ fontSize: 13 }}>
                    {lead.services && lead.services.length > 0
                      ? lead.services.join(", ")
                      : "No explicit services entered yet."}
                  </div>
                </div>

                <div
                  style={{
                    background: "white",
                    border: "1px solid var(--border-light)",
                    borderRadius: "var(--radius-md)",
                    padding: 14
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 6 }}>
                    VERIFIED BUYING SIGNALS
                  </div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5 }}>
                    {lead.buyingSignals && lead.buyingSignals.length > 0 ? (
                      lead.buyingSignals.map(s => (
                        <span key={s} className="badge badge-signal-strong" style={{ fontSize: 11 }}>
                          ✓ {s}
                        </span>
                      ))
                    ) : (
                      <span style={{ fontSize: 13, color: "var(--text-dim)" }}>None checked</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Notes Editor */}
              <div className="form-group">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <label className="form-label">Notes & Observations</label>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={handleSaveNotes}
                    disabled={savingNotes}
                  >
                    {savingNotes ? "Saving…" : "Save Notes & CRM"}
                  </button>
                </div>
                <textarea
                  className="form-textarea"
                  rows={4}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder="Record customer details, conversation notes, reception response, or objection handling..."
                />
              </div>
            </div>
          )}

          {/* TAB 2: WEBSITE ANALYSIS */}
          {activeTab === "website" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>
                    Basic Automated Website Check
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                    Free local server-side inspection · No paid SEO tool required
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={handleReAnalyze}
                  disabled={analyzing}
                >
                  {analyzing ? "Inspecting…" : "🔄 Re-analyze Website"}
                </button>
              </div>

              {!lead.website && (
                <div
                  style={{
                    background: "#fee2e2",
                    border: "1px solid #fecaca",
                    borderRadius: "var(--radius-md)",
                    padding: 18,
                    textAlign: "center"
                  }}
                >
                  <div style={{ fontSize: 24, marginBottom: 6 }}>🚫</div>
                  <div style={{ fontWeight: 800, color: "#991b1b", fontSize: 15 }}>
                    No Website Detected for {lead.businessName}
                  </div>
                  <div style={{ fontSize: 13, color: "#7f1d1d", marginTop: 4, maxWidth: 500, margin: "6px auto 0" }}>
                    This business has zero live website presence. They are losing high-intent Google Maps searchers and visitors looking for their treatments/menu. Opportunity is exceptionally high.
                  </div>
                </div>
              )}

              {analysis && (
                <>
                  {/* Score & Core Metrics */}
                  <div className="grid-cols-4">
                    <div className="stat-card">
                      <span className="stat-label">Website Score</span>
                      <span
                        className="stat-value"
                        style={{
                          color:
                            analysis.basicScore > 75
                              ? "#15803d"
                              : analysis.basicScore > 45
                              ? "#b45309"
                              : "#991b1b"
                        }}
                      >
                        {analysis.basicScore}/100
                      </span>
                      <span className="stat-sub">
                        {analysis.basicScore > 75 ? "Decent foundation" : "Significant commercial gaps"}
                      </span>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">Mobile Responsive</span>
                      <span className="stat-value">
                        {analysis.mobileMeta ? "✅ Yes" : "❌ No"}
                      </span>
                      <span className="stat-sub">Viewport meta tag</span>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">WhatsApp CTA</span>
                      <span className="stat-value">
                        {analysis.whatsappCta ? "✅ Yes" : "❌ No"}
                      </span>
                      <span className="stat-sub">Direct chat button</span>
                    </div>

                    <div className="stat-card">
                      <span className="stat-label">Booking / Order CTA</span>
                      <span className="stat-value">
                        {analysis.bookingCta || analysis.orderCta ? "✅ Yes" : "❌ No"}
                      </span>
                      <span className="stat-sub">Conversion channel</span>
                    </div>
                  </div>

                  {/* Checklist of all signals */}
                  <div
                    style={{
                      background: "white",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-md)",
                      padding: 16
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 12 }}>
                      Automated Signals Breakdown
                    </div>
                    <div className="form-grid-3" style={{ fontSize: 13, gap: 10 }}>
                      <div>{analysis.reachable ? "✅" : "❌"} Website loads</div>
                      <div>{analysis.https ? "✅" : "❌"} HTTPS secure</div>
                      <div>{analysis.mobileMeta ? "✅" : "❌"} Mobile viewport</div>
                      <div>{analysis.title ? "✅" : "❌"} Title tag {analysis.titleText ? `("${analysis.titleText.slice(0, 20)}...")` : ""}</div>
                      <div>{analysis.metaDescription ? "✅" : "❌"} Meta description</div>
                      <div>{analysis.h1 ? "✅" : "❌"} H1 heading</div>
                      <div>{analysis.favicon ? "✅" : "❌"} Favicon detected</div>
                      <div>{analysis.whatsappCta ? "✅" : "❌"} WhatsApp CTA</div>
                      <div>{analysis.phoneCta ? "✅" : "❌"} Phone call link</div>
                      <div>{analysis.bookingCta ? "✅" : "❌"} Booking CTA</div>
                      <div>{analysis.orderCta ? "✅" : "❌"} Order / Menu CTA</div>
                      <div>{analysis.contactForm ? "✅" : "❌"} Contact form</div>
                      <div>{analysis.menuOrServices ? "✅" : "❌"} Services / Menu</div>
                      <div>{analysis.addressDetected ? "✅" : "❌"} Address signals</div>
                      <div>{analysis.socialLinks.length > 0 ? "✅" : "❌"} Social profiles ({analysis.socialLinks.join(", ") || "None"})</div>
                    </div>
                  </div>

                  {/* Detected Strengths, Gaps, Opportunities */}
                  <div className="form-grid-2">
                    <div
                      style={{
                        background: "#f0fdf4",
                        border: "1px solid #bbf7d0",
                        borderRadius: "var(--radius-md)",
                        padding: 14
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#166534", marginBottom: 8 }}>
                        Detected Strengths ({analysis.strengths.length})
                      </div>
                      <ul style={{ paddingLeft: 18, fontSize: 12, color: "#14532d", lineHeight: 1.6 }}>
                        {analysis.strengths.map(s => (
                          <li key={s}>{s}</li>
                        ))}
                      </ul>
                    </div>

                    <div
                      style={{
                        background: "#fff1f2",
                        border: "1px solid #fecdd3",
                        borderRadius: "var(--radius-md)",
                        padding: 14
                      }}
                    >
                      <div style={{ fontWeight: 700, fontSize: 13, color: "#9f1239", marginBottom: 8 }}>
                        Detected Gaps ({analysis.gaps.length})
                      </div>
                      <ul style={{ paddingLeft: 18, fontSize: 12, color: "#881337", lineHeight: 1.6 }}>
                        {analysis.gaps.map(g => (
                          <li key={g}>{g}</li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  {/* Pitchable Opportunities */}
                  <div
                    style={{
                      background: "#eef2ff",
                      border: "1px solid #c7d2fe",
                      borderRadius: "var(--radius-md)",
                      padding: 14
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#3730a3", marginBottom: 8 }}>
                      💡 Recommended Angles for Custom Website Concept
                    </div>
                    <ul style={{ paddingLeft: 18, fontSize: 13, color: "#312e81", lineHeight: 1.6 }}>
                      {analysis.opportunities.map(o => (
                        <li key={o}>{o}</li>
                      ))}
                    </ul>
                  </div>
                </>
              )}
            </div>
          )}

          {/* TAB 3: OPPORTUNITY SCORE */}
          {activeTab === "opportunity" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Commercial Lead Qualification</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  55-Point Objective Commercial Score Breakdown
                </div>
              </div>

              {score ? (
                <>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      flexWrap: "wrap",
                      gap: 12,
                      background: "#f8fafc",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-lg)",
                      padding: 16
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)" }}>
                        OVERALL COMMERCIAL SCORE
                      </div>
                      <div style={{ fontSize: 32, fontWeight: 900, color: "var(--text-main)" }}>
                        {score.total} <span style={{ fontSize: 18, color: "var(--text-dim)" }}>/ 55</span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                      <span className={`badge badge-priority-${score.priority}`} style={{ fontSize: 14, padding: "6px 12px" }}>
                        Priority {score.priority} ({score.priorityLabel})
                      </span>
                      <span className={`badge badge-signal-${score.buyingSignal.toLowerCase()}`} style={{ fontSize: 14, padding: "6px 12px" }}>
                        Buying Signal: {score.buyingSignal}
                      </span>
                    </div>
                  </div>

                  {/* 6 Sub-Scores Breakdown with REASONS */}
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {score.reasons.map(r => (
                      <div
                        key={r.category}
                        style={{
                          background: "white",
                          border: "1px solid var(--border-light)",
                          borderRadius: "var(--radius-md)",
                          padding: 12,
                          display: "flex",
                          flexDirection: "column",
                          gap: 4
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 700, fontSize: 13 }}>{r.category}</span>
                          <span style={{ fontWeight: 800, fontSize: 13, color: "var(--brand-accent)" }}>
                            {r.score} / {r.max}
                          </span>
                        </div>
                        {/* Progress Bar */}
                        <div
                          style={{
                            height: 6,
                            background: "#f1f5f9",
                            borderRadius: 999,
                            overflow: "hidden"
                          }}
                        >
                          <div
                            style={{
                              width: `${(r.score / r.max) * 100}%`,
                              height: "100%",
                              background: r.score / r.max > 0.7 ? "#10b981" : r.score / r.max > 0.4 ? "#f59e0b" : "#64748b",
                              borderRadius: 999
                            }}
                          />
                        </div>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                          {r.reason}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: 24, color: "var(--text-muted)" }}>
                  Click "Re-analyze Website" on the Website tab to calculate the commercial score.
                </div>
              )}
            </div>
          )}

          {/* TAB 4: OUTREACH PACK */}
          {activeTab === "outreach" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              {/* Pitch Customization Controls */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-lg)",
                  padding: 16,
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 12
                }}
              >
                <div style={{ display: "flex", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", display: "block" }}>
                      PITCH TONE
                    </label>
                    <select
                      className="form-select"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                      value={tone}
                      onChange={e => setTone(e.target.value as any)}
                    >
                      <option value="friendly">Friendly</option>
                      <option value="professional">Professional</option>
                      <option value="premium">Premium</option>
                      <option value="short">Very Short</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", display: "block" }}>
                      TARGET RECIPIENT
                    </label>
                    <select
                      className="form-select"
                      style={{ padding: "4px 8px", fontSize: 12 }}
                      value={target}
                      onChange={e => setTarget(e.target.value as any)}
                    >
                      <option value="receptionist">Front Desk / Receptionist</option>
                      <option value="owner">Owner / Principal</option>
                      <option value="manager">Practice / General Manager</option>
                      <option value="marketing">Marketing Specialist</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleGeneratePitch("short")}
                    disabled={generatingPitch}
                  >
                    Shorter
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleGeneratePitch("professional")}
                    disabled={generatingPitch}
                  >
                    More Professional
                  </button>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleGeneratePitch("friendly")}
                    disabled={generatingPitch}
                  >
                    More Friendly
                  </button>
                  <button
                    className="btn btn-sm btn-accent"
                    onClick={() => handleGeneratePitch()}
                    disabled={generatingPitch}
                  >
                    {generatingPitch ? "Writing…" : pitch ? "🔄 Regenerate" : "⚡ Generate Pitch"}
                  </button>
                </div>
              </div>

              {pitch ? (
                <>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="badge" style={{ background: "#e0e7ff", color: "#3730a3" }}>
                      Generated by: {pitch.engine} {pitch.modelUsed ? `(${pitch.modelUsed})` : ""}
                    </span>
                    <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      Always review before manual send. 100% Free with zero paid API keys.
                    </span>
                  </div>

                  {/* WhatsApp Card */}
                  <div
                    style={{
                      background: "white",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-lg)",
                      padding: 16
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      <span style={{ fontWeight: 800, color: "#166534" }}>💬 WhatsApp Message (Quick Forwardable)</span>
                      <div style={{ display: "flex", gap: 6 }}>
                        {lead.whatsapp && (
                          <a
                            href={getWhatsAppUrl(lead.whatsapp, pitch.whatsapp)}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm btn-whatsapp"
                          >
                            Open in WhatsApp
                          </a>
                        )}
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => copyText(pitch.whatsapp, "WhatsApp message")}
                        >
                          Copy
                        </button>
                      </div>
                    </div>
                    <pre>{pitch.whatsapp}</pre>
                  </div>

                  {/* Email Card */}
                  <div
                    style={{
                      background: "white",
                      border: "1px solid var(--border-light)",
                      borderRadius: "var(--radius-lg)",
                      padding: 16
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 6, marginBottom: 8 }}>
                      <div>
                        <span style={{ fontWeight: 800, color: "var(--text-main)" }}>✉️ Email Pitch</span>
                        <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                          Subject: <strong>{pitch.emailSubject}</strong>
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 6 }}>
                        {lead.email && (
                          <a
                            href={getMailtoUrl(lead.email, pitch.emailSubject, pitch.email)}
                            className="btn btn-sm btn-secondary"
                          >
                            Open Email App
                          </a>
                        )}
                        <button
                          className="btn btn-sm btn-outline"
                          onClick={() => copyText(`${pitch.emailSubject}\n\n${pitch.email}`, "Email pitch")}
                        >
                          Copy Email
                        </button>
                      </div>
                    </div>
                    <pre>{pitch.email}</pre>
                  </div>

                  {/* Follow-ups Cards */}
                  <div className="form-grid-2">
                    <div
                      style={{
                        background: "white",
                        border: "1px solid var(--border-light)",
                        borderRadius: "var(--radius-md)",
                        padding: 14
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>Follow-up #1 (Day 3)</span>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => copyText(pitch.followUp1, "Follow-up #1")}
                        >
                          Copy
                        </button>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-main)", lineHeight: 1.5 }}>
                        {pitch.followUp1}
                      </div>
                    </div>

                    <div
                      style={{
                        background: "white",
                        border: "1px solid var(--border-light)",
                        borderRadius: "var(--radius-md)",
                        padding: 14
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                        <span style={{ fontWeight: 700, fontSize: 13 }}>Follow-up #2 (Day 7)</span>
                        <button
                          className="btn btn-sm btn-ghost"
                          onClick={() => copyText(pitch.followUp2, "Follow-up #2")}
                        >
                          Copy
                        </button>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--text-main)", lineHeight: 1.5 }}>
                        {pitch.followUp2}
                      </div>
                    </div>
                  </div>

                  {/* Strategic Sales Angle */}
                  <div
                    style={{
                      background: "#fffbeb",
                      border: "1px solid #fde68a",
                      borderRadius: "var(--radius-md)",
                      padding: 14
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: 13, color: "#92400e", marginBottom: 4 }}>
                      🎯 Recommended Strategic Angle
                    </div>
                    <div style={{ fontSize: 12, color: "#78350f", lineHeight: 1.6 }}>
                      {pitch.angle}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: 36, color: "var(--text-muted)" }}>
                  Click <strong>⚡ Generate Pitch</strong> to prepare personalized WhatsApp, Email and Follow-ups for this lead.
                </div>
              )}
            </div>
          )}

          {/* TAB 5: FOLLOW-UPS & DEMO */}
          {activeTab === "followups" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800 }}>Follow-up Schedule & Custom Demo</div>
                <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                  Controlled manual follow-up cadence: Day 0 → Day 3 → Day 7 → Stop
                </div>
              </div>

              {/* Cadence Control Card */}
              <div
                style={{
                  background: "#f8fafc",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-lg)",
                  padding: 16
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 10 }}>
                  Quick Cadence Scheduler
                </div>

                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleScheduleFollowUp(3)}
                  >
                    Mark Contacted (+3 Days Follow-up)
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => handleScheduleFollowUp(7)}
                  >
                    Schedule Next (+7 Days)
                  </button>
                  <button
                    className="btn btn-outline"
                    onClick={() => handleQuickStatusUpdate("REPLIED")}
                  >
                    Mark Replied
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={handleStopFollowUp}
                  >
                    Stop Follow-up
                  </button>
                </div>

                <div style={{ marginTop: 12, fontSize: 12, color: "var(--text-muted)" }}>
                  Current Follow-up: <strong>{nextFollowUpAt || "None scheduled"}</strong>
                  {lead.contactedAt && ` · Initial Contact: ${lead.contactedAt.slice(0, 10)}`}
                </div>
              </div>

              {/* Custom Demo Management */}
              <div
                style={{
                  background: "white",
                  border: "1px solid var(--border-light)",
                  borderRadius: "var(--radius-lg)",
                  padding: 16
                }}
              >
                <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 12 }}>
                  Custom Website Concept / Demo Management
                </div>

                <div className="form-grid-split" style={{ marginBottom: 14 }}>
                  <div className="form-group">
                    <label className="form-label">Demo URL</label>
                    <input
                      className="form-input"
                      value={demoUrl}
                      onChange={e => setDemoUrl(e.target.value)}
                      placeholder="https://preview.youragency.com/demo/clinic-name"
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Demo Status</label>
                    <select
                      className="form-select"
                      value={demoStatus}
                      onChange={e => setDemoStatus(e.target.value as DemoStatus)}
                    >
                      <option value="NOT_STARTED">Not Started</option>
                      <option value="IN_PROGRESS">In Progress</option>
                      <option value="READY">Ready</option>
                      <option value="SHARED">Shared with Client</option>
                    </select>
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button className="btn btn-primary btn-sm" onClick={handleSaveNotes}>
                    Save Demo Settings
                  </button>
                </div>

                {/* Suggested Demo Sections */}
                {pitch?.suggestedDemoSections && (
                  <div style={{ marginTop: 16 }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: "var(--text-muted)", marginBottom: 8 }}>
                      SUGGESTED DEMO SECTIONS FOR {lead.category.toUpperCase()}:
                    </div>
                    <div className="form-grid-2" style={{ gap: 6, fontSize: 12 }}>
                      {pitch.suggestedDemoSections.map((sec, idx) => (
                        <div key={sec} style={{ background: "#f8fafc", padding: "6px 10px", borderRadius: "var(--radius-sm)" }}>
                          {idx + 1}. {sec}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 6: ACTIVITY LOG */}
          {activeTab === "activity" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 16, fontWeight: 800 }}>Audit & Activity Trail</div>

              {activities.length === 0 ? (
                <div style={{ color: "var(--text-muted)", fontSize: 13, padding: 24, textAlign: "center" }}>
                  No logged activities yet. Actions like creating, analyzing, pitching, or changing status will automatically appear here.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {activities.map(act => (
                    <div
                      key={act.id}
                      style={{
                        padding: "10px 14px",
                        background: "#f8fafc",
                        border: "1px solid var(--border-light)",
                        borderRadius: "var(--radius-md)",
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center"
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>
                          {act.title}
                        </div>
                        {act.details && (
                          <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                            {act.details}
                          </div>
                        )}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-dim)", whiteSpace: "nowrap" }}>
                        {new Date(act.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
