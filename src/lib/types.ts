export type SkillMatch = {
  skill: string;
  presentInResume: boolean;
  importance: "high" | "medium" | "low";
};

export type ResumeProfile = {
  id: string;
  rawText: string;
  parsedSkills: string[];
  parsedExperience: string[];
  parsedEducation: string[];
  bulletPoints: string[];
  createdAt: string;
};

export type JobDescriptionProfile = {
  id: string;
  rawText: string;
  extractedRequirements: string[];
  extractedSkills: string[];
  extractedResponsibilities: string[];
};

export type AnalysisReport = {
  id: string;
  resumeId: string;
  jdId: string;
  score: number;
  matches: string[];
  gaps: string[];
  suggestions: string[];
  coverLetterDraft?: string;
  createdAt: string;
};
