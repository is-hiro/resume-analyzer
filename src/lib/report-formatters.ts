import { coverLetterSchema, scoreSchema } from "@/lib/schemas";
import { callLlmWithSchema } from "@/lib/llm";
import type { AnalysisReport, JobDescriptionProfile, ResumeProfile } from "@/lib/types";

export const generateCoverLetterDraft = async (
  resume: ResumeProfile,
  jobDescription: JobDescriptionProfile,
  report: AnalysisReport,
): Promise<string> => {
  const topSkills = resume.parsedSkills.slice(0, 6).join(", ");
  const topExperienceHighlights = resume.parsedExperience.slice(0, 3).join("; ");
  const topRequirements = jobDescription.extractedRequirements.slice(0, 3).join("; ");
  const relevantMatches = report.matches.slice(0, 4).join("; ");

  const llmResult = await callLlmWithSchema({
    schema: coverLetterSchema,
    systemPrompt:
      "You are a senior career coach and hiring manager. Return valid JSON only: {\"draft\":\"...\"}.",
    userPrompt: `Write a natural-sounding, personalized cover letter in English.

Tone requirements:
- Warm, confident, and human (not robotic).
- No generic phrases like "I am writing to express my interest..."
- Keep it concise: 180-260 words.
- Keep paragraph flow readable and modern.

Structure requirements:
1) Short greeting + role fit hook.
2) 1 paragraph with strongest relevant achievements.
3) 1 paragraph with motivation for this company/role and collaboration style.
4) Clear and friendly CTA closing.

Candidate context:
- Skills: ${topSkills || "relevant technical skills"}
- Experience highlights: ${topExperienceHighlights || "hands-on delivery in similar projects"}
- Best matches with JD: ${relevantMatches || "strong relevance to role requirements"}
- Potential gaps to handle carefully: ${report.gaps.slice(0, 3).join("; ") || "no major gaps"}

Job context:
- Main requirements: ${topRequirements || "role requirements outlined in the job description"}

Output strictly as JSON with field "draft".`,
  });

  if (llmResult) {
    return llmResult.draft;
  }

  const primarySkills = resume.parsedSkills.slice(0, 5).join(", ") || "relevant technical skills";
  const topExperience =
    resume.parsedExperience.slice(0, 2).join("; ") || "hands-on delivery in similar tasks";
  const topRequirement =
    jobDescription.extractedRequirements[0] ?? "the role requirements outlined in your vacancy";

  return `Hello Hiring Team,

Your role immediately stood out to me because it combines hands-on delivery with real product impact. I bring ${primarySkills}, and I enjoy turning business goals into practical, user-focused solutions.

In my recent work, I ${topExperience}. This experience aligns directly with your priority around "${topRequirement}", and it reflects how I usually work: clear ownership, strong communication, and measurable outcomes.

What motivates me most is joining a team where quality, speed, and collaboration all matter. I value feedback, move quickly without sacrificing maintainability, and genuinely enjoy building features that users feel.

If it sounds relevant, I would be glad to discuss how I can contribute to your roadmap and deliver value from the first weeks.

[Best regards],
[Your Name]`;
};

export const toMarkdownReport = (
  resume: ResumeProfile,
  jd: JobDescriptionProfile,
  report: AnalysisReport,
): string => {
  return `# AI Resume Analyzer Report

## Match Score
**${report.score}/100**

## Strong Matches
${report.matches.map((item) => `- ${item}`).join("\n")}

## Missing Skills / Gaps
${report.gaps.map((item) => `- ${item}`).join("\n")}

## Recommendations
${report.suggestions.map((item) => `- ${item}`).join("\n")}

## Cover Letter Draft
${report.coverLetterDraft ?? "_Not generated yet._"}

## Metadata
- Report ID: ${report.id}
- Resume ID: ${resume.id}
- JD ID: ${jd.id}
- Generated at: ${report.createdAt}
`;
};

export const enhanceReportWithLlm = async (
  report: AnalysisReport,
  resume: ResumeProfile,
  jobDescription: JobDescriptionProfile,
): Promise<AnalysisReport> => {
  const llmResult = await callLlmWithSchema({
    schema: scoreSchema,
    systemPrompt:
      "You are an ATS expert. Return JSON only with fields: score, matches, gaps, suggestions.",
    userPrompt: `Current score: ${report.score}
Resume skills: ${resume.parsedSkills.join(", ")}
Resume bullets: ${resume.bulletPoints.join(" | ")}
JD skills: ${jobDescription.extractedSkills.join(", ")}
JD requirements: ${jobDescription.extractedRequirements.join(" | ")}
Refine analysis with at least 5 actionable suggestions.`,
  });

  if (!llmResult) {
    return report;
  }

  return {
    ...report,
    score: llmResult.score,
    matches: llmResult.matches,
    gaps: llmResult.gaps,
    suggestions: llmResult.suggestions,
  };
};
