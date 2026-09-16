<template>
  <div class="control-center">
    <!-- COCKPIT HEADER -->
    <header class="header">
      <div class="brand-group">
        <span class="brand-icon" aria-hidden="true"
          ><img src="/icon/32.png" alt="Catch Bug" class="brand-img" />
        </span>
        <div>
          <h1 class="brand-title">CatchBug</h1>
          <span class="brand-subtitle">Control Center &amp; Settings</span>
        </div>
      </div>
      <div class="header-status">
        <span class="version-badge">v0.1.0</span>
        <span
          :class="[
            'status-pill',
            settings.isEnabled && isCurrentSiteAllowed
              ? 'status-active'
              : 'status-inactive',
          ]"
          :title="currentSiteStatusTooltip"
        >
          <span class="status-dot" aria-hidden="true"></span>
          {{
            settings.isEnabled && isCurrentSiteAllowed ? "Active" : "Inactive"
          }}
        </span>
      </div>
    </header>

    <!-- CURRENT SITE INFO BANNER -->
    <div v-if="currentHost" class="site-info-bar">
      <span class="site-label">Current Tab:</span>
      <span class="site-host" :title="currentHost">{{ currentHost }}</span>
      <span
        v-if="
          settings.domainFilterMode === 'whitelist' && !isCurrentSiteAllowed
        "
        class="site-tag tag-excluded"
      >
        Filtered Out
      </span>
      <span
        v-else-if="settings.domainFilterMode === 'whitelist'"
        class="site-tag tag-included"
      >
        Whitelisted
      </span>
    </div>

    <main class="content">
      <!-- 1. MASTER OVERLAY SWITCH -->
      <section class="setting-card master-card">
        <div class="setting-info">
          <label for="master-toggle" class="setting-title"
            >In-Page Overlay Widget</label
          >
          <span class="setting-desc"
            >Render floating diagnostic pill and bug drawer on pages</span
          >
        </div>
        <button
          id="master-toggle"
          type="button"
          role="switch"
          :aria-checked="settings.isEnabled"
          :class="['toggle-btn', { 'is-checked': settings.isEnabled }]"
          @click="toggleMasterSwitch"
          title="Toggle overlay activation"
        >
          <span class="toggle-thumb"></span>
        </button>
      </section>

      <!-- 2. ENVIRONMENT & DOMAIN FILTERING -->
      <section class="setting-card">
        <div class="section-header">
          <span class="section-icon" aria-hidden="true">🌐</span>
          <h2 class="section-title">Activation Scope</h2>
        </div>

        <div
          class="radio-group"
          role="radiogroup"
          aria-label="Domain activation scope"
        >
          <label
            :class="[
              'radio-label',
              { 'is-selected': settings.domainFilterMode === 'all' },
            ]"
          >
            <input
              type="radio"
              name="domain-mode"
              value="all"
              :checked="settings.domainFilterMode === 'all'"
              @change="handleDomainModeChange('all')"
            />
            <div class="radio-text">
              <span class="radio-title">All Websites</span>
              <span class="radio-desc"
                >Active on any visited HTTP/HTTPS page</span
              >
            </div>
          </label>

          <label
            :class="[
              'radio-label',
              { 'is-selected': settings.domainFilterMode === 'whitelist' },
            ]"
          >
            <input
              type="radio"
              name="domain-mode"
              value="whitelist"
              :checked="settings.domainFilterMode === 'whitelist'"
              @change="handleDomainModeChange('whitelist')"
            />
            <div class="radio-text">
              <span class="radio-title">Staging &amp; Dev Whitelist</span>
              <span class="radio-desc"
                >Only activate on specified staging/local environments</span
              >
            </div>
          </label>
        </div>

        <!-- Whitelist Chips Editor (Only visible when whitelist is selected) -->
        <div
          v-if="settings.domainFilterMode === 'whitelist'"
          class="whitelist-box"
        >
          <div class="chips-list">
            <span
              v-for="(domain, idx) in settings.whitelistedDomains"
              :key="idx"
              class="domain-chip"
            >
              <span class="chip-text">{{ domain }}</span>
              <button
                type="button"
                @click="removeDomain(idx)"
                class="chip-remove"
                :title="`Remove ${domain}`"
                :aria-label="`Remove ${domain}`"
              >
                ✕
              </button>
            </span>
          </div>

          <form @submit.prevent="addDomain" class="add-domain-form">
            <input
              v-model="newDomainInput"
              type="text"
              placeholder="Add domain (e.g. *.staging.*, localhost)"
              class="input-domain"
              aria-label="Domain pattern to whitelist"
            />
            <button
              type="submit"
              :disabled="!newDomainInput.trim()"
              class="btn-add-domain"
            >
              + Add
            </button>
          </form>
        </div>
      </section>

      <!-- 3. CLIENT-SIDE DATA MASKING & PRIVACY -->
      <section class="setting-card">
        <div class="section-header">
          <span class="section-icon" aria-hidden="true">🔒</span>
          <h2 class="section-title">Client-Side Masking</h2>
        </div>

        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-title">Sanitize Credentials &amp; Tokens</span>
            <span class="setting-desc"
              >Auto-redact Bearer tokens, passwords, and credit cards before
              logs are stored</span
            >
          </div>
          <button
            type="button"
            role="switch"
            :aria-checked="settings.maskingEnabled"
            :class="['toggle-btn', { 'is-checked': settings.maskingEnabled }]"
            @click="toggleMasking"
            title="Toggle sensitive data masking"
          >
            <span class="toggle-thumb"></span>
          </button>
        </div>

        <div v-if="settings.maskingEnabled" class="masking-suboptions">
          <label class="checkbox-row">
            <input
              type="checkbox"
              :checked="settings.maskEmails"
              @change="toggleMaskEmails"
              class="checkbox-input"
            />
            <span class="checkbox-label">Redact Email Addresses in logs</span>
          </label>

          <div class="custom-keywords-box">
            <label for="custom-keywords-input" class="keywords-label">
              Custom Sensitive Keys (comma-separated):
            </label>
            <input
              id="custom-keywords-input"
              v-model="customKeywordsInput"
              @blur="saveCustomKeywords"
              @keydown.enter="saveCustomKeywords"
              type="text"
              placeholder="e.g. secretKey, ssn, pin, client_secret"
              class="input-keywords"
            />
          </div>
        </div>
      </section>

      <!-- 4. TELEMETRY BUFFER SIZE -->
      <section class="setting-card">
        <div class="setting-row">
          <div class="setting-info">
            <span class="setting-title">Log Buffer Capacity</span>
            <span class="setting-desc"
              >Maximum recent error logs kept in in-page drawer</span
            >
          </div>
          <div class="buffer-selector">
            <button
              type="button"
              :class="['btn-buffer', { 'is-active': settings.maxLogs === 10 }]"
              @click="setMaxLogs(10)"
            >
              10
            </button>
            <button
              type="button"
              :class="['btn-buffer', { 'is-active': settings.maxLogs === 20 }]"
              @click="setMaxLogs(20)"
            >
              20
            </button>
          </div>
        </div>
      </section>

      <!-- 5. INTEGRATIONS & DIRECT DISPATCH (v0.4) -->
      <section class="setting-card">
        <div class="section-header">
          <span class="section-icon" aria-hidden="true">⚡</span>
          <h2 class="section-title">Integrations &amp; Direct Dispatch</h2>
        </div>

        <!-- GitHub Integration -->
        <div class="integration-block">
          <div class="integration-title-row">
            <div class="integration-meta">
              <span class="integration-name">🐙 GitHub Issues</span>
              <span class="integration-desc"
                >Create 1-click issue directly in target repository</span
              >
            </div>
            <button
              type="button"
              class="btn-test-conn"
              :disabled="
                !settings.githubToken ||
                !settings.githubRepo ||
                githubTestState === 'testing'
              "
              @click="handleTestGithub"
            >
              {{
                githubTestState === "testing" ? "Testing..." : "Test Connection"
              }}
            </button>
          </div>

          <div
            v-if="githubTestState !== 'idle'"
            :class="['test-feedback', githubTestState]"
          >
            <span class="feedback-dot"></span>
            <span class="feedback-text">{{ githubTestMsg }}</span>
          </div>

          <div class="integration-fields">
            <div class="field-group">
              <label for="gh-token" class="field-label"
                >Personal Access Token (PAT):</label
              >
              <div class="input-password-wrapper">
                <input
                  id="gh-token"
                  v-model="settings.githubToken"
                  :type="showGithubToken ? 'text' : 'password'"
                  placeholder="ghp_xxxxxxxxxxxx"
                  class="input-text input-mono"
                  @change="saveGithubSettings"
                />
                <button
                  type="button"
                  class="btn-toggle-eye"
                  @click="showGithubToken = !showGithubToken"
                  :title="showGithubToken ? 'Hide token' : 'Show token'"
                >
                  {{ showGithubToken ? "👁️" : "🔒" }}
                </button>
              </div>
            </div>

            <div class="field-grid-2">
              <div class="field-group">
                <label for="gh-repo" class="field-label"
                  >Target Repository:</label
                >
                <input
                  id="gh-repo"
                  v-model="settings.githubRepo"
                  type="text"
                  placeholder="owner/repo"
                  class="input-text input-mono"
                  @change="saveGithubSettings"
                />
              </div>

              <div class="field-group">
                <label for="gh-labels" class="field-label"
                  >Default Labels:</label
                >
                <input
                  id="gh-labels"
                  v-model="githubLabelsInput"
                  type="text"
                  placeholder="bug, catch-bug"
                  class="input-text input-mono"
                  @change="saveGithubLabels"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Slack / Discord Webhook -->
        <div class="integration-block mt-3">
          <div class="integration-title-row">
            <div class="integration-meta">
              <span class="integration-name">💬 Slack / Discord Webhook</span>
              <span class="integration-desc"
                >Broadcast telemetry alerts to team channel</span
              >
            </div>
            <button
              type="button"
              class="btn-test-conn"
              :disabled="
                !settings.slackWebhookUrl || webhookTestState === 'testing'
              "
              @click="handleTestWebhook"
            >
              {{
                webhookTestState === "testing" ? "Pinging..." : "Send Test Ping"
              }}
            </button>
          </div>

          <div
            v-if="webhookTestState !== 'idle'"
            :class="['test-feedback', webhookTestState]"
          >
            <span class="feedback-dot"></span>
            <span class="feedback-text">{{ webhookTestMsg }}</span>
          </div>

          <div class="field-group">
            <label for="webhook-url" class="field-label"
              >Incoming Webhook URL:</label
            >
            <input
              id="webhook-url"
              v-model="settings.slackWebhookUrl"
              type="url"
              placeholder="https://hooks.slack.com/services/... or discord.com/api/webhooks/..."
              class="input-text input-mono"
              @change="saveWebhookSettings"
            />
          </div>
        </div>
      </section>

      <!-- 6. AI ROOT CAUSE DIAGNOSTICS (v0.5) -->
      <section class="setting-card">
        <div class="section-header">
          <span class="section-icon" aria-hidden="true">🧠</span>
          <h2 class="section-title">AI Diagnostics Engine</h2>
        </div>

        <div class="integration-block">
          <div class="integration-title-row">
            <div class="integration-meta">
              <span class="integration-name">Google Gemini API (BYOK)</span>
              <span class="integration-desc"
                >Zero-cost root cause synthesis via your personal API key</span
              >
            </div>
            <button
              type="button"
              class="btn-test-conn"
              :disabled="
                !settings.geminiApiKey || geminiTestState === 'testing'
              "
              @click="handleTestGemini"
            >
              {{
                geminiTestState === "testing" ? "Testing..." : "Test API Key"
              }}
            </button>
          </div>

          <div
            v-if="geminiTestState !== 'idle'"
            :class="['test-feedback', geminiTestState]"
          >
            <span class="feedback-dot"></span>
            <span class="feedback-text">{{ geminiTestMsg }}</span>
          </div>

          <div class="integration-fields">
            <div class="field-group">
              <div class="label-with-link">
                <label for="gemini-key" class="field-label"
                  >Gemini API Key:</label
                >
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  class="link-help"
                >
                  Get free key on AI Studio ↗
                </a>
              </div>
              <div class="input-password-wrapper">
                <input
                  id="gemini-key"
                  v-model="settings.geminiApiKey"
                  :type="showGeminiKey ? 'text' : 'password'"
                  placeholder="AIzaSy..."
                  class="input-text input-mono"
                  @change="saveAISettings"
                />
                <button
                  type="button"
                  class="btn-toggle-eye"
                  @click="showGeminiKey = !showGeminiKey"
                  :title="showGeminiKey ? 'Hide key' : 'Show key'"
                >
                  {{ showGeminiKey ? "👁️" : "🔒" }}
                </button>
              </div>
            </div>

            <div class="field-grid-2">
              <div class="field-group">
                <label for="gemini-model" class="field-label">Model:</label>
                <select
                  id="gemini-model"
                  v-model="settings.geminiModel"
                  class="select-input"
                  @change="saveAISettings"
                >
                  <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                </select>
              </div>

              <div class="field-group">
                <label for="ai-provider" class="field-label"
                  >Provider Mode:</label
                >
                <select
                  id="ai-provider"
                  v-model="settings.aiProvider"
                  class="select-input"
                  @change="saveAISettings"
                >
                  <option value="gemini">Google Gemini API</option>
                  <option value="chrome-builtin">Chrome Built-in AI</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>

    <!-- FOOTER ACTIONS -->
    <footer class="footer">
      <button
        type="button"
        @click="handleReset"
        class="btn-reset"
        title="Reset all settings to default"
      >
        Reset Defaults
      </button>

      <span v-if="saveNotification" class="toast-saved" role="status">
        ✓ Saved
      </span>
      <span v-else class="storage-hint">Settings synced locally</span>
    </footer>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from "vue";
