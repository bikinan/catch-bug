import { reactive } from "vue";
import type { CapturedLog, Breadcrumb } from "./types";

export interface AIDiagnosisResult {
  rootCause: string;
  stepsToReproduce: string[];
  suggestedFix: string;
  confidence?: "high" | "medium" | "low";
  timestamp?: string;
}

export const aiDiagnosisState = reactive<{
  result: AIDiagnosisResult | null;
  isLoading: boolean;
  error: string | null;
}>({
  result: null,
  isLoading: false,
  error: null,
});

export function clearAIDiagnosis() {
  aiDiagnosisState.result = null;
  aiDiagnosisState.error = null;
  aiDiagnosisState.isLoading = false;
}

/**
 * Detects if Chrome Built-in Prompt API (Gemini Nano) is present on window.
 */
export function isChromeBuiltinAIAvailable(): boolean {
  return (
    typeof window !== "undefined" &&
    "ai" in window &&
    Boolean((window as any).ai?.languageModel)
  );
}

/**
 * Tests a Google Gemini API Key via background worker.
 */
export async function testGeminiApiKey(
  apiKey: string,
  model = "gemini-2.5-flash"
): Promise<{ success: boolean; displayName?: string; error?: string }> {
  try {
    const res = await browser.runtime.sendMessage({
      type: "TEST_GEMINI_KEY",
      payload: { apiKey, model },
    });
    return res || { success: false, error: "No response from background script" };
  } catch (err) {
    return { success: false, error: String(err) };
  }
}

/**
 * Builds a structured diagnostic prompt for the AI model.
 */
function buildTelemetryPrompt(
  url: string,
  userAgent: string,
  viewport: string,
  logs: CapturedLog[],
  breadcrumbs: Breadcrumb[]
): string {
  const telemetrySummary = {
    targetUrl: url,
    environment: { userAgent, viewport },
    totalErrors: logs.length,
    userActionBreadcrumbs: breadcrumbs.map((b, idx) => ({
      step: idx + 1,
      category: b.category,
      target: b.target,
      detail: b.detail || null,
      time: b.timestamp,
    })),
    capturedErrors: logs.map((l) => {
      if (l.type === "console") {
        return {
          type: "CONSOLE_ERROR",
          message: l.message,
          time: l.timestamp,
        };
      }
      return {
        type: "NETWORK_ERROR",
        method: l.method,
        url: l.url,
        status: l.status,
        statusText: l.statusText || null,
        requestBody: l.requestBody || null,
        responseBody: l.responseBody || null,
        time: l.timestamp,
      };
    }),
  };

  return `Here is the intercepted web diagnostic session in JSON format:
${JSON.stringify(telemetrySummary, null, 2)}

Provide your response strictly in the following JSON format:
{
  "rootCause": "Direct and technically accurate diagnosis of why the failure occurred (1-3 sentences).",
  "stepsToReproduce": [
    "Step 1: ...",
    "Step 2: ...",
    "Step 3: ..."
  ],
  "suggestedFix": "Concise code or architectural recommendation for frontend/backend engineers to fix this.",
  "confidence": "high"
}`;
}

const SYSTEM_INSTRUCTION = `You are CatchBug AI, a senior QA and triage intelligence engineer.
Your task is to analyze web application errors (console exceptions, network 4xx/5xx failures, payload data, and action breadcrumbs) and provide a concise, high-signal root cause diagnosis, chronological steps to reproduce, and remediation advice.
Output strictly valid JSON adhering to the specified schema. Do not output markdown code fences or conversational prose.`;

/**
 * Runs AI root cause synthesis using Google Gemini API or Chrome Built-in AI.
 */
