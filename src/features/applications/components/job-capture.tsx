"use client";

import React, { useState } from "react";
import { Sparkles, FileText, Image as ImageIcon, UploadCloud, AlertCircle } from "lucide-react";
import { useApplicationStore } from "../store";
import { useAuth } from "@/features/auth/auth-context";

export function JobCapture() {
  const { user } = useAuth();
  const { extractJob, extracting, error } = useApplicationStore();
  const [activeTab, setActiveTab] = useState<"paste" | "screenshot">("paste");
  const [jobText, setJobText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploadingImage, setUploadingImage] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.uid) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("uid", user.uid);

      const res = await fetch("/api/profile/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error("Image upload failed");
      const data = await res.json();
      setImageUrl(data.cloudinaryUrl);
    } catch (err) {
      console.error("Screenshot upload error:", err);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleExtract = async () => {
    if (!jobText.trim() && !imageUrl) return;
    await extractJob(jobText, imageUrl || undefined, user?.uid);
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--ink)]">Capture Job Post</h2>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5">
            Paste a job description or upload a screenshot to extract key details and draft an email.
          </p>
        </div>

        {/* Mode Tabs */}
        <div className="flex items-center p-1 bg-[var(--bg)] border border-[var(--border)] rounded-full text-xs font-medium">
          <button
            onClick={() => setActiveTab("paste")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
              activeTab === "paste"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Paste Text</span>
          </button>
          <button
            onClick={() => setActiveTab("screenshot")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full transition-colors ${
              activeTab === "screenshot"
                ? "bg-[var(--accent)] text-white"
                : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
            }`}
          >
            <ImageIcon className="w-3.5 h-3.5" />
            <span>Screenshot</span>
          </button>
        </div>
      </div>

      {activeTab === "paste" ? (
        <div className="space-y-3">
          <textarea
            value={jobText}
            onChange={(e) => setJobText(e.target.value)}
            rows={8}
            className="w-full px-4 py-3 text-sm rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none font-sans placeholder:text-[var(--ink-soft)]"
            placeholder="Paste raw job description text or forwarded recruiter email here..."
          />
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center bg-[var(--bg)] hover:border-[var(--accent)] transition-colors">
            <input
              type="file"
              id="job-screenshot-input"
              accept="image/*"
              onChange={handleImageUpload}
              disabled={uploadingImage}
              className="hidden"
            />

            {uploadingImage ? (
              <div className="flex flex-col items-center space-y-2 py-2">
                <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
                <p className="text-xs font-mono text-[var(--ink-soft)]">Uploading screenshot...</p>
              </div>
            ) : imageUrl ? (
              <div className="space-y-3">
                <img
                  src={imageUrl}
                  alt="Job Post Screenshot"
                  className="max-h-48 mx-auto rounded-lg border border-[var(--border)] object-contain"
                />
                <p className="text-xs font-mono text-[var(--green)]">Screenshot uploaded successfully</p>
                <label
                  htmlFor="job-screenshot-input"
                  className="text-xs text-[var(--ink-soft)] underline cursor-pointer"
                >
                  Change image
                </label>
              </div>
            ) : (
              <label htmlFor="job-screenshot-input" className="cursor-pointer block space-y-2">
                <UploadCloud className="w-8 h-8 text-[var(--ink-soft)] mx-auto" />
                <p className="text-sm font-medium text-[var(--ink)]">Click to upload screenshot</p>
                <p className="text-xs text-[var(--ink-soft)]">PNG, JPG, or WebP job post capture</p>
              </label>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-[var(--red)] rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex justify-end pt-2">
        <button
          onClick={handleExtract}
          disabled={extracting || (!jobText.trim() && !imageUrl)}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-[var(--accent)]/20"
        >
          {extracting ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Analyzing & Drafting...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4" />
              <span>Extract & Draft</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