import {
  settingsState,
  DEFAULT_SETTINGS,
  loadSettings,
  saveSettings,
  resetSettings,
  isDomainAllowed,
  type CatchBugSettings,
} from "@/utils/settingsStore";
import { testGitHubConnection, testWebhookPing } from "@/utils/dispatchService";
import { testGeminiApiKey } from "@/utils/aiService";

const settings = reactive<CatchBugSettings>({ ...settingsState });
const currentHost = ref<string>("");
const newDomainInput = ref<string>("");
const customKeywordsInput = ref<string>("");
const saveNotification = ref<boolean>(false);
let saveTimeout: number | undefined;

// v0.4: Integrations State
const showGithubToken = ref<boolean>(false);
const githubLabelsInput = ref<string>("");
const githubTestState = ref<"idle" | "testing" | "success" | "error">("idle");
const githubTestMsg = ref<string>("");

const webhookTestState = ref<"idle" | "testing" | "success" | "error">("idle");
const webhookTestMsg = ref<string>("");

// v0.5: AI Diagnostics State
const showGeminiKey = ref<boolean>(false);
const geminiTestState = ref<"idle" | "testing" | "success" | "error">("idle");
const geminiTestMsg = ref<string>("");

const isCurrentSiteAllowed = computed(() => {
  if (!currentHost.value) return true;
  return isDomainAllowed(currentHost.value, settings);
});

