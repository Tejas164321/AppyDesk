import { create } from "zustand";
import { UserProfile, ResumeFile } from "./types";
import { fetchUserProfile, saveUserProfile } from "./api/profile";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

interface ProfileState {
  profile: UserProfile | null;
  loading: boolean;
  saveStatus: SaveStatus;
  lastSavedAt: string | null;
  errorMessage: string | null;

  loadProfile: (uid: string) => Promise<void>;
  updateProfile: (uid: string, data: Partial<UserProfile>) => Promise<void>;
  setResumeFile: (uid: string, file: ResumeFile) => Promise<void>;
}

export const useProfileStore = create<ProfileState>((set, get) => ({
  profile: null,
  loading: false,
  saveStatus: "idle",
  lastSavedAt: null,
  errorMessage: null,

  loadProfile: async (uid: string) => {
    set({ loading: true, errorMessage: null });
    try {
      const data = await fetchUserProfile(uid);
      set({ profile: data, loading: false });
    } catch (error: any) {
      set({ loading: false, errorMessage: error?.message || "Failed to load profile" });
    }
  },

  updateProfile: async (uid: string, data: Partial<UserProfile>) => {
    set({ saveStatus: "saving", errorMessage: null });
    try {
      const current = get().profile;
      const updated = {
        uid,
        name: data.name ?? current?.name ?? "",
        email: data.email ?? current?.email ?? "",
        phone: data.phone ?? current?.phone ?? "",
        location: data.location ?? current?.location ?? "",
        links: {
          linkedin: data.links?.linkedin ?? current?.links?.linkedin ?? "",
          github: data.links?.github ?? current?.links?.github ?? "",
          portfolio: data.links?.portfolio ?? current?.links?.portfolio ?? "",
          resumeLink: data.links?.resumeLink ?? current?.links?.resumeLink ?? "",
        },
        summary: data.summary ?? current?.summary ?? "",
        settings: {
          dailySendCap: data.settings?.dailySendCap ?? current?.settings?.dailySendCap ?? 15,
          warmupStartDate: data.settings?.warmupStartDate ?? current?.settings?.warmupStartDate ?? new Date().toISOString(),
          timezone: data.settings?.timezone ?? current?.settings?.timezone ?? "UTC",
        },
        llmConfig: {
          provider: data.llmConfig?.provider ?? current?.llmConfig?.provider ?? "anthropic",
          apiKey: data.llmConfig?.apiKey ?? current?.llmConfig?.apiKey ?? "",
          model: data.llmConfig?.model ?? current?.llmConfig?.model ?? "claude-3-5-sonnet-20241022",
          customEndpoint: data.llmConfig?.customEndpoint ?? current?.llmConfig?.customEndpoint ?? "",
        },
        resumeFile: data.resumeFile ?? current?.resumeFile ?? null,
      };

      await saveUserProfile(uid, updated);
      set({
        profile: updated,
        saveStatus: "saved",
        lastSavedAt: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      });
    } catch (error: any) {
      set({
        saveStatus: "error",
        errorMessage: error?.message || "Failed to save profile changes",
      });
    }
  },

  setResumeFile: async (uid: string, file: ResumeFile) => {
    const current = get().profile;
    if (!current) return;

    await get().updateProfile(uid, {
      ...current,
      resumeFile: file,
      links: {
        ...current.links,
        resumeLink: file.cloudinaryUrl,
      },
    });
  },
}));
