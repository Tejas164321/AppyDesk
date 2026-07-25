import Anthropic from "@anthropic-ai/sdk";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserProfile, LLMConfig } from "@/features/profile/types";
import { ExtractionResult } from "@/features/applications/types";

export async function extractAndDraftWithClaude(
  jobText: string,
  images: string[] | string | undefined,
  profile: UserProfile,
  customLlmConfig?: LLMConfig
): Promise<ExtractionResult> {
  const imageList: string[] = Array.isArray(images)
    ? images.filter(Boolean)
    : typeof images === "string" && images
    ? [images]
    : [];

  const llmConfig = customLlmConfig || profile.llmConfig || {
    provider: "anthropic",
    apiKey: process.env.ANTHROPIC_API_KEY || "",
    model: "claude-3-5-sonnet-20241022",
  };

  const provider = llmConfig.provider || "anthropic";
  const apiKey = llmConfig.apiKey || process.env.ANTHROPIC_API_KEY || "";
  const modelName = llmConfig.model || "claude-3-5-sonnet-20241022";

  // Mock / fallback if no key provided
  if (!apiKey || apiKey.includes("mock")) {
    return generateFallbackExtraction(jobText, profile);
  }

  try {
    switch (provider) {
      case "gemini":
        return await callGoogleGemini(jobText, imageList, profile, apiKey, modelName);
      case "groq":
        return await callGroqAPI(jobText, profile, apiKey, modelName);
      case "grok":
      case "openai":
        return await callOpenAICompatible(jobText, profile, apiKey, modelName, llmConfig.customEndpoint, provider);
      case "anthropic":
      default:
        return await callAnthropicClaude(jobText, imageList, profile, apiKey, modelName);
    }
  } catch (err) {
    console.warn(`Extraction failed with provider ${provider}, falling back:`, err);
    return generateFallbackExtraction(jobText, profile);
  }
}

// 1. Anthropic Claude Provider
async function callAnthropicClaude(
  jobText: string,
  imageList: string[],
  profile: UserProfile,
  apiKey: string,
  modelName: string
): Promise<ExtractionResult> {
  const anthropic = new Anthropic({ apiKey });
  const systemPrompt = getSystemPrompt();
  const userPrompt = getUserPrompt(jobText, profile);

  const contentBlocks: any[] = [];
  if (jobText) contentBlocks.push({ type: "text", text: `Job Posting Text:\n${jobText}` });
  
  for (const imgUrl of imageList) {
    if (imgUrl.startsWith("data:image/")) {
      const matches = imgUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (matches) {
        contentBlocks.push({
          type: "image",
          source: {
            type: "base64",
            media_type: matches[1] as any,
            data: matches[2],
          },
        });
      }
    } else if (imgUrl.startsWith("http")) {
      contentBlocks.push({ type: "image", source: { type: "url", url: imgUrl } });
    }
  }

  contentBlocks.push({ type: "text", text: userPrompt });

  const response = await anthropic.messages.create({
    model: modelName || "claude-3-5-sonnet-20241022",
    max_tokens: 1500,
    system: systemPrompt,
    messages: [{ role: "user", content: contentBlocks }],
  });

  const responseText = response.content[0]?.type === "text" ? response.content[0].text : "";
  return parseExtractionJsonResponse(responseText, profile);
}

// 2. Google Gemini Provider
async function callGoogleGemini(
  jobText: string,
  imageList: string[],
  profile: UserProfile,
  apiKey: string,
  modelName: string
): Promise<ExtractionResult> {
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: modelName || "gemini-1.5-flash" });

  const promptParts: any[] = [`${getSystemPrompt()}\n\n${getUserPrompt(jobText, profile)}\n\nJob Posting:\n${jobText}`];
  
  for (const imgUrl of imageList) {
    if (imgUrl.startsWith("data:image/")) {
      const matches = imgUrl.match(/^data:(image\/[a-zA-Z+]+);base64,(.+)$/);
      if (matches) {
        promptParts.push({
          inlineData: {
            mimeType: matches[1],
            data: matches[2],
          },
        });
      }
    }
  }

  const result = await model.generateContent(promptParts);
  const responseText = result.response.text();
  return parseExtractionJsonResponse(responseText, profile);
}

// 3. Groq Provider (Fast Llama 3 / Mixtral)
async function callGroqAPI(
  jobText: string,
  profile: UserProfile,
  apiKey: string,
  modelName: string
): Promise<ExtractionResult> {
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName || "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: getSystemPrompt() },
        { role: "user", content: `${getUserPrompt(jobText, profile)}\n\nJob Posting:\n${jobText}` },
      ],
      response_format: { type: "json_object" },
    }),
  });

  if (!res.ok) throw new Error(`Groq API error: ${res.statusText}`);
  const data = await res.json();
  const responseText = data.choices?.[0]?.message?.content || "";
  return parseExtractionJsonResponse(responseText, profile);
}

