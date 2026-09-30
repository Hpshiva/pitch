"use client";

import React from "react";

type NavbarProps = {
  aiMode: {
    online: boolean;
    mode: string;
    activeModel?: string;
  };
  onOpenAddModal: () => void;
  onOpenImportExport: () => void;
  onOpenSettings: () => void;
  onOpenDiscovery: () => void;
};

export default function Navbar({
  aiMode,
  onOpenAddModal,
  onOpenImportExport,
  onOpenSettings,
  onOpenDiscovery
}: NavbarProps) {
  return (
    <header className="top-navbar">
      <div className="app-container">
        <div className="nav-inner">
          <div className="nav-brand">
            <div className="brand-icon">⚡</div>
            <div>
              <div className="brand-title">Local Business Lead Engine</div>
              <div className="brand-subtitle">₹0-First Client Acquisition & Outreach</div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* AI Status Pill */}
            <div
              className={`status-pill ${aiMode.online ? "active" : ""}`}
              title={
                aiMode.online
                  ? `Connected to local Ollama (${aiMode.activeModel})`
                  : "Ollama not detected. Using built-in free template engine (100% offline & ₹0)"
              }
              style={{ cursor: "pointer" }}
              onClick={onOpenSettings}
            >
              <div
                className={`status-indicator ${aiMode.online ? "pulse" : ""}`}
                style={{ background: aiMode.online ? "#10b981" : "#60a5fa" }}
              />
              <span>
                {aiMode.online
                  ? `AI: Ollama (${aiMode.activeModel || "local"})`
                  : "AI: Free Template Engine"}
              </span>
            </div>

            {/* Quick Actions */}
            <button
              className="btn btn-outline btn-sm"
              onClick={onOpenDiscovery}
              title="Optional free discovery via OpenStreetMap (No API key needed)"
              style={{ color: "#cbd5e1", borderColor: "#334155" }}
            >
              <span>🌍 Free Discovery</span>
            </button>

            <button
              className="btn btn-outline btn-sm"
              onClick={onOpenImportExport}
              title="Import or Export CSV & JSON backups"
              style={{ color: "#cbd5e1", borderColor: "#334155" }}
            >
              <span>📁 Import / Export</span>
            </button>

            <button
              className="btn btn-outline btn-sm"
              onClick={onOpenSettings}
              title="Agency branding and AI settings"
              style={{ color: "#cbd5e1", borderColor: "#334155" }}
            >
              <span>⚙️ Settings</span>
            </button>

            <button
              className="btn btn-accent btn-sm"
              onClick={onOpenAddModal}
              style={{ fontWeight: 700 }}
            >
              <span>+ Add Lead</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
