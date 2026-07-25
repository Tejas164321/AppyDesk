import { create } from "zustand";
import { ApplicationItem } from "@/features/applications/types";
import { ApplicationStatus } from "@/components/ui/status-rail";
import { fetchUserApplications, updateApplicationStatusInDb } from "./api/tracker";

export type TrackerViewMode = "table" | "kanban";

interface TrackerState {
  applications: ApplicationItem[];
  loading: boolean;
  viewMode: TrackerViewMode;
  searchQuery: string;
  statusFilter: ApplicationStatus | "all";

  setViewMode: (mode: TrackerViewMode) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: ApplicationStatus | "all") => void;
  loadApplications: (uid: string) => Promise<void>;
  updateStatus: (id: string, newStatus: ApplicationStatus) => Promise<void>;
}

export const useTrackerStore = create<TrackerState>((set, get) => ({
  applications: [],
  loading: false,
  viewMode: "table",
  searchQuery: "",
  statusFilter: "all",

  setViewMode: (mode) => set({ viewMode: mode }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),

  loadApplications: async (uid: string) => {
    set({ loading: true });
    try {
      const data = await fetchUserApplications(uid);
      set({ applications: data, loading: false });
    } catch (err) {
      console.error("Tracker store fetch error:", err);
      set({ loading: false });
    }
  },

  updateStatus: async (id: string, newStatus: ApplicationStatus) => {
    try {
      // Optimistic update
      set((state) => ({
        applications: state.applications.map((app) =>
          app.id === id
            ? {
                ...app,
                status: newStatus,
                lastUpdatedAt: new Date().toISOString(),
                history: [
                  ...app.history,
                  { status: newStatus, changedAt: new Date().toISOString() },
                ],
              }
            : app
        ),
      }));

      await updateApplicationStatusInDb(id, newStatus);
    } catch (err) {
      console.error("Tracker store update error:", err);
    }
  },
}));
