"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Lead, LeadStatus, UserSettings } from "@/lib/types";
import Navbar from "@/components/Navbar";
import StatsRow from "@/components/StatsRow";
import LeadTable from "@/components/LeadTable";
import AddLeadModal from "@/components/AddLeadModal";
import LeadDetailModal from "@/components/LeadDetailModal";
import SettingsModal from "@/components/SettingsModal";
import ImportExportModal from "@/components/ImportExportModal";
import DiscoveryModal from "@/components/DiscoveryModal";

const CATEGORIES = [
  "ALL",
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

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<UserSettings | null>(null);

  // AI Mode status
  const [aiMode, setAiMode] = useState<{
    online: boolean;
    mode: string;
    activeModel?: string;
  }>({
    online: false,
    mode: "Built-in Free Template Engine"
  });

  // Modal states
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isDiscoveryOpen, setIsDiscoveryOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);

  // Filters & Search
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [priorityFilter, setPriorityFilter] = useState("ALL");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [buyingSignalFilter, setBuyingSignalFilter] = useState("ALL");
  const [followUpFilter, setFollowUpFilter] = useState("");
  const [sortBy, setSortBy] = useState<"score" | "reviews" | "rating" | "recent" | "followup">("score");

  // Toast
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2800);
  }

  // Initial data loading
  useEffect(() => {
    fetchLeads();
    fetchSettings();
    checkOllama();
  }, []);

  async function fetchLeads() {
    setLoading(true);
    try {
      const res = await fetch("/api/leads");
      const data = await res.json();
      setLeads(Array.isArray(data) ? data : []);
    } catch {
      showToast("Could not load leads from database");
    } finally {
      setLoading(false);
    }
  }

  async function fetchSettings() {
    try {
      const res = await fetch("/api/settings");
      const data = await res.json();
      setSettings(data);
    } catch {}
  }

  async function checkOllama() {
    try {
      const res = await fetch("/api/ollama-status");
      const data = await res.json();
      setAiMode({
        online: data.online,
        mode: data.mode,
        activeModel: data.activeModel
      });
    } catch {
      setAiMode({
        online: false,
        mode: "Built-in Free Template Engine"
      });
    }
  }

  // Quick Lead Actions
  async function handleQuickStatusChange(leadId: string, newStatus: LeadStatus) {
    try {
      const res = await fetch(`/api/leads/${leadId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      });
      const updated = await res.json();
      setLeads(prev => prev.map(l => (l.id === leadId ? updated : l)));
      showToast(`Status updated to ${newStatus.replace(/_/g, " ")}`);
    } catch {
      showToast("Failed to update status");
    }
  }

  async function handleAnalyzeLead(lead: Lead) {
    showToast(`Analyzing ${lead.businessName} website...`);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(lead)
      });
      const data = await res.json();

      const patchRes = await fetch(`/api/leads/${lead.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          analysis: data.analysis,
          score: data.score,
          websiteStatus: !lead.website ? "NONE" : data.analysis.basicScore < 60 ? "NEEDS_IMPROVEMENT" : "GOOD"
        })
      });
      const updated = await patchRes.json();
      setLeads(prev => prev.map(l => (l.id === lead.id ? updated : l)));
      showToast(`Scored ${lead.businessName}: ${updated.score?.total}/55 (Priority ${updated.score?.priority})`);
    } catch {
      showToast("Failed to analyze website");
    }
  }

  function handleOpenPitch(lead: Lead) {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  }

  function handleSelectLead(lead: Lead) {
    setSelectedLead(lead);
    setIsDetailOpen(true);
  }

  function handleLeadAdded(newLead: Lead) {
    setLeads(prev => [newLead, ...prev]);
  }

  function handleLeadUpdated(updated: Lead) {
    setLeads(prev => prev.map(l => (l.id === updated.id ? updated : l)));
    if (selectedLead?.id === updated.id) {
      setSelectedLead(updated);
    }
  }

  function handleLeadDeleted(leadId: string) {
    setLeads(prev => prev.filter(l => l.id !== leadId));
    if (selectedLead?.id === leadId) {
      setSelectedLead(null);
    }
    showToast("Lead removed from database");
  }

  // Filter & Sort Logic
  const filteredLeads = useMemo(() => {
    let result = [...leads];
    const todayStr = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().slice(0, 10);

    // Search
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        l =>
          l.businessName.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          l.area.toLowerCase().includes(q) ||
          l.phone.includes(q) ||
          l.whatsapp.includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.website.toLowerCase().includes(q) ||
          (l.notes && l.notes.toLowerCase().includes(q))
      );
    }

    // Category
    if (categoryFilter !== "ALL") {
      result = result.filter(l => l.category.toLowerCase() === categoryFilter.toLowerCase());
    }

    // Priority
    if (priorityFilter !== "ALL") {
      result = result.filter(l => l.score?.priority === priorityFilter);
    }

    // Status
    if (statusFilter !== "ALL") {
      result = result.filter(l => l.status === statusFilter);
    }

    // Buying Signal
    if (buyingSignalFilter !== "ALL") {
      result = result.filter(l => l.score?.buyingSignal === buyingSignalFilter);
    }

    // Follow-up Due
    if (followUpFilter === "today") {
      result = result.filter(l => l.nextFollowUpAt?.slice(0, 10) === todayStr);
    } else if (followUpFilter === "tomorrow") {
      result = result.filter(l => l.nextFollowUpAt?.slice(0, 10) === tomorrowStr);
    } else if (followUpFilter === "overdue") {
      result = result.filter(
        l => l.nextFollowUpAt && l.nextFollowUpAt.slice(0, 10) < todayStr && !["WON", "LOST", "NOT_A_FIT"].includes(l.status)
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === "score") {
        return (b.score?.total || 0) - (a.score?.total || 0);
      }
      if (sortBy === "reviews") {
        return (b.reviews || 0) - (a.reviews || 0);
      }
      if (sortBy === "rating") {
        return (b.rating || 0) - (a.rating || 0);
      }
      if (sortBy === "followup") {
        if (!a.nextFollowUpAt) return 1;
        if (!b.nextFollowUpAt) return -1;
        return a.nextFollowUpAt.localeCompare(b.nextFollowUpAt);
      }
      // recent (default)
      return b.createdAt.localeCompare(a.createdAt);
    });

    return result;
  }, [leads, search, categoryFilter, priorityFilter, statusFilter, buyingSignalFilter, followUpFilter, sortBy]);

  return (
    <main style={{ minHeight: "100vh", paddingBottom: 60 }}>
      {/* Top Navbar */}
      <Navbar
        aiMode={aiMode}
        onOpenAddModal={() => setIsAddOpen(true)}
        onOpenImportExport={() => setIsImportExportOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        onOpenDiscovery={() => setIsDiscoveryOpen(true)}
      />

      <div className="app-container" style={{ marginTop: 24 }}>
        {/* KPI Stats Row */}
        <StatsRow
          leads={leads}
          currentPriorityFilter={priorityFilter}
          currentStatusFilter={statusFilter}
          currentFollowUpFilter={followUpFilter}
          onFilterChange={(type, val) => {
            if (type === "priority") setPriorityFilter(val);
            if (type === "status") setStatusFilter(val);
            if (type === "followUp") setFollowUpFilter(val);
          }}
        />

        {/* Search, Filter & Controls Toolbar */}
        <div
          className="card"
          style={{
            padding: "14px 18px",
            marginBottom: 16,
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          {/* Search bar */}
          <div style={{ flex: 1, minWidth: 260 }}>
            <input
              className="form-input"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="🔍 Search name, phone, city, email, notes..."
            />
          </div>

          {/* Filter Dropdowns */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
            {/* Category */}
            <select
              className="form-select"
              style={{ width: "auto" }}
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
            >
              {CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c === "ALL" ? "All Categories" : c}
                </option>
              ))}
            </select>

            {/* Priority */}
            <select
              className="form-select"
              style={{ width: "auto" }}
              value={priorityFilter}
              onChange={e => setPriorityFilter(e.target.value)}
            >
              <option value="ALL">All Priorities</option>
              <option value="A">Priority A (High)</option>
              <option value="B">Priority B (Moderate)</option>
              <option value="C">Priority C (Low)</option>
            </select>

            {/* Buying Signal */}
            <select
              className="form-select"
              style={{ width: "auto" }}
              value={buyingSignalFilter}
              onChange={e => setBuyingSignalFilter(e.target.value)}
            >
              <option value="ALL">All Buying Signals</option>
              <option value="Strong">Strong Signal</option>
              <option value="Moderate">Moderate Signal</option>
              <option value="Weak">Weak Signal</option>
            </select>

            {/* Sort */}
            <select
              className="form-select"
              style={{ width: "auto" }}
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
            >
              <option value="score">Sort: Commercial Score</option>
              <option value="recent">Sort: Recently Added</option>
              <option value="reviews">Sort: Review Count</option>
              <option value="rating">Sort: Google Rating</option>
              <option value="followup">Sort: Follow-up Date</option>
            </select>

            {/* Clear Filters if active */}
            {(categoryFilter !== "ALL" ||
              priorityFilter !== "ALL" ||
              statusFilter !== "ALL" ||
              buyingSignalFilter !== "ALL" ||
              followUpFilter ||
              search) && (
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => {
                  setCategoryFilter("ALL");
                  setPriorityFilter("ALL");
                  setStatusFilter("ALL");
                  setBuyingSignalFilter("ALL");
                  setFollowUpFilter("");
                  setSearch("");
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </div>

        {/* Lead Table Header count */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, padding: "0 4px" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-muted)" }}>
            SHOWING {filteredLeads.length} OF {leads.length} LEADS
          </div>
          <div style={{ fontSize: 12, color: "var(--text-dim)" }}>
            Tip: Click a lead row to open full analysis, score reasons, and personalized pitches
          </div>
        </div>

        {/* Main Leads Table */}
        <LeadTable
          leads={filteredLeads}
          onSelectLead={handleSelectLead}
          onQuickStatusChange={handleQuickStatusChange}
          onAnalyzeLead={handleAnalyzeLead}
          onOpenPitch={handleOpenPitch}
          onToast={showToast}
        />

        {/* Fast Operational Workflow Guide Card */}
        <div
          className="card"
          style={{
            marginTop: 28,
            padding: 22,
            background: "#ffffff",
            display: "grid",
            gridTemplateColumns: "repeat(4, 1fr)",
            gap: 16
          }}
        >
          <div>
            <div style={{ fontSize: 20, marginBottom: 4 }}>1. 📍 Manual Discovery</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>Find High-Intent Business</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Search Google Maps for target niches (e.g. "dental implants Dubai" or "specialty coffee"). Copy URL or snippet.
            </div>
          </div>

          <div>
            <div style={{ fontSize: 20, marginBottom: 4 }}>2. ⚡ 1-Click Qualification</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>Analyze & Score</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              System runs free local website checks and computes a 55-point commercial score across 6 key factors.
            </div>
          </div>

          <div>
            <div style={{ fontSize: 20, marginBottom: 4 }}>3. 💬 Personalized Outreach</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>WhatsApp & Email Pack</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Generates respectful, receptionist-forwardable pitches offering a FREE custom website concept.
            </div>
          </div>

          <div>
            <div style={{ fontSize: 20, marginBottom: 4 }}>4. 📅 Follow-up Cadence</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: "var(--text-main)" }}>Day 0 → Day 3 → Day 7</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>
              Automated reminders track when to follow up and prompt when a custom website demo is ready.
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddLeadModal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        onLeadAdded={handleLeadAdded}
        defaultCity={settings?.defaultCity || "Dubai"}
        defaultCategory={settings?.defaultCategory || "Dental Clinic"}
        onToast={showToast}
      />

      <LeadDetailModal
        lead={selectedLead}
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        onUpdateLead={handleLeadUpdated}
        onDeleteLead={handleLeadDeleted}
        onToast={showToast}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onSettingsSaved={s => {
          setSettings(s);
          checkOllama();
        }}
        onToast={showToast}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        onRefreshLeads={fetchLeads}
        onToast={showToast}
      />

      <DiscoveryModal
        isOpen={isDiscoveryOpen}
        onClose={() => setIsDiscoveryOpen(false)}
        onLeadAdded={handleLeadAdded}
        onToast={showToast}
      />

      {/* Toast Notification Container */}
      {toast && (
        <div className="toast-container">
          <div className="toast-item">
            <span>⚡</span>
            <span>{toast}</span>
          </div>
        </div>
      )}
    </main>
  );
}
