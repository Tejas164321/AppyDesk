export type LLMProvider = "anthropic" | "gemini" | "groq" | "grok" | "openai";

export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  model: string;
  customEndpoint?: string;
}

export interface ResumeFile {
  cloudinaryUrl: string;
  publicId: string;
  filename: string;
  mimeType: string;
  uploadedAt: string;
}

export interface ProfileLinks {
  linkedin: string;
  github: string;
  portfolio: string;
  resumeLink: string;
}

export interface ProfileSettings {
  dailySendCap: number;
  warmupStartDate: string;
  timezone: string;
}

export interface WorkExperience {
  id: string;
  company: string;
  title: string;
  startDate: string;       // "YYYY-MM" format e.g. "2022-03"
  endDate: string | null;  // null = currently working here
  isCurrent: boolean;
  location: string;
  description: string;     // accomplishments / bullet points
}

export interface Education {
  id: string;
  school: string;
  degree: string;          // e.g. "Bachelor of Science"
  field: string;           // e.g. "Computer Science"
  startDate: string;       // "YYYY" or "YYYY-MM"
  endDate: string;         // "YYYY" or "YYYY-MM"
  gpa?: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  links: ProfileLinks;
  resumeFile?: ResumeFile | null;
  summary: string;
  settings: ProfileSettings;
  llmConfig?: LLMConfig;
  updatedAt?: string;

  // Rich context for accurate autofill
  workExperience?: WorkExperience[];
  education?: Education[];
  skills?: string[];
  yearsOfExperience?: number;
  workAuthorization?: string;   // "US Citizen", "H1B Visa", "Need Sponsorship", etc.
  salaryExpectation?: string;   // e.g. "$120k - $150k" or "Open to discussion"
  availableFrom?: string;       // "Immediately", "2 weeks notice", "1 month notice"
  languages?: string[];         // e.g. ["English (Native)", "Spanish (Conversational)"]
}
