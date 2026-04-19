const COMMON_SKILLS = [
  "javascript",
  "typescript",
  "react",
  "next.js",
  "node.js",
  "python",
  "sql",
  "postgresql",
  "mongodb",
  "docker",
  "kubernetes",
  "aws",
  "azure",
  "git",
  "rest api",
  "graphql",
  "jest",
  "cypress",
  "figma",
  "agile",
  "scrum",
  "ci/cd",
  "redis",
  "html",
  "css",
  "tailwind",
];

export const normalizeSpace = (text: string): string =>
  text.replace(/\r/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

export const splitLines = (text: string): string[] =>
  normalizeSpace(text)
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

export const uniq = (items: string[]): string[] =>
  Array.from(
    new Set(
      items
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => item.toLowerCase()),
    ),
  );

export const extractSkillsFromText = (text: string): string[] => {
  const lowered = text.toLowerCase();
  return COMMON_SKILLS.filter((skill) => lowered.includes(skill));
};

export const extractBulletPoints = (text: string): string[] =>
  splitLines(text).filter((line) => /^[-*•]/.test(line) || /^\d+\./.test(line));

export const extractSectionLines = (text: string, sectionNames: string[]): string[] => {
  const lines = splitLines(text);
  const sectionRegex = new RegExp(
    `^(${sectionNames.map((name) => name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")})[:\\s]*$`,
    "i",
  );
  const genericSectionRegex = /^[A-Z][A-Za-z\s/&-]{2,30}:?$/;

  const collected: string[] = [];
  let inTargetSection = false;

  for (const line of lines) {
    if (sectionRegex.test(line)) {
      inTargetSection = true;
      continue;
    }
    if (genericSectionRegex.test(line) && !sectionRegex.test(line)) {
      inTargetSection = false;
    }
    if (inTargetSection) {
      collected.push(line);
    }
  }

  return collected;
};

export const ensureMinimum = (items: string[], fallback: string[]): string[] => {
  if (items.length >= fallback.length) {
    return items;
  }
  return [...items, ...fallback.slice(0, Math.max(0, fallback.length - items.length))];
};
