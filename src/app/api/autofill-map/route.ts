import { NextRequest, NextResponse } from "next/server";
import { authenticateRequest } from "@/lib/api-auth";
import { handleCorsOptions, withCors } from "@/lib/cors";
import { UserProfile, WorkExperience, Education } from "@/features/profile/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function OPTIONS(req: NextRequest) {
  return handleCorsOptions(req);
}

// ════════════════════════════════════════════════════════════════
// TYPE DEFINITIONS
// ════════════════════════════════════════════════════════════════

export interface SelectOption {
  value: string;
  label: string;
}

export interface FieldDescriptor {
  fieldId: string;
  domType?: "standard" | "radio-group" | "checkbox-group";
  type: string;
  tag?: string;
  name?: string;
  id?: string;
  label?: string;
  placeholder?: string;
  ariaLabel?: string;
  sectionContext?: string;
  fieldsetLegend?: string;
  options?: SelectOption[];           // select dropdown options
  radioOptions?: SelectOption[];      // radio group options
  checkboxOptions?: SelectOption[];   // checkbox group options
  required?: boolean;
  maxLength?: number | string | null;
  currentValue?: string;
  groupLabel?: string;
}

export interface FieldMapping {
  fieldId: string;
  value: string | string[] | null;
  isDraft: boolean;
  isUnmapped: boolean;
  reason?: string;
}

// ════════════════════════════════════════════════════════════════
// ROUTE HANDLER
// ════════════════════════════════════════════════════════════════

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { fields = [], pageTitle = "", pageUrl = "", pageContext = "", uid } = body;

    if (!Array.isArray(fields) || fields.length === 0) {
      return withCors(
        NextResponse.json({ error: "No field descriptors provided" }, { status: 400 }),
        req
      );
    }

    const authResult = await authenticateRequest(req, uid);
    if (!authResult.authenticated) {
      return withCors(
        NextResponse.json({ error: authResult.error || "Unauthorized" }, { status: 401 }),
        req
      );
    }

    const profile = authResult.userProfile;
    const mappings = await mapFieldsWithProfile(fields, profile, pageTitle, pageContext);

    const filledCount = mappings.filter((m) => m.value !== null && !m.isDraft).length;
    const draftCount  = mappings.filter((m) => m.isDraft).length;
    const unmappedCount = mappings.filter((m) => m.isUnmapped).length;

    return withCors(
      NextResponse.json({ mappings, totalDetected: fields.length, filledCount, draftCount, unmappedCount }),
      req
    );
  } catch (error: any) {
    console.error("Autofill mapping route error:", error);
    return withCors(
      NextResponse.json({ error: error?.message || "Failed to process autofill mapping" }, { status: 500 }),
      req
    );
  }
}

// ════════════════════════════════════════════════════════════════
// PROFILE CONTEXT BUILDER
// ════════════════════════════════════════════════════════════════

