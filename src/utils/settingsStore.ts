import { reactive } from "vue";

export interface CatchBugSettings {
  isEnabled: boolean;
  maskingEnabled: boolean;
  maskEmails: boolean;
  customKeywords: string[];
  domainFilterMode: "all" | "whitelist";
  whitelistedDomains: string[];
  maxLogs: number;
  // v0.4: Integrations & Direct Dispatch
  githubToken: string;
  githubRepo: string;
  githubLabels: string[];
  slackWebhookUrl: string;
  discordWebhookUrl: string;
  // v0.5: AI Diagnostics
  aiProvider: "gemini" | "chrome-builtin";
  geminiApiKey: string;
  geminiModel: string;
}

export const DEFAULT_SETTINGS: CatchBugSettings = {
  isEnabled: true,
  maskingEnabled: true,
  maskEmails: false,
  customKeywords: [],
  domainFilterMode: "all",
  whitelistedDomains: ["localhost", "127.0.0.1", "*.staging.*", "*.preview.*"],
  maxLogs: 10,
  // v0.4 Defaults
  githubToken: "",
  githubRepo: "",
  githubLabels: ["bug", "catch-bug"],
  slackWebhookUrl: "",
  discordWebhookUrl: "",
  // v0.5 Defaults
  aiProvider: "gemini",
  geminiApiKey: "",
  geminiModel: "gemini-2.5-flash",
};

const STORAGE_KEY = "catchbug_settings";

export const settingsState = reactive<CatchBugSettings>({
  ...DEFAULT_SETTINGS,
});

/**
 * Loads settings from browser.storage.local or falls back to defaults.
 */
export async function loadSettings(): Promise<CatchBugSettings> {
  try {
    if (typeof browser !== "undefined" && browser.storage?.local) {
      const data = await browser.storage.local.get(STORAGE_KEY);
      if (data && data[STORAGE_KEY]) {
        Object.assign(settingsState, DEFAULT_SETTINGS, data[STORAGE_KEY]);
        return settingsState;
      }
    }
  } catch (err) {
    console.warn("[CatchBug] Failed to read settings from storage:", err);
  }

  return settingsState;
}

/**
 * Persists settings to storage and updates local reactive state.
 */
export async function saveSettings(updates: Partial<CatchBugSettings>): Promise<void> {
  Object.assign(settingsState, updates);

  try {
    const raw = JSON.parse(JSON.stringify(settingsState));
    if (typeof browser !== "undefined" && browser.storage?.local) {
      await browser.storage.local.set({ [STORAGE_KEY]: raw });
    }
  } catch (err) {
    console.warn("[CatchBug] Failed to persist settings:", err);
  }
}

/**
 * Resets settings back to factory defaults.
 */
export async function resetSettings(): Promise<void> {
  await saveSettings(DEFAULT_SETTINGS);
}

/**
 * Checks if a given hostname or URL matches wildcard domains.
 * e.g., "*.staging.*" matches "app.staging.example.com"
 */
export function isDomainAllowed(urlOrHostname: string, settings: CatchBugSettings = settingsState): boolean {
  if (settings.domainFilterMode === "all") {
    return true;
  }

  let hostname = urlOrHostname;
  try {
    if (urlOrHostname.startsWith("http://") || urlOrHostname.startsWith("https://")) {
      hostname = new URL(urlOrHostname).hostname;
    }
  } catch {
    hostname = urlOrHostname;
  }

  return settings.whitelistedDomains.some((pattern) => {
    const trimmed = pattern.trim();
    if (!trimmed) return false;

    if (trimmed === hostname) return true;

    // Wildcard matching: e.g. *.staging.* -> regex
    const regexPattern = "^" + trimmed.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, ".*") + "$";
    const regex = new RegExp(regexPattern, "i");
    return regex.test(hostname);
  });
}

/**
 * Initializes automatic storage listener to sync settings across tabs in real time.
 */
export function initSettingsListener(onChange?: (newSettings: CatchBugSettings) => void) {
  const handleStorageChange = (changes: Record<string, { newValue?: unknown }>, areaName: string) => {
    if (areaName === "local" && changes[STORAGE_KEY]?.newValue) {
      const updated = changes[STORAGE_KEY].newValue as CatchBugSettings;
      Object.assign(settingsState, DEFAULT_SETTINGS, updated);
      onChange?.(settingsState);
    }
  };

  if (typeof browser !== "undefined" && browser.storage?.onChanged) {
    browser.storage.onChanged.addListener(handleStorageChange);
  }
}
