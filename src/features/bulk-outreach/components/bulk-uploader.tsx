"use client";

import React from "react";
import { UploadCloud, ShieldCheck, FileSpreadsheet, Download, AlertCircle } from "lucide-react";
import { useBulkStore } from "../store";

export function BulkUploader() {
  const { uploadFile, parsing, complianceConfirmed, setComplianceConfirmed, listName, contacts, error } =
    useBulkStore();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  const downloadSampleCsv = () => {
    const sampleCsv = `email,name,company,role\nhr.alice@acme.com,Alice Smith,Acme Corp,Talent Lead\nrecruiter.bob@tech.io,Bob Jones,Tech.io,Tech Recruiter\njobs@innovate.co,Hiring Manager,Innovate Co,Engineering Director`;
    const blob = new Blob([sampleCsv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "applydesk_sample_contacts.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-6 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-4">
        <div>
          <h2 className="text-base font-semibold text-[var(--ink)]">1. Upload HR Contact List</h2>
          <p className="text-xs text-[var(--ink-soft)] mt-0.5">
            Upload a CSV or XLSX spreadsheet containing contact email addresses.
          </p>
        </div>

        <button
          onClick={downloadSampleCsv}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[var(--border)] bg-[var(--bg)] text-xs font-mono text-[var(--ink)] hover:bg-[var(--accent-soft)]/50 transition-colors"
        >
          <Download className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span>Sample CSV</span>
        </button>
      </div>

      {/* File Dropzone */}
      <div className="border-2 border-dashed border-[var(--border)] rounded-xl p-8 text-center bg-[var(--bg)] hover:border-[var(--accent)] transition-colors">
        <input
          type="file"
          id="bulk-csv-input"
          accept=".csv,.xlsx,.xls"
          onChange={handleFileChange}
          disabled={parsing}
          className="hidden"
        />

        {parsing ? (
          <div className="flex flex-col items-center space-y-2 py-2">
            <div className="w-6 h-6 border-2 border-[var(--accent)] border-t-transparent rounded-full animate-spin" />
            <p className="text-xs font-mono text-[var(--ink-soft)]">Parsing spreadsheet contacts...</p>
          </div>
        ) : contacts.length > 0 ? (
          <div className="flex flex-col items-center space-y-2">
            <div className="p-3 bg-[var(--accent-soft)] text-[var(--accent)] rounded-full">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-[var(--ink)]">{listName}</p>
            <p className="text-xs font-mono text-[var(--green)]">
              {contacts.length} valid contacts loaded
            </p>
            <label htmlFor="bulk-csv-input" className="text-xs text-[var(--ink-soft)] underline cursor-pointer pt-1">
              Replace file
            </label>
          </div>
        ) : (
          <label htmlFor="bulk-csv-input" className="cursor-pointer block space-y-2">
            <UploadCloud className="w-8 h-8 text-[var(--ink-soft)] mx-auto" />
            <p className="text-sm font-medium text-[var(--ink)]">Click to upload CSV or XLSX spreadsheet</p>
            <p className="text-xs text-[var(--ink-soft)] font-mono">Columns: email (required), name, company, role</p>
          </label>
        )}
      </div>

      {/* Mandatory Compliance Gate */}
      <div className="p-4 bg-[var(--bg)] border border-[var(--border)] rounded-xl space-y-3">
        <div className="flex items-center space-x-2 text-xs font-semibold text-[var(--ink)]">
          <ShieldCheck className="w-4 h-4 text-[var(--accent)]" />
          <span>Compliance & Sourcing Authorization Gate</span>
        </div>

        <label className="flex items-start space-x-3 cursor-pointer">
          <input
            type="checkbox"
            checked={complianceConfirmed}
            onChange={(e) => setComplianceConfirmed(e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded border-[var(--border)] text-[var(--accent)] focus:ring-[var(--accent)] cursor-pointer"
          />
          <span className="text-xs text-[var(--ink)] leading-relaxed">
            I confirm this HR contact list was legitimately sourced (direct outreach, network contacts, or public team listings) and was <span className="font-semibold text-[var(--ink)]">not harvested, scraped, or purchased from third-party brokers</span>.
          </span>
        </label>
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-xs text-[var(--red)] rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