function buildCandidateContext(profile: UserProfile): string {
  const nameParts = (profile.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  // Derive current role from workExperience
  const currentJob = (profile.workExperience || []).find((e) => e.isCurrent) 
                     || (profile.workExperience || [])[0] 
                     || null;

  const lines: string[] = [
    "=== CANDIDATE PROFILE ===",
    `First Name: ${firstName}`,
    `Last Name:  ${lastName}`,
    `Full Name:  ${profile.name || ""}`,
    `Email:      ${profile.email || ""}`,
    `Phone:      ${profile.phone || ""}`,
    `Location:   ${profile.location || ""}`,
    "",
    "--- Links ---",
    `LinkedIn:   ${profile.links?.linkedin || ""}`,
    `GitHub:     ${profile.links?.github || ""}`,
    `Portfolio:  ${profile.links?.portfolio || ""}`,
    `Resume URL: ${profile.resumeFile?.cloudinaryUrl || profile.links?.resumeLink || "Available"}`,
    "",
    "--- Employment ---",
    `Years of Experience: ${profile.yearsOfExperience ?? "Not specified"}`,
    `Current Role:        ${currentJob ? `${currentJob.title} at ${currentJob.company}` : "Not specified"}`,
    `Work Authorization:  ${profile.workAuthorization || "Not specified"}`,
    `Salary Expectation:  ${profile.salaryExpectation || "Not specified"}`,
    `Available From:      ${profile.availableFrom || "Not specified"}`,
  ];

  // Work history
  if (profile.workExperience && profile.workExperience.length > 0) {
    lines.push("", "--- Work History ---");
    for (const job of profile.workExperience) {
      const end = job.isCurrent ? "Present" : (job.endDate || "");
      lines.push(`• ${job.title} at ${job.company} (${job.startDate} – ${end}) | ${job.location}`);
      if (job.description) {
        job.description.split("\n").forEach((line) => {
          if (line.trim()) lines.push(`  ${line.trim()}`);
        });
      }
    }
  }

  // Education
  if (profile.education && profile.education.length > 0) {
    lines.push("", "--- Education ---");
    for (const edu of profile.education) {
      const gpa = edu.gpa ? ` | GPA: ${edu.gpa}` : "";
      lines.push(`• ${edu.degree} in ${edu.field} — ${edu.school} (${edu.startDate}–${edu.endDate})${gpa}`);
    }
  }

  // Skills
  if (profile.skills && profile.skills.length > 0) {
    lines.push("", `--- Skills ---`);
    lines.push(profile.skills.join(", "));
  }

  // Languages
  if (profile.languages && profile.languages.length > 0) {
    lines.push("", `--- Languages ---`);
    lines.push(profile.languages.join(", "));
  }

  // Summary
  if (profile.summary) {
    lines.push("", "--- Professional Summary ---");
    lines.push(profile.summary);
  }

  return lines.join("\n");
}

// ════════════════════════════════════════════════════════════════
// FIELD MAPPING ORCHESTRATOR
// ════════════════════════════════════════════════════════════════

async function mapFieldsWithProfile(
  fields: FieldDescriptor[],
  profile: UserProfile,
  pageTitle: string,
  pageContext: string
): Promise<FieldMapping[]> {
  const apiKey = profile.llmConfig?.apiKey
    || process.env.ANTHROPIC_API_KEY
    || process.env.GEMINI_API_KEY;

  if (apiKey) {
    try {
      const llmMappings = await callLlmForFieldMapping(
        fields, profile, pageTitle, pageContext,
        apiKey, profile.llmConfig?.provider || "anthropic"
      );
      if (llmMappings && llmMappings.length > 0) return llmMappings;
    } catch (err) {
      console.warn("LLM mapping failed, falling back to rule engine:", err);
    }
  }

  return deterministicFallback(fields, profile);
}

// ════════════════════════════════════════════════════════════════
// LLM CALL — ANTHROPIC / GEMINI
// ════════════════════════════════════════════════════════════════

async function callLlmForFieldMapping(
  fields: FieldDescriptor[],
  profile: UserProfile,
  pageTitle: string,
  pageContext: string,
  apiKey: string,
  provider: string
): Promise<FieldMapping[] | null> {

  const candidateContext = buildCandidateContext(profile);

  // Build a compact field list — include all options so LLM can pick exact values
  const fieldLines = fields.map((f) => {
    const opts = f.options?.length
      ? `\n  dropdown options: ${JSON.stringify(f.options.map((o) => o.label))}`
      : "";
    const radioOpts = f.radioOptions?.length
      ? `\n  radio options: ${JSON.stringify(f.radioOptions.map((o) => ({ value: o.value, label: o.label })))}`
      : "";
    const checkOpts = f.checkboxOptions?.length
      ? `\n  checkbox options: ${JSON.stringify(f.checkboxOptions.map((o) => ({ value: o.value, label: o.label })))}`
      : "";
    const maxLen = f.maxLength ? `\n  maxLength: ${f.maxLength}` : "";
    const section = f.sectionContext ? `\n  formSection: "${f.sectionContext}"` : "";
    const legend = f.fieldsetLegend ? `\n  fieldsetLegend: "${f.fieldsetLegend}"` : "";
    const req = f.required ? `\n  required: true` : "";

    return (
      `{ fieldId: "${f.fieldId}", type: "${f.domType || f.type}",` +
      ` label: "${f.label || f.groupLabel || ""}", placeholder: "${f.placeholder || ""}",` +
      ` name: "${f.name || ""}", id: "${f.id || ""}"` +
      opts + radioOpts + checkOpts + maxLen + section + legend + req +
      " }"
    );
  }).join(",\n");

  const prompt = `You are an expert form-filling assistant. Your job is to map every field in a job application form to a candidate's profile data with MAXIMUM accuracy.

${candidateContext}

=== PAGE CONTEXT ===
Title: ${pageTitle}
URL: ${pageContext.slice(0, 100)}
Visible Text Snippet: ${pageContext.slice(0, 800)}

=== FORM FIELDS TO FILL ===
${fieldLines}

=== FILLING RULES ===
1. STANDARD FIELDS (name, email, phone, location, links): Use exact profile values. isDraft: false, isUnmapped: false.
2. WORK EXPERIENCE FIELDS: Use the candidate's most recent/current job details — company, title, start date, end date, duration.
   - For date fields, output in the format hinted by the placeholder (e.g. "MM/YYYY" or "YYYY-MM-DD" or just "YYYY").
   - "Currently employed?" → "Yes" if isCurrent.
3. EDUCATION FIELDS: Use degree, field of study, school, graduation year.
4. SKILLS / EXPERIENCE LEVEL: Match to the candidate's skills list and yearsOfExperience.
5. DROPDOWN FIELDS: You MUST pick an option from the provided "dropdown options" list — output the exact label string.
   - For country: pick the most appropriate based on location.
   - For employment type: default to "Full-time" if not otherwise specified.
6. RADIO GROUPS: Output the exact VALUE (not label) from radioOptions that best matches the candidate.
7. CHECKBOX GROUPS: Output an array of matching VALUES.
8. OPEN-ENDED / COVER LETTER / "WHY US?" (textarea, type="textarea"): Set isDraft: true. Write 2-3 professional sentences tailored to this specific job using the candidate's current role, experience, and skills. Be specific, not generic.
9. SALARY: Use salaryExpectation if present.
10. WORK AUTHORIZATION: Use workAuthorization if present.
11. UNKNOWN / UNSTATED FIELDS (EEO, race, gender, custom questions with no data): Set value: null, isUnmapped: true. NEVER invent data.
12. Character limits: Keep textarea values under maxLength if specified.

Return ONLY valid JSON, no markdown, no explanation:
{
  "mappings": [
    {
      "fieldId": "string",
      "value": "string | string[] | null",
      "isDraft": false,
      "isUnmapped": false,
      "reason": "brief explanation"
    }
  ]
}`;

  // ── Anthropic ──
  if (provider === "anthropic" || process.env.ANTHROPIC_API_KEY) {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey: apiKey || process.env.ANTHROPIC_API_KEY });
    const response = await client.messages.create({
      model: profile.llmConfig?.model || "claude-3-5-sonnet-20241022",
      max_tokens: 4096,
      messages: [{ role: "user", content: prompt }],
    });
    const text = response.content[0]?.type === "text" ? response.content[0].text : "";
    return parseJsonMappings(text);
  }

  // ── Gemini ──
  if (provider === "gemini" || process.env.GEMINI_API_KEY) {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(apiKey || process.env.GEMINI_API_KEY!);
    const model = genAI.getGenerativeModel({ model: profile.llmConfig?.model || "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    return parseJsonMappings(text);
  }

  return null;
}

function parseJsonMappings(text: string): FieldMapping[] | null {
  try {
    // Strip markdown code fences if present
    const cleaned = text.replace(/^```(?:json)?\s*/m, "").replace(/\s*```$/m, "").trim();
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) return null;
    const parsed = JSON.parse(jsonMatch[0]);
    if (Array.isArray(parsed.mappings) && parsed.mappings.length > 0) {
      return parsed.mappings;
    }
  } catch (err) {
    console.warn("JSON parse failed for LLM output:", err);
  }
  return null;
}

