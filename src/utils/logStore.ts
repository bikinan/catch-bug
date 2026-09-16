import { reactive } from "vue";
import type { CapturedLog } from "./types";
import { maskSensitiveData } from "./masking";
import { settingsState } from "./settingsStore";

export const logState = reactive<{ logs: CapturedLog[] }>({
  logs: [],
});

export const enforceLogLimit = (customLimit?: number) => {
  const limit = customLimit ?? settingsState.maxLogs ?? 10;
  while (logState.logs.length > limit) {
    logState.logs.pop();
  }
};

export const addLog = (log: CapturedLog) => {
  // Terapkan client-side masking jika diaktifkan
  const sanitizedLog: CapturedLog = { ...log };

  if (settingsState.maskingEnabled) {
    const maskingOpts = {
      enabled: settingsState.maskingEnabled,
      maskEmails: settingsState.maskEmails,
      customKeywords: settingsState.customKeywords,
    };

    if (sanitizedLog.type === "console" && sanitizedLog.message) {
      sanitizedLog.message = maskSensitiveData(sanitizedLog.message, maskingOpts);
    } else if (sanitizedLog.type === "network") {
      if (sanitizedLog.url) {
        sanitizedLog.url = maskSensitiveData(sanitizedLog.url, maskingOpts);
      }
      if (sanitizedLog.requestBody) {
        sanitizedLog.requestBody = maskSensitiveData(sanitizedLog.requestBody, maskingOpts);
      }
      if (sanitizedLog.responseBody) {
        sanitizedLog.responseBody = maskSensitiveData(sanitizedLog.responseBody, maskingOpts);
      }
    }
  }

  logState.logs.unshift(sanitizedLog);
  enforceLogLimit();
};

export const clearLogs = () => {
  logState.logs = [];
};
