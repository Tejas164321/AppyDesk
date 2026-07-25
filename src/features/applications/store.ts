import { create } from "zustand";
import { ApplicationItem, ExtractionResult } from "./types";

interface ApplicationState {
  currentDraft: Partial<ApplicationItem> | null;
  extracting: boolean;
  sending: boolean;
  lastSentApp: ApplicationItem | null;
  error: string | null;

  setDraft: (draft: Partial<ApplicationItem> | null) => void;
  updateDraftField: (field: keyof ApplicationItem, value: any) => void;
  extractJob: (text: string, imageUrl?: string, uid?: string) => Promise<ExtractionResult | null>;
  sendApplication: (uid: string) => Promise<boolean>;
  resetDraft: () => void;
}

export const useApplicationStore = create<ApplicationState>((set, get) => ({
  currentDraft: null,
  extracting: false,
  sending: false,
  lastSentApp: null,
  error: null,

  setDraft: (draft) => set({ currentDraft: draft, error: null }),

  updateDraftField: (field, value) => {
    const draft = get().currentDraft;
    if (draft) {
      set({ currentDraft: { ...draft, [field]: value } });
    }
  },

  extractJob: async (text: string, imageUrl?: string, uid?: string) => {
    set({ extracting: true, error: null });
    try {
      const res = await fetch("/api/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, imageUrl, uid }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to extract job posting");
      }

      const data: ExtractionResult = await res.json();
      set({
        currentDraft: {
          company: data.company,
          role: data.role,
          contactEmail: data.contactEmail,
          location: data.location,
          matchScore: data.matchScore,
          keyRequirements: data.keyRequirements,
          subject: data.subject,
          body: data.body,
          jdSnippet: text || "Screenshot image",
          source: imageUrl ? "screenshot" : "paste",
          status: "drafted",
        },
        extracting: false,
      });
      return data;
    } catch (err: any) {
      set({ extracting: false, error: err?.message || "Extraction failed" });
      return null;
    }
  },

  sendApplication: async (uid: string) => {
    const draft = get().currentDraft;
    if (!draft || !draft.contactEmail || !draft.subject || !draft.body) {
      set({ error: "Contact email, subject, and body are required to send" });
      return false;
    }

    set({ sending: true, error: null });
    try {
      const res = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...draft,
          uid,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to send email");
      }

      const resData = await res.json();
      set({
        sending: false,
        lastSentApp: resData.application,
        currentDraft: null,
      });
      return true;
    } catch (err: any) {
      set({ sending: false, error: err?.message || "Failed to send application email" });
      return false;
    }
  },

  resetDraft: () => set({ currentDraft: null, error: null }),
}));