const currentSiteStatusTooltip = computed(() => {
  if (!settings.isEnabled) return "CatchBug is disabled via Master Switch";
  if (!isCurrentSiteAllowed.value) {
    return `Host '${currentHost.value}' is excluded by whitelist filter`;
  }
  return `CatchBug overlay active on ${currentHost.value}`;
});

const triggerSavedToast = () => {
  saveNotification.value = true;
  if (saveTimeout) clearTimeout(saveTimeout);
  saveTimeout = window.setTimeout(() => {
    saveNotification.value = false;
  }, 1600);
};

const persist = async (updates: Partial<CatchBugSettings>) => {
  Object.assign(settings, updates);
  await saveSettings(updates);
  triggerSavedToast();
};

const toggleMasterSwitch = () => {
  persist({ isEnabled: !settings.isEnabled });
};

const handleDomainModeChange = (mode: "all" | "whitelist") => {
  persist({ domainFilterMode: mode });
};

const addDomain = () => {
  const trimmed = newDomainInput.value.trim();
  if (trimmed && !settings.whitelistedDomains.includes(trimmed)) {
    const updated = [...settings.whitelistedDomains, trimmed];
    persist({ whitelistedDomains: updated });
    newDomainInput.value = "";
  }
};

const removeDomain = (index: number) => {
  const updated = settings.whitelistedDomains.filter((_, i) => i !== index);
  persist({ whitelistedDomains: updated });
};

