"use client";

import React, { useState } from "react";
import { UploadCloud, FileText, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { ResumeFile } from "../types";

interface ResumeUploaderProps {
  uid: string;
  resumeFile?: ResumeFile | null;
  onUploadSuccess: (fileData: ResumeFile) => void;
}

export function ResumeUploader({ uid, resumeFile, onUploadSuccess }: ResumeUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      setError("File size must be under 10MB");
      return;
    }

    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uid", uid);

      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const errJson = await res.json();
        throw new Error(errJson.error || "Upload failed");
      }

      const fileData: ResumeFile = await res.json();
      onUploadSuccess(fileData);
    } catch (err: any) {
      setError(err?.message || "Failed to upload resume file");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-[var(--ink)] flex items-center gap-2">
          <FileText className="w-4 h-4 text-[var(--accent)]" />
          <span>Resume Asset (Cloudinary)</span>
        </label>
        {resumeFile && (
          <span className="text-xs text-[var(--green)] flex items-center gap-1 font-mono">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Uploaded
          </span>
        )}
      </div>

      <div className="border-2 border-dashed border-[var(--border)] rounded-2xl p-6 text-center hover:border-[var(--accent)] transition-colors bg-[var(--surface)]">
        <input
          type="file"
          id="resume-file-input"
          accept=".pdf,.doc,.docx"
          onChange={handleFileChange}
          disabled={uploading}
          className="hidden"
        />

        {uploading ? (
          <div className="flex flex-col items-center space-y-2 py-2">
            <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-[var(--ink-soft)]">Uploading to Cloudinary...</p>
          </div>
        ) : resumeFile ? (
          <div className="flex flex-col items-center space-y-3">
            <div className="p-3 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">{resumeFile.filename}</p>
              <p className="text-xs text-[var(--ink-soft)] font-mono mt-0.5">
                Uploaded {new Date(resumeFile.uploadedAt).toLocaleDateString()}
              </p>
            </div>
            <div className="flex items-center gap-3 pt-1">
              <a
                href={resumeFile.cloudinaryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-mono text-[var(--accent)] hover:underline inline-flex items-center gap-1"
              >
                <span>View Asset</span>
                <ExternalLink className="w-3 h-3" />
              </a>
              <span className="text-[var(--border)]">•</span>
              <label
                htmlFor="resume-file-input"
                className="text-xs font-mono text-[var(--ink-soft)] hover:text-[var(--ink)] cursor-pointer hover:underline"
              >
                Replace file
              </label>
            </div>
          </div>
        ) : (
          <label htmlFor="resume-file-input" className="cursor-pointer block space-y-2">
            <UploadCloud className="w-8 h-8 text-[var(--ink-soft)] mx-auto" />
            <div>
              <p className="text-sm font-medium text-[var(--ink)]">
                Click to upload resume (PDF, DOCX)
              </p>
              <p className="text-xs text-[var(--ink-soft)] mt-1">
                Stored in Cloudinary for authentic email attachment sending. Max 10MB.
              </p>
            </div>
          </label>
        )}
      </div>

      {error && (
        <div className="text-xs text-[var(--red)] flex items-center gap-1.5 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
