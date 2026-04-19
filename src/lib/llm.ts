import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

import { ZodSchema } from "zod";

import { logError } from "@/lib/logger";

type LlmMessage = {
  role: "system" | "user";
  content: string;
};

type CallLlmParams<T> = {
  schema: ZodSchema<T>;
  systemPrompt: string;
  userPrompt: string;
};

type GigachatModel = {
  id: string;
  object?: string;
  owned_by?: string;
};

type LlmProvider = "gigachat" | "openai-compatible";

type OAuthTokenResponse = {
  access_token: string;
  expires_at?: number;
  expires_in?: number;
  token_type?: string;
};

type TokenCache = {
  token: string;
  expiresAtMs: number;
};

let tokenCache: TokenCache | null = null;

const DEFAULT_SCOPE = "";

const getConfig = () => ({
  provider: (process.env.LLM_PROVIDER as LlmProvider | undefined) ?? "gigachat",
  llmBaseUrl: process.env.LLM_BASE_URL ?? "",
  llmApiKey: process.env.LLM_API_KEY ?? "",
  llmModel: process.env.LLM_MODEL ?? "",
  directAccessToken: process.env.LLM_ACCESS_TOKEN ?? "",
  basicAuthKey: process.env.LLM_AUTH_BASIC ?? "",
  authUrl: process.env.LLM_AUTH_URL ?? "https://ngw.devices.sberbank.ru:9443/api/v2/oauth",
  baseUrl: process.env.LLM_API_BASE_URL ?? "https://gigachat.devices.sberbank.ru/api/v1",
  model: process.env.LLM_DEFAULT_MODEL ?? "GigaChat",
  scope: process.env.LLM_SCOPE ?? DEFAULT_SCOPE,
  rqUid: process.env.LLM_RQUID ?? "",
  tokenCacheFilePath: process.env.LLM_TOKEN_CACHE_PATH ?? ".cache/llm-access-token.json",
});

const parseJsonFromText = (text: string): unknown => {
  try {
    return JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      throw new Error("LLM did not return JSON.");
    }
    return JSON.parse(match[0]);
  }
};

const isTokenValid = (cache: TokenCache | null): cache is TokenCache => {
  if (!cache) return false;
  // 60s safety window to avoid token expiring mid-request.
  return Date.now() < cache.expiresAtMs - 60_000;
};

const computeExpiresAtMs = (payload: OAuthTokenResponse): number => {
  if (typeof payload.expires_at === "number") {
    return payload.expires_at;
  }
  if (typeof payload.expires_in === "number") {
    return Date.now() + payload.expires_in * 1000;
  }
  // Conservative default in case provider omits expiration fields.
  return Date.now() + 30 * 60 * 1000;
};

const getRqUid = (configuredRqUid: string): string =>
  configuredRqUid.trim() || crypto.randomUUID();

const getCacheFilePath = (): string => {
  const { tokenCacheFilePath } = getConfig();
  return resolve(/*turbopackIgnore: true*/ process.cwd(), tokenCacheFilePath);
};

const loadTokenFromDisk = async (): Promise<TokenCache | null> => {
  try {
    const filePath = getCacheFilePath();
    const raw = await readFile(filePath, "utf8");
    const parsed = JSON.parse(raw) as { token?: string; expiresAtMs?: number };
    if (!parsed.token || typeof parsed.expiresAtMs !== "number") {
      return null;
    }
    return { token: parsed.token, expiresAtMs: parsed.expiresAtMs };
  } catch {
    return null;
  }
};

const saveTokenToDisk = async (cache: TokenCache): Promise<void> => {
  try {
    const filePath = getCacheFilePath();
    await mkdir(dirname(filePath), { recursive: true });
    await writeFile(filePath, JSON.stringify(cache), "utf8");
  } catch (error) {
    logError("Failed to persist LLM token cache", { error: String(error) });
  }
};

