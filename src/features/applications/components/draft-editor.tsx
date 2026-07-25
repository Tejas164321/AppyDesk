"use client";

import React, { useState } from "react";
import { useApplicationStore } from "../store";
import { useAuth } from "@/features/auth/auth-context";
import { StatusRail } from "@/components/ui/status-rail";
import { Send, AlertTriangle, CheckCircle2, Building, Briefcase, Mail, MapPin, Sparkles, RefreshCw } from "lucide-react";

export function DraftEditor() {
  const { user } = useAuth();
  const { currentDraft, updateDraftField, sendApplication, sending, resetDraft, error } =
    useApplicationStore();

  const [sendSuccess, setSendSuccess] = useState(false);

  if (!currentDraft) return null;

  const isLowMatch = (currentDraft.matchScore || 0) < 65;

  const handleSend = async () => {
    if (!user?.uid) return;
    const ok = await sendApplication(user.uid);
    if (ok) {
      setSendSuccess(true);
    }
  };

  if (sendSuccess) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 text-center space-y-4 shadow-md">
        <div className="w-12 h-12 bg-green-500/10 text-[var(--green)] rounded-full flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-6 h-6" />
        </div>
        <div className="space-y-1">
          <h2 className="text-xl font-bold text-[var(--ink)]">Application Sent!</h2>
          <p className="text-sm text-[var(--ink-soft)]">
            Your tailored email to <span className="font-semibold text-[var(--ink)]">{currentDraft.contactEmail}</span> for{" "}
            <span className="font-semibold text-[var(--ink)]">{currentDraft.role}</span> at{" "}
            <span className="font-semibold text-[var(--ink)]">{currentDraft.company}</span> has been dispatched from your Gmail account with resume attached.
          </p>
        </div>

        <div className="pt-4 max-w-sm mx-auto">
          <StatusRail status="sent" showLabels />
        </div>

        <div className="pt-4">
          <button
            onClick={() => {
              setSendSuccess(false);
              resetDraft();
            }}
            className="px-5 py-2.5 rounded-xl bg-[var(--accent)] text-white text-xs font-medium hover:opacity-90 transition-opacity"
          >
            Start Another Application
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-6 shadow-md">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-semibold uppercase">
              Human Review Checkpoint
            </span>
            <span className="text-xs text-[var(--ink-soft)] font-mono">• Edits autosave in draft</span>
          </div>
          <h2 className="text-lg font-bold text-[var(--ink)] mt-1">Review Tailored Application</h2>
        </div>

        {/* Match Score Badge */}
        <div className="flex items-center gap-3">
          <div className="text-right">
            <div className="text-xs font-mono text-[var(--ink-soft)]">Match Score</div>
            <div
              className={`text-lg font-bold font-mono ${
                isLowMatch ? "text-[var(--red)]" : "text-[var(--green)]"
              }`}
            >
              {currentDraft.matchScore}%
            </div>
          </div>

          <div className="w-24">
            <StatusRail status="drafted" />
          </div>
        </div>
      </div>

      {/* Low Match Warning Banner */}
      {isLowMatch && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl text-xs text-[var(--amber)] flex items-start gap-2.5">
          <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[var(--amber)]" />
          <div>
            <span className="font-semibold">Low Match Warning ({currentDraft.matchScore}%):</span> Your profile summary has limited keyword overlap with this job's key requirements. Review and customize the body draft below before sending so you don't waste an outreach attempt.
          </div>
        </div>
      )}

      {/* Extracted Metadata Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-[var(--bg)] p-4 rounded-xl border border-[var(--border)]">
        <div>
          <label className="text-[11px] font-mono text-[var(--ink-soft)] uppercase tracking-wider flex items-center gap-1">
            <Building className="w-3 h-3 text-[var(--accent)]" /> Company
          </label>
          <input
            type="text"
            value={currentDraft.company || ""}
            onChange={(e) => updateDraftField("company", e.target.value)}
            className="w-full mt-1 text-sm font-semibold text-[var(--ink)] bg-transparent border-b border-transparent focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-mono text-[var(--ink-soft)] uppercase tracking-wider flex items-center gap-1">
            <Briefcase className="w-3 h-3 text-[var(--accent)]" /> Role
          </label>
          <input
            type="text"
            value={currentDraft.role || ""}
            onChange={(e) => updateDraftField("role", e.target.value)}
            className="w-full mt-1 text-sm font-semibold text-[var(--ink)] bg-transparent border-b border-transparent focus:border-[var(--accent)] focus:outline-none"
          />
        </div>

        <div>
          <label className="text-[11px] font-mono text-[var(--ink-soft)] uppercase tracking-wider flex items-center gap-1">
            <Mail className="w-3 h-3 text-[var(--accent)]" /> Recipient Email
          </label>
          <input
            type="email"
            value={currentDraft.contactEmail || ""}
            onChange={(e) => updateDraftField("contactEmail", e.target.value)}
            className="w-full mt-1 text-sm font-semibold text-[var(--ink)] bg-transparent border-b border-transparent focus:border-[var(--accent)] focus:outline-none"
            placeholder="recruiter@company.com"
          />
        </div>
      </div>

      {/* Key Requirements Checklist */}
      {currentDraft.keyRequirements && currentDraft.keyRequirements.length > 0 && (
        <div>
          <label className="text-xs font-mono text-[var(--ink-soft)] uppercase tracking-wider block mb-2">
            Key Extracted Requirements
          </label>
          <div className="flex flex-wrap gap-2">
            {currentDraft.keyRequirements.map((req, i) => (
              <span
                key={i}
                className="text-xs font-mono px-3 py-1 rounded-full bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] flex items-center gap-1.5"
              >
                <Sparkles className="w-3 h-3 text-[var(--accent)]" />
                {req}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Editable Subject */}
      <div>
        <label className="text-xs font-medium text-[var(--ink-soft)] block mb-1">Email Subject Line</label>
        <input
          type="text"
          value={currentDraft.subject || ""}
          onChange={(e) => updateDraftField("subject", e.target.value)}
          className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] font-medium"
        />
      </div>

      {/* Editable Body */}
      <div>
        <label className="text-xs font-medium text-[var(--ink-soft)] block mb-1">
          Email Body (Editable Draft)
        </label>
        <textarea
          value={currentDraft.body || ""}
          onChange={(e) => updateDraftField("body", e.target.value)}
          rows={12}
          className="w-full px-4 py-3 text-sm rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] font-sans leading-relaxed resize-none"
        />
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-[var(--red)] rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Footer controls */}
      <div className="flex items-center justify-between pt-2 border-t border-[var(--border)]">
        <button
          onClick={resetDraft}
          disabled={sending}
          className="text-xs font-mono text-[var(--ink-soft)] hover:text-[var(--ink)] transition-colors"
        >
          Discard Draft
        </button>

        <button
          onClick={handleSend}
          disabled={sending || !currentDraft.contactEmail}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-[var(--accent)]/20"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sending via Gmail API...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send via Gmail</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
