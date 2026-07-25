"use client";

import React, { useState } from "react";
import { Key, Copy, Check, ShieldAlert, Trash2, RefreshCw, Smartphone } from "lucide-react";

interface ExtensionTokenSettingsProps {
  uid: string;
  hasExistingToken?: boolean;
  tokenCreatedAt?: string | null;
}

export function ExtensionTokenSettings({
  uid,
  hasExistingToken = false,
  tokenCreatedAt = null,
}: ExtensionTokenSettingsProps) {
  const [token, setToken] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isTokenActive, setIsTokenActive] = useState(hasExistingToken);
  const [createdAt, setCreatedAt] = useState<string | null>(tokenCreatedAt);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleGenerateToken = async () => {
    if (!uid) return;
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/user/token", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setToken(data.token);
        setIsTokenActive(true);
        setCreatedAt(data.createdAt);
      } else {
        setErrorMsg(data.error || "Failed to generate extension token");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error generating token");
    } finally {
      setLoading(false);
    }
  };

  const handleRevokeToken = async () => {
    if (!uid || !confirm("Are you sure you want to revoke your Extension API Token? Any active browser extension will lose access.")) {
      return;
    }
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/user/token", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setToken(null);
        setIsTokenActive(false);
        setCreatedAt(null);
      } else {
        setErrorMsg(data.error || "Failed to revoke token");
      }
    } catch (err: any) {
      setErrorMsg(err?.message || "Network error revoking token");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!token) return;
    navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl space-y-5">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center space-x-2">
          <Key className="w-5 h-5 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--ink)]">Developer & Extension Access Token</h3>
        </div>
        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-semibold uppercase">
          ApplyDesk Capture
        </span>
      </div>

      <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
        Generate a Personal Access Token to authenticate the <strong>ApplyDesk Capture Chrome Extension</strong>. This token provides scoped access to capture job postings and send applications directly from your browser without opening the dashboard.
      </p>

      {errorMsg && (
        <div className="p-3 text-xs bg-red-500/10 border border-red-500/20 text-[var(--red)] rounded-xl flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Raw Token Reveal Modal/Banner */}
      {token && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/30 rounded-xl space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-500 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              <span>Copy Your New API Token (Shown ONCE only)</span>
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="text"
              readOnly
              value={token}
              className="w-full px-3 py-2 text-xs font-mono bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] rounded-lg select-all focus:outline-none"
            />
            <button
              type="button"
              onClick={handleCopy}
              className="px-3 py-2 bg-[var(--accent)] text-white text-xs font-medium rounded-lg flex items-center space-x-1.5 hover:opacity-90 transition-opacity"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
          </div>

          <p className="text-[11px] text-[var(--ink-soft)] font-mono">
            ⚠️ Store this token safely in your Chrome Extension Options page. Only its hash is stored in the database.
          </p>
        </div>
      )}

      {/* Token Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2">
        <div className="flex items-center space-x-2 text-xs font-mono text-[var(--ink-soft)]">
          <div
            className={`w-2.5 h-2.5 rounded-full ${
              isTokenActive ? "bg-[var(--green)]" : "bg-[var(--ink-soft)]"
            }`}
          />
          <span>
            {isTokenActive
              ? `Active Token ${createdAt ? `(Generated ${new Date(createdAt).toLocaleDateString()})` : ""}`
              : "No Active Extension Token"}
          </span>
        </div>

        <div className="flex items-center space-x-3">
          {isTokenActive && (
            <button
              type="button"
              disabled={loading}
              onClick={handleRevokeToken}
              className="px-3.5 py-2 text-xs font-medium text-[var(--red)] border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 rounded-lg flex items-center space-x-1.5 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Revoke Token</span>
            </button>
          )}

          <button
            type="button"
            disabled={loading}
            onClick={handleGenerateToken}
            className="px-4 py-2 text-xs font-medium bg-[var(--accent)] text-white rounded-lg flex items-center space-x-1.5 hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {loading ? (
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Key className="w-3.5 h-3.5" />
            )}
            <span>{isTokenActive ? "Regenerate Token" : "Generate Extension Token"}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
