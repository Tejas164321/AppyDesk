"use client";

import React from "react";
import { cn } from "@/lib/utils";

export type ApplicationStatus =
  | "drafted"
  | "reviewed"
  | "sent"
  | "interviewing"
  | "offer"
  | "rejected"
  | "no_response";

interface StatusRailProps {
  status: ApplicationStatus;
  className?: string;
  showLabels?: boolean;
}

const pipelineStages: { key: ApplicationStatus; label: string }[] = [
  { key: "drafted", label: "Drafted" },
  { key: "reviewed", label: "Reviewed" },
  { key: "sent", label: "Sent" },
  { key: "interviewing", label: "Interviewing" },
  { key: "offer", label: "Offer" },
];

const statusColorMap: Record<ApplicationStatus, string> = {
  drafted: "bg-[var(--ink-soft)] text-white",
  reviewed: "bg-[var(--accent)] text-white",
  sent: "bg-[var(--slate)] text-white",
  interviewing: "bg-[var(--amber)] text-white",
  offer: "bg-[var(--green)] text-white",
  rejected: "bg-[var(--red)] text-white",
  no_response: "bg-[var(--ink-soft)] text-white",
};

export function StatusRail({ status, className, showLabels = false }: StatusRailProps) {
  // Find current index in linear pipeline
  const isTerminalFailure = status === "rejected" || status === "no_response";
  let activeIndex = pipelineStages.findIndex((s) => s.key === status);
  if (activeIndex === -1 && !isTerminalFailure) activeIndex = 0;

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <div className="flex items-center gap-1">
        {pipelineStages.map((stage, idx) => {
          const isCompleted = !isTerminalFailure && idx <= activeIndex;
          const isCurrent = !isTerminalFailure && idx === activeIndex;

          let bgClass = "bg-[var(--border)]";
          if (isCurrent) {
            bgClass = statusColorMap[status].split(" ")[0];
          } else if (isCompleted) {
            bgClass = "bg-[var(--accent)]";
          }

          return (
            <React.Fragment key={stage.key}>
              <div
                title={`${stage.label}${isCurrent ? " (Current)" : ""}`}
                className={cn(
                  "h-2 rounded-full transition-all duration-300 flex-1 min-w-[12px]",
                  bgClass,
                  isCurrent ? "ring-2 ring-offset-1 ring-[var(--accent)]/30 scale-105" : "opacity-80"
                )}
              />
              {idx < pipelineStages.length - 1 && (
                <div
                  className={cn(
                    "h-0.5 w-1.5 transition-colors duration-300",
                    isCompleted && idx < activeIndex ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                  )}
                />
              )}
            </React.Fragment>
          );
        })}

        {isTerminalFailure && (
          <span
            className={cn(
              "ml-2 text-xs font-mono px-2 py-0.5 rounded-full font-medium uppercase tracking-wider",
              status === "rejected"
                ? "bg-red-500/10 text-[var(--red)] border border-red-500/20"
                : "bg-gray-500/10 text-[var(--ink-soft)] border border-gray-500/20"
            )}
          >
            {status === "rejected" ? "Rejected" : "No Response"}
          </span>
        )}
      </div>

      {showLabels && (
        <div className="flex justify-between items-center text-[10px] font-mono text-[var(--ink-soft)] uppercase tracking-wider px-0.5">
          <span>Drafted</span>
          <span>Interviewing</span>
          <span>Offer</span>
        </div>
      )}
    </div>
  );
}
