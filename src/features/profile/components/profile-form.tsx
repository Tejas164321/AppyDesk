"use client";

import React, { useEffect, useCallback, useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { profileFormSchema, ProfileFormValues } from "../schema";
import { useProfileStore } from "../store";
import { useAuth } from "@/features/auth/auth-context";
import { ResumeUploader } from "./resume-uploader";
import { LLMSettings } from "./llm-settings";
import { ExtensionTokenSettings } from "./extension-token-settings";
import { ResumeFile } from "../types";
import {
  Save, CheckCircle, AlertCircle, RefreshCw, User, Link as LinkIcon,
  Sparkles, Settings, Briefcase, GraduationCap, Plus, Trash2, X, ChevronDown, ChevronUp
} from "lucide-react";

const inputCls =
  "w-full mt-1 px-3 py-2 text-sm rounded-lg bg-[var(--bg)] border border-[var(--border)] text-[var(--ink)] focus:outline-none focus:border-[var(--accent)] transition-colors";
const labelCls = "text-xs font-medium text-[var(--ink-soft)]";

// ─── Work Experience Entry ────────────────────────────────────────────────────
function ExperienceEntry({ index, register, remove, watch, setValue }: any) {
  const [open, setOpen] = useState(true);
  const isCurrent = watch(`workExperience.${index}.isCurrent`);
  const title = watch(`workExperience.${index}.title`);
  const company = watch(`workExperience.${index}.company`);

  return (
    <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl overflow-hidden">
      {/* Entry Header */}
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <Briefcase className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-sm font-medium text-[var(--ink)]">
            {title || company ? `${title}${title && company ? " @ " : ""}${company}` : `Experience #${index + 1}`}
          </span>
          {isCurrent && (
            <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">
              Current
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); remove(index); }}
            className="p-1 rounded-md text-[var(--ink-soft)] hover:text-[var(--red)] hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-[var(--ink-soft)]" /> : <ChevronDown className="w-4 h-4 text-[var(--ink-soft)]" />}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div>
              <label className={labelCls}>Job Title *</label>
              <input {...register(`workExperience.${index}.title`)} className={inputCls} placeholder="e.g. Senior Software Engineer" />
            </div>
            <div>
              <label className={labelCls}>Company *</label>
              <input {...register(`workExperience.${index}.company`)} className={inputCls} placeholder="e.g. Google" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Start Date (YYYY-MM)</label>
              <input {...register(`workExperience.${index}.startDate`)} className={inputCls} placeholder="2021-06" />
            </div>
            <div>
              <label className={labelCls}>End Date (YYYY-MM)</label>
              <input
                {...register(`workExperience.${index}.endDate`)}
                className={inputCls}
                placeholder="2024-01"
                disabled={isCurrent}
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id={`current-${index}`}
              {...register(`workExperience.${index}.isCurrent`)}
              onChange={(e) => {
                setValue(`workExperience.${index}.isCurrent`, e.target.checked);
                if (e.target.checked) setValue(`workExperience.${index}.endDate`, null);
              }}
              className="w-4 h-4 accent-[var(--accent)] rounded"
            />
            <label htmlFor={`current-${index}`} className={labelCls + " cursor-pointer"}>
              Currently working here
            </label>
          </div>

          <div>
            <label className={labelCls}>Location</label>
            <input {...register(`workExperience.${index}.location`)} className={inputCls} placeholder="e.g. Mountain View, CA (Remote)" />
          </div>

          <div>
            <label className={labelCls}>Accomplishments & Description</label>
            <textarea
              {...register(`workExperience.${index}.description`)}
              rows={3}
              className={inputCls + " resize-none"}
              placeholder="• Led migration of monolith to microservices reducing latency by 40%&#10;• Mentored 3 junior engineers..."
            />
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Education Entry ──────────────────────────────────────────────────────────
function EducationEntry({ index, register, remove, watch }: any) {
  const [open, setOpen] = useState(true);
  const school = watch(`education.${index}.school`);
  const degree = watch(`education.${index}.degree`);

  return (
    <div className="bg-[var(--bg)] border border-[var(--border)] rounded-xl overflow-hidden">
      <div
        className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-white/5 transition-colors"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-[var(--accent)]" />
          <span className="text-sm font-medium text-[var(--ink)]">
            {school || degree ? `${degree}${degree && school ? " — " : ""}${school}` : `Education #${index + 1}`}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); remove(index); }}
            className="p-1 rounded-md text-[var(--ink-soft)] hover:text-[var(--red)] hover:bg-red-500/10 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          {open ? <ChevronUp className="w-4 h-4 text-[var(--ink-soft)]" /> : <ChevronDown className="w-4 h-4 text-[var(--ink-soft)]" />}
        </div>
      </div>

      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-[var(--border)]" onClick={(e) => e.stopPropagation()}>
          <div className="pt-3">
            <label className={labelCls}>School / University *</label>
            <input {...register(`education.${index}.school`)} className={inputCls} placeholder="e.g. University of California, Berkeley" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Degree</label>
              <input {...register(`education.${index}.degree`)} className={inputCls} placeholder="e.g. Bachelor of Science" />
            </div>
            <div>
              <label className={labelCls}>Field of Study</label>
              <input {...register(`education.${index}.field`)} className={inputCls} placeholder="e.g. Computer Science" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelCls}>Start Year</label>
              <input {...register(`education.${index}.startDate`)} className={inputCls} placeholder="2018" />
            </div>
            <div>
              <label className={labelCls}>End Year</label>
              <input {...register(`education.${index}.endDate`)} className={inputCls} placeholder="2022" />
            </div>
            <div>
              <label className={labelCls}>GPA (optional)</label>
              <input {...register(`education.${index}.gpa`)} className={inputCls} placeholder="3.8" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Skills Tag Input ─────────────────────────────────────────────────────────
