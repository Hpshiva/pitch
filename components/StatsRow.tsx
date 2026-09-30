"use client";

import React from "react";
import { Lead } from "@/lib/types";

type StatsRowProps = {
  leads: Lead[];
  currentPriorityFilter: string;
  currentStatusFilter: string;
  currentFollowUpFilter: string;
  onFilterChange: (type: "priority" | "status" | "followUp", val: string) => void;
};

export default function StatsRow({
  leads,
  currentPriorityFilter,
  currentStatusFilter,
  currentFollowUpFilter,
  onFilterChange
}: StatsRowProps) {
  const todayStr = new Date().toISOString().slice(0, 10);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().slice(0, 10);

  const total = leads.length;
  const priorityA = leads.filter(l => l.score?.priority === "A").length;
  const priorityB = leads.filter(l => l.score?.priority === "B").length;
  const priorityC = leads.filter(l => l.score?.priority === "C").length;

  const newOrResearched = leads.filter(l => ["NEW", "RESEARCHED", "READY_TO_CONTACT"].includes(l.status)).length;
  const contacted = leads.filter(l => ["CONTACTED", "FOLLOW_UP"].includes(l.status)).length;
  const interested = leads.filter(l => ["REPLIED", "INTERESTED", "CALL_SCHEDULED"].includes(l.status)).length;
  const demos = leads.filter(l => l.status === "DEMO_SENT" || l.demoStatus === "SHARED" || l.demoStatus === "READY").length;
  const won = leads.filter(l => l.status === "WON").length;

  const dueToday = leads.filter(l => l.nextFollowUpAt?.slice(0, 10) === todayStr).length;
  const overdue = leads.filter(
    l => l.nextFollowUpAt && l.nextFollowUpAt.slice(0, 10) < todayStr && !["WON", "LOST", "NOT_A_FIT"].includes(l.status)
  ).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 20 }}>
      {/* Urgent Follow-up Alert Banner if overdue or due today */}
      {(dueToday > 0 || overdue > 0) && (
        <div
          className="followup-alert-banner"
          style={{
            background: overdue > 0 ? "#fef2f2" : "#fffbeb",
            border: `1px solid ${overdue > 0 ? "#fecaca" : "#fde68a"}`,
            borderRadius: "var(--radius-md)",
            padding: "10px 16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 10
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, fontWeight: 600 }}>
            <span>{overdue > 0 ? "🚨" : "⏰"}</span>
            <span style={{ color: overdue > 0 ? "#991b1b" : "#92400e" }}>
              {overdue > 0
                ? `${overdue} overdue follow-up task${overdue > 1 ? "s" : ""} pending! (${dueToday} due today)`
                : `${dueToday} follow-up task${dueToday > 1 ? "s" : ""} due today!`}
            </span>
          </div>

          <div className="followup-alert-actions" style={{ display: "flex", gap: 8 }}>
            <button
              className="btn btn-sm btn-outline"
              style={{
                borderColor: overdue > 0 ? "#f87171" : "#f59e0b",
                color: overdue > 0 ? "#991b1b" : "#92400e",
                background: "white"
              }}
              onClick={() => onFilterChange("followUp", overdue > 0 ? "overdue" : "today")}
            >
              Filter Follow-ups Due
            </button>
            {currentFollowUpFilter && (
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => onFilterChange("followUp", "")}
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid-cols-6">
        {/* Total Leads */}
        <div
          className="stat-card"
          style={{ cursor: "pointer", borderColor: currentPriorityFilter === "ALL" && !currentStatusFilter ? "var(--brand-accent)" : undefined }}
          onClick={() => {
            onFilterChange("priority", "ALL");
            onFilterChange("status", "ALL");
            onFilterChange("followUp", "");
          }}
        >
          <span className="stat-label">Total Leads</span>
          <span className="stat-value">{total}</span>
          <span className="stat-sub">In local database</span>
        </div>

        {/* Priority A */}
        <div
          className="stat-card"
          style={{
            cursor: "pointer",
            background: currentPriorityFilter === "A" ? "#f0fdf4" : "white",
            borderColor: currentPriorityFilter === "A" ? "#86efac" : undefined
          }}
          onClick={() => onFilterChange("priority", currentPriorityFilter === "A" ? "ALL" : "A")}
        >
          <span className="stat-label" style={{ color: "#166534" }}>Priority A</span>
          <span className="stat-value" style={{ color: "#15803d" }}>{priorityA}</span>
          <span className="stat-sub">High opportunity (44-55)</span>
        </div>

        {/* Priority B */}
        <div
          className="stat-card"
          style={{
            cursor: "pointer",
            background: currentPriorityFilter === "B" ? "#fffbeb" : "white",
            borderColor: currentPriorityFilter === "B" ? "#fde68a" : undefined
          }}
          onClick={() => onFilterChange("priority", currentPriorityFilter === "B" ? "ALL" : "B")}
        >
          <span className="stat-label" style={{ color: "#92400e" }}>Priority B</span>
          <span className="stat-value" style={{ color: "#b45309" }}>{priorityB}</span>
          <span className="stat-sub">Moderate opportunity (34-43)</span>
        </div>

        {/* Contacted */}
        <div
          className="stat-card"
          style={{
            cursor: "pointer",
            borderColor: currentStatusFilter === "CONTACTED" ? "var(--brand-accent)" : undefined
          }}
          onClick={() => onFilterChange("status", currentStatusFilter === "CONTACTED" ? "ALL" : "CONTACTED")}
        >
          <span className="stat-label">Contacted / Follow-up</span>
          <span className="stat-value">{contacted}</span>
          <span className="stat-sub">{newOrResearched} uncontacted</span>
        </div>

        {/* Interested */}
        <div
          className="stat-card"
          style={{
            cursor: "pointer",
            borderColor: currentStatusFilter === "INTERESTED" ? "#86efac" : undefined
          }}
          onClick={() => onFilterChange("status", currentStatusFilter === "INTERESTED" ? "ALL" : "INTERESTED")}
        >
          <span className="stat-label" style={{ color: "#15803d" }}>Interested / Replied</span>
          <span className="stat-value" style={{ color: "#15803d" }}>{interested}</span>
          <span className="stat-sub">{demos} demos shared</span>
        </div>

        {/* Won */}
        <div
          className="stat-card"
          style={{
            cursor: "pointer",
            background: "#ecfdf5",
            borderColor: currentStatusFilter === "WON" ? "#10b981" : "#a7f3d0"
          }}
          onClick={() => onFilterChange("status", currentStatusFilter === "WON" ? "ALL" : "WON")}
        >
          <span className="stat-label" style={{ color: "#065f46" }}>Clients Won</span>
          <span className="stat-value" style={{ color: "#047857" }}>{won}</span>
          <span className="stat-sub">Closed web deals</span>
        </div>
      </div>
    </div>
  );
}
