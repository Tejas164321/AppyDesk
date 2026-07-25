export type BulkRowStatus = "pending" | "drafted" | "sending" | "sent" | "failed";

export interface ContactRow {
  id: string;
  email: string;
  name?: string;
  company?: string;
  role?: string;
  subject?: string;
  body?: string;
  status: BulkRowStatus;
  failCount?: number;
  lastAttemptAt?: string;
  errorReason?: string;
}

export interface HRListRecord {
  listId: string;
  userId: string;
  name: string;
  createdAt: string;
  sourceNote: string;
  contacts: ContactRow[];
}
