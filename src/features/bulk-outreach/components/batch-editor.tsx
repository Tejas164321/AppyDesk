"use client";

import React, { useState } from "react";
import { useBulkStore } from "../store";
import { useAuth } from "@/features/auth/auth-context";
import { useProfileStore } from "@/features/profile/store";
import { Sparkles, Send, Edit3, CheckCircle2, XCircle, Clock, AlertTriangle, ChevronRight } from "lucide-react";

export function BatchEditor() {
  const { user } = useAuth();
  const { profile } = useProfileStore();
  const {
    contacts,
    pitchContext,
    setPitchContext,
    complianceConfirmed,
    generateBatchDrafts,
    updateRowDraft,
    sendBatch,
    drafting,
    sending,
    currentIndex,
    error,
  } = useBulkStore();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSubject, setEditSubject] = useState("");
  const [editBody, setEditBody] = useState("");

  if (!contacts.length) return null;

  const sentCount = contacts.filter((c) => c.status === "sent").length;
  const failedCount = contacts.filter((c) => c.status === "failed").length;
  const progressPercent = Math.round((sentCount / contacts.length) * 100);

  const handleGenerate = async () => {
    await generateBatchDrafts(
      profile?.summary || "Full-stack developer with experience in web applications",
      user?.displayName || profile?.name || "Applicant",
      user?.email || profile?.email || ""
    );
  };

  const handleStartEdit = (id: string, currentSubj: string, currentBody: string) => {
    setEditingId(id);
    setEditSubject(currentSubj || "");
    setEditBody(currentBody || "");
  };

  const handleSaveEdit = (id: string) => {
    updateRowDraft(id, editSubject, editBody);
    setEditingId(null);
  };

  const handleSendBatch = async () => {
    if (!user?.uid) return;
    await sendBatch(user.uid, profile?.settings?.dailySendCap || 15);
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--ink)]">2. Batch Pitch Context & Row Review</h2>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5">
            Configure your outreach pitch topic, generate drafts for each row, and review before dispatch.
          </p>
        </div>

        {/* Status Counts */}
        <div className="flex items-center gap-3 font-mono text-xs">
          <span className="text-[var(--green)] flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> {sentCount} Sent
          </span>
          {failedCount > 0 && (
            <span className="text-[var(--red)] flex items-center gap-1">
              <XCircle className="w-3.5 h-3.5" /> {failedCount} Failed
            </span>
          )}
        </div>
      </div>

      {/* Pitch Context Prompt */}
      <div className="space-y-2">
        <label className="text-xs font-medium text-[var(--ink-soft)]">Batch Pitch Context / Target Role Focus</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={pitchContext}
            onChange={(e) => setPitchContext(e.target.value)}
            placeholder="e.g. Senior Frontend / Full-Stack Engineer role pitch"
            className="flex-1 px-3 py-2 text-sm rounded-xl bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)]"
          />
          <button
            onClick={handleGenerate}
            disabled={drafting || !pitchContext.trim()}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--accent-soft)] text-[var(--accent)] text-xs font-medium hover:bg-[var(--accent-soft)]/80 transition-colors disabled:opacity-50"
          >
            {drafting ? (
              <div className="w-3.5 h-3.5 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            <span>Generate Drafts</span>
          </button>
        </div>
      </div>

      {/* Sending Progress Bar */}
      {sending && (
        <div className="p-4 bg-[var(--accent-soft)]/40 border border-[var(--accent)]/30 rounded-xl space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-[var(--accent)] font-semibold">
            <span className="flex items-center gap-1.5">
              <Clock className="w-4 h-4 animate-spin" />
              Dispatching Batch ({currentIndex + 1} of {contacts.length})...
            </span>
            <span>{progressPercent}%</span>
          </div>
          <div className="w-full bg-[var(--bg)] h-2 rounded-full overflow-hidden">
            <div
              className="bg-[var(--accent)] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Row Review Table */}
      <div className="border border-[var(--border)] rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-[var(--border)] bg-[var(--bg)]/50 font-mono text-[11px] text-[var(--ink-soft)] uppercase tracking-wider">
                <th className="py-3 px-4 font-medium">Contact</th>
                <th className="py-3 px-4 font-medium">Company & Role</th>
                <th className="py-3 px-4 font-medium">Generated Draft</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 font-medium text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {contacts.map((contact, idx) => (
                <tr
                  key={contact.id}
                  className={`hover:bg-[var(--accent-soft)]/10 transition-colors ${
                    idx === currentIndex ? "bg-[var(--accent-soft)]/20" : ""
                  }`}
                >
                  <td className="py-3 px-4 font-mono">
                    <p className="font-semibold text-[var(--ink)]">{contact.name || "HR Recruiter"}</p>
                    <p className="text-[11px] text-[var(--ink-soft)]">{contact.email}</p>
                  </td>

                  <td className="py-3 px-4">
                    <p className="font-bold text-[var(--ink)]">{contact.company || "Company"}</p>
                    <p className="text-[11px] text-[var(--ink-soft)]">{contact.role || "Recruiter"}</p>
                  </td>

                  <td className="py-3 px-4 max-w-xs">
                    {editingId === contact.id ? (
                      <div className="space-y-2 py-1">
                        <input
                          type="text"
                          value={editSubject}
                          onChange={(e) => setEditSubject(e.target.value)}
                          className="w-full px-2 py-1 text-xs rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)]"
                        />
                        <textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          rows={3}
                          className="w-full px-2 py-1 text-xs rounded bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] resize-none"
                        />
                        <button
                          onClick={() => handleSaveEdit(contact.id)}
                          className="px-3 py-1 rounded bg-[var(--accent)] text-white text-[11px] font-medium"
                        >
                          Save Row Edits
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-semibold text-[var(--ink)] truncate">{contact.subject || "No draft generated"}</p>
                        <p className="text-[11px] text-[var(--ink-soft)] line-clamp-2">{contact.body || "Click Generate Drafts above"}</p>
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4 font-mono">
                    {contact.status === "pending" && (
                      <span className="px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--ink-soft)]">
                        Pending
                      </span>
                    )}
                    {contact.status === "drafted" && (
                      <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-[var(--slate)] border border-blue-500/20 font-medium">
                        Drafted
                      </span>
                    )}
                    {contact.status === "sending" && (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-[var(--amber)] border border-amber-500/20 font-medium flex items-center gap-1">
                        <Clock className="w-3 h-3 animate-spin" /> Sending...
                      </span>
                    )}
                    {contact.status === "sent" && (
                      <span className="px-2 py-0.5 rounded-full bg-green-500/10 text-[var(--green)] border border-green-500/20 font-medium">
                        Sent
                      </span>
                    )}
                    {contact.status === "failed" && (
                      <span
                        title={contact.errorReason}
                        className="px-2 py-0.5 rounded-full bg-red-500/10 text-[var(--red)] border border-red-500/20 font-medium"
                      >
                        Failed
                      </span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-right">
                    {editingId !== contact.id && (
                      <button
                        onClick={() => handleStartEdit(contact.id, contact.subject || "", contact.body || "")}
                        className="p-1.5 rounded-lg hover:bg-[var(--accent-soft)] text-[var(--ink-soft)] hover:text-[var(--accent)]"
                        title="Edit Row Draft"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-[var(--red)] rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Send Batch Button */}
      <div className="flex justify-end pt-2">
        <button
          onClick={handleSendBatch}
          disabled={sending || !complianceConfirmed || contacts.every((c) => c.status === "sent")}
          className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[var(--accent)] text-white text-sm font-medium hover:opacity-90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-md shadow-[var(--accent)]/20"
        >
          {sending ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Sending Batch...</span>
            </>
          ) : (
            <>
              <Send className="w-4 h-4" />
              <span>Send Batch (Max {profile?.settings?.dailySendCap || 15}/day)</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