function SkillsInput({ skills, setSkills }: { skills: string[]; setSkills: (s: string[]) => void }) {
  const [input, setInput] = useState("");

  const addSkill = (val: string) => {
    const cleaned = val.trim().replace(/,+$/, "").trim();
    if (cleaned && !skills.includes(cleaned)) {
      setSkills([...skills, cleaned]);
    }
    setInput("");
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addSkill(input);
    } else if (e.key === "Backspace" && !input && skills.length > 0) {
      setSkills(skills.slice(0, -1));
    }
  };

  return (
    <div className="flex flex-wrap gap-2 mt-1 p-2 min-h-[44px] bg-[var(--bg)] border border-[var(--border)] rounded-lg focus-within:border-[var(--accent)] transition-colors">
      {skills.map((skill) => (
        <span
          key={skill}
          className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20"
        >
          {skill}
          <button type="button" onClick={() => setSkills(skills.filter((s) => s !== skill))}>
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}
      <input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={onKeyDown}
        onBlur={() => { if (input.trim()) addSkill(input); }}
        className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]"
        placeholder={skills.length === 0 ? "Type a skill + Enter (e.g. TypeScript, React, Node.js...)" : "Add more..."}
      />
    </div>
  );
}

// ─── Main Profile Form ────────────────────────────────────────────────────────
export function ProfileForm() {
  const { user } = useAuth();
  const { profile, loading, saveStatus, lastSavedAt, errorMessage, loadProfile, updateProfile, setResumeFile } =
    useProfileStore();

  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      name: "", email: "", phone: "", location: "",
      links: { linkedin: "", github: "", portfolio: "", resumeLink: "" },
      summary: "",
      workExperience: [],
      education: [],
      skills: [],
      yearsOfExperience: undefined,
      workAuthorization: "",
      salaryExpectation: "",
      availableFrom: "",
      languages: [],
      settings: { dailySendCap: 15, warmupStartDate: new Date().toISOString(), timezone: "UTC" },
      llmConfig: { provider: "anthropic", apiKey: "", model: "claude-3-5-sonnet-20241022", customEndpoint: "" },
    },
  });

  const { register, handleSubmit, reset, watch, setValue, control, formState: { errors } } = form;

  const {
    fields: experienceFields,
    append: appendExperience,
    remove: removeExperience,
  } = useFieldArray({ control, name: "workExperience" });

  const {
    fields: educationFields,
    append: appendEducation,
    remove: removeEducation,
  } = useFieldArray({ control, name: "education" });

  // Track skills locally so we can sync to form
  const currentSkills = watch("skills") ?? [];
  const setSkills = (s: string[]) => setValue("skills", s);

  // Track languages locally
  const [langInput, setLangInput] = useState("");
  const currentLangs = watch("languages") ?? [];

  const addLang = (val: string) => {
    const cleaned = val.trim().replace(/,+$/, "").trim();
    if (cleaned && !currentLangs.includes(cleaned)) setValue("languages", [...currentLangs, cleaned]);
    setLangInput("");
  };

  useEffect(() => { if (user?.uid) loadProfile(user.uid); }, [user?.uid, loadProfile]);

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
        workExperience: profile.workExperience || [],
        education: profile.education || [],
        skills: profile.skills || [],
        yearsOfExperience: profile.yearsOfExperience,
        workAuthorization: profile.workAuthorization || "",
        salaryExpectation: profile.salaryExpectation || "",
        availableFrom: profile.availableFrom || "",
        languages: profile.languages || [],
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
      reset((prev) => ({ ...prev, name: user.displayName || "", email: user.email || "" }));
    }
  }, [profile, user, reset]);

  const onSave = useCallback(
    async (values: ProfileFormValues) => {
      if (!user?.uid) return;
      await updateProfile(user.uid, values as any);
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
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[var(--surface)] border border-[var(--border)] p-4 rounded-2xl">
        <div className="flex items-center space-x-3">
          <div className="p-2.5 bg-[var(--accent-soft)] text-[var(--accent)] rounded-xl">
            <User className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold text-[var(--ink)]">Profile & Autofill Context</h2>
            <p className="text-xs text-[var(--ink-soft)] font-mono">
              All fields here are used for 100% accurate form autofill
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2 px-3 py-1.5 rounded-full text-xs font-mono bg-[var(--bg)] border border-[var(--border)]">
            {saveStatus === "saving" && <><RefreshCw className="w-3.5 h-3.5 text-[var(--amber)] animate-spin" /><span className="text-[var(--amber)] font-medium">Saving...</span></>}
            {saveStatus === "saved" && <><CheckCircle className="w-3.5 h-3.5 text-[var(--green)]" /><span className="text-[var(--ink)]">Saved {lastSavedAt ? `at ${lastSavedAt}` : ""}</span></>}
            {saveStatus === "error" && <><AlertCircle className="w-3.5 h-3.5 text-[var(--red)]" /><span className="text-[var(--red)] font-medium">Save Failed</span></>}
            {saveStatus === "idle" && <span className="text-[var(--ink-soft)]">All changes up to date</span>}
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

      {/* Contact Info + Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-[var(--border)] pb-3">
            <User className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--ink)]">Contact Information</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Full Name</label>
              <input {...register("name")} className={inputCls} placeholder="e.g. Alex Morgan" />
              {errors.name && <p className="text-[11px] text-[var(--red)] mt-1">{errors.name.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Email Address</label>
              <input {...register("email")} className={inputCls} placeholder="alex@example.com" />
              {errors.email && <p className="text-[11px] text-[var(--red)] mt-1">{errors.email.message}</p>}
            </div>
            <div>
              <label className={labelCls}>Phone Number</label>
              <input {...register("phone")} className={inputCls} placeholder="+1 (555) 000-0000" />
            </div>
            <div>
              <label className={labelCls}>Location</label>
              <input {...register("location")} className={inputCls} placeholder="e.g. San Francisco, CA (Open to Remote)" />
            </div>
          </div>
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-[var(--border)] pb-3">
            <LinkIcon className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--ink)]">Online Presence & Links</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>LinkedIn Profile URL</label>
              <input {...register("links.linkedin")} className={inputCls} placeholder="https://linkedin.com/in/username" />
              {errors.links?.linkedin && <p className="text-[11px] text-[var(--red)] mt-1">{errors.links.linkedin.message}</p>}
            </div>
            <div>
              <label className={labelCls}>GitHub Profile URL</label>
              <input {...register("links.github")} className={inputCls} placeholder="https://github.com/username" />
            </div>
            <div>
              <label className={labelCls}>Portfolio Website</label>
              <input {...register("links.portfolio")} className={inputCls} placeholder="https://yourportfolio.com" />
            </div>
            <div>
              <label className={labelCls}>Direct Resume Link (Auto-populated)</label>
              <input {...register("links.resumeLink")} readOnly className={inputCls + " opacity-50 cursor-not-allowed font-mono"} placeholder="Populated via Resume Upload" />
            </div>
          </div>
        </div>
      </div>

      {/* ─── Work Experience ─── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center space-x-2">
            <Briefcase className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--ink)]">Work Experience</h3>
            <span className="text-xs text-[var(--ink-soft)] font-mono">(used for autofill — dates, current company, titles)</span>
          </div>
          <button
            type="button"
            onClick={() =>
              appendExperience({
                id: crypto.randomUUID(),
                company: "", title: "", startDate: "", endDate: null,
                isCurrent: false, location: "", description: "",
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Experience
          </button>
        </div>

        {experienceFields.length === 0 ? (
          <p className="text-xs text-[var(--ink-soft)] font-mono py-2">
            No work experience added yet. Click "Add Experience" to add your first entry.
          </p>
        ) : (
          <div className="space-y-3">
            {experienceFields.map((field, index) => (
              <ExperienceEntry
                key={field.id}
                index={index}
                register={register}
                remove={removeExperience}
                watch={watch}
                setValue={setValue}
              />
            ))}
          </div>
        )}

        {/* Years of Experience quick-fill */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          <div>
            <label className={labelCls}>Total Years of Experience</label>
            <input
              type="number"
              {...register("yearsOfExperience", { valueAsNumber: true })}
              className={inputCls}
              min={0} max={50}
              placeholder="e.g. 5"
            />
          </div>
        </div>
      </div>

      {/* ─── Education ─── */}
      <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl space-y-4">
        <div className="flex items-center justify-between border-b border-[var(--border)] pb-3">
          <div className="flex items-center space-x-2">
            <GraduationCap className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--ink)]">Education</h3>
          </div>
          <button
            type="button"
            onClick={() =>
              appendEducation({
                id: crypto.randomUUID(),
                school: "", degree: "", field: "",
                startDate: "", endDate: "", gpa: "",
              })
            }
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20 hover:bg-[var(--accent)]/20 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" /> Add Education
          </button>
        </div>

        {educationFields.length === 0 ? (
          <p className="text-xs text-[var(--ink-soft)] font-mono py-2">
            No education entries yet. Click "Add Education" to add your degree.
          </p>
        ) : (
          <div className="space-y-3">
            {educationFields.map((field, index) => (
              <EducationEntry
                key={field.id}
                index={index}
                register={register}
                remove={removeEducation}
                watch={watch}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── Skills & Languages ─── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-[var(--border)] pb-3">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--ink)]">Skills</h3>
          </div>
          <p className="text-xs text-[var(--ink-soft)]">Type a skill and press Enter or comma to add.</p>
          <SkillsInput skills={currentSkills} setSkills={setSkills} />
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-[var(--border)] pb-3">
            <Settings className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--ink)]">Autofill Preferences</h3>
          </div>
          <div className="space-y-3">
            <div>
              <label className={labelCls}>Work Authorization</label>
              <input {...register("workAuthorization")} className={inputCls} placeholder="e.g. US Citizen / H1B / Need Sponsorship" />
            </div>
            <div>
              <label className={labelCls}>Salary Expectation</label>
              <input {...register("salaryExpectation")} className={inputCls} placeholder="e.g. $120k–$150k or Open to discussion" />
            </div>
            <div>
              <label className={labelCls}>Available From</label>
              <input {...register("availableFrom")} className={inputCls} placeholder="e.g. Immediately / 2 weeks notice" />
            </div>
            <div>
              <label className={labelCls}>Languages</label>
              <div className="flex flex-wrap gap-2 mt-1 p-2 min-h-[44px] bg-[var(--bg)] border border-[var(--border)] rounded-lg focus-within:border-[var(--accent)] transition-colors">
                {currentLangs.map((lang) => (
                  <span key={lang} className="flex items-center gap-1 px-2 py-1 text-xs rounded-md bg-[var(--accent-soft)] text-[var(--accent)] border border-[var(--accent)]/20">
                    {lang}
                    <button type="button" onClick={() => setValue("languages", currentLangs.filter((l) => l !== lang))}><X className="w-3 h-3" /></button>
                  </span>
                ))}
                <input
                  value={langInput}
                  onChange={(e) => setLangInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); addLang(langInput); } }}
                  onBlur={() => { if (langInput.trim()) addLang(langInput); }}
                  className="flex-1 min-w-[120px] bg-transparent outline-none text-sm text-[var(--ink)] placeholder:text-[var(--ink-soft)]"
                  placeholder={currentLangs.length === 0 ? "English (Native), Spanish..." : "Add..."}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* LLM Settings */}
      <LLMSettings register={register} setValue={setValue} watch={watch} />

      {/* Extension Token */}
      <ExtensionTokenSettings
        uid={user?.uid || ""}
        hasExistingToken={!!(profile as any)?.apiTokenHash}
        tokenCreatedAt={(profile as any)?.apiTokenCreatedAt}
      />

      {/* Resume Upload & Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl">
          <ResumeUploader uid={user?.uid || ""} resumeFile={profile?.resumeFile} onUploadSuccess={handleResumeSuccess} />
        </div>

        <div className="bg-[var(--surface)] border border-[var(--border)] p-6 rounded-2xl space-y-4">
          <div className="flex items-center space-x-2 border-b border-[var(--border)] pb-3">
            <Sparkles className="w-4 h-4 text-[var(--accent)]" />
            <h3 className="text-sm font-semibold text-[var(--ink)]">Drafting Context Summary</h3>
          </div>
          <p className="text-xs text-[var(--ink-soft)]">
            Provided to the AI for tailored email drafting and open-ended question answers.
          </p>
          <textarea
            {...register("summary")}
            rows={6}
            className={inputCls + " resize-none"}
            placeholder="e.g. Senior Full-Stack Engineer with 6+ years in TypeScript, React, Next.js, Node.js, and AWS..."
          />
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
            <label className={labelCls + " font-mono"}>Daily Outbound Email Send Cap</label>
            <input type="number" {...register("settings.dailySendCap", { valueAsNumber: true })} className={inputCls + " font-mono"} min={1} max={50} />
            <p className="text-[11px] text-[var(--ink-soft)] mt-1 font-mono">Recommended: 15/day</p>
          </div>
          <div>
            <label className={labelCls + " font-mono"}>Mailbox Timezone</label>
            <input {...register("settings.timezone")} className={inputCls + " font-mono"} placeholder="America/New_York" />
          </div>
        </div>
      </div>
    </form>
  );
}
