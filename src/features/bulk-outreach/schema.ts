import { z } from "zod";

export const bulkContactSchema = z.object({
  email: z.string().email("Valid email is required"),
  name: z.string().default(""),
  company: z.string().default(""),
  role: z.string().default(""),
});

export const bulkBatchSendSchema = z.object({
  pitchContext: z.string().min(5, "Pitch/Role context is required"),
  complianceConfirmed: z.literal(true, {
    message: "You must confirm the contact list sourcing compliance",
  }),
});

export type BulkContactValues = z.infer<typeof bulkContactSchema>;
export type BulkBatchSendValues = z.infer<typeof bulkBatchSendSchema>;