const toggleMasking = () => {
  persist({ maskingEnabled: !settings.maskingEnabled });
};

const toggleMaskEmails = () => {
  persist({ maskEmails: !settings.maskEmails });
};

const saveCustomKeywords = () => {
  const list = customKeywordsInput.value
    .split(",")
    .map((k) => k.trim())
    .filter(Boolean);
  persist({ customKeywords: list });
};

const setMaxLogs = (limit: number) => {
  persist({ maxLogs: limit });
};

// v0.4: Integration Actions
const saveGithubSettings = () => {
  persist({
    githubToken: settings.githubToken,
    githubRepo: settings.githubRepo,
  });
};

const saveGithubLabels = () => {
  const labels = githubLabelsInput.value
    .split(",")
    .map((l) => l.trim())
    .filter(Boolean);
  persist({ githubLabels: labels.length ? labels : ["bug", "catch-bug"] });
};

const saveWebhookSettings = () => {
  persist({ slackWebhookUrl: settings.slackWebhookUrl });
};

const handleTestGithub = async () => {
  if (!settings.githubToken || !settings.githubRepo) return;
  githubTestState.value = "testing";
  githubTestMsg.value = "Connecting to GitHub API...";

  const res = await testGitHubConnection(
    settings.githubToken,
    settings.githubRepo,
  );
  if (res.success) {
    githubTestState.value = "success";
    githubTestMsg.value = `Connected: ${res.fullName || settings.githubRepo}${res.private ? " (private)" : " (public)"}`;
  } else {
    githubTestState.value = "error";
    githubTestMsg.value = res.error || "Failed to authenticate";
  }
};