const getAccessToken = async (): Promise<string | null> => {
  const { directAccessToken } = getConfig();
  if (directAccessToken.trim()) {
    return directAccessToken.trim();
  }

  if (!tokenCache) {
    tokenCache = await loadTokenFromDisk();
  }

  if (isTokenValid(tokenCache)) {
    return tokenCache.token;
  }

  const { basicAuthKey, authUrl, scope, rqUid } = getConfig();
  if (!basicAuthKey) {
    return null;
  }

  const body = new URLSearchParams();
  if (scope.trim()) {
    body.set("scope", scope.trim());
  }

  try {
    const response = await fetch(authUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
        RqUID: getRqUid(rqUid),
        Authorization: `Basic ${basicAuthKey}`,
      },
      body: body.toString(),
    });

    if (!response.ok) {
      throw new Error(`OAuth HTTP ${response.status}`);
    }

    const payload = (await response.json()) as OAuthTokenResponse;
    if (!payload.access_token) {
      throw new Error("OAuth response has no access_token.");
    }

    tokenCache = {
      token: payload.access_token,
      expiresAtMs: computeExpiresAtMs(payload),
    };
    await saveTokenToDisk(tokenCache);

    return tokenCache.token;
  } catch (error) {
    const fetchError = error as Error & { cause?: { code?: string; message?: string } };
    logError("LLM OAuth failed", {
      error: String(error),
      causeCode: fetchError.cause?.code ?? null,
      causeMessage: fetchError.cause?.message ?? null,
      hint:
        fetchError.cause?.code === "SELF_SIGNED_CERT_IN_CHAIN"
          ? "TLS trust chain issue: configure system CA / NODE_EXTRA_CA_CERTS or use LLM_ACCESS_TOKEN."
          : null,
    });
    tokenCache = null;
    return null;
  }
};

const authHeaders = (accessToken: string): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json",
});

const trimTrailingSlash = (value: string): string => value.replace(/\/+$/, "");

const fetchWithGigachatAuth = async (
  path: string,
  init: Omit<RequestInit, "headers"> & { headers?: HeadersInit },
): Promise<Response | null> => {
  const { baseUrl } = getConfig();
  const accessToken = await getAccessToken();
  if (!accessToken) {
    return null;
  }

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      ...authHeaders(accessToken),
      ...(init.headers ?? {}),
    },
  });
};

const fetchWithOpenAiCompatibleAuth = async (
  path: string,
  init: Omit<RequestInit, "headers"> & { headers?: HeadersInit },
): Promise<Response | null> => {
  const { llmBaseUrl, llmApiKey } = getConfig();
  const baseUrl = trimTrailingSlash(llmBaseUrl);
  if (!baseUrl || !llmApiKey.trim()) {
    return null;
  }

  return fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${llmApiKey.trim()}`,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
  });
};

const getActiveProvider = (): LlmProvider => {
  const { provider, llmBaseUrl, llmApiKey, llmModel } = getConfig();
  if (
    provider === "openai-compatible" &&
    llmBaseUrl.trim() &&
    llmApiKey.trim() &&
    llmModel.trim()
  ) {
    return "openai-compatible";
  }
  return "gigachat";
};

export const getGigachatModels = async (): Promise<GigachatModel[] | null> => {
  try {
    const provider = getActiveProvider();
    const response =
      provider === "openai-compatible"
        ? await fetchWithOpenAiCompatibleAuth("/models", {
            method: "GET",
            headers: { Accept: "application/json" },
          })
        : await fetchWithGigachatAuth("/models", {
            method: "GET",
            headers: { Accept: "application/json" },
          });
    if (!response) {
      return null;
    }
    if (!response.ok) {
      throw new Error(`Models HTTP ${response.status}`);
    }
    const payload = (await response.json()) as { data?: GigachatModel[] };
    return payload.data ?? [];
  } catch (error) {
    logError("LLM models check failed", { error: String(error) });
    return null;
  }
};

export const callLlmWithSchema = async <T>({
  schema,
  systemPrompt,
  userPrompt,
}: CallLlmParams<T>): Promise<T | null> => {
  const provider = getActiveProvider();
  const { model, llmModel } = getConfig();
  const activeModel = provider === "openai-compatible" ? llmModel.trim() : model;

  const messages: LlmMessage[] = [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];

  try {
    const response =
      provider === "openai-compatible"
        ? await fetchWithOpenAiCompatibleAuth("/chat/completions", {
            method: "POST",
            body: JSON.stringify({
              model: activeModel,
              temperature: 0.2,
              messages,
            }),
          })
        : await fetchWithGigachatAuth("/chat/completions", {
            method: "POST",
            body: JSON.stringify({
              model: activeModel,
              temperature: 0.2,
              messages,
            }),
          });
    if (!response) {
      return null;
    }

    if (!response.ok) {
      throw new Error(`LLM HTTP ${response.status}`);
    }

    const payload = (await response.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
    };
    const rawContent = payload.choices?.[0]?.message?.content;

    if (!rawContent) {
      throw new Error("LLM response is empty.");
    }

    const parsed = parseJsonFromText(rawContent);
    return schema.parse(parsed);
  } catch (error) {
    logError("LLM call failed, using fallback", { error: String(error) });
    return null;
  }
};
