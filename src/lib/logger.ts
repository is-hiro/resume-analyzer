const mask = (value: string): string => {
  const maskedEmail = value.replace(
    /([A-Za-z0-9._%+-])[A-Za-z0-9._%+-]*@([A-Za-z0-9.-]+\.[A-Za-z]{2,})/g,
    "$1***@$2",
  );
  return maskedEmail.replace(/(\+?\d[\d\s().-]{6,}\d)/g, "***PHONE***");
};

const redact = (payload: unknown): unknown => {
  if (typeof payload === "string") {
    return mask(payload);
  }
  if (Array.isArray(payload)) {
    return payload.map((item) => redact(item));
  }
  if (payload && typeof payload === "object") {
    return Object.fromEntries(
      Object.entries(payload).map(([key, value]) => [key, redact(value)]),
    );
  }
  return payload;
};

export const logError = (message: string, details?: unknown): void => {
  const safeDetails = redact(details);
  console.error(`[resume-analyzer] ${message}`, safeDetails ?? "");
};
