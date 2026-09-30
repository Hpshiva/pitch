"use client";

import React, { useState, useEffect } from "react";
import { UserSettings } from "@/lib/types";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSettingsSaved: (settings: UserSettings) => void;
  onToast: (msg: string) => void;
};

export default function SettingsModal({
  isOpen,
  onClose,
  onSettingsSaved,
  onToast
}: SettingsModalProps) {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [testingOllama, setTestingOllama] = useState(false);
  const [ollamaResult, setOllamaResult] = useState<{
    online: boolean;
    models: string[];
    message?: string;
  } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetch("/api/settings")
        .then(r => r.json())
        .then(setSettings)
        .catch(() => {});
    }
  }, [isOpen]);

  if (!isOpen || !settings) return null;

  async function handleTestOllama() {
    setTestingOllama(true);
    setOllamaResult(null);
    try {
      const res = await fetch("/api/ollama-status");
      const data = await res.json();
      setOllamaResult(data);
      if (data.online) {
        onToast(`Ollama is online! Detected ${data.models.length} model(s).`);
      } else {
        onToast("Ollama not running. Built-in template engine is active & ready.");
      }
    } catch {
      setOllamaResult({
        online: false,
        models: [],
        message: "Failed to connect to local Ollama service."
      });
    } finally {
      setTestingOllama(false);
    }
  }

  async function handleSave() {
    if (!settings) return;
    setSaving(true);
    try {
      const res = await fetch("/api/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings)
      });
      const data = await res.json();
      onSettingsSaved(data);
      onToast("Settings saved successfully");
      onClose();
    } catch {
      onToast("Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-content" style={{ maxWidth: 650 }}>
        <div className="modal-header">
          <div>
            <div style={{ fontSize: 16, fontWeight: 800 }}>Agency & Pitch Settings</div>
            <div style={{ fontSize: 12, color: "var(--text-muted)" }}>
              Customize your profile, branding, and local AI configuration
            </div>
          </div>
          <button className="btn btn-ghost btn-sm" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {/* User Profile */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Your Name</label>
              <input
                className="form-input"
                value={settings.userName}
                onChange={e => setSettings({ ...settings, userName: e.target.value })}
                placeholder="Shiva"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Your Professional Role</label>
              <input
                className="form-input"
                value={settings.userRole}
                onChange={e => setSettings({ ...settings, userRole: e.target.value })}
                placeholder="Frontend Developer & Web Specialist"
              />
            </div>
          </div>

          {/* Agency & Portfolio */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Agency / Brand Name</label>
              <input
                className="form-input"
                value={settings.agencyName}
                onChange={e => setSettings({ ...settings, agencyName: e.target.value })}
                placeholder="Independent Web Studio"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Portfolio URL</label>
              <input
                className="form-input"
                value={settings.portfolioUrl}
                onChange={e => setSettings({ ...settings, portfolioUrl: e.target.value })}
                placeholder="https://yourportfolio.com"
              />
            </div>
          </div>

          {/* Contact Details */}
          <div className="form-grid-2">
            <div className="form-group">
              <label className="form-label">Your Email</label>
              <input
                className="form-input"
                type="email"
                value={settings.userEmail}
                onChange={e => setSettings({ ...settings, userEmail: e.target.value })}
                placeholder="shiva@example.com"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Your WhatsApp Number</label>
              <input
                className="form-input"
                value={settings.userWhatsApp}
                onChange={e => setSettings({ ...settings, userWhatsApp: e.target.value })}
                placeholder="+971 50 000 0000"
              />
            </div>
          </div>

          {/* Defaults */}
          <div className="form-grid-3">
            <div className="form-group">
              <label className="form-label">Default City</label>
              <input
                className="form-input"
                value={settings.defaultCity}
                onChange={e => setSettings({ ...settings, defaultCity: e.target.value })}
                placeholder="Dubai"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Default Category</label>
              <input
                className="form-input"
                value={settings.defaultCategory}
                onChange={e => setSettings({ ...settings, defaultCategory: e.target.value })}
                placeholder="Dental Clinic"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Default Pitch Tone</label>
              <select
                className="form-select"
                value={settings.defaultTone}
                onChange={e => setSettings({ ...settings, defaultTone: e.target.value as any })}
              >
                <option value="friendly">Friendly</option>
                <option value="professional">Professional</option>
                <option value="premium">Premium</option>
                <option value="short">Very Short</option>
              </select>
            </div>
          </div>

          {/* Local Ollama AI Settings */}
          <div
            style={{
              background: "#f8fafc",
              border: "1px solid var(--border-light)",
              borderRadius: "var(--radius-lg)",
              padding: 16,
              marginTop: 6
            }}
          >
            <div style={{ fontWeight: 800, fontSize: 13, marginBottom: 4 }}>
              Local AI Engine (Optional Ollama)
            </div>
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 12 }}>
              If Ollama is not installed or running, the tool seamlessly uses its high-converting built-in free template engine. Zero paid API keys required.
            </div>

            <div className="form-grid-split">
              <div className="form-group">
                <label className="form-label">Ollama URL</label>
                <input
                  className="form-input"
                  value={settings.ollamaUrl}
                  onChange={e => setSettings({ ...settings, ollamaUrl: e.target.value })}
                  placeholder="http://127.0.0.1:11434"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Ollama Model</label>
                <input
                  className="form-input"
                  value={settings.ollamaModel}
                  onChange={e => setSettings({ ...settings, ollamaModel: e.target.value })}
                  placeholder="qwen3:8b"
                />
              </div>
            </div>

            <div style={{ marginTop: 12, display: "flex", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={handleTestOllama}
                disabled={testingOllama}
              >
                {testingOllama ? "Pinging Ollama…" : "🔌 Test Ollama Connection"}
              </button>

              {ollamaResult && (
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: ollamaResult.online ? "#166534" : "#92400e"
                  }}
                >
                  {ollamaResult.online
                    ? `✓ Online (${ollamaResult.models.length} model(s) available)`
                    : "⚡ Offline (Free Template Engine is active)"}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn btn-outline" onClick={onClose} disabled={saving}>
            Cancel
          </button>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving…" : "Save Settings"}
          </button>
        </div>
      </div>
    </div>
  );
}
