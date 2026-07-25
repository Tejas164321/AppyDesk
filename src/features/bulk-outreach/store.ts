import { create } from "zustand";
import { ContactRow, BulkRowStatus } from "./types";
import { parseContactFile } from "./lib/parser";

interface BulkState {
  listName: string;
  contacts: ContactRow[];
  complianceConfirmed: boolean;
  pitchContext: string;
  parsing: boolean;
  drafting: boolean;
  sending: boolean;
  currentIndex: number;
  error: string | null;

  setListName: (name: string) => void;
  setComplianceConfirmed: (confirmed: boolean) => void;
  setPitchContext: (context: string) => void;
  uploadFile: (file: File) => Promise<void>;
  updateRowDraft: (id: string, subject: string, body: string) => void;
  generateBatchDrafts: (userSummary: string, userName: string, userEmail: string) => Promise<void>;
  sendBatch: (uid: string, dailyCap?: number) => Promise<void>;
  resetBulk: () => void;
}

export const useBulkStore = create<BulkState>((set, get) => ({
  listName: "",
  contacts: [],
  complianceConfirmed: false,
  pitchContext: "",
  parsing: false,
  drafting: false,
  sending: false,
  currentIndex: -1,
  error: null,

  setListName: (name) => set({ listName: name }),
  setComplianceConfirmed: (confirmed) => set({ complianceConfirmed: confirmed }),
  setPitchContext: (context) => set({ pitchContext: context }),

  uploadFile: async (file: File) => {
    set({ parsing: true, error: null, listName: file.name });
    try {
      const rows = await parseContactFile(file);
      if (!rows.length) {
        throw new Error("No valid contact rows with email addresses found in file");
      }
      set({ contacts: rows, parsing: false });
    } catch (err: any) {
      set({ parsing: false, error: err?.message || "File parsing failed" });
    }
  },

  updateRowDraft: (id: string, subject: string, body: string) => {
    set((state) => ({
      contacts: state.contacts.map((c) =>
        c.id === id ? { ...c, subject, body, status: "drafted" as BulkRowStatus } : c
      ),
    }));
  },

  generateBatchDrafts: async (userSummary: string, userName: string, userEmail: string) => {
    const pitch = get().pitchContext || "Software Engineering Role Outreach";
    set({ drafting: true, error: null });

    const contacts = get().contacts;
    const updated = contacts.map((c) => {
      const comp = c.company || "Hiring Team";
      const recipientName = c.name ? ` ${c.name}` : "";
      const subject = `Outreach: ${c.role || "Role Opportunity"} at ${comp} — ${userName}`;
      const body = `Hi${recipientName},

I am reaching out regarding potential opportunities at ${comp}. With my experience in ${userSummary.slice(0, 120)}..., I would love to connect and discuss how my background aligns with your team's goals.

Regarding ${pitch}: I bring hands-on experience building scalable applications and delivering strong results.

I have attached my resume for your reference.

Best regards,
${userName}
${userEmail}`;

      return {
        ...c,
        subject,
        body,
        status: "drafted" as BulkRowStatus,
      };
    });

    set({ contacts: updated, drafting: false });
  },

  sendBatch: async (uid: string, dailyCap: number = 15) => {
    if (!get().complianceConfirmed) {
      set({ error: "Sourcing compliance confirmation is required before sending batch" });
      return;
    }

    set({ sending: true, error: null });
    const contacts = get().contacts;

    for (let i = 0; i < contacts.length; i++) {
      const contact = contacts[i];
      if (contact.status === "sent") continue;

      set({ currentIndex: i });

      // Update row status to sending
      set((state) => ({
        contacts: state.contacts.map((c, idx) =>
          idx === i ? { ...c, status: "sending" as BulkRowStatus } : c
        ),
      }));

      try {
        const res = await fetch("/api/bulk/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ contact, uid, dailyCap }),
        });

        const data = await res.json();

        if (res.status === 429) {
          // Rate limited -> pause batch
          set((state) => ({
            contacts: state.contacts.map((c, idx) =>
              idx === i
                ? {
                    ...c,
                    status: "failed" as BulkRowStatus,
                    errorReason: data.error || "Rate limit reached",
                  }
                : c
            ),
            sending: false,
            error: data.error || "Batch sending paused: Daily cap reached.",
          }));
          return;
        }

        if (!res.ok) {
          throw new Error(data.error || "Send failed");
        }

        // Success
        set((state) => ({
          contacts: state.contacts.map((c, idx) =>
            idx === i ? { ...c, status: "sent" as BulkRowStatus, errorReason: undefined } : c
          ),
        }));

        // Randomized spacing between sends (using a conservative 3-6s for testing, production 20-60s)
        if (i < contacts.length - 1) {
          const delayMs = Math.floor(Math.random() * 3000) + 3000;
          await new Promise((r) => setTimeout(r, delayMs));
        }
      } catch (err: any) {
        set((state) => ({
          contacts: state.contacts.map((c, idx) =>
            idx === i
              ? {
                  ...c,
                  status: "failed" as BulkRowStatus,
                  failCount: (c.failCount || 0) + 1,
                  errorReason: err?.message || "Failed to send email",
                }
              : c
          ),
        }));
      }
    }

    set({ sending: false, currentIndex: -1 });
  },

  resetBulk: () =>
    set({
      listName: "",
      contacts: [],
      complianceConfirmed: false,
      pitchContext: "",
      parsing: false,
      drafting: false,
      sending: false,
      currentIndex: -1,
      error: null,
    }),
}));
