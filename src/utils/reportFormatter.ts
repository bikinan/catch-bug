import { aiDiagnosisState } from "./aiService";
import { breadcrumbState } from "./breadcrumbStore";
import { maskSensitiveData } from "./masking";
import { settingsState } from "./settingsStore";
import type { CapturedLog } from "./types";

/**
 * Format string log data into structured Markdown for QA / developer reporting.
 */
export function generateMarkdownReport(logs: CapturedLog[], hasScreenshot?: boolean): string {
  const rawUrl = typeof window !== "undefined" ? window.location.href : "Unknown";
  const url = settingsState.maskingEnabled ? maskSensitiveData(rawUrl) : rawUrl;
  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "Unknown";
  const timestamp = new Date().toLocaleString();
  const screenResolution =
    typeof window !== "undefined"
      ? `${window.innerWidth}x${window.innerHeight} (Screen: ${window.screen.width}x${window.screen.height})`
      : "Unknown";

  const totalLogs = logs.length;
  const consoleCount = logs.filter((l) => l.type === "console").length;
  const networkCount = logs.filter((l) => l.type === "network").length;

  let report = `## 🐛 Bug Report - ${url}\n\n`;
  report += `**Timestamp:** ${timestamp}\n`;
  report += `**Environment:** ${userAgent}\n`;
  report += `**Viewport / Resolution:** ${screenResolution}\n`;
  report += `**Diagnostics Summary:** ${totalLogs} captured (${consoleCount} console errors, ${networkCount} failed network requests)\n`;
  if (hasScreenshot) {
    report += `**Visual Evidence:** ✅ Viewport screenshot attached at ${timestamp}\n`;
  }
  report += `\n---\n\n`;

  // 1. ACTION BREADCRUMBS TRAIL (Steps to Reproduce)
  if (breadcrumbState.breadcrumbs.length > 0) {
    report += `### 🐾 User Action Breadcrumbs (Steps Leading to Error)\n\n`;
    breadcrumbState.breadcrumbs.forEach((crumb, idx) => {
      const detailStr = crumb.detail ? ` _${crumb.detail}_` : "";
      const catBadge = crumb.category.toUpperCase();
      report += `${idx + 1}. \`[${crumb.timestamp}]\` **[${catBadge}]** \`${crumb.target}\`${detailStr}\n`;
    });
    report += `\n---\n\n`;
  }

  // 2. AI ROOT CAUSE DIAGNOSIS & REPRODUCTION (v0.5)
  if (aiDiagnosisState.result) {
    const ai = aiDiagnosisState.result;
    report += `### 🧠 AI Root Cause Diagnosis\n\n`;
    report += `> **Root Cause:** ${ai.rootCause}\n\n`;

    if (ai.stepsToReproduce && ai.stepsToReproduce.length > 0) {
      report += `**Steps to Reproduce (AI-Deduced):**\n`;
      ai.stepsToReproduce.forEach((step, idx) => {
        report += `${idx + 1}. ${step.replace(/^Step\s*\d+:\s*/i, "")}\n`;
      });
      report += `\n`;
    }

    if (ai.suggestedFix) {
      report += `**Suggested Remediation:**\n\`\`\`text\n${ai.suggestedFix}\n\`\`\`\n\n`;
    }

    report += `---\n\n`;
  }

  // 3. TELEMETRY LOGS
  report += `### 📋 Telemetry Logs\n\n`;

  if (logs.length === 0) {
    report += `_No error logs recorded on this session._\n`;
  } else {
    logs.forEach((log, index) => {
      report += `#### ${index + 1}. [${log.timestamp}] `;
      if (log.type === "console") {
        report += `**[CONSOLE ERROR]**\n\`\`\`text\n${log.message}\n\`\`\`\n\n`;
      } else {
        const statusText = log.statusText ? ` (${log.statusText})` : "";
        report += `**[NETWORK ${log.status}${statusText}]**\n`;
        report += `- **Method:** \`${log.method}\`\n`;
        report += `- **Endpoint:** \`${log.url}\`\n`;
        report += `- **Status Code:** \`${log.status}\`\n`;

        if (log.requestBody) {
          report += `- **Request Payload:**\n\`\`\`json\n${log.requestBody}\n\`\`\`\n`;
        }

        if (log.responseBody) {
          report += `- **Response Body:**\n\`\`\`json\n${log.responseBody}\n\`\`\`\n`;
        }

        report += `\n`;
      }
    });
  }

  report += `---\n_Report generated with CatchBug Extension_`;
  return report;
}

/**
 * Copy text to clipboard with fallback handling.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (navigator?.clipboard?.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fallback below
    }
  }

  try {
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.opacity = "0";
    document.body.appendChild(textarea);
    textarea.select();
    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);
    return successful;
  } catch (err) {
    console.error("CatchBug: Failed to copy clipboard text", err);
    return false;
  }
}