// 4. xAI Grok / OpenAI Compatible Provider
async function callOpenAICompatible(
  jobText: string,
  profile: UserProfile,
  apiKey: string,
  modelName: string,
  customEndpoint: string | undefined,
  provider: string
): Promise<ExtractionResult> {
  const endpoint =
    customEndpoint ||
    (provider === "grok"
      ? "https://api.x.ai/v1/chat/completions"
      : "https://api.openai.com/v1/chat/completions");

  const res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: modelName || (provider === "grok" ? "grok-beta" : "gpt-4o-mini"),
      messages: [
        { role: "system", content: getSystemPrompt() },
        { role: "user", content: `${getUserPrompt(jobText, profile)}\n\nJob Posting:\n${jobText}` },
      ],
    }),
  });

  if (!res.ok) throw new Error(`${provider} API error: ${res.statusText}`);
  const data = await res.json();
  const responseText = data.choices?.[0]?.message?.content || "";
  return parseExtractionJsonResponse(responseText, profile);
}

// Helper Prompts & Fallback Generators
function getSystemPrompt(): string {
  return `You are an expert HR applicant analyzer and cold outreach email copywriter.
Given a job posting and candidate profile summary, extract structured details and write a tailored email.

CRITICAL EMAIL COPYWRITING RULES:
- Tone: Plain, warm, direct, and authentic — sound like a real person wrote it.
- NO corporate jargon or buzzwords (e.g. "synergy", "passionate about leveraging", "spearheaded").
- Position as a capable recent graduate/fresher with real production project and internship experience looking for their first full-time role.
- Salutation: Use "Dear [Name]," if a specific recruiter/hiring manager name appears in the JD. Otherwise, use "Dear Hiring Manager,". NEVER invent a name.
- Opening: Start with one direct sentence connecting to the specific role/company (avoid generic "I am writing to express my interest").
- Body content: Select ONLY 2–3 candidate skills/projects/internship achievements that directly match the JD requirements.
- Resume reference: Fold "my resume is attached for your review" naturally into a sentence.
- Length: Strictly 120–170 words in the body text.
- Formatting: Plain text prose only. DO NOT use markdown, bullet points, asterisks, or bold text in the email body.
- Never mention marks, percentages, or CGPA.

Return ONLY valid JSON matching this exact schema:
{
  "company": "Company Name",
  "role": "Job Role Title",
  "contactEmail": "HR or Recruiter email if present, else empty string",
  "location": "Location if present, else Remote",
  "keyRequirements": ["Requirement 1", "Requirement 2", "Requirement 3"],
  "matchScore": 85,
  "subject": "Tailored Email Subject Line",
  "body": "Tailored outreach email body ending with a simple sign-off"
}`;
}

function getUserPrompt(jobText: string, profile: UserProfile): string {
  return `User Profile & Candidate Details:
Name: ${profile.name || "Applicant"}
Email: ${profile.email || ""}
Phone: ${profile.phone || "N/A"}
Location: ${profile.location || "N/A"}
Candidate Summary & Experience: ${profile.summary || "Software Developer"}
LinkedIn: ${profile.links?.linkedin || "N/A"}
GitHub: ${profile.links?.github || "N/A"}
Portfolio: ${profile.links?.portfolio || "N/A"}
Resume Link: ${profile.links?.resumeLink || "Attached"}`;
}

function parseExtractionJsonResponse(responseText: string, profile: UserProfile): ExtractionResult {
  const jsonMatch = responseText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) {
    throw new Error("Failed to parse structured JSON from model response");
  }
  const parsed: ExtractionResult = JSON.parse(jsonMatch[0]);
  parsed.matchScore = calculateMatchScore(parsed.keyRequirements || [], profile.summary);
  return parsed;
}

function generateFallbackExtraction(jobText: string, profile: UserProfile): ExtractionResult {
  const company = jobText.match(/(?:at|company:?)\s+([A-Z][A-Za-z0-9\s]+)/i)?.[1]?.trim() || "Acme Corp";
  const role = jobText.match(/(?:role|position|title:?)\s+([A-Z][A-Za-z0-9\s]+)/i)?.[1]?.trim() || "Software Engineer";
  const contactEmail = jobText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/)?.[1] || "careers@company.com";
  const requirements = ["TypeScript & Web Development", "API Design & Backend Services", "Team Collaboration"];
  const matchScore = calculateMatchScore(requirements, profile.summary);

  const body = `Hi hiring team at ${company},

I am writing to express my interest in the ${role} position. With my background in ${profile.summary ? profile.summary.slice(0, 100) + '...' : 'modern web development'}, I am confident I can contribute to your team.

Attached is my resume for your review.

Best regards,
${profile.name || "Applicant"}
${profile.email || ""}
${profile.phone ? `Phone: ${profile.phone}` : ""}`;

  return {
    company,
    role,
    contactEmail,
    location: profile.location || "Remote",
    keyRequirements: requirements,
    matchScore,
    subject: `Application for ${role} — ${profile.name || "Applicant"}`,
    body,
  };
}

export function calculateMatchScore(keyRequirements: string[], summary: string): number {
  if (!keyRequirements.length || !summary) return 70;
  const summaryLower = summary.toLowerCase();

  let matches = 0;
  keyRequirements.forEach((req) => {
    const keywords = req.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const hit = keywords.some((kw) => summaryLower.includes(kw));
    if (hit) matches++;
  });

  const ratio = matches / keyRequirements.length;
  const score = Math.round(50 + ratio * 45);
  return Math.min(Math.max(score, 45), 98);
}
