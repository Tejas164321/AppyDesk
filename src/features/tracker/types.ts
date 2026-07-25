import { ApplicationStatus } from "@/components/ui/status-rail";
import { ApplicationItem } from "@/features/applications/types";

export type TrackerViewMode = "table" | "kanban";

export interface TrackerFilterOptions {
  searchQuery: string;
  statusFilter: ApplicationStatus | "all";
}

export { type ApplicationStatus, type ApplicationItem };
