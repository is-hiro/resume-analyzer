import { jdAnalyzeSchema, scoreSchema } from "@/lib/schemas";
import {
  ensureMinimum,
  extractSkillsFromText,
  splitLines,
  uniq,
} from "@/lib/text-utils";
import type {
  AnalysisReport,
  JobDescriptionProfile,
  ResumeProfile,
} from "@/lib/types";

const randomId = () => crypto.randomUUID();

const requirementPattern =
  /\b(required|requirements?|must|experience with|at least|strong|proficient|knowledge of|will be responsible|mandatory|nice to have)\b|(?:обязательн|требован|необходим|нужно|должен|должна|будет плюсом|желательно|опыт от)/i;
const responsibilityPattern =
  /\b(responsible|build|develop|maintain|deliver|collaborate|lead|own|implement)\b|(?:обязанност|отвечать за|разрабатывать|поддерживать|взаимодействовать)/i;
const bulletLikePattern = /^[-*•]\s+|^\d+[.)]\s+/;
const qualificationPattern =
  /\b\d+\+?\s*(years?|yrs?)\b|(?:\d+\+?\s*(лет|года))|(?:junior|middle|senior|lead)/i;

export const analyzeJobDescriptionText = (rawText: string): JobDescriptionProfile => {
  const lines = splitLines(rawText);
  const explicitRequirementLines = lines.filter((line) => requirementPattern.test(line));
  const qualificationLines = lines.filter((line) => qualificationPattern.test(line));
  const bulletLines = lines.filter((line) => bulletLikePattern.test(line));

  const extractedRequirements = uniq(
    [...explicitRequirementLines, ...qualificationLines, ...bulletLines].slice(0, 20),
  );
  const extractedResponsibilities = uniq(lines.filter((line) => responsibilityPattern.test(line)).slice(0, 20));
  const extractedSkills = uniq(extractSkillsFromText(rawText));

  const validated = jdAnalyzeSchema.parse({
    extractedRequirements,
    extractedSkills,
    extractedResponsibilities,
  });

  return {
    id: randomId(),
    rawText,
    extractedRequirements: validated.extractedRequirements,
    extractedSkills: validated.extractedSkills,
    extractedResponsibilities: validated.extractedResponsibilities,
  };
};

export const generateScoreReport = (
  resume: ResumeProfile,
  jobDescription: JobDescriptionProfile,
): AnalysisReport => {
  const requiredSkills = jobDescription.extractedSkills;
  const resumeSkills = new Set(resume.parsedSkills);

  const matchedSkills = requiredSkills.filter((skill) => resumeSkills.has(skill));
  const missingSkills = requiredSkills.filter((skill) => !resumeSkills.has(skill));

  const skillsCoverage = requiredSkills.length
    ? matchedSkills.length / requiredSkills.length
    : 0.5;
  const experienceCoverage = Math.min(resume.parsedExperience.length / 5, 1);
  const educationCoverage = resume.parsedEducation.length > 0 ? 1 : 0.3;

  const score = Math.round(
    Math.max(0, Math.min(100, skillsCoverage * 60 + experienceCoverage * 30 + educationCoverage * 10)),
  );

  const suggestions = ensureMinimum(
    [
      ...missingSkills.map((skill) => `Add evidence of ${skill} in experience bullets or skills section.`),
      "Rewrite top 3 bullets using action + metric + outcome format.",
      "Align resume summary with the vacancy title and key responsibilities.",
      "Add 2-3 domain keywords from the JD to increase ATS relevance.",
      "Move the most relevant projects above less relevant experience.",
    ].filter(Boolean),
    [
      "Highlight measurable outcomes in each role (%, time, revenue, users).",
      "Mirror the JD terminology where your real experience matches.",
      "Keep bullets concise: one impact statement per bullet.",
      "Prioritize recent relevant experience in the first half of the resume.",
      "Ensure contact and headline are clear and professional.",
    ],
  ).slice(0, 8);

  const matches = uniq([
    ...matchedSkills.map((skill) => `Matched skill: ${skill}`),
    ...resume.parsedExperience.slice(0, 3).map((item) => `Relevant experience: ${item}`),
  ]);

  const gaps = uniq([
    ...missingSkills.map((skill) => `Missing skill: ${skill}`),
    ...(resume.parsedEducation.length === 0
      ? ["Education section is not clearly identified."]
      : []),
  ]);

  const validated = scoreSchema.parse({
    score,
    matches,
    gaps,
    suggestions,
  });

  return {
    id: randomId(),
    resumeId: resume.id,
    jdId: jobDescription.id,
    score: validated.score,
    matches: validated.matches,
    gaps: validated.gaps,
    suggestions: validated.suggestions,
    createdAt: new Date().toISOString(),
  };
};
