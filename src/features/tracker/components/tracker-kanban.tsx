"use client";

import React from "react";
import { ApplicationItem } from "@/features/applications/types";
import { StatusRail, ApplicationStatus } from "@/components/ui/status-rail";
import { Mail, ChevronRight } from "lucide-react";

interface TrackerKanbanProps {
  applications: ApplicationItem[];
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
}

const kanbanColumns: { key: ApplicationStatus | "terminal"; title: string; filterStatuses: ApplicationStatus[] }[] = [
  { key: "drafted", title: "Drafted", filterStatuses: ["drafted", "reviewed"] },
  { key: "sent", title: "Sent", filterStatuses: ["sent"] },
  { key: "interviewing", title: "Interviewing", filterStatuses: ["interviewing"] },
  { key: "offer", title: "Offer", filterStatuses: ["offer"] },
  { key: "terminal", title: "Closed / Outcome", filterStatuses: ["rejected", "no_response"] },
];

export function TrackerKanban({ applications, onStatusChange }: TrackerKanbanProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
      {kanbanColumns.map((col) => {
        const colApps = applications.filter((app) => col.filterStatuses.includes(app.status));

        return (
          <div key={col.key} className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-4 flex flex-col min-h-[450px]">
            <div className="flex items-center justify-between border-b border-[var(--border)] pb-3 mb-3">
              <h3 className="text-xs font-bold font-mono text-[var(--ink)] uppercase tracking-wider">{col.title}</h3>
              <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-[var(--bg)] border border-[var(--border)] text-[var(--ink-soft)] font-medium">
                {colApps.length}
              </span>
            </div>

            <div className="space-y-3 flex-1 overflow-y-auto">
              {colApps.length === 0 ? (
                <div className="h-32 border-2 border-dashed border-[var(--border)] rounded-xl flex items-center justify-center text-xs text-[var(--ink-soft)] font-mono">
                  Empty stage
                </div>
              ) : (
                colApps.map((app) => (
                  <div
                    key={app.id}
                    className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl space-y-3 hover:border-[var(--accent)] transition-colors shadow-xs"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-bold text-sm text-[var(--ink)] leading-snug">{app.company}</h4>
                        <p className="text-xs text-[var(--ink-soft)]">{app.role}</p>
                      </div>
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded ${
                          (app.matchScore || 0) >= 65 ? "bg-green-500/10 text-[var(--green)]" : "bg-red-500/10 text-[var(--red)]"
                        }`}
                      >
                        {app.matchScore || 0}%
                      </span>
                    </div>

                    <div className="text-[11px] font-mono text-[var(--ink-soft)] truncate flex items-center gap-1">
                      <Mail className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{app.contactEmail}</span>
                    </div>

                    <StatusRail status={app.status} />

                    <div className="pt-1 flex items-center justify-between border-t border-[var(--border)] text-[10px] font-mono text-[var(--ink-soft)]">
                      <span>{app.createdAt ? new Date(app.createdAt).toLocaleDateString() : ""}</span>

                      {/* Quick stage advance button */}
                      {app.status === "drafted" && (
                        <button
                          onClick={() => onStatusChange(app.id, "sent")}
                          className="hover:text-[var(--accent)] flex items-center gap-0.5"
                        >
                          <span>Move to Sent</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                      {app.status === "sent" && (
                        <button
                          onClick={() => onStatusChange(app.id, "interviewing")}
                          className="hover:text-[var(--amber)] flex items-center gap-0.5"
                        >
                          <span>Interviewing</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                      {app.status === "interviewing" && (
                        <button
                          onClick={() => onStatusChange(app.id, "offer")}
                          className="hover:text-[var(--green)] flex items-center gap-0.5"
                        >
                          <span>Offer</span>
                          <ChevronRight className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