const handleTestWebhook = async () => {
  if (!settings.slackWebhookUrl) return;
  webhookTestState.value = "testing";
  webhookTestMsg.value = "Sending test ping...";

  const res = await testWebhookPing(settings.slackWebhookUrl);
  if (res.success) {
    webhookTestState.value = "success";
    webhookTestMsg.value = "Test payload delivered successfully!";
  } else {
    webhookTestState.value = "error";
    webhookTestMsg.value = res.error || "Failed to deliver webhook payload";
  }
};

// v0.5: AI Diagnostics Actions
const saveAISettings = () => {
  persist({
    geminiApiKey: settings.geminiApiKey,
    geminiModel: settings.geminiModel,
    aiProvider: settings.aiProvider,
  });
};

const handleTestGemini = async () => {
  if (!settings.geminiApiKey) return;
  geminiTestState.value = "testing";
  geminiTestMsg.value = "Validating Gemini API key...";

  const res = await testGeminiApiKey(
    settings.geminiApiKey,
    settings.geminiModel || "gemini-2.5-flash",
  );
  if (res.success) {
    geminiTestState.value = "success";
    geminiTestMsg.value = `Verified: ${res.displayName || settings.geminiModel} ready!`;
  } else {
    geminiTestState.value = "error";
    geminiTestMsg.value = res.error || "Failed to validate API key";
  }
};

const handleReset = async () => {
  if (confirm("Reset all CatchBug settings to default?")) {
    await resetSettings();
    Object.assign(settings, settingsState);
    customKeywordsInput.value = "";
    githubLabelsInput.value = (DEFAULT_SETTINGS.githubLabels || []).join(", ");
    githubTestState.value = "idle";
    webhookTestState.value = "idle";
    geminiTestState.value = "idle";
    triggerSavedToast();
  }
};

onMounted(async () => {
  const loaded = await loadSettings();
  Object.assign(settings, loaded);
  customKeywordsInput.value = settings.customKeywords.join(", ");
  githubLabelsInput.value = (
    settings.githubLabels || ["bug", "catch-bug"]
  ).join(", ");

  // Resolve current active tab domain
  try {
    if (typeof browser !== "undefined" && browser.tabs?.query) {
      const [tab] = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      if (tab?.url) {
        currentHost.value = new URL(tab.url).hostname;
      }
    }
  } catch {
    // Popup opened outside active web tab context
  }
});
</script>

<style scoped>
/* ==========================================================================
   COCKPIT DARK DESIGN SYSTEM FOR POPUP CONTROL CENTER
   ========================================================================== */
.control-center {
  box-sizing: border-box;
  width: 100%;
  max-width: 380px;
  background: #090d16;
  color: #f9fafb;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  display: flex;
  flex-direction: column;
  user-select: none;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 14px;
  background: #111827;
  border-bottom: 1px solid #1f2937;
}

.brand-group {
  display: flex;
  align-items: center;
  gap: 8px;
}

.brand-img {
  width: 16px;
  height: 16px;
}

.brand-title {
  font-size: 14px;
  font-weight: 700;
  color: #ffffff;
  margin: 0;
  line-height: 1.2;
}

.brand-subtitle {
  font-size: 11px;
  color: #9ca3af;
  margin: 0;
  display: block;
}

.header-status {
  display: flex;
  align-items: center;
  gap: 6px;
}

