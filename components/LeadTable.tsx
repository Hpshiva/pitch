"use client";

import React from "react";
import { Lead, LeadStatus } from "@/lib/types";

type LeadTableProps = {
  leads: Lead[];
  onSelectLead: (lead: Lead) => void;
  onQuickStatusChange: (leadId: string, status: LeadStatus) => void;
  onAnalyzeLead: (lead: Lead) => void;
  onOpenPitch: (lead: Lead) => void;
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

export default function LeadTable({
  leads,
  onSelectLead,
  onQuickStatusChange,
  onAnalyzeLead,
  onOpenPitch,
  onToast
}: LeadTableProps) {
  const todayStr = new Date().toISOString().slice(0, 10);

  function copyText(text: string, label: string) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    onToast(`Copied ${label}`);
  }

  function getWhatsAppUrl(phone: string, pitchText?: string) {
    const cleanNumber = phone.replace(/[^0-9]/g, "");
    if (!cleanNumber) return "";
    const textParam = pitchText ? `?text=${encodeURIComponent(pitchText)}` : "";
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

  if (leads.length === 0) {
    return (
      <div
        className="card"
        style={{
          padding: 48,
          textAlign: "center",
          color: "var(--text-muted)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 12
        }}
      >
        <div style={{ fontSize: 36 }}>🔍</div>
        <div style={{ fontSize: 16, fontWeight: 700, color: "var(--text-main)" }}>
          No leads found matching your criteria
        </div>
        <div style={{ fontSize: 13, maxWidth: 440 }}>
          Search Google Maps for target businesses (e.g. "dental clinics Dubai" or "cafes London") and click <strong>+ Add Lead</strong> to paste the link.
        </div>
      </div>
    );
  }

  return (
    <>
      {/* =========================================================================
          1. DESKTOP VIEW: Full Table
          ========================================================================= */}
      <div className="table-wrapper desktop-only">
        <table className="lead-table">
          <thead>
            <tr>
              <th>Business & Location</th>
              <th>Category</th>
              <th>Google Rating</th>
              <th>Website Status</th>
              <th>Priority & Score</th>
              <th>Buying Signal</th>
              <th>Direct Channels</th>
              <th>CRM Status</th>
              <th>Next Follow-up</th>
              <th>Demo</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {leads.map(lead => {
              const isFollowUpDueToday = lead.nextFollowUpAt?.slice(0, 10) === todayStr;
              const isOverdue =
                lead.nextFollowUpAt &&
                lead.nextFollowUpAt.slice(0, 10) < todayStr &&
                !["WON", "LOST", "NOT_A_FIT"].includes(lead.status);

              const hasWebsite = Boolean(lead.website && lead.websiteStatus !== "NONE");
              const websiteScore = lead.analysis?.basicScore;

              return (
                <tr key={lead.id}>
                  {/* Business & Location */}
                  <td>
                    <div
                      style={{ fontWeight: 700, color: "var(--text-main)", cursor: "pointer" }}
                      onClick={() => onSelectLead(lead)}
                    >
                      {lead.businessName}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
                      {lead.area ? `${lead.area}, ` : ""}
                      {lead.city}
                      {lead.country ? ` · ${lead.country}` : ""}
                    </div>
                  </td>

                  {/* Category */}
                  <td>
                    <span
                      style={{
                        fontSize: 12,
                        fontWeight: 600,
                        background: "#f1f5f9",
                        padding: "3px 8px",
                        borderRadius: "var(--radius-sm)"
                      }}
                    >
                      {lead.category || "Local"}
                    </span>
                  </td>

                  {/* Rating & Reviews */}
                  <td>
                    {lead.rating ? (
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ color: "#f59e0b", fontWeight: 700 }}>★ {lead.rating.toFixed(1)}</span>
                        <span style={{ fontSize: 12, color: "var(--text-muted)" }}>
                          ({lead.reviews ?? 0})
                        </span>
                      </div>
                    ) : (
                      <span style={{ color: "var(--text-dim)", fontSize: 12 }}>Not rated</span>
                    )}
                  </td>

                  {/* Website Status & Score */}
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {!hasWebsite ? (
                        <span className="badge badge-priority-C" style={{ background: "#fee2e2", color: "#991b1b" }}>
                          NO WEBSITE
                        </span>
                      ) : (
                        <>
                          <a
                            href={lead.website.startsWith("http") ? lead.website : `https://${lead.website}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: 12,
                              fontWeight: 600,
                              color: "var(--brand-accent)",
                              textDecoration: "underline",
                              maxWidth: 110,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                              display: "inline-block"
                            }}
                            title={lead.website}
                          >
                            {lead.website.replace(/^https?:\/\/(www\.)?/, "").replace(/\/$/, "")}
                          </a>
                          {websiteScore !== undefined && (
                            <span
                              className="badge"
                              style={{
                                background: websiteScore > 75 ? "#dcfce7" : websiteScore > 45 ? "#fef3c7" : "#fee2e2",
                                color: websiteScore > 75 ? "#166534" : websiteScore > 45 ? "#92400e" : "#991b1b"
                              }}
                            >
                              {websiteScore}/100
                            </span>
                          )}
                        </>
                      )}
                    </div>
                  </td>

                  {/* Commercial Priority & Score */}
                  <td>
                    {lead.score ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
                        <span className={`badge badge-priority-${lead.score.priority}`}>
                          Priority {lead.score.priority} · {lead.score.total}/55
                        </span>
                        <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
                          {lead.score.priorityLabel}
                        </span>
                      </div>
                    ) : (
                      <button
                        className="btn btn-sm btn-outline"
                        onClick={() => onAnalyzeLead(lead)}
                      >
                        Score Now
                      </button>
                    )}
                  </td>

                  {/* Buying Signal */}
                  <td>
                    {lead.score?.buyingSignal ? (
                      <span
                        className={`badge badge-signal-${lead.score.buyingSignal.toLowerCase()}`}
                      >
                        {lead.score.buyingSignal}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-dim)", fontSize: 12 }}>—</span>
                    )}
                  </td>

                  {/* Direct Channels */}
                  <td>
                    <div style={{ display: "flex", gap: 5 }}>
                      {lead.whatsapp && (
                        <a
                          href={getWhatsAppUrl(lead.whatsapp, lead.pitch?.whatsapp)}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-whatsapp"
                          title={`Open WhatsApp (${lead.whatsapp})`}
                          style={{ padding: "3px 7px", fontSize: 11 }}
                        >
                          WA
                        </a>
                      )}
                      {lead.phone && !lead.whatsapp && (
                        <a
                          href={`tel:${lead.phone}`}
                          className="btn btn-sm btn-secondary"
                          title={`Call (${lead.phone})`}
                          style={{ padding: "3px 7px", fontSize: 11 }}
                        >
                          Call
                        </a>
                      )}
                      {lead.email && (
                        <a
                          href={getMailtoUrl(lead.email, lead.pitch?.emailSubject, lead.pitch?.email)}
                          className="btn btn-sm btn-secondary"
                          title={`Send Email (${lead.email})`}
                          style={{ padding: "3px 7px", fontSize: 11 }}
                        >
                          Email
                        </a>
                      )}
                      {lead.mapsUrl && (
                        <a
                          href={lead.mapsUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm btn-ghost"
                          title="View on Google Maps"
                          style={{ padding: "3px 7px", fontSize: 11 }}
                        >
                          📍 Maps
                        </a>
                      )}
                    </div>
                  </td>

                  {/* CRM Status Dropdown */}
                  <td>
                    <select
                      className={`badge-status badge-status-${lead.status}`}
                      value={lead.status}
                      onChange={e => onQuickStatusChange(lead.id, e.target.value as LeadStatus)}
                      style={{
                        border: "none",
                        outline: "none",
                        cursor: "pointer",
                        fontFamily: "inherit"
                      }}
                    >
                      {ALL_STATUSES.map(st => (
                        <option key={st} value={st}>
                          {st.replace(/_/g, " ")}
                        </option>
                      ))}
                    </select>
                  </td>

                  {/* Next Follow-up */}
                  <td>
                    {lead.nextFollowUpAt ? (
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: isOverdue ? "#dc2626" : isFollowUpDueToday ? "#d97706" : "var(--text-main)"
                          }}
                        >
                          {lead.nextFollowUpAt.slice(0, 10)}
                        </span>
                        {isOverdue && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#dc2626" }}>
                            OVERDUE
                          </span>
                        )}
                        {isFollowUpDueToday && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: "#d97706" }}>
                            DUE TODAY
                          </span>
                        )}
                      </div>
                    ) : (
                      <span style={{ fontSize: 12, color: "var(--text-dim)" }}>None</span>
                    )}
                  </td>

                  {/* Demo Status */}
                  <td>
                    <span
                      className="badge"
                      style={{
                        fontSize: 10,
                        background:
                          lead.demoStatus === "SHARED"
                            ? "#dcfce7"
                            : lead.demoStatus === "READY"
                            ? "#e0e7ff"
                            : lead.demoStatus === "IN_PROGRESS"
                            ? "#fef3c7"
                            : "#f1f5f9",
                        color:
                          lead.demoStatus === "SHARED"
                            ? "#166534"
                            : lead.demoStatus === "READY"
                            ? "#3730a3"
                            : lead.demoStatus === "IN_PROGRESS"
                            ? "#92400e"
                            : "#64748b"
                      }}
                    >
                      {lead.demoStatus || "NOT STARTED"}
                    </span>
                  </td>

                  {/* Actions */}
                  <td style={{ textAlign: "right" }}>
                    <div style={{ display: "inline-flex", gap: 6 }}>
                      <button
                        className="btn btn-sm btn-secondary"
                        onClick={() => onSelectLead(lead)}
                        title="Open full lead dossier"
                      >
                        View
                      </button>
                      <button
                        className="btn btn-sm btn-primary"
                        onClick={() => onOpenPitch(lead)}
                        title="Generate or view outreach pitch"
                      >
                        Pitch
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* =========================================================================
          2. MOBILE VIEW: Touch-Optimized Cards
          ========================================================================= */}
      <div className="mobile-only">
        {leads.map(lead => {
          const isFollowUpDueToday = lead.nextFollowUpAt?.slice(0, 10) === todayStr;
          const isOverdue =
            lead.nextFollowUpAt &&
            lead.nextFollowUpAt.slice(0, 10) < todayStr &&
            !["WON", "LOST", "NOT_A_FIT"].includes(lead.status);

          const hasWebsite = Boolean(lead.website && lead.websiteStatus !== "NONE");
          const websiteScore = lead.analysis?.basicScore;

          return (
            <div key={lead.id} className="mobile-lead-card">
              {/* Card Header: Business Name, Category & Priority */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
                <div>
                  <div
                    style={{ fontWeight: 800, fontSize: 16, color: "var(--text-main)", cursor: "pointer" }}
                    onClick={() => onSelectLead(lead)}
                  >
                    {lead.businessName}
                  </div>
                  <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 2 }}>
                    {lead.area ? `${lead.area}, ` : ""}{lead.city}
                    {lead.country ? ` · ${lead.country}` : ""}
                  </div>
                </div>

                {lead.score && (
                  <span className={`badge badge-priority-${lead.score.priority}`} style={{ flexShrink: 0 }}>
                    P-{lead.score.priority} · {lead.score.total}/55
                  </span>
                )}
              </div>

              {/* Sub-signals: Rating & Website */}
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, fontSize: 12 }}>
                <span
                  style={{
                    background: "#f1f5f9",
                    padding: "2px 7px",
                    borderRadius: "var(--radius-sm)",
                    fontWeight: 600
                  }}
                >
                  {lead.category || "Local"}
                </span>

                {lead.rating && (
                  <span style={{ color: "#f59e0b", fontWeight: 700 }}>
                    ★ {lead.rating.toFixed(1)} <span style={{ color: "var(--text-muted)" }}>({lead.reviews ?? 0})</span>
                  </span>
                )}

                {!hasWebsite ? (
                  <span className="badge badge-priority-C" style={{ background: "#fee2e2", color: "#991b1b" }}>
                    NO WEBSITE
                  </span>
                ) : (
                  <span
                    className="badge"
                    style={{
                      background: websiteScore && websiteScore > 75 ? "#dcfce7" : "#fef3c7",
                      color: websiteScore && websiteScore > 75 ? "#166534" : "#92400e"
                    }}
                  >
                    Site: {websiteScore !== undefined ? `${websiteScore}/100` : "Yes"}
                  </span>
                )}
              </div>

              {/* Direct 1-Tap Action Bar on Mobile */}
              <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                {lead.whatsapp && (
                  <a
                    href={getWhatsAppUrl(lead.whatsapp, lead.pitch?.whatsapp)}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-whatsapp btn-sm"
                    style={{ flex: 1, minWidth: 100 }}
                  >
                    💬 WhatsApp
                  </a>
                )}

                {lead.phone && (
                  <a
                    href={`tel:${lead.phone}`}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, minWidth: 70 }}
                  >
                    📞 Call
                  </a>
                )}

                {lead.email && (
                  <a
                    href={getMailtoUrl(lead.email, lead.pitch?.emailSubject, lead.pitch?.email)}
                    className="btn btn-secondary btn-sm"
                    style={{ flex: 1, minWidth: 70 }}
                  >
                    ✉️ Email
                  </a>
                )}

                {lead.mapsUrl && (
                  <a
                    href={lead.mapsUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="btn btn-outline btn-sm"
                  >
                    📍 Maps
                  </a>
                )}
              </div>

              {/* Status & Follow-up Footer */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  paddingTop: 8,
                  borderTop: "1px solid #f1f5f9"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <select
                    className={`badge-status badge-status-${lead.status}`}
                    value={lead.status}
                    onChange={e => onQuickStatusChange(lead.id, e.target.value as LeadStatus)}
                    style={{ border: "none", outline: "none", cursor: "pointer" }}
                  >
                    {ALL_STATUSES.map(st => (
                      <option key={st} value={st}>
                        {st.replace(/_/g, " ")}
                      </option>
                    ))}
                  </select>

                  {lead.nextFollowUpAt && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: isOverdue ? "#dc2626" : isFollowUpDueToday ? "#d97706" : "var(--text-muted)"
                      }}
                    >
                      {isOverdue ? "OVERDUE" : isFollowUpDueToday ? "DUE TODAY" : lead.nextFollowUpAt.slice(5, 10)}
                    </span>
                  )}
                </div>

                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => onSelectLead(lead)}
                  >
                    View
                  </button>
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => onOpenPitch(lead)}
                  >
                    Pitch
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </>
  );
}
