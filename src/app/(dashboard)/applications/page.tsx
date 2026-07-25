"use client";

import { JobCapture } from "@/features/applications/components/job-capture";
import { DraftEditor } from "@/features/applications/components/draft-editor";

export default function ApplicationsPage() {
  return (
    <div className="space-y-8">
      <div className="border-b border-[var(--border)] pb-5">
        <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">Single Application Flow</h1>
        <p className="text-sm text-[var(--ink-soft)] mt-1">
          Capture job postings, extract structured details with Anthropic Claude, tailor cold outreach, and send directly from your Gmail with your Cloudinary resume attached.
        </p>
      </div>

      <JobCapture />
      <DraftEditor />
    </div>
  );
}
