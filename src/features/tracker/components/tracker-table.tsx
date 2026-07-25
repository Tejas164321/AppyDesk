"use client";

import React from "react";
import { ApplicationItem } from "@/features/applications/types";
import { StatusRail, ApplicationStatus } from "@/components/ui/status-rail";
import { Building, Mail, ChevronDown } from "lucide-react";

interface TrackerTableProps {
  applications: ApplicationItem[];
  onStatusChange: (id: string, newStatus: ApplicationStatus) => void;
}

const statusOptions: { value: ApplicationStatus; label: string }[] = [
  { value: "drafted", label: "Drafted" },
  { value: "reviewed", label: "Reviewed" },
  { value: "sent", label: "Sent" },
  { value: "interviewing", label: "Interviewing" },
  { value: "offer", label: "Offer" },
  { value: "rejected", label: "Rejected" },
  { value: "no_response", label: "No Response" },
];

export function TrackerTable({ applications, onStatusChange }: TrackerTableProps) {
  if (!applications.length) {
    return (
      <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-12 text-center space-y-3">
        <Building className="w-8 h-8 text-[var(--accent)] mx-auto opacity-50" />
        <h3 className="text-base font-semibold text-[var(--ink)]">No applications found</h3>
        <p className="text-xs text-[var(--ink-soft)] max-w-sm mx-auto">
          No applications match your search or filter criteria. Send an application from the Single Application flow to start tracking.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-sm">
          <thead>
            <tr className="border-b border-[var(--border)] bg-[var(--bg)]/50 text-[11px] font-mono text-[var(--ink-soft)] uppercase tracking-wider">
              <th className="py-3.5 px-4 font-medium">Company & Role</th>
              <th className="py-3.5 px-4 font-medium">Recipient Email</th>
              <th className="py-3.5 px-4 font-medium text-center">Fit Score</th>
              <th className="py-3.5 px-4 font-medium">Pipeline Stage</th>
              <th className="py-3.5 px-4 font-medium">Date Sent</th>
              <th className="py-3.5 px-4 font-medium text-right">Status Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--border)]">
            {applications.map((app) => (
              <tr key={app.id} className="hover:bg-[var(--accent-soft)]/20 transition-colors">
                <td className="py-3.5 px-4">
                  <div className="flex items-center space-x-2">
                    <div className="p-2 bg-[var(--accent-soft)] text-[var(--accent)] rounded-lg flex-shrink-0">
                      <Building className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-bold text-[var(--ink)] leading-tight">{app.company}</p>
                      <p className="text-xs text-[var(--ink-soft)]">{app.role}</p>
                    </div>
                  </div>
                </td>

                <td className="py-3.5 px-4 font-mono text-xs text-[var(--ink-soft)]">
                  <div className="flex items-center space-x-1.5">
                    <Mail className="w-3.5 h-3.5 text-[var(--slate)]" />
                    <span>{app.contactEmail}</span>
                  </div>
                </td>

                <td className="py-3.5 px-4 text-center">
                  <span
                    className={`inline-block text-xs font-mono font-bold px-2 py-0.5 rounded-full ${
                      (app.matchScore || 0) >= 65
                        ? "bg-green-500/10 text-[var(--green)] border border-green-500/20"
                        : "bg-red-500/10 text-[var(--red)] border border-red-500/20"
                    }`}
                  >
                    {app.matchScore || 0}%
                  </span>
                </td>

                <td className="py-3.5 px-4 w-44">
                  <StatusRail status={app.status} />
                </td>

                <td className="py-3.5 px-4 font-mono text-xs text-[var(--ink-soft)] whitespace-nowrap">
                  {app.createdAt ? new Date(app.createdAt).toLocaleDateString() : "-"}
                </td>

                <td className="py-3.5 px-4 text-right">
                  <div className="relative inline-block text-left">
                    <select
                      value={app.status}
                      onChange={(e) => onStatusChange(app.id, e.target.value as ApplicationStatus)}
                      className="appearance-none bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] text-xs font-mono px-3 py-1.5 pr-7 rounded-lg cursor-pointer focus:outline-none focus:border-[var(--accent)]"
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="w-3 h-3 text-[var(--ink-soft)] absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
