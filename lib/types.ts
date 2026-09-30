export type LeadStatus =
  | "NEW"
  | "RESEARCHED"
  | "READY_TO_CONTACT"
  | "CONTACTED"
  | "FOLLOW_UP"
  | "REPLIED"
  | "INTERESTED"
  | "DEMO_SENT"
  | "CALL_SCHEDULED"
  | "NEGOTIATION"
  | "WON"
  | "LOST"
  | "NOT_A_FIT";

export type DemoStatus = "NOT_STARTED" | "IN_PROGRESS" | "READY" | "SHARED";

export type WebsiteStatus = "NONE" | "GOOD" | "NEEDS_IMPROVEMENT" | "UNKNOWN";

export type BrokenLinksResult = {
  checked: number;
  broken: number;
  brokenUrls: string[];
};

export type AccessibilitySignals = {
  hasLang: boolean;
  imageAltRatio: number;
  hasAria: boolean;
};

export type WebsiteAnalysis = {
  reachable: boolean;
  https: boolean;
  mobileMeta: boolean;
  title: boolean;
  titleText?: string;
  metaDescription: boolean;
  metaDescriptionText?: string;
  h1: boolean;
  h1Text?: string;
  favicon: boolean;
  responsive: boolean;
  phoneCta: boolean;
  whatsappCta: boolean;
  bookingCta: boolean;
  orderCta: boolean;
  contactCta: boolean;
  contactForm: boolean;
  menuOrServices: boolean;
  addressDetected: boolean;
  mapsLink: boolean;
  socialLinks: string[];
  performanceLatencyMs: number;
  payloadSizeKb: number;
  accessibilitySignals: AccessibilitySignals;
  brokenLinks?: BrokenLinksResult;
  findings: string[];
  strengths: string[];
  gaps: string[];
  opportunities: string[];
  basicScore: number;
  analyzedAt: string;
};

export type ScoreReason = {
  category: string;
  score: number;
  max: number;
  reason: string;
};

export type LeadScore = {
  websiteNeed: number;
  growthPotential: number;
  onlinePresenceGap: number;
  googlePresence: number;
  revenueImpact: number;
  easeOfContact: number;
  total: number; // 0-55
  priority: "A" | "B" | "C";
  priorityLabel: "High opportunity" | "Moderate opportunity" | "Low opportunity";
  buyingSignal: "Strong" | "Moderate" | "Weak";
  reasons: ScoreReason[];
};

export type PitchPack = {
  whatsapp: string;
  emailSubject: string;
  email: string;
  followUp1: string;
  followUp2: string;
  angle: string;
  suggestedDemoSections: string[];
  engine: "Local Ollama" | "Built-in Free Template Engine";
  modelUsed?: string;
  toneUsed?: string;
  targetUsed?: string;
};

export type PitchOptions = {
  tone?: "friendly" | "professional" | "premium" | "short";
  target?: "receptionist" | "owner" | "manager" | "marketing";
  category?: string;
  highTicketTreatments?: string[];
};

export type ActivityLog = {
  id: string;
  leadId: string;
  type:
    | "LEAD_CREATED"
    | "ANALYZED"
    | "PITCH_GENERATED"
    | "CONTACTED"
    | "FOLLOW_UP_SCHEDULED"
    | "FOLLOW_UP_COMPLETED"
    | "STATUS_CHANGED"
    | "DEMO_UPDATED"
    | "NOTE_ADDED";
  title: string;
  details?: string;
  timestamp: string;
};

export type Lead = {
  id: string;
  createdAt: string;
  updatedAt: string;
  businessName: string;
  category: string;
  country: string;
  city: string;
  area: string;
  mapsUrl: string;
  rating: number | null;
  reviews: number | null;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  instagram: string;
  facebook: string;
  services: string[];
  branches: number;
  buyingSignals: string[];
  websiteStatus: WebsiteStatus;
  analysis?: WebsiteAnalysis;
  score?: LeadScore;
  pitch?: PitchPack;
  status: LeadStatus;
  dealValue?: number;
  source?: string;
  contactedAt?: string;
  nextFollowUpAt?: string;
  followUpStage?: number; // 0 = initial, 1 = follow-up #1, 2 = follow-up #2, 3 = complete/stopped
  demoUrl?: string;
  demoScreenshot?: string;
  demoStatus?: DemoStatus;
  notes?: string;
};

export type UserSettings = {
  userName: string;
  userRole: string;
  agencyName: string;
  portfolioUrl: string;
  userEmail: string;
  userWhatsApp: string;
  defaultCity: string;
  defaultCategory: string;
  defaultTone: "friendly" | "professional" | "premium" | "short";
  ollamaUrl: string;
  ollamaModel: string;
};
