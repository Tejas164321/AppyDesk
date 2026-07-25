import { z } from "zod";

export const profileFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().default(""),
  location: z.string().default(""),
  links: z.object({
    linkedin: z.string().url("Invalid URL").or(z.literal("")).default(""),
    github: z.string().url("Invalid URL").or(z.literal("")).default(""),
    portfolio: z.string().url("Invalid URL").or(z.literal("")).default(""),
    resumeLink: z.string().url("Invalid URL").or(z.literal("")).default(""),
  }),
  summary: z.string().default(""),
  settings: z.object({
    dailySendCap: z.number().min(1).max(50).default(15),
    warmupStartDate: z.string().default(() => new Date().toISOString()),
    timezone: z.string().default("UTC"),
  }),
  llmConfig: z.object({
    provider: z.enum(["anthropic", "gemini", "groq", "grok", "openai"]).default("anthropic"),
    apiKey: z.string().default(""),
    model: z.string().default("claude-3-5-sonnet-20241022"),
    customEndpoint: z.string().default(""),
  }),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;
