import { z } from "zod";

export const extractRequestSchema = z.object({
  text: z.string().default(""),
  imageUrl: z.string().default(""),
});

export const sendEmailRequestSchema = z.object({
  company: z.string().min(1, "Company is required"),
  role: z.string().min(1, "Role is required"),
  contactEmail: z.string().email("Valid recipient email is required"),
  subject: z.string().min(1, "Email subject is required"),
  body: z.string().min(10, "Email body must be at least 10 characters"),
  matchScore: z.number().default(0),
  keyRequirements: z.array(z.string()).default([]),
  jdSnippet: z.string().default(""),
  source: z.enum(["paste", "screenshot", "bulk"]).default("paste"),
});

export type ExtractRequestValues = z.infer<typeof extractRequestSchema>;
export type SendEmailRequestValues = z.infer<typeof sendEmailRequestSchema>;
