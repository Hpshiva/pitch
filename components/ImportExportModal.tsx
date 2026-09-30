"use client";

import React, { useState, useRef } from "react";

type ImportExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onRefreshLeads: () => void;
  onToast: (msg: string) => void;
};

export default function ImportExportModal({
  isOpen,
  onClose,
  onRefreshLeads,
  onToast
}: ImportExportModalProps) {
  const [importing, setImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  function handleExportCsv() {
    window.open("/api/export?format=csv", "_blank");
    onToast("Downloading CSV export...");
  }

  function handleExportJson() {
    window.open("/api/export?format=json", "_blank");
    onToast("Downloading JSON database backup...");
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const isJson = file.name.endsWith(".json");
      const text = await file.text();

      const res = await fetch("/api/import", {
        method: "POST",
        headers: {
          "Content-Type": isJson ? "application/json" : "text/csv"
        },
        body: text
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Import failed");

      onToast(data.message || `Imported ${data.count} leads`);
      onRefreshLeads();
      onClose();
    } catch (err: any) {
      onToast(`Import error: ${err.message}`);
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 600 }}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Import & Export Leads</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Easily move leads between computers with zero lock-in
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          {/* Export Section */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: 16
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
              📤 Export Your Data
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
              Download your full leads dataset for spreadsheets or complete offline backups.
            </div>

            <div style={{ display: "flex", gap: 10 }}>
              <button className="btn btn-secondary" onClick={handleExportCsv}>
                📊 Export CSV (Spreadsheets)
              </button>
              <button className="btn btn-outline" onClick={handleExportJson}>
                💾 Backup Full Database (JSON)
              </button>
            </div>
          </div>

          {/* Import Section */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: 16
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 14, marginBottom: 4 }}>
              📥 Import / Restore Data
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
              Upload any lead CSV file or a previously exported JSON database backup.
            </div>

            <input
              type="file"
              ref={fileInputRef}
              accept=".csv,.json"
              onChange={handleFileUpload}
              style={{ display: "none" }}
            />

            <button
              className="btn btn-primary"
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
            >
              {importing ? "Processing Import…" : "📂 Select CSV or JSON Backup File"}
            </button>
          </div>
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
