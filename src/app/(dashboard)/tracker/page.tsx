"use client";

import React, { useEffect } from "react";
import { useAuth } from "@/features/auth/auth-context";
import { useTrackerStore } from "@/features/tracker/store";
import { TrackerTable } from "@/features/tracker/components/tracker-table";
import { TrackerKanban } from "@/features/tracker/components/tracker-kanban";
import { exportApplicationsToCSV, exportApplicationsToJSON } from "@/features/tracker/lib/export";
import { Table, LayoutGrid, Search, Filter, Download } from "lucide-react";
import { ApplicationStatus } from "@/components/ui/status-rail";

export default function TrackerPage() {
  const { user } = useAuth();
  const {
    applications,
    loading,
    viewMode,
    searchQuery,
    statusFilter,
    setViewMode,
    setSearchQuery,
    setStatusFilter,
    loadApplications,
    updateStatus,
  } = useTrackerStore();

  useEffect(() => {
    if (user?.uid) {
      loadApplications(user.uid);
    }
  }, [user?.uid, loadApplications]);

  // Filtered dataset
  const filteredApps = applications.filter((app) => {
    const matchesSearch =
      (app.company || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.role || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
      (app.contactEmail || "").toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === "all" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-5">
        <div>
          <h1 className="text-2xl font-bold text-[var(--ink)] tracking-tight">Application Tracker</h1>
          <p className="text-sm text-[var(--ink-soft)] mt-1">
            Track pipeline stages, update application outcomes, and export records.
          </p>
        </div>

        {/* View Mode & Export Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex items-center p-1 bg-[var(--surface)] border border-[var(--border)] rounded-xl text-xs font-medium">
            <button
              onClick={() => setViewMode("table")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === "table"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              <Table className="w-3.5 h-3.5" />
              <span>Table</span>
            </button>
            <button
              onClick={() => setViewMode("kanban")}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                viewMode === "kanban"
                  ? "bg-[var(--accent)] text-white"
                  : "text-[var(--ink-soft)] hover:text-[var(--ink)]"
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
          </div>

          {/* Export CSV */}
          <button
            onClick={() => exportApplicationsToCSV(filteredApps)}
            disabled={!filteredApps.length}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-mono text-[var(--ink)] hover:bg-[var(--accent-soft)]/50 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>CSV</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={() => exportApplicationsToJSON(filteredApps)}
            disabled={!filteredApps.length}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-mono text-[var(--ink)] hover:bg-[var(--accent-soft)]/50 transition-colors disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--ink-soft)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search company, role, or contact email..."
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors"
          />
        </div>

        {/* Status filter */}
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-[var(--ink-soft)]" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ApplicationStatus | "all")}
            className="bg-[var(--surface)] border border-[var(--border)] text-[var(--ink)] text-xs font-mono px-3 py-2.5 rounded-xl cursor-pointer focus:outline-none focus:border-[var(--accent)]"
          >
            <option value="all">All Pipeline Stages</option>
            <option value="drafted">Drafted</option>
            <option value="sent">Sent</option>
            <option value="interviewing">Interviewing</option>
            <option value="offer">Offer</option>
            <option value="rejected">Rejected</option>
            <option value="no_response">No Response</option>
          </select>
        </div>
      </div>

      {/* Content View */}
      {loading ? (
        <div className="p-12 text-center bg-[var(--surface)] border border-[var(--border)] rounded-2xl">
          <div className="flex items-center justify-center space-x-2 text-xs font-mono text-[var(--ink-soft)]">
            <div className="w-4 h-4 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <span>Loading tracker entries...</span>
          </div>
        </div>
      ) : viewMode === "table" ? (
        <TrackerTable applications={filteredApps} onStatusChange={updateStatus} />
      ) : (
        <TrackerKanban applications={filteredApps} onStatusChange={updateStatus} />
      )}
    </div>
  );
}
