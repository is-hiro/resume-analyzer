import { z } from "zod";

export const resumeParseSchema = z.object({
  parsedSkills: z.array(z.string()).default([]),
  parsedExperience: z.array(z.string()).default([]),
  parsedEducation: z.array(z.string()).default([]),
  bulletPoints: z.array(z.string()).default([]),
});

export const jdAnalyzeSchema = z.object({
  extractedRequirements: z.array(z.string()).default([]),
  extractedSkills: z.array(z.string()).default([]),
  extractedResponsibilities: z.array(z.string()).default([]),
});

export const scoreSchema = z.object({
  score: z.number().min(0).max(100),
  matches: z.array(z.string()).default([]),
  gaps: z.array(z.string()).default([]),
  suggestions: z.array(z.string()).default([]),
});

export const coverLetterSchema = z.object({
  draft: z.string().min(120),
});