export async function runAIDiagnosis(params: {
  apiKey: string;
  model: string;
  provider: "gemini" | "chrome-builtin";
  logs: CapturedLog[];
  breadcrumbs: Breadcrumb[];
}): Promise<{ success: boolean; result?: AIDiagnosisResult; error?: string }> {
  const { apiKey, model, provider, logs, breadcrumbs } = params;

  if (logs.length === 0 && breadcrumbs.length === 0) {
    return {
      success: false,
      error: "No telemetry logs or user breadcrumbs available to analyze.",
    };
  }

  aiDiagnosisState.isLoading = true;
  aiDiagnosisState.error = null;

  const pageUrl = typeof window !== "undefined" ? window.location.href : "Unknown";
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
  const viewport = typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "Unknown";

  const prompt = buildTelemetryPrompt(pageUrl, userAgent, viewport, logs, breadcrumbs);

  // 1. Chrome Built-in AI Pathway (Gemini Nano)
  if (provider === "chrome-builtin" && isChromeBuiltinAIAvailable()) {
    try {
      const session = await (window as any).ai.languageModel.create({
        systemPrompt: SYSTEM_INSTRUCTION,
      });
      const raw = await session.prompt(prompt);
      session.destroy?.();

      let parsed: AIDiagnosisResult;
      try {
        parsed = JSON.parse(raw);
      } catch {
        parsed = {
          rootCause: raw,
          stepsToReproduce: breadcrumbs.map((b, i) => `${i + 1}. ${b.category.toUpperCase()} on ${b.target}`),
          suggestedFix: "Inspect network request payloads and error stack traces.",
          confidence: "medium",
        };
      }

      parsed.timestamp = new Date().toLocaleTimeString();
      aiDiagnosisState.result = parsed;
      aiDiagnosisState.isLoading = false;
      return { success: true, result: parsed };
    } catch (err) {
      console.warn("[CatchBug AI] Chrome built-in AI failed, falling back to Gemini API if key exists:", err);
      // If failed and no apiKey, return error
      if (!apiKey) {
        const msg = `Chrome Built-in AI error: ${String(err)}`;
        aiDiagnosisState.error = msg;
        aiDiagnosisState.isLoading = false;
        return { success: false, error: msg };
      }
    }
  }

  // 2. Google Gemini API via Background Worker
  if (!apiKey) {
    const msg = "Missing Gemini API Key. Please configure it in CatchBug Extension Popup Settings.";
    aiDiagnosisState.error = msg;
    aiDiagnosisState.isLoading = false;
    return { success: false, error: msg };
  }

  try {
    const res = await browser.runtime.sendMessage({
      type: "DISPATCH_GEMINI_DIAGNOSE",
      payload: {
        apiKey,
        model: model || "gemini-2.5-flash",
        prompt,
        systemInstruction: SYSTEM_INSTRUCTION,
      },
    });

    if (!res || !res.success) {
      const errMsg = res?.error || "Gemini API failed to return diagnostic analysis.";
      aiDiagnosisState.error = errMsg;
      aiDiagnosisState.isLoading = false;
      return { success: false, error: errMsg };
    }

    let parsed: AIDiagnosisResult;
    if (res.result?.rootCause && res.result?.stepsToReproduce) {
      parsed = res.result as AIDiagnosisResult;
    } else if (res.result?.raw) {
      parsed = {
        rootCause: String(res.result.raw),
        stepsToReproduce: breadcrumbs.map((b, i) => `Step ${i + 1}: ${b.category.toUpperCase()} on ${b.target}`),
        suggestedFix: "Review console stack trace and HTTP response status code.",
        confidence: "medium",
      };
    } else {
      parsed = {
        rootCause: typeof res.result === "string" ? res.result : JSON.stringify(res.result),
        stepsToReproduce: [],
        suggestedFix: "Check endpoint request and validation error codes.",
        confidence: "low",
      };
    }

    parsed.timestamp = new Date().toLocaleTimeString();
    aiDiagnosisState.result = parsed;
    aiDiagnosisState.isLoading = false;
    return { success: true, result: parsed };
  } catch (err) {
    const errMsg = String(err);
    aiDiagnosisState.error = errMsg;
    aiDiagnosisState.isLoading = false;
    return { success: false, error: errMsg };
  }
}
