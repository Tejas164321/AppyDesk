"use client";

import React, { useState } from "react";
import { UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form";
import { Cpu, Key, Eye, EyeOff, Globe } from "lucide-react";
import { LLMProvider } from "../types";

interface LLMSettingsProps {
  register: UseFormRegister<any>;
  setValue: UseFormSetValue<any>;
  watch: UseFormWatch<any>;
}

const defaultModels: Record<LLMProvider, { name: string; value: string }[]> = {
  anthropic: [
    { name: "Claude 3.5 Sonnet (Recommended)", value: "claude-3-5-sonnet-20241022" },
    { name: "Claude 3 Haiku (Fast)", value: "claude-3-haiku-20240307" },
  ],
  gemini: [
    { name: "Gemini 1.5 Flash (Fast & Low Cost)", value: "gemini-1.5-flash" },
    { name: "Gemini 1.5 Pro (High Reasoning)", value: "gemini-1.5-pro" },
  ],
  groq: [
    { name: "Llama 3.3 70B Versatile (Groq Speed)", value: "llama-3.3-70b-versatile" },
    { name: "Mixtral 8x7B (Groq Speed)", value: "mixtral-8x7b-32768" },
  ],
  grok: [
    { name: "xAI Grok Beta", value: "grok-beta" },
    { name: "Custom Grok Model", value: "grok-2" },
  ],
  openai: [
    { name: "GPT-4o (Omni)", value: "gpt-4o" },
    { name: "GPT-4o Mini (Fast)", value: "gpt-4o-mini" },
  ],
};

export function LLMSettings({ register, setValue, watch }: LLMSettingsProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const currentProvider = (watch("llmConfig.provider") || "anthropic") as LLMProvider;
  const models = defaultModels[currentProvider] || [];

  const handleProviderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newProvider = e.target.value as LLMProvider;
    setValue("llmConfig.provider", newProvider);
    if (defaultModels[newProvider]?.[0]) {
      setValue("llmConfig.model", defaultModels[newProvider][0].value);
    }
  };

  return (
    <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl space-y-6">
      <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
        <div className="flex items-center space-x-2">
          <Cpu className="w-5 h-5 text-[var(--accent)]" />
          <h3 className="text-sm font-semibold text-[var(--ink)]">AI Engine & Multi-LLM Credentials</h3>
        </div>
        <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-semibold uppercase">
          Dynamic Provider Router
        </span>
      </div>

      <p className="text-xs text-[var(--ink-soft)] leading-relaxed">
        Choose your preferred AI model provider (Anthropic, Gemini, Groq, Grok, or OpenAI) and enter your custom API key directly. ApplyDesk will route all job description parsing and cold outreach email drafting through your chosen engine.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Provider Select */}
        <div>
          <label className="text-xs font-medium text-[var(--ink-soft)] block mb-1">Select LLM Provider</label>
          <select
            value={currentProvider}
            onChange={handleProviderChange}
            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] font-mono focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            <option value="anthropic">Anthropic Claude (Default)</option>
            <option value="gemini">Google Gemini AI</option>
            <option value="groq">Groq (Ultra Fast Llama 3)</option>
            <option value="grok">xAI Grok</option>
            <option value="openai">OpenAI / Custom Endpoint</option>
          </select>
        </div>

        {/* Model Select */}
        <div>
          <label className="text-xs font-medium text-[var(--ink-soft)] block mb-1">Target Model</label>
          <select
            {...register("llmConfig.model")}
            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] font-mono focus:outline-none focus:border-[var(--accent)] cursor-pointer"
          >
            {models.map((m) => (
              <option key={m.value} value={m.value}>
                {m.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Custom API Key Input */}
      <div>
        <label className="text-xs font-medium text-[var(--ink-soft)] flex items-center justify-between mb-1">
          <span className="flex items-center gap-1">
            <Key className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Custom API Key for {currentProvider.toUpperCase()}</span>
          </span>
          <span className="text-[11px] text-[var(--ink-soft)] font-mono">Stored securely in your profile</span>
        </label>
        <div className="relative">
          <input
            type={showApiKey ? "text" : "password"}
            {...register("llmConfig.apiKey")}
            placeholder={`Enter your ${currentProvider} API key (e.g. sk-...)`}
            className="w-full px-3 py-2 pr-10 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] font-mono focus:outline-none focus:border-[var(--accent)]"
          />
          <button
            type="button"
            onClick={() => setShowApiKey(!showApiKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-soft)] hover:text-[var(--ink)]"
          >
            {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Custom Endpoint Input for Grok / OpenAI */}
      {(currentProvider === "grok" || currentProvider === "openai") && (
        <div>
          <label className="text-xs font-medium text-[var(--ink-soft)] flex items-center gap-1 mb-1">
            <Globe className="w-3.5 h-3.5 text-[var(--accent)]" />
            <span>Custom API Base URL Endpoint (Optional)</span>
          </label>
          <input
            type="text"
            {...register("llmConfig.customEndpoint")}
            placeholder={
              currentProvider === "grok"
                ? "https://api.x.ai/v1/chat/completions"
                : "https://api.openai.com/v1/chat/completions"
            }
            className="w-full px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] font-mono focus:outline-none focus:border-[var(--accent)]"
          />
        </div>
      )}
    </div>
  );
}
