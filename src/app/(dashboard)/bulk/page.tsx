"use client";

import { BulkUploader } from "@/features/bulk-outreach/components/bulk-uploader";
import { BatchEditor } from "@/features/bulk-outreach/components/batch-editor";

export default function BulkOutreachPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--border)] pb-5">
        <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">Bulk Outreach</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Upload HR contact lists (CSV/XLSX), enforce sourcing compliance, review candidate drafts, and execute rate-limited batch sends directly from your Gmail.
        </p>
      </div>

      <BulkUploader />
      <BatchEditor />
    </div>
  );
}
