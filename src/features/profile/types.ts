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
}
