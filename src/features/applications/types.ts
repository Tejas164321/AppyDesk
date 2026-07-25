import { ApplicationStatus } from "@/components/ui/status-rail";

export interface StatusHistoryItem {
  status: ApplicationStatus;
  changedAt: string;
}

export interface ApplicationItem {
  id: string;
  userId: string;
  company: string;
  role: string;
  contactEmail: string;
  location?: string;
  source: "paste" | "screenshot" | "bulk";
  jdSnippet: string;
  matchScore: number;
  keyRequirements: string[];
  subject: string;
  body: string;
  status: ApplicationStatus;
  channel: "single" | "bulk";
  createdAt: string;
  sentAt?: string;
  lastUpdatedAt: string;
  history: StatusHistoryItem[];
  errorReason?: string;
}

export interface ExtractionResult {
  company: string;
  role: string;
  contactEmail: string;
  location: string;
  keyRequirements: string[];
  matchScore: number;
  subject: string;
  body: string;
}
