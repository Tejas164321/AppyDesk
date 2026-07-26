import { z } from "zod";

export const workExperienceSchema = z.object({
  id: z.string(),
  company: z.string().min(1, "Company is required"),
  title: z.string().min(1, "Job title is required"),
  startDate: z.string().min(1, "Start date is required"),
  endDate: z.string().nullable().default(null),
  isCurrent: z.boolean().default(false),
  location: z.string().default(""),
  description: z.string().default(""),
});

export const educationSchema = z.object({
  id: z.string(),
  school: z.string().min(1, "School is required"),
  degree: z.string().min(1, "Degree is required"),
  field: z.string().min(1, "Field of study is required"),
  startDate: z.string().default(""),
  endDate: z.string().default(""),
  gpa: z.string().optional().default(""),
});

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
  workExperience: z.array(workExperienceSchema).default([]),
  education: z.array(educationSchema).default([]),
  skills: z.array(z.string()).default([]),
  yearsOfExperience: z.number().min(0).max(50).optional(),
  workAuthorization: z.string().default(""),
  salaryExpectation: z.string().default(""),
  availableFrom: z.string().default(""),
  languages: z.array(z.string()).default([]),
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
export type WorkExperienceFormValues = z.infer<typeof workExperienceSchema>;
export type EducationFormValues = z.infer<typeof educationSchema>;
