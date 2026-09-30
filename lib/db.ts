import fs from "fs";
import path from "path";
import { Lead, UserSettings, ActivityLog } from "./types";

const isServerless = process.env.VERCEL === "1" || Boolean(process.env.AWS_LAMBDA_FUNCTION_NAME);

// On Vercel, the root filesystem is read-only. We use /tmp/data for runtime writes, seeded from process.cwd()/data.
const sourceDataDir = path.join(process.cwd(), "data");
const activeDataDir = isServerless ? path.join("/tmp", "lead-engine-data") : sourceDataDir;

const leadsPath = path.join(activeDataDir, "leads.json");
const settingsPath = path.join(activeDataDir, "settings.json");
const activitiesPath = path.join(activeDataDir, "activities.json");

const sourceLeadsPath = path.join(sourceDataDir, "leads.json");
const sourceSettingsPath = path.join(sourceDataDir, "settings.json");
const sourceActivitiesPath = path.join(sourceDataDir, "activities.json");

export const DEFAULT_SETTINGS: UserSettings = {
  userName: "Shiva",
  userRole: "Frontend Developer & Web Specialist",
  agencyName: "Independent Web Development Studio",
  portfolioUrl: "",
  userEmail: "",
  userWhatsApp: "",
  defaultCity: "Dubai",
  defaultCategory: "Dental Clinic",
  defaultTone: "friendly",
  ollamaUrl: process.env.OLLAMA_URL || "http://127.0.0.1:11434",
  ollamaModel: process.env.OLLAMA_MODEL || "qwen3:8b"
};

function ensureDir(p: string) {
  try {
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
    }
  } catch {}
}

function ensureFile(targetPath: string, sourcePath: string, defaultContent: string) {
  ensureDir(path.dirname(targetPath));
  if (!fs.existsSync(targetPath)) {
    // If source exists in repo, copy it over to runtime directory
    if (fs.existsSync(sourcePath)) {
      try {
        fs.copyFileSync(sourcePath, targetPath);
        return;
      } catch {}
    }
    try {
      fs.writeFileSync(targetPath, defaultContent, "utf8");
    } catch {}
  }
}

export function readLeads(): Lead[] {
  ensureFile(leadsPath, sourceLeadsPath, "[]");
  try {
    const raw = fs.readFileSync(leadsPath, "utf8");
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

export function writeLeads(leads: Lead[]) {
  ensureFile(leadsPath, sourceLeadsPath, "[]");
  try {
    fs.writeFileSync(leadsPath, JSON.stringify(leads, null, 2), "utf8");
  } catch {
    // If read-only error occurs, fallback to /tmp
    const fallbackPath = path.join("/tmp", "leads.json");
    try {
      fs.writeFileSync(fallbackPath, JSON.stringify(leads, null, 2), "utf8");
    } catch {}
  }
}

export function getLeadById(id: string): Lead | undefined {
  const leads = readLeads();
  return leads.find(l => l.id === id);
}

export function updateLead(id: string, updates: Partial<Lead>): Lead | undefined {
  const leads = readLeads();
  const idx = leads.findIndex(l => l.id === id);
  if (idx === -1) return undefined;

  const updated: Lead = {
    ...leads[idx],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  leads[idx] = updated;
  writeLeads(leads);
  return updated;
}

export function deleteLead(id: string): boolean {
  const leads = readLeads();
  const filtered = leads.filter(l => l.id !== id);
  if (filtered.length === leads.length) return false;
  writeLeads(filtered);
  return true;
}

export function readSettings(): UserSettings {
  ensureFile(settingsPath, sourceSettingsPath, JSON.stringify(DEFAULT_SETTINGS, null, 2));
  try {
    const raw = fs.readFileSync(settingsPath, "utf8");
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_SETTINGS, ...parsed };
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function writeSettings(settings: Partial<UserSettings>): UserSettings {
  const current = readSettings();
  const updated: UserSettings = { ...current, ...settings };
  ensureFile(settingsPath, sourceSettingsPath, "{}");
  try {
    fs.writeFileSync(settingsPath, JSON.stringify(updated, null, 2), "utf8");
  } catch {}
  return updated;
}

export function readActivities(leadId?: string): ActivityLog[] {
  ensureFile(activitiesPath, sourceActivitiesPath, "[]");
  try {
    const raw = fs.readFileSync(activitiesPath, "utf8");
    const activities: ActivityLog[] = JSON.parse(raw || "[]");
    if (leadId) {
      return activities.filter(a => a.leadId === leadId);
    }
    return activities;
  } catch {
    return [];
  }
}

export function logActivity(
  leadId: string,
  type: ActivityLog["type"],
  title: string,
  details?: string
): ActivityLog {
  ensureFile(activitiesPath, sourceActivitiesPath, "[]");
  const activities = readActivities();
  const newActivity: ActivityLog = {
    id: crypto.randomUUID(),
    leadId,
    type,
    title,
    details,
    timestamp: new Date().toISOString()
  };
  activities.unshift(newActivity);
  // Keep last 1000 activities
  const capped = activities.slice(0, 1000);
  try {
    fs.writeFileSync(activitiesPath, JSON.stringify(capped, null, 2), "utf8");
  } catch {}
  return newActivity;
}

export function createDatabaseBackup() {
  return {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    leads: readLeads(),
    settings: readSettings(),
    activities: readActivities()
  };
}

export function restoreDatabaseBackup(data: {
  leads?: Lead[];
  settings?: UserSettings;
  activities?: ActivityLog[];
}) {
  if (Array.isArray(data.leads)) {
    writeLeads(data.leads);
  }
  if (data.settings && typeof data.settings === "object") {
    writeSettings(data.settings);
  }
  if (Array.isArray(data.activities)) {
    ensureFile(activitiesPath, sourceActivitiesPath, "[]");
    try {
      fs.writeFileSync(activitiesPath, JSON.stringify(data.activities, null, 2), "utf8");
    } catch {}
  }
  return { success: true, leadCount: data.leads?.length ?? 0 };
}