.version-badge {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  font-weight: 600;
  color: #9ca3af;
  background: #1f293d;
  padding: 2px 6px;
  border-radius: 4px;
  border: 1px solid #374151;
}

.status-pill {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
  border: 1px solid transparent;
}

.status-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.status-active {
  background: #062e21;
  color: #6ee7b7;
  border-color: #10b981;
}

.status-active .status-dot {
  background: #10b981;
  box-shadow: 0 0 6px #10b981;
}

.status-inactive {
  background: #1f2937;
  color: #9ca3af;
  border-color: #374151;
}

.status-inactive .status-dot {
  background: #6b7280;
}

/* SITE INFO BAR */
.site-info-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 14px;
  background: #0d1322;
  border-bottom: 1px solid #1f2937;
  font-size: 11px;
}

.site-label {
  color: #6b7280;
}

.site-host {
  font-family: "JetBrains Mono", monospace;
  font-weight: 600;
  color: #e5e7eb;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.site-tag {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  padding: 1px 5px;
  border-radius: 4px;
  margin-left: auto;
}

.tag-included {
  background: #062e21;
  color: #6ee7b7;
  border: 1px solid #10b981;
}

.tag-excluded {
  background: #3b2606;
  color: #fcd34d;
  border: 1px solid #f59e0b;
}

/* CONTENT & SECTIONS */
.content {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  max-height: 400px;
  overflow-y: auto;
}

.setting-card {
  background: #111827;
  border: 1px solid #1f2937;
  border-radius: 8px;
  padding: 10px 12px;
}

.master-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: #141d30;
  border-color: #2b3956;
}

.setting-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.section-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
}

.section-icon {
  font-size: 14px;
}

