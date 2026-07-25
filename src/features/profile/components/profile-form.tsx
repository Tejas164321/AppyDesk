"use client";

import React, { useEffect, useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileFormSchema, ProfileFormValues } from "../schema";
import { useProfileStore } from "../store";
import { useAuth } from "@/features/auth/auth-context";
import { ResumeUploader } from "./resume-uploader";
import { LLMSettings } from "./llm-settings";
import { ExtensionTokenSettings } from "./extension-token-settings";
import { ResumeFile } from "../types";
import { Save, CheckCircle, AlertCircle, RefreshCw, User, Link as LinkIcon, Sparkles, Settings } from "lucide-react";

export function ProfileForm() {
  const { user } = useAuth();
  const { profile, loading, saveStatus, lastSavedAt, errorMessage, loadProfile, updateProfile, setResumeFile } =
    useProfileStore();

  const form = useForm({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      location: "",
      links: {
        linkedin: "",
        github: "",
        portfolio: "",
        resumeLink: "",
      },
      summary: "",
      settings: {
        dailySendCap: 15,
        warmupStartDate: new Date().toISOString(),
        timezone: "UTC",
      },
      llmConfig: {
        provider: "anthropic" as const,
        apiKey: "",
        model: "claude-3-5-sonnet-20241022",
        customEndpoint: "",
      },
    },
  });

  const { register, handleSubmit, reset, watch, setValue, formState: { errors } } = form;

  // Initial load
  useEffect(() => {
    if (user?.uid) {
      loadProfile(user.uid);
    }
  }, [user?.uid, loadProfile]);

  // Sync loaded profile into form values
  useEffect(() => {
    if (profile) {
      reset({
        name: profile.name || user?.displayName || "",
        email: profile.email || user?.email || "",
        phone: profile.phone || "",
        location: profile.location || "",
        links: {
          linkedin: profile.links?.linkedin || "",
          github: profile.links?.github || "",
          portfolio: profile.links?.portfolio || "",
          resumeLink: profile.links?.resumeLink || profile.resumeFile?.cloudinaryUrl || "",
        },
        summary: profile.summary || "",
        settings: {
          dailySendCap: profile.settings?.dailySendCap || 15,
          warmupStartDate: profile.settings?.warmupStartDate || new Date().toISOString(),
          timezone: profile.settings?.timezone || "UTC",
        },
        llmConfig: {
          provider: profile.llmConfig?.provider || "anthropic",
          apiKey: profile.llmConfig?.apiKey || "",
          model: profile.llmConfig?.model || "claude-3-5-sonnet-20241022",
          customEndpoint: profile.llmConfig?.customEndpoint || "",
        },
      });
    } else if (user) {
      reset((prev) => ({
        ...prev,
        name: user.displayName || "",
        email: user.email || "",
      }));
    }
  }, [profile, user, reset]);

  const onSave = useCallback(
    async (values: ProfileFormValues) => {
      if (!user?.uid) return;
      await updateProfile(user.uid, values);
    },
    [user?.uid, updateProfile]
  );

  const handleResumeSuccess = async (fileData: ResumeFile) => {
    if (!user?.uid) return;
    await setResumeFile(user.uid, fileData);
    form.setValue("links.resumeLink", fileData.cloudinaryUrl);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12 bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
        <div className="flex items-center space-x-3 text-sm text-[var(--ink-soft)] font-mono">
          <div className="w-5 h-5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
          <span>Loading profile settings...</span>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSave)} className="space-y-8">
      {/* Header bar with Status Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[var(--accent-soft)] text-[var(--accent)] rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--ink)]">Profile Details</h2>
            <p className="text-xs text-[var(--ink-soft)] font-mono">
              Auto-syncs with drafting engine & outbound email credentials
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          {/* Status Indicator */}
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono bg-[var(--bg)] border border-[var(--border)]">
            {saveStatus === "saving" && (
              <>
                <RefreshCw className="w-3.5 h-3.5 text-[var(--amber)] animate-spin" />
                <span className="text-[var(--amber)] font-medium">Saving...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <CheckCircle className="w-3.5 h-3.5 text-[var(--green)]" />
                <span className="text-[var(--ink)]">Saved {lastSavedAt ? `at ${lastSavedAt}` : ""}</span>
              </>
            )}
            {saveStatus === "error" && (
              <>
                <AlertCircle className="w-3.5 h-3.5 text-[var(--red)]" />
                <span className="text-[var(--red)] font-medium">Save Failed</span>
              </>
            )}
            {saveStatus === "idle" && (
              <span className="text-[var(--ink-soft)]">All changes up to date</span>
            )}
          </div>

          <button
            type="submit"
            disabled={saveStatus === "saving"}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Save changes</span>
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-xs text-[var(--red)] rounded-xl flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Grid Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Info */}
        <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-[var(--border)] pb-3">
            <User className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--ink)]">Contact Information</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)]">Full Name</label>
              <input
                {...register("name")}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="e.g. Alex Morgan"
              />
              {errors.name && <p className="text-[11px] text-[var(--red)] mt-1">{errors.name.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)]">Email Address</label>
              <input
                {...register("email")}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="alex@example.com"
              />
              {errors.email && <p className="text-[11px] text-[var(--red)] mt-1">{errors.email.message}</p>}
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)]">Phone Number</label>
              <input
                {...register("phone")}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="+1 (555) 000-0000"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)]">Location</label>
              <input
                {...register("location")}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="e.g. San Francisco, CA (Open to Remote)"
              />
            </div>
          </div>
        </div>

        {/* Links */}
        <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-[var(--border)] pb-3">
            <LinkIcon className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--ink)]">Online Presence & Links</h3>
          </div>

          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)]">LinkedIn Profile URL</label>
              <input
                {...register("links.linkedin")}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="https://linkedin.com/in/username"
              />
              {errors.links?.linkedin && (
                <p className="text-[11px] text-[var(--red)] mt-1">{errors.links.linkedin.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)]">GitHub Profile URL</label>
              <input
                {...register("links.github")}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="https://github.com/username"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)]">Portfolio Website</label>
              <input
                {...register("links.portfolio")}
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors"
                placeholder="https://yourportfolio.com"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[var(--ink-soft)]">Direct Resume Link (Auto-populated)</label>
              <input
                {...register("links.resumeLink")}
                readOnly
                className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg)]/50 border border-[var(--border)] text-[var(--ink-soft)] font-mono focus:outline-none cursor-not-allowed"
                placeholder="Populated via Resume Upload"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Multi-LLM Provider Settings Panel */}
      <LLMSettings register={register} setValue={setValue} watch={watch} />

      {/* Developer & Extension Access Token */}
      <ExtensionTokenSettings
        uid={user?.uid || ""}
        hasExistingToken={!!(profile as any)?.apiTokenHash}
        tokenCreatedAt={(profile as any)?.apiTokenCreatedAt}
      />

      {/* Resume Upload & Professional Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl">
          <ResumeUploader
            uid={user?.uid || ""}
            resumeFile={profile?.resumeFile}
            onUploadSuccess={handleResumeSuccess}
          />
        </div>

        {/* Professional Summary */}
        <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-[var(--border)] pb-3">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--ink)]">Drafting Context Summary</h3>
          </div>

          <div>
            <p className="text-xs text-[var(--ink-soft)] mb-2">
              This summary is provided to your selected AI model when generating tailored application emails. Include key skills, achievements, and career highlights.
            </p>
            <textarea
              {...register("summary")}
              rows={6}
              className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors resize-none"
              placeholder="e.g. Senior Full-Stack Engineer with 6+ years experience in TypeScript, React, Next.js, Node.js, and cloud deployments..."
            />
            {errors.summary && (
              <p className="text-[11px] text-[var(--red)] mt-1">{errors.summary.message}</p>
            )}
          </div>
        </div>
      </div>

      {/* Outbound Settings */}
      <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl space-y-4">
        <div className="flex items-center space-x-2 border-b border-[var(--border)] pb-3">
          <Settings className="w-4 h-4 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--ink)]">Outreach & Warmup Settings</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-medium text-[var(--ink-soft)] font-mono">Daily Outbound Email Send Cap</label>
            <input
              type="number"
              {...register("settings.dailySendCap", { valueAsNumber: true })}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] font-mono focus:outline-none focus:border-[var(--accent)]"
              min={1}
              max={50}
            />
            <p className="text-[11px] text-[var(--ink-soft)] mt-1 font-mono">Recommended conservative cap: 15/day</p>
          </div>

          <div>
            <label className="text-xs font-medium text-[var(--ink-soft)] font-mono">Mailbox Timezone</label>
            <input
              {...register("settings.timezone")}
              className="w-full mt-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] font-mono focus:outline-none focus:border-[var(--accent)]"
              placeholder="America/New_York"
            />
          </div>
        </div>
      </div>
    </form>
  );
}