// ════════════════════════════════════════════════════════════════
// DETERMINISTIC RULE ENGINE FALLBACK
// ════════════════════════════════════════════════════════════════

function deterministicFallback(fields: FieldDescriptor[], profile: UserProfile): FieldMapping[] {
  const nameParts = (profile.name || "").trim().split(/\s+/);
  const firstName = nameParts[0] || "";
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(" ") : "";

  const currentJob = (profile.workExperience || []).find((e) => e.isCurrent)
                     || (profile.workExperience || [])[0]
                     || null;
  const latestEdu  = (profile.education || [])[0] || null;

  return fields.map((field): FieldMapping => {
    const text = [
      field.label, field.name, field.id, field.ariaLabel,
      field.placeholder, field.sectionContext, field.fieldsetLegend,
    ].join(" ").toLowerCase();

    // File / Resume
    if (field.type === "file" || text.includes("resume") || text.includes("cv")) {
      const url = profile.resumeFile?.cloudinaryUrl || profile.links?.resumeLink;
      return { fieldId: field.fieldId, value: url || null, isDraft: false, isUnmapped: !url, reason: "Resume" };
    }

    // Name
    if (text.includes("first name") || text.includes("given name") || field.name === "firstname" || field.id === "first_name")
      return { fieldId: field.fieldId, value: firstName || null, isDraft: false, isUnmapped: !firstName, reason: "First Name" };
    if (text.includes("last name") || text.includes("family name") || field.name === "lastname" || field.id === "last_name")
      return { fieldId: field.fieldId, value: lastName || null, isDraft: false, isUnmapped: !lastName, reason: "Last Name" };
    if (text.includes("full name") || text.includes("your name") || field.name === "name")
      return { fieldId: field.fieldId, value: profile.name || null, isDraft: false, isUnmapped: !profile.name, reason: "Full Name" };

    // Contact
    if (field.type === "email" || text.includes("email"))
      return { fieldId: field.fieldId, value: profile.email || null, isDraft: false, isUnmapped: !profile.email, reason: "Email" };
    if (field.type === "tel" || text.includes("phone") || text.includes("mobile"))
      return { fieldId: field.fieldId, value: profile.phone || null, isDraft: false, isUnmapped: !profile.phone, reason: "Phone" };

    // Location
    if (text.includes("city") || text.includes("location") || text.includes("address"))
      return { fieldId: field.fieldId, value: profile.location || null, isDraft: false, isUnmapped: !profile.location, reason: "Location" };

    // Links
    if (text.includes("linkedin"))
      return { fieldId: field.fieldId, value: profile.links?.linkedin || null, isDraft: false, isUnmapped: !profile.links?.linkedin, reason: "LinkedIn" };
    if (text.includes("github"))
      return { fieldId: field.fieldId, value: profile.links?.github || null, isDraft: false, isUnmapped: !profile.links?.github, reason: "GitHub" };
    if (text.includes("portfolio") || text.includes("website") || text.includes("personal url"))
      return { fieldId: field.fieldId, value: profile.links?.portfolio || null, isDraft: false, isUnmapped: !profile.links?.portfolio, reason: "Portfolio" };

    // Work Experience
    if (currentJob) {
      if (text.includes("current company") || text.includes("employer") || text.includes("company name"))
        return { fieldId: field.fieldId, value: currentJob.company, isDraft: false, isUnmapped: false, reason: "Current Company" };
      if (text.includes("current title") || text.includes("current position") || text.includes("job title"))
        return { fieldId: field.fieldId, value: currentJob.title, isDraft: false, isUnmapped: false, reason: "Current Title" };
      if (text.includes("start date") && (text.includes("current") || text.includes("recent")))
        return { fieldId: field.fieldId, value: currentJob.startDate, isDraft: false, isUnmapped: false, reason: "Job Start Date" };
    }

    // Education
    if (latestEdu) {
      if (text.includes("school") || text.includes("university") || text.includes("institution"))
        return { fieldId: field.fieldId, value: latestEdu.school, isDraft: false, isUnmapped: false, reason: "School" };
      if (text.includes("degree"))
        return { fieldId: field.fieldId, value: latestEdu.degree, isDraft: false, isUnmapped: false, reason: "Degree" };
      if (text.includes("field of study") || text.includes("major"))
        return { fieldId: field.fieldId, value: latestEdu.field, isDraft: false, isUnmapped: false, reason: "Field of Study" };
      if (text.includes("graduation") || (text.includes("end") && text.includes("edu")))
        return { fieldId: field.fieldId, value: latestEdu.endDate, isDraft: false, isUnmapped: false, reason: "Graduation Date" };
      if (text.includes("gpa") && latestEdu.gpa)
        return { fieldId: field.fieldId, value: latestEdu.gpa, isDraft: false, isUnmapped: false, reason: "GPA" };
    }

    // Autofill preferences
    if (text.includes("authorization") || text.includes("visa") || text.includes("sponsorship") || text.includes("eligible to work"))
      return { fieldId: field.fieldId, value: profile.workAuthorization || null, isDraft: false, isUnmapped: !profile.workAuthorization, reason: "Work Authorization" };
    if (text.includes("salary") || text.includes("compensation") || text.includes("pay expectation"))
      return { fieldId: field.fieldId, value: profile.salaryExpectation || null, isDraft: false, isUnmapped: !profile.salaryExpectation, reason: "Salary" };
    if (text.includes("available") || text.includes("start") || text.includes("notice period"))
      return { fieldId: field.fieldId, value: profile.availableFrom || null, isDraft: false, isUnmapped: !profile.availableFrom, reason: "Availability" };
    if (text.includes("years of experience") || text.includes("years experience"))
      return { fieldId: field.fieldId, value: profile.yearsOfExperience?.toString() || null, isDraft: false, isUnmapped: !profile.yearsOfExperience, reason: "Years of Experience" };

    // Open-ended / cover letter
    if (
      field.type === "textarea" || field.domType === "standard" && field.tag === "textarea" ||
      text.includes("why do you want") || text.includes("cover letter") || text.includes("tell us about") ||
      text.includes("describe a") || text.includes("additional information")
    ) {
      const summary = profile.summary || "a motivated professional";
      const currentRole = currentJob ? `${currentJob.title} at ${currentJob.company}` : "my current role";
      const draft = `I am excited about this opportunity because my experience as a ${currentRole} closely aligns with what you're looking for. ${summary ? summary.slice(0, 200) : "I bring strong technical skills and a passion for delivering quality work."}`;
      return { fieldId: field.fieldId, value: draft, isDraft: true, isUnmapped: false, reason: "Open-ended draft" };
    }

    // Unknown / unmapped
    return { fieldId: field.fieldId, value: null, isDraft: false, isUnmapped: true, reason: "No confident match" };
  });
}