.section-title {
  font-size: 12px;
  font-weight: 700;
  color: #f3f4f6;
  margin: 0;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.setting-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.setting-title {
  font-size: 13px;
  font-weight: 600;
  color: #f9fafb;
}

.setting-desc {
  font-size: 11px;
  color: #9ca3af;
  line-height: 1.3;
}

/* TOGGLE SWITCH */
.toggle-btn {
  position: relative;
  width: 38px;
  height: 20px;
  background: #374151;
  border-radius: 9999px;
  border: none;
  cursor: pointer;
  transition: background-color 0.2s ease;
  flex-shrink: 0;
  padding: 0;
}

.toggle-btn:focus-visible {
  outline: 2px solid #f43f5e;
  outline-offset: 2px;
}

.toggle-thumb {
  position: absolute;
  top: 2px;
  left: 2px;
  width: 16px;
  height: 16px;
  background: #ffffff;
  border-radius: 50%;
  transition: transform 0.2s ease;
}

.toggle-btn.is-checked {
  background: #10b981;
}

.master-card .toggle-btn.is-checked {
  background: #f43f5e;
}

.toggle-btn.is-checked .toggle-thumb {
  transform: translateX(18px);
}

/* RADIO GROUP */
.radio-group {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.radio-label {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #0f1523;
  border: 1px solid #1f2937;
  cursor: pointer;
  transition: all 0.15s ease;
}

.radio-label:hover {
  background: #172033;
  border-color: #374151;
}

.radio-label.is-selected {
  border-color: #f43f5e;
  background: #1a1725;
}

.radio-label input[type="radio"] {
  margin-top: 3px;
  accent-color: #f43f5e;
}

.radio-text {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.radio-title {
  font-size: 12px;
  font-weight: 600;
  color: #f3f4f6;
}

.radio-desc {
  font-size: 10px;
  color: #9ca3af;
}

/* WHITELIST CHIPS */
.whitelist-box {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #1f2937;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.chips-list {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  max-height: 70px;
  overflow-y: auto;
}

.domain-chip {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  padding: 2px 6px;
  background: #1f293d;
  color: #e5e7eb;
  border: 1px solid #374151;
  border-radius: 4px;
}

.chip-remove {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 9px;
  cursor: pointer;
  padding: 0 1px;
}

.chip-remove:hover {
  color: #f43f5e;
}

.add-domain-form {
  display: flex;
  gap: 4px;
}

.input-domain {
  flex: 1;
  background: #090d16;
  border: 1px solid #374151;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  color: #f9fafb;
  font-family: "JetBrains Mono", monospace;
}

.input-domain:focus {
  outline: none;
  border-color: #f43f5e;
}

.btn-add-domain {
  background: #1f293d;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #f9fafb;
  font-size: 11px;
  font-weight: 600;
  padding: 4px 8px;
  cursor: pointer;
}

.btn-add-domain:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.btn-add-domain:not(:disabled):hover {
  background: #28354f;
  border-color: #4b5563;
}

/* MASKING SUBOPTIONS */
.masking-suboptions {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #1f2937;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.checkbox-row {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.checkbox-input {
  accent-color: #10b981;
}

.checkbox-label {
  font-size: 11px;
  color: #d1d5db;
}

.custom-keywords-box {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.keywords-label {
  font-size: 10px;
  color: #9ca3af;
}

.input-keywords {
  background: #090d16;
  border: 1px solid #374151;
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 11px;
  color: #f9fafb;
  font-family: "JetBrains Mono", monospace;
}

.input-keywords:focus {
  outline: none;
  border-color: #10b981;
}

/* BUFFER SELECTOR */
.buffer-selector {
  display: flex;
  gap: 4px;
}

.btn-buffer {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 10px;
  background: #1f293d;
  color: #9ca3af;
  border: 1px solid #374151;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-buffer:hover {
  background: #28354f;
  color: #f9fafb;
}

.btn-buffer.is-active {
  background: #f43f5e;
  color: #ffffff;
  border-color: #e11d48;
}

/* 5. INTEGRATIONS & DISPATCH */
.integration-block {
  background: #090d16;
  border: 1px solid #1f2937;
  border-radius: 6px;
  padding: 10px 12px;
}

.integration-block.mt-3 {
  margin-top: 10px;
}

.integration-title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  margin-bottom: 8px;
}

.integration-meta {
  display: flex;
  flex-direction: column;
}

.integration-name {
  font-size: 12px;
  font-weight: 600;
  color: #f9fafb;
}

.integration-desc {
  font-size: 10px;
  color: #9ca3af;
}

.btn-test-conn {
  font-size: 10px;
  font-weight: 600;
  padding: 4px 10px;
  background: #1f293d;
  color: #e5e7eb;
  border: 1px solid #374151;
  border-radius: 4px;
  cursor: pointer;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.btn-test-conn:hover:not(:disabled) {
  background: #28354f;
  border-color: #4b5563;
  color: #ffffff;
}

.btn-test-conn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.test-feedback {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 8px;
  border-radius: 4px;
  margin-bottom: 8px;
  font-size: 11px;
}

.test-feedback.testing {
  background: #1e293b;
  color: #93c5fd;
  border: 1px solid #2563eb;
}

.test-feedback.success {
  background: #062e21;
  color: #6ee7b7;
  border: 1px solid #10b981;
}

.test-feedback.error {
  background: #3f1219;
  color: #fca5a5;
  border: 1px solid #f43f5e;
}

.feedback-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: currentColor;
}

.feedback-text {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  word-break: break-all;
}

.integration-fields {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.field-grid-2 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 8px;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.field-label {
  font-size: 10px;
  font-weight: 500;
  color: #9ca3af;
}

.input-password-wrapper {
  display: flex;
  align-items: center;
  position: relative;
}

.input-password-wrapper .input-text {
  padding-right: 30px;
  width: 100%;
}

.btn-toggle-eye {
  position: absolute;
  right: 6px;
  background: transparent;
  border: none;
  font-size: 11px;
  cursor: pointer;
  opacity: 0.7;
  transition: opacity 0.15s;
}

.btn-toggle-eye:hover {
  opacity: 1;
}

.input-text {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 11px;
  color: #f9fafb;
  box-sizing: border-box;
}

.input-text:focus {
  outline: none;
  border-color: #f43f5e;
}

.input-mono {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
}

.label-with-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.link-help {
  font-size: 10px;
  color: #60a5fa;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link-help:hover {
  color: #93c5fd;
}

.select-input {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 4px;
  padding: 5px 8px;
  font-size: 11px;
  color: #f9fafb;
  cursor: pointer;
  box-sizing: border-box;
}

.select-input:focus {
  outline: none;
  border-color: #f43f5e;
}

/* FOOTER */
.footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #111827;
  border-top: 1px solid #1f2937;
}

.btn-reset {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 11px;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.btn-reset:hover {
  color: #f87171;
}

.toast-saved {
  font-size: 11px;
  font-weight: 600;
  color: #10b981;
}

.storage-hint {
  font-size: 10px;
  color: #6b7280;
}
</style>
