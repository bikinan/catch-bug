<template>
  <!-- MINIMIZED STATE (Floating Pill Trigger) - Only active in overlay mode -->
  <div
    v-if="props.mode === 'overlay' && isMinimized"
    class="floating-trigger"
    @click="isMinimized = false"
    role="button"
    tabindex="0"
    @keydown.enter="isMinimized = false"
    @keydown.space.prevent="isMinimized = false"
    aria-label="Expand CatchBug diagnostics overlay"
  >
    <span class="trigger-icon" aria-hidden="true">
      <img :src="brandIconUrl" alt="Icon" class="brand-img" />
    </span>
    <span class="trigger-label">CatchBug</span>
    <span
      :class="['trigger-badge', { 'has-errors': logState.logs.length > 0 }]"
      :aria-label="`${logState.logs.length} captured error logs`"
    >
      {{ logState.logs.length }}
    </span>
  </div>

  <!-- EXPANDED PANEL -->
  <div
    v-else
    :class="[
      'overlay-card',
      props.mode === 'popup' ? 'mode-popup' : 'mode-overlay',
      { 'is-hidden-for-capture': isCapturingFlash },
    ]"
  >
    <!-- HEADER BAR -->
    <div class="header">
      <div class="title-group">
        <span class="brand-icon" aria-hidden="true"
          ><img :src="brandIconUrl" alt="Icon" class="brand-img"
        /></span>
        <span class="brand-name">CatchBug</span>
        <span
          :class="['count-badge', { 'has-errors': logState.logs.length > 0 }]"
          :aria-label="`${logState.logs.length} of ${settingsState.maxLogs} maximum error logs recorded`"
        >
          {{ logState.logs.length }}/{{ settingsState.maxLogs }}
        </span>
      </div>

      <div class="actions-group">
        <!-- CAPTURE SCREENSHOT BUTTON -->
        <button
          type="button"
          @click="handleCaptureScreenshot"
          :disabled="isCapturingFlash"
          :class="[
            'btn-action',
            'btn-screenshot',
            {
              'is-capturing': isCapturingFlash,
              'is-error': Boolean(snapError),
            },
          ]"
          :title="snapError || 'Capture visible viewport screenshot'"
          aria-label="Capture viewport screenshot"
        >
          <span class="btn-icon" aria-hidden="true">{{
            isCapturingFlash ? "⏳" : snapError ? "⚠️" : "📸"
          }}</span>
          <span class="btn-text">{{
            isCapturingFlash ? "Snapping..." : snapError ? "Failed" : "Snap"
          }}</span>
        </button>

        <!-- COPY REPORT BUTTON -->
        <button
          type="button"
          @click="handleCopyReport"
          :disabled="
            logState.logs.length === 0 &&
            !isCopied &&
            !screenshotState.dataUrl &&
            breadcrumbState.breadcrumbs.length === 0
          "
          :class="[
            'btn-action',
            'btn-copy',
            {
              'is-copied': isCopied,
              'is-disabled':
                logState.logs.length === 0 &&
                !isCopied &&
                !screenshotState.dataUrl &&
                breadcrumbState.breadcrumbs.length === 0,
            },
          ]"
          :title="copyTooltip"
          :aria-label="copyTooltip"
        >
          <span class="btn-icon" aria-hidden="true">{{
            isCopied ? "✓" : "📋"
          }}</span>
          <span class="btn-text">{{ isCopied ? "Copied" : "Copy" }}</span>
        </button>

        <!-- CLEAR / UNDO BUTTON -->
        <button
          v-if="undoLogs.length > 0"
          type="button"
          @click="handleUndoClear"
          class="btn-action btn-undo"
          title="Restore cleared logs (4s remaining)"
          aria-label="Undo clear logs"
        >
          Undo
        </button>
        <button
          v-else
          type="button"
          @click="handleClearWithUndo"
          :disabled="
            logState.logs.length === 0 &&
            !screenshotState.dataUrl &&
            breadcrumbState.breadcrumbs.length === 0
          "
          :class="[
            'btn-action',
            'btn-clear',
            {
              'is-disabled':
                logState.logs.length === 0 &&
                !screenshotState.dataUrl &&
                breadcrumbState.breadcrumbs.length === 0,
            },
          ]"
          title="Clear current log and journey history"
          aria-label="Clear all captured logs"
        >
          Clear
        </button>

        <!-- HEADER DIVIDER & MINIMIZE (Overlay mode only) -->
        <div
          v-if="props.mode === 'overlay'"
          class="header-divider"
          aria-hidden="true"
        ></div>
        <button
          v-if="props.mode === 'overlay'"
          type="button"
          @click="isMinimized = true"
          class="btn-control btn-minimize"
          title="Minimize overlay to floating pill (Esc)"
          aria-label="Minimize overlay to floating pill"
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
            aria-hidden="true"
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </button>
      </div>
    </div>

    <!-- SCREENSHOT EVIDENCE DRAWER (If Captured) -->
    <div v-if="screenshotState.dataUrl" class="screenshot-preview-bar">
      <div
        class="thumb-wrap"
        @click="isLightboxOpen = true"
        title="Click to view full screenshot"
      >
        <img
          :src="screenshotState.dataUrl"
          alt="Captured viewport preview"
          class="screenshot-thumb"
        />
        <span class="zoom-hint">🔍</span>
      </div>
      <div class="screenshot-meta">
        <span class="shot-title">Screenshot Captured</span>
        <span class="shot-time">{{ screenshotState.timestamp }}</span>
      </div>
      <div class="screenshot-actions">
        <button
          type="button"
          @click="isAnnotating = true"
          class="btn-shot-action btn-shot-annotate"
          title="Annotate screenshot (Draw boxes, arrows, markups)"
          aria-label="Annotate screenshot"
        >
          ✏️
        </button>
        <button
          type="button"
          @click="downloadScreenshot()"
          class="btn-shot-action"
          title="Download PNG screenshot"
          aria-label="Download PNG screenshot"
        >
          💾
        </button>
        <button
          type="button"
          @click="clearScreenshot"
          class="btn-shot-action btn-shot-delete"
          title="Discard screenshot"
          aria-label="Discard screenshot"
        >
          ✕
        </button>
      </div>
    </div>

    <!-- FILTER TABS BAR -->
    <div class="filter-bar" role="tablist" aria-label="Filter logs and journey">
      <button
        type="button"
        role="tab"
        :aria-selected="activeFilter === 'all'"
        :class="['filter-tab', { 'is-active': activeFilter === 'all' }]"
        @click="activeFilter = 'all'"
      >
        All <span class="tab-count">{{ logState.logs.length }}</span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeFilter === 'console'"
        :class="['filter-tab', { 'is-active': activeFilter === 'console' }]"
        @click="activeFilter = 'console'"
      >
        Console <span class="tab-count">{{ consoleCount }}</span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeFilter === 'network'"
        :class="['filter-tab', { 'is-active': activeFilter === 'network' }]"
        @click="activeFilter = 'network'"
      >
        Network <span class="tab-count">{{ networkCount }}</span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeFilter === 'journey'"
        :class="['filter-tab', { 'is-active': activeFilter === 'journey' }]"
        @click="activeFilter = 'journey'"
        title="View user action breadcrumbs trail"
      >
        🐾 Journey
        <span class="tab-count">{{ breadcrumbState.breadcrumbs.length }}</span>
      </button>
      <button
        type="button"
        role="tab"
        :aria-selected="activeFilter === 'ai'"
        :class="['filter-tab', { 'is-active': activeFilter === 'ai' }]"
        @click="activeFilter = 'ai'"
        title="AI Root Cause Analysis & Reproduction Steps"
      >
        🧠 AI <span v-if="aiDiagnosisState.result" class="tab-badge-ai">✓</span>
      </button>
    </div>

    <!-- MAIN BODY AREA: JOURNEY VIEW, AI VIEW, OR LOGS VIEW -->

    <!-- 1. JOURNEY (ACTION BREADCRUMBS) VIEW -->
    <div
      v-if="activeFilter === 'journey'"
      class="journey-list"
      role="region"
      aria-label="User action breadcrumbs trail"
      tabindex="0"
    >
      <div v-if="breadcrumbState.breadcrumbs.length === 0" class="empty-state">
        <span class="empty-icon" aria-hidden="true">🐾</span>
        <span class="empty-title">No user actions recorded yet</span>
        <span class="empty-subtitle"
          >Click, type, or navigate the page to record steps to reproduce</span
        >
      </div>

      <div
        v-else
        v-for="(crumb, idx) in breadcrumbState.breadcrumbs"
        :key="crumb.id || idx"
        class="journey-item"
      >
        <span class="journey-index">{{ idx + 1 }}</span>
        <span :class="['journey-badge', `badge-${crumb.category}`]">
          {{ crumb.category.toUpperCase() }}
        </span>
        <div class="journey-info">
          <span class="journey-target">{{ crumb.target }}</span>
          <span v-if="crumb.detail" class="journey-detail">{{
            crumb.detail
          }}</span>
        </div>
        <span class="journey-time">{{ crumb.timestamp }}</span>
      </div>
    </div>

    <!-- 2. AI DIAGNOSTICS VIEW (v0.5) -->
    <div
      v-else-if="activeFilter === 'ai'"
      class="ai-diagnosis-container"
      role="region"
      aria-label="AI Root Cause Diagnosis"
      tabindex="0"
    >
      <!-- Loading State -->
      <div v-if="aiDiagnosisState.isLoading" class="ai-loading-state">
        <div class="ai-pulse-spinner"></div>
        <span class="ai-loading-title">Synthesizing Telemetry...</span>
        <span class="ai-loading-desc"
          >Analyzing stack traces, network payloads, and breadcrumbs with Gemini
          Flash</span
        >
      </div>

      <!-- Error State -->
      <div v-else-if="aiDiagnosisState.error" class="ai-error-state">
        <span class="ai-state-icon">⚠️</span>
        <span class="ai-error-title">AI Analysis Failed</span>
        <p class="ai-error-msg">{{ aiDiagnosisState.error }}</p>
        <button type="button" class="btn-ai-retry" @click="handleRunAIAnalysis">
          Try Again
        </button>
      </div>

      <!-- Empty / CTA State -->
      <div v-else-if="!aiDiagnosisState.result" class="ai-empty-state">
        <span class="ai-state-icon">🧠</span>
        <span class="ai-empty-title">AI Root Cause &amp; Steps Synthesis</span>
        <p class="ai-empty-desc">
          Generate high-signal diagnostic findings, chronological steps to
          reproduce, and remediation advice in seconds.
        </p>

        <button
          type="button"
          class="btn-ai-primary"
          :disabled="
            logState.logs.length === 0 &&
            breadcrumbState.breadcrumbs.length === 0
          "
          @click="handleRunAIAnalysis"
        >
          ⚡ Run AI Diagnosis
        </button>

        <span v-if="!settingsState.geminiApiKey" class="ai-key-hint">
          💡 Configure your free Google Gemini API Key in Popup Settings to
          enable this feature.
        </span>
      </div>

      <!-- Results View -->
      <div v-else class="ai-results-wrapper">
        <!-- Results Header Bar -->
        <div class="ai-results-header">
          <div class="ai-header-meta">
            <span class="ai-result-tag">DIAGNOSIS COMPLETE</span>
            <span
              v-if="aiDiagnosisState.result.confidence"
              class="ai-confidence-pill"
            >
              {{ aiDiagnosisState.result.confidence.toUpperCase() }} CONFIDENCE
            </span>
          </div>
          <div class="ai-header-actions">
            <button
              type="button"
              class="btn-ai-copy"
              @click="copyAIInsights"
              title="Copy AI analysis to clipboard"
            >
              {{ isAICopied ? "✓ Copied" : "📋 Copy" }}
            </button>
            <button
              type="button"
              class="btn-ai-reanalyze"
              @click="handleRunAIAnalysis"
              title="Re-run AI analysis on latest telemetry"
            >
              🔄
            </button>
          </div>
        </div>

        <!-- Card 1: Root Cause -->
        <div class="ai-card ai-card-cause">
          <div class="ai-card-header">
            <span class="ai-card-bullet bullet-crimson"></span>
            <h4 class="ai-card-title">Root Cause</h4>
          </div>
          <p class="ai-card-content">{{ aiDiagnosisState.result.rootCause }}</p>
        </div>

        <!-- Card 2: Steps to Reproduce -->
        <div
          v-if="
            aiDiagnosisState.result.stepsToReproduce &&
            aiDiagnosisState.result.stepsToReproduce.length > 0
          "
          class="ai-card ai-card-steps"
        >
          <div class="ai-card-header">
            <span class="ai-card-bullet bullet-amber"></span>
            <h4 class="ai-card-title">Steps to Reproduce</h4>
          </div>
          <div class="ai-steps-list">
            <div
              v-for="(step, sIdx) in aiDiagnosisState.result.stepsToReproduce"
              :key="sIdx"
              class="ai-step-item"
            >
              <span class="ai-step-badge">{{ sIdx + 1 }}</span>
              <span class="ai-step-text">{{
                step.replace(/^Step\s*\d+:\s*/i, "")
              }}</span>
            </div>
          </div>
        </div>

        <!-- Card 3: Suggested Remediation -->
        <div
          v-if="aiDiagnosisState.result.suggestedFix"
          class="ai-card ai-card-fix"
        >
          <div class="ai-card-header">
            <span class="ai-card-bullet bullet-emerald"></span>
            <h4 class="ai-card-title">Suggested Remediation</h4>
          </div>
          <div class="ai-fix-box">
            <code>{{ aiDiagnosisState.result.suggestedFix }}</code>
          </div>
        </div>
      </div>
    </div>

    <!-- 3. TELEMETRY LOGS VIEW -->
    <div
      v-else
      class="log-list"
      role="region"
      aria-label="Captured telemetry log list"
      tabindex="0"
    >
      <div
        v-for="(log, idx) in filteredLogs"
        :key="log.id || idx"
        :class="['log-item', log.type, { 'is-expanded': isExpanded(log.id) }]"
        @click="toggleExpand(log.id)"
        role="button"
        tabindex="0"
        @keydown.enter="toggleExpand(log.id)"
        @keydown.space.prevent="toggleExpand(log.id)"
      >
        <!-- LOG HEADER ROW -->
        <div class="log-header">
          <div class="log-tag-group">
            <span v-if="log.type === 'console'" class="badge badge-console"
              >CONSOLE ERROR</span
            >
            <template v-else>
              <span
                :class="['method-chip', `method-${log.method?.toLowerCase()}`]"
              >
                {{ log.method || "GET" }}
              </span>
              <span
                :class="[
                  'badge',
                  'badge-network',
                  log.status >= 500
                    ? 'badge-5xx'
                    : log.status === 0
                      ? 'badge-neterr'
                      : 'badge-4xx',
                ]"
              >
                HTTP {{ log.status }}
              </span>
            </template>
          </div>

          <div class="log-meta-right">
            <span class="time">{{ log.timestamp || "—" }}</span>
            <button
              type="button"
              class="btn-copy-log"
              @click="copySingleLog(log, $event)"
              :title="
                copiedLogId === log.id ? 'Copied to clipboard' : 'Copy log'
              "
              :aria-label="copiedLogId === log.id ? 'Copied' : 'Copy log'"
            >
              {{ copiedLogId === log.id ? "✓" : "📋" }}
            </button>
            <span
              class="expand-icon"
              :class="{ 'is-open': isExpanded(log.id) }"
              aria-hidden="true"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </span>
          </div>
        </div>

        <!-- CONSOLE LOG CONTENT -->
        <div v-if="log.type === 'console'" class="log-body console-body">
          <span
            :class="['console-msg', { 'clamp-preview': !isExpanded(log.id) }]"
          >
            {{ log.message || "Unknown error payload" }}
          </span>
        </div>

        <!-- NETWORK LOG CONTENT -->
        <div v-else class="log-body network-body">
          <!-- Compact summary row -->
          <div class="endpoint-summary">
            <span v-if="parseUrl(log.url).hostname" class="endpoint-host">
              {{ parseUrl(log.url).hostname }}
            </span>
            <span class="endpoint-path">
              {{ parseUrl(log.url).pathname }}
            </span>
            <span
              v-if="parseUrl(log.url).hasParams"
              class="params-indicator"
              :title="`${parseUrl(log.url).searchEntries.length} URL query parameters`"
            >
              ?{{ parseUrl(log.url).searchEntries.length }} params
            </span>
          </div>

          <!-- Expanded details -->
          <div
            v-if="isExpanded(log.id)"
            class="network-expanded-details"
            @click.stop
          >
            <div class="detail-row">
              <span class="detail-label">Status Info:</span>
              <span class="detail-val">{{
                log.statusText ||
                (log.status === 0 ? "Network Error / Blocked" : "HTTP Error")
              }}</span>
            </div>

            <div class="detail-section">
              <span class="detail-label">Full URL:</span>
              <div class="full-url-box">
                <code>{{ log.url }}</code>
              </div>
            </div>

            <!-- Query parameters -->
            <div
              v-if="parseUrl(log.url).searchEntries.length > 0"
              class="detail-section"
            >
              <span class="detail-label"
                >Query Parameters ({{
                  parseUrl(log.url).searchEntries.length
                }}):</span
              >
              <div class="params-table">
                <div
                  v-for="([key, val], pIdx) in parseUrl(log.url).searchEntries"
                  :key="pIdx"
                  class="param-row"
                >
                  <span class="param-key">{{ key }}:</span>
                  <span class="param-val" :title="val">{{ val }}</span>
                </div>
              </div>
            </div>

            <!-- Request Payload (if present) -->
            <div v-if="log.requestBody" class="detail-section">
              <div class="detail-header-row">
                <span class="detail-label">Request Payload:</span>
                <button
                  type="button"
                  class="btn-copy-mini"
                  @click.stop="copySnippet(log.requestBody)"
                  title="Copy request payload"
                >
                  Copy
                </button>
              </div>
              <div class="payload-box">
                <code>{{ formatJsonOrRaw(log.requestBody) }}</code>
              </div>
            </div>

            <!-- Response Body (if present) -->
            <div v-if="log.responseBody" class="detail-section">
              <div class="detail-header-row">
                <span class="detail-label">Response Body:</span>
                <button
                  type="button"
                  class="btn-copy-mini"
                  @click.stop="copySnippet(log.responseBody)"
                  title="Copy response body"
                >
                  Copy
                </button>
              </div>
              <div class="payload-box response-box">
                <code>{{ formatJsonOrRaw(log.responseBody) }}</code>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div v-if="filteredLogs.length === 0" class="empty-state">
        <span class="empty-icon" aria-hidden="true">✓</span>
        <span class="empty-title">All systems quiet</span>
        <span class="empty-subtitle">
          {{
            activeFilter === "all"
              ? "Zero console errors or network failures recorded"
              : `No ${activeFilter} errors recorded`
          }}
        </span>
      </div>
    </div>

    <!-- BOTTOM DISPATCH ACTION BAR (v0.4 Zero-Friction Dispatch) -->
    <div class="panel-dispatch-bar">
      <div class="dispatch-actions-left">
        <!-- GitHub Dispatch Button -->
        <button
          type="button"
          class="btn-dispatch btn-dispatch-gh"
          @click="openGithubModal"
          :title="
            settingsState.githubRepo
              ? `Submit issue to ${settingsState.githubRepo}`
              : 'Configure GitHub in Popup Settings'
          "
        >
          <span class="dispatch-icon" aria-hidden="true">🐙</span>
          <span class="dispatch-text">GitHub</span>
          <span v-if="!settingsState.githubRepo" class="dispatch-badge-setup"
            >Setup</span
          >
        </button>

        <!-- Slack / Discord Webhook Dispatch Button -->
        <button
          type="button"
          class="btn-dispatch btn-dispatch-slack"
          @click="handleDispatchSlack"
          :disabled="isDispatchingSlack"
          :title="
            settingsState.slackWebhookUrl
              ? 'Broadcast telemetry to team webhook'
              : 'Configure Webhook in Popup Settings'
          "
        >
          <span class="dispatch-icon" aria-hidden="true">{{
            isDispatchingSlack ? "⏳" : "💬"
          }}</span>
          <span class="dispatch-text">{{
            isDispatchingSlack ? "Sending..." : "Slack"
          }}</span>
          <span
            v-if="!settingsState.slackWebhookUrl"
            class="dispatch-badge-setup"
            >Setup</span
          >
        </button>
      </div>

      <!-- Quick Export Markdown File -->
      <button
        type="button"
        class="btn-export-md"
        @click="handleExportMarkdown"
        :disabled="
          logState.logs.length === 0 &&
          !screenshotState.dataUrl &&
          breadcrumbState.breadcrumbs.length === 0
        "
        title="Download formatted markdown report file"
      >
        <span class="dispatch-icon" aria-hidden="true">💾</span>
        <span class="dispatch-text">Export MD</span>
      </button>
    </div>

    <!-- DISPATCH NOTIFICATION TOAST -->
    <div
      v-if="dispatchToast"
      :class="['dispatch-toast', `toast-${dispatchToast.type}`]"
      role="status"
    >
      <span class="toast-icon">{{
        dispatchToast.type === "success"
          ? "✓"
          : dispatchToast.type === "error"
            ? "✕"
            : "ℹ"
      }}</span>
      <span class="toast-message">{{ dispatchToast.message }}</span>
    </div>

    <!-- GITHUB ISSUE SUBMISSION MODAL -->
    <div
      v-if="isGithubModalOpen"
      class="gh-modal-backdrop"
      @click.self="isGithubModalOpen = false"
    >
      <div
        class="gh-modal-content"
        role="dialog"
        aria-modal="true"
        aria-labelledby="gh-modal-title"
      >
        <div class="gh-modal-header">
          <div class="gh-title-group">
            <span class="gh-title-icon" aria-hidden="true">🐙</span>
            <h3 id="gh-modal-title" class="gh-title-text">
              Create GitHub Issue
            </h3>
          </div>
          <button
            type="button"
            class="gh-modal-close"
            @click="isGithubModalOpen = false"
            aria-label="Close dialog"
          >
            ✕
          </button>
        </div>

        <div class="gh-modal-body">
          <!-- Target Repo & Labels Info -->
          <div class="gh-meta-row">
            <span class="gh-label">Target Repository:</span>
            <span class="gh-repo-chip">{{ settingsState.githubRepo }}</span>
          </div>

          <div class="gh-field">
            <label for="gh-issue-title" class="gh-field-label"
              >Issue Title:</label
            >
            <input
              id="gh-issue-title"
              v-model="githubIssueTitle"
              type="text"
              class="gh-input-title"
              placeholder="e.g. [Bug] 500 error on /checkout"
            />
          </div>

          <div class="gh-summary-box">
            <span class="gh-summary-title">Telemetry Included in Issue:</span>
            <ul class="gh-summary-list">
              <li>
                📋 {{ logState.logs.length }} diagnostics logs (Console +
                Network)
              </li>
              <li>
                🐾 {{ breadcrumbState.breadcrumbs.length }} user action
                breadcrumbs
              </li>
              <li v-if="screenshotState.dataUrl">
                📸 Viewport screenshot snapshot
              </li>
              <li>🔒 Sensitive credentials sanitized via masking engine</li>
            </ul>
          </div>

          <!-- Result feedback if already submitted -->
          <div
            v-if="githubSubmitResult"
            :class="[
              'gh-result-box',
              githubSubmitResult.success ? 'is-success' : 'is-error',
            ]"
          >
            <div v-if="githubSubmitResult.success" class="gh-result-success">
              <span class="gh-result-text"
                >🎉 Issue #{{ githubSubmitResult.issueNumber }} created
                successfully!</span
              >
              <a
                :href="githubSubmitResult.issueUrl"
                target="_blank"
                rel="noreferrer"
                class="gh-issue-link"
              >
                Open Issue in GitHub ↗
              </a>
            </div>
            <div v-else class="gh-result-error">
              <span>✕ Failed: {{ githubSubmitResult.error }}</span>
            </div>
          </div>
        </div>

        <div class="gh-modal-footer">
          <button
            type="button"
            class="btn-gh-cancel"
            @click="isGithubModalOpen = false"
          >
            {{ githubSubmitResult?.success ? "Close" : "Cancel" }}
          </button>

          <button
            v-if="!githubSubmitResult?.success"
            type="button"
            class="btn-gh-submit"
            :disabled="isSubmittingGithub || !githubIssueTitle.trim()"
            @click="handleSendGithubIssue"
          >
            <span v-if="isSubmittingGithub">Submitting...</span>
            <span v-else>Submit Issue</span>
          </button>
        </div>
      </div>
    </div>

    <!-- FULLSCREEN LIGHTBOX MODAL -->
    <div
      v-if="isLightboxOpen && screenshotState.dataUrl"
      class="lightbox-backdrop"
      @click="isLightboxOpen = false"
    >
      <div class="lightbox-content" @click.stop>
        <div class="lightbox-header">
          <span>Viewport Screenshot ({{ screenshotState.timestamp }})</span>
          <button
            type="button"
            @click="isLightboxOpen = false"
            class="lightbox-close"
          >
            ✕
          </button>
        </div>
        <img
          :src="screenshotState.dataUrl"
          alt="Full captured screenshot"
          class="lightbox-img"
        />
      </div>
    </div>

    <!-- ANNOTATION EDITOR MODAL -->
    <AnnotationModal
      v-if="isAnnotating && screenshotState.dataUrl"
      :image-src="screenshotState.dataUrl"
      @save="handleSaveAnnotation"
      @close="isAnnotating = false"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import AnnotationModal from "@/components/AnnotationModal.vue";
import { breadcrumbState, clearBreadcrumbs } from "@/utils/breadcrumbStore";
import { logState, clearLogs } from "@/utils/logStore";
import { settingsState } from "@/utils/settingsStore";
import {
  screenshotState,
  setScreenshot,
  clearScreenshot,
  downloadScreenshot,
} from "@/utils/screenshotStore";
import {
  generateMarkdownReport,
  copyToClipboard,
} from "@/utils/reportFormatter";
import {
  dispatchGitHubIssue,
  dispatchWebhook,
  generateDefaultIssueTitle,
} from "@/utils/dispatchService";
import {
  aiDiagnosisState,
  runAIDiagnosis,
  clearAIDiagnosis,
} from "@/utils/aiService";
import type { CapturedLog } from "@/utils/types";

const props = withDefaults(
  defineProps<{
    mode?: "overlay" | "popup";
  }>(),
  {
    mode: "overlay",
  },
);

const brandIconUrl = browser.runtime.getURL("/icon/32.png");
const isMinimized = ref(props.mode === "overlay");
const isCopied = ref(false);
const isCapturingFlash = ref(false);
const isLightboxOpen = ref(false);
const isAnnotating = ref(false);
const undoLogs = ref<CapturedLog[]>([]);
const activeFilter = ref<"all" | "console" | "network" | "journey" | "ai">(
  "all",
);
const expandedLogIds = ref<Set<string>>(new Set());
const copiedLogId = ref<string | null>(null);
const snapError = ref<string | null>(null);

// v0.5: AI Diagnostics State
const isAICopied = ref(false);
let aiCopyTimer: number | undefined;

const handleRunAIAnalysis = async () => {
  if (logState.logs.length === 0 && breadcrumbState.breadcrumbs.length === 0) {
    showDispatchToast("No telemetry logs or breadcrumbs captured yet", "info");
    return;
  }

  if (!settingsState.geminiApiKey && settingsState.aiProvider === "gemini") {
    showDispatchToast(
      "Configure Gemini API Key in Extension Popup Settings",
      "info",
    );
    return;
  }

  activeFilter.value = "ai";
  const res = await runAIDiagnosis({
    apiKey: settingsState.geminiApiKey,
    model: settingsState.geminiModel,
    provider: settingsState.aiProvider,
    logs: logState.logs,
    breadcrumbs: breadcrumbState.breadcrumbs,
  });

  if (res.success) {
    showDispatchToast("✓ AI Diagnosis synthesized successfully!", "success");
  } else {
    showDispatchToast(`✕ AI Diagnosis failed: ${res.error}`, "error");
  }
};

const copyAIInsights = async () => {
  if (!aiDiagnosisState.result) return;
  const res = aiDiagnosisState.result;
  let text = `🧠 CatchBug AI Diagnosis:\n\nRoot Cause: ${res.rootCause}\n\n`;
  if (res.stepsToReproduce?.length) {
    text += `Steps to Reproduce:\n${res.stepsToReproduce.map((s, i) => `${i + 1}. ${s}`).join("\n")}\n\n`;
  }
  if (res.suggestedFix) {
    text += `Suggested Remediation:\n${res.suggestedFix}\n`;
  }
  await copyToClipboard(text);
  isAICopied.value = true;
  if (aiCopyTimer) clearTimeout(aiCopyTimer);
  aiCopyTimer = window.setTimeout(() => {
    isAICopied.value = false;
  }, 2000);
  showDispatchToast("✓ Copied AI Insights to clipboard", "success");
};

// v0.4: Dispatch State
const isGithubModalOpen = ref(false);
const githubIssueTitle = ref("");
const isSubmittingGithub = ref(false);
const githubSubmitResult = ref<{
  success: boolean;
  issueUrl?: string;
  issueNumber?: number;
  error?: string;
} | null>(null);

const isDispatchingSlack = ref(false);
const dispatchToast = ref<{
  message: string;
  type: "success" | "error" | "info";
} | null>(null);
let dispatchToastTimer: number | undefined;

const showDispatchToast = (
  message: string,
  type: "success" | "error" | "info" = "info",
) => {
  dispatchToast.value = { message, type };
  if (dispatchToastTimer) clearTimeout(dispatchToastTimer);
  dispatchToastTimer = window.setTimeout(() => {
    dispatchToast.value = null;
  }, 3500);
};

const openGithubModal = () => {
  if (!settingsState.githubToken || !settingsState.githubRepo) {
    showDispatchToast(
      "Configure GitHub Token & Repo in Extension Popup Settings",
      "info",
    );
    return;
  }
  const firstError =
    logState.logs[0]?.type === "console"
      ? logState.logs[0].message
      : logState.logs[0]?.url
        ? `${logState.logs[0].method} ${logState.logs[0].url}`
        : undefined;
  githubIssueTitle.value = generateDefaultIssueTitle(
    typeof window !== "undefined" ? window.location.href : "",
    firstError,
  );
  githubSubmitResult.value = null;
  isGithubModalOpen.value = true;
};

const handleSendGithubIssue = async () => {
  if (!githubIssueTitle.value.trim() || isSubmittingGithub.value) return;
  isSubmittingGithub.value = true;
  githubSubmitResult.value = null;

  const markdown = generateMarkdownReport(
    logState.logs,
    Boolean(screenshotState.dataUrl),
  );
  const res = await dispatchGitHubIssue({
    token: settingsState.githubToken,
    repo: settingsState.githubRepo,
    title: githubIssueTitle.value.trim(),
    body: markdown,
    labels: settingsState.githubLabels,
  });

  isSubmittingGithub.value = false;
  githubSubmitResult.value = res;

  if (res.success) {
    showDispatchToast(
      `✓ Issue #${res.issueNumber} created on GitHub!`,
      "success",
    );
  } else {
    showDispatchToast(`✕ GitHub submission failed: ${res.error}`, "error");
  }
};

const handleDispatchSlack = async () => {
  if (!settingsState.slackWebhookUrl) {
    showDispatchToast(
      "Configure Webhook URL in Extension Popup Settings",
      "info",
    );
    return;
  }
  if (isDispatchingSlack.value) return;
  isDispatchingSlack.value = true;

  const firstLog = logState.logs[0];
  const snippet = firstLog
    ? firstLog.type === "console"
      ? firstLog.message
      : `${firstLog.method} ${firstLog.url} (HTTP ${firstLog.status})`
    : "";
  const viewport =
    typeof window !== "undefined"
      ? `${window.innerWidth}x${window.innerHeight}`
      : "Unknown";

  const res = await dispatchWebhook({
    webhookUrl: settingsState.slackWebhookUrl,
    pageUrl: typeof window !== "undefined" ? window.location.href : "Unknown",
    viewport,
    errorsCount: logState.logs.length,
    breadcrumbsCount: breadcrumbState.breadcrumbs.length,
    latestErrorSnippet: snippet,
    reportMarkdown: generateMarkdownReport(
      logState.logs,
      Boolean(screenshotState.dataUrl),
    ),
  });

  isDispatchingSlack.value = false;
  if (res.success) {
    showDispatchToast("✓ Dispatched to Slack / Discord Webhook!", "success");
  } else {
    showDispatchToast(
      `✕ Webhook failed: ${res.error || "Unknown error"}`,
      "error",
    );
  }
};

const handleExportMarkdown = () => {
  const md = generateMarkdownReport(
    logState.logs,
    Boolean(screenshotState.dataUrl),
  );
  const blob = new Blob([md], { type: "text/markdown;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const dateStr = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `catchbug-report-${dateStr}.md`;
  a.click();
  URL.revokeObjectURL(url);
  showDispatchToast("✓ Exported catchbug-report.md", "success");
};

let copyTimer: number | undefined;
let undoTimer: number | undefined;
let copySingleTimer: number | undefined;
let snapErrorTimer: number | undefined;

const consoleCount = computed(
  () => logState.logs.filter((l) => l.type === "console").length,
);
const networkCount = computed(
  () => logState.logs.filter((l) => l.type === "network").length,
);

const filteredLogs = computed(() => {
  if (activeFilter.value === "all") return logState.logs;
  return logState.logs.filter((l) => l.type === activeFilter.value);
});

const isExpanded = (id?: string) => {
  if (!id) return false;
  return expandedLogIds.value.has(id);
};

const toggleExpand = (id?: string) => {
  if (!id) return;
  if (expandedLogIds.value.has(id)) {
    expandedLogIds.value.delete(id);
  } else {
    expandedLogIds.value.add(id);
  }
};

const formatJsonOrRaw = (text?: string) => {
  if (!text) return "";
  try {
    return JSON.stringify(JSON.parse(text), null, 2);
  } catch {
    return text;
  }
};

const copySnippet = async (text?: string) => {
  if (!text) return;
  await copyToClipboard(text);
};

const parseUrl = (rawUrl: string) => {
  try {
    const urlObj = new URL(rawUrl);
    const searchEntries: [string, string][] = [];
    urlObj.searchParams.forEach((val, key) => {
      searchEntries.push([key, val]);
    });
    return {
      hostname: urlObj.hostname,
      pathname: urlObj.pathname || "/",
      searchEntries,
      hasParams: searchEntries.length > 0,
    };
  } catch {
    return {
      hostname: "",
      pathname: rawUrl,
      searchEntries: [],
      hasParams: false,
    };
  }
};

const copySingleLog = async (log: CapturedLog, event?: Event) => {
  event?.stopPropagation();
  let text = "";
  if (log.type === "console") {
    text = `[CONSOLE ERROR - ${log.timestamp}]\n${log.message}`;
  } else {
    text = `[NETWORK ${log.status} - ${log.timestamp}]\n${log.method} ${log.url}`;
    if (log.requestBody) text += `\nRequest:\n${log.requestBody}`;
    if (log.responseBody) text += `\nResponse:\n${log.responseBody}`;
  }
  const ok = await copyToClipboard(text);
  if (ok && log.id) {
    copiedLogId.value = log.id;
    if (copySingleTimer) clearTimeout(copySingleTimer);
    copySingleTimer = window.setTimeout(() => {
      copiedLogId.value = null;
    }, 1500);
  }
};

const copyTooltip = computed(() => {
  if (isCopied.value) return "Report copied to clipboard!";
  if (
    logState.logs.length === 0 &&
    !screenshotState.dataUrl &&
    breadcrumbState.breadcrumbs.length === 0
  ) {
    return "No telemetry or journey to copy";
  }
  return "Copy formatted Markdown report";
});

const handleCaptureScreenshot = async () => {
  // Sembunyikan panel sejenak agar overlay CatchBug tidak menutupi tampilan bug
  if (props.mode === "overlay") {
    isCapturingFlash.value = true;
  }
  snapError.value = null;

  // Beri waktu 100ms untuk DOM dan browser engine merender tampilan bersih tanpa overlay
  await new Promise((r) => setTimeout(r, 100));

  try {
    const response = await browser.runtime.sendMessage({
      type: "CAPTURE_SCREENSHOT",
    });
    if (response?.success && response.dataUrl) {
      setScreenshot(response.dataUrl);
    } else {
      const errMsg = response?.error || "Capture failed";
      console.error("CatchBug: Screenshot failed:", errMsg);
      snapError.value = errMsg;
      if (snapErrorTimer) clearTimeout(snapErrorTimer);
      snapErrorTimer = window.setTimeout(() => {
        snapError.value = null;
      }, 3500);
    }
  } catch (err) {
    console.error("CatchBug: Failed to send capture message:", err);
    snapError.value = String(err);
    if (snapErrorTimer) clearTimeout(snapErrorTimer);
    snapErrorTimer = window.setTimeout(() => {
      snapError.value = null;
    }, 3500);
  } finally {
    isCapturingFlash.value = false;
  }
};

const handleCopyReport = async () => {
  if (
    logState.logs.length === 0 &&
    !isCopied.value &&
    !screenshotState.dataUrl &&
    breadcrumbState.breadcrumbs.length === 0
  ) {
    return;
  }
  const hasScreenshot = Boolean(screenshotState.dataUrl);
  const reportMarkdown = generateMarkdownReport(logState.logs, hasScreenshot);
  const success = await copyToClipboard(reportMarkdown);

  if (success) {
    isCopied.value = true;
    if (copyTimer) clearTimeout(copyTimer);
    copyTimer = window.setTimeout(() => {
      isCopied.value = false;
    }, 2000);
  }
};

const handleClearWithUndo = () => {
  if (
    logState.logs.length === 0 &&
    !screenshotState.dataUrl &&
    breadcrumbState.breadcrumbs.length === 0 &&
    !aiDiagnosisState.result
  ) {
    return;
  }
  undoLogs.value = [...logState.logs];
  clearLogs();
  clearScreenshot();
  clearBreadcrumbs();
  clearAIDiagnosis();

  if (undoTimer) clearTimeout(undoTimer);
  undoTimer = window.setTimeout(() => {
    undoLogs.value = [];
  }, 4000);
};

const handleUndoClear = () => {
  if (undoLogs.value.length > 0) {
    logState.logs = [...undoLogs.value];
    undoLogs.value = [];
    if (undoTimer) clearTimeout(undoTimer);
  }
};

const handleSaveAnnotation = (annotatedDataUrl: string) => {
  setScreenshot(annotatedDataUrl);
};

const handleKeydown = (e: KeyboardEvent) => {
  if (props.mode === "overlay" && e.key === "Escape") {
    if (isAnnotating.value) {
      isAnnotating.value = false;
    } else if (isLightboxOpen.value) {
      isLightboxOpen.value = false;
    } else if (!isMinimized.value) {
      isMinimized.value = true;
    }
  }
};

onMounted(() => {
  if (typeof window !== "undefined") {
    window.addEventListener("keydown", handleKeydown);
  }
});

onUnmounted(() => {
  if (typeof window !== "undefined") {
    window.removeEventListener("keydown", handleKeydown);
  }
  if (copyTimer) clearTimeout(copyTimer);
  if (undoTimer) clearTimeout(undoTimer);
  if (copySingleTimer) clearTimeout(copySingleTimer);
  if (snapErrorTimer) clearTimeout(snapErrorTimer);
  if (dispatchToastTimer) clearTimeout(dispatchToastTimer);
  if (aiCopyTimer) clearTimeout(aiCopyTimer);
});
</script>

<style scoped>
/* ==========================================================================
   COCKPIT DARK DESIGN SYSTEM FOR IN-PAGE OVERLAY PANEL
   ========================================================================== */

/* FLOATING TRIGGER (Minimized State) */
.floating-trigger {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2147483640;
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 6px 12px;
  background: #090d16;
  color: #f9fafb;
  border: 1px solid #1f2937;
  border-radius: 9999px;
  cursor: pointer;
  box-shadow:
    0 16px 36px -4px rgba(0, 0, 0, 0.75),
    0 0 0 1px rgba(255, 255, 255, 0.08);
  user-select: none;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  font-size: 13px;
  font-weight: 600;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    box-shadow 0.15s ease;
}

.floating-trigger:hover {
  transform: translateY(-2px);
  border-color: #374151;
  background: #111827;
}

.floating-trigger:focus-visible {
  outline: 2px solid #f43f5e;
  outline-offset: 2px;
}

.trigger-icon {
  font-size: 14px;
}

.brand-img {
  width: 14px;
  height: 14px;
}

.trigger-badge {
  font-family: "JetBrains Mono", Menlo, monospace;
  font-size: 12px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 9999px;
  background: #1f293d;
  color: #9ca3af;
  border: 1px solid #374151;
}

.trigger-badge.has-errors {
  background: #f43f5e;
  color: #ffffff;
  border-color: #e11d48;
  box-shadow: 0 0 10px rgba(244, 63, 94, 0.5);
}

/* MAIN CARD CONTAINER */
.overlay-card {
  box-sizing: border-box;
  background: #090d16;
  color: #f9fafb;
  border-radius: 10px;
  font-family:
    Inter,
    -apple-system,
    BlinkMacSystemFont,
    "Segoe UI",
    sans-serif;
  border: 1px solid #1f2937;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  user-select: text;
  transition: opacity 0.08s ease;
}

.overlay-card.is-hidden-for-capture {
  visibility: hidden !important;
  opacity: 0 !important;
  transition: none !important;
  pointer-events: none !important;
}

.mode-overlay {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 2147483645;
  width: 380px;
  max-height: 480px;
  box-shadow:
    0 16px 36px -4px rgba(0, 0, 0, 0.75),
    0 0 0 1px rgba(255, 255, 255, 0.08);
}

.mode-popup {
  position: relative;
  width: 100%;
  max-width: 100%;
  border: none;
  border-radius: 0;
  box-shadow: none;
}

/* HEADER */
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #111827;
  border-bottom: 1px solid #1f2937;
  gap: 8px;
  flex-shrink: 0;
}

.title-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.brand-icon {
  font-size: 14px;
}

.brand-name {
  font-size: 13px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: #f9fafb;
}

.count-badge {
  font-family: "JetBrains Mono", Menlo, monospace;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 6px;
  border-radius: 4px;
  background: #1f293d;
  color: #9ca3af;
  border: 1px solid #374151;
}

.count-badge.has-errors {
  background: #3f1219;
  color: #fca5a5;
  border-color: #f43f5e;
}

.actions-group {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

/* Action Buttons */
.btn-action {
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  height: 26px;
  padding: 0 8px;
  border-radius: 4px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  white-space: nowrap;
  transition: all 0.15s ease;
  border: 1px solid transparent;
  user-select: none;
}

.btn-action:focus-visible {
  outline: 2px solid #f43f5e;
  outline-offset: 1px;
}

.btn-action.is-disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.btn-screenshot {
  background: #1f293d;
  color: #f9fafb;
  border-color: #374151;
}

.btn-screenshot:hover {
  background: #28354f;
  border-color: #4b5563;
}

.btn-screenshot.is-capturing {
  background: #141d30;
  border-color: #3b82f6;
  color: #93c5fd;
}

.btn-screenshot.is-error {
  background: #3f1219;
  border-color: #f43f5e;
  color: #fca5a5;
}

.btn-copy {
  background: #f43f5e;
  color: #ffffff;
  border-color: #e11d48;
}

.btn-copy:hover {
  background: #e11d48;
}

.btn-copy.is-copied {
  background: #062e21;
  color: #6ee7b7;
  border-color: #10b981;
}

.btn-clear {
  background: #1f293d;
  color: #9ca3af;
  border: 1px solid #374151;
}

.btn-clear:hover {
  background: #28354f;
  color: #f9fafb;
}

.btn-undo {
  background: #3b2606;
  color: #fcd34d;
  border: 1px solid #f59e0b;
}

.btn-undo:hover {
  background: #5c3b09;
}

.header-divider {
  width: 1px;
  height: 16px;
  background: #374151;
  margin: 0 2px;
}

.btn-control {
  background: #1f293d;
  color: #9ca3af;
  border: 1px solid #374151;
  border-radius: 4px;
  width: 26px;
  height: 26px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.15s ease;
  flex-shrink: 0;
}

.btn-control:hover {
  background: #28354f;
  color: #ffffff;
  border-color: #4b5563;
}

.btn-control:focus-visible {
  outline: 2px solid #f43f5e;
  outline-offset: 1px;
}

/* SCREENSHOT PREVIEW BAR */
.screenshot-preview-bar {
  display: flex;
  align-items: center;
  padding: 6px 12px;
  background: #111827;
  border-bottom: 1px solid #1f2937;
  gap: 10px;
  flex-shrink: 0;
}

.thumb-wrap {
  position: relative;
  width: 52px;
  height: 32px;
  border-radius: 4px;
  overflow: hidden;
  border: 1px solid #374151;
  cursor: pointer;
  flex-shrink: 0;
}

.screenshot-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.zoom-hint {
  position: absolute;
  right: 2px;
  bottom: 2px;
  font-size: 10px;
  background: rgba(0, 0, 0, 0.6);
  border-radius: 2px;
  padding: 1px;
}

.screenshot-meta {
  display: flex;
  flex-direction: column;
  flex: 1;
}

.shot-title {
  font-size: 12px;
  font-weight: 600;
  color: #f3f4f6;
}

.shot-time {
  font-family: "JetBrains Mono", Menlo, monospace;
  font-size: 10px;
  color: #6b7280;
}

.screenshot-actions {
  display: flex;
  gap: 4px;
}

.btn-shot-action {
  background: #1f293d;
  border: 1px solid #374151;
  color: #f9fafb;
  border-radius: 4px;
  padding: 3px 6px;
  font-size: 11px;
  cursor: pointer;
  transition: background 0.15s;
}

.btn-shot-action:hover {
  background: #28354f;
}

.btn-shot-delete {
  color: #fca5a5;
  border-color: #631a26;
  background: #3f1219;
}

.btn-shot-delete:hover {
  background: #882334;
}

/* FILTER TABS BAR */
.filter-bar {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background: #0d1322;
  border-bottom: 1px solid #1f2937;
  flex-shrink: 0;
  overflow-x: auto;
}

.filter-tab {
  background: transparent;
  border: 1px solid transparent;
  border-radius: 4px;
  color: #9ca3af;
  font-family: inherit;
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  white-space: nowrap;
  transition: all 0.15s ease;
}

.filter-tab:hover {
  background: #1f293d;
  color: #f3f4f6;
}

.filter-tab.is-active {
  background: #1f293d;
  color: #ffffff;
  border-color: #374151;
}

.tab-count {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  background: #111827;
  padding: 0 4px;
  border-radius: 3px;
  color: #9ca3af;
}

.filter-tab.is-active .tab-count {
  color: #f43f5e;
  background: #090d16;
}

/* LOG LIST & SCROLLBAR */
.log-list {
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  background: #090d16;
  outline: none;
  scrollbar-width: thin;
  scrollbar-color: #1f293d #090d16;
}

.log-list::-webkit-scrollbar,
.journey-list::-webkit-scrollbar {
  width: 6px;
}

.log-list::-webkit-scrollbar-track,
.journey-list::-webkit-scrollbar-track {
  background: #090d16;
}

.log-list::-webkit-scrollbar-thumb,
.journey-list::-webkit-scrollbar-thumb {
  background: #1f293d;
  border-radius: 9999px;
  border: 1px solid #374151;
}

.log-list::-webkit-scrollbar-thumb:hover,
.journey-list::-webkit-scrollbar-thumb:hover {
  background: #374151;
}

/* JOURNEY TIMELINE VIEW */
.journey-list {
  overflow-y: auto;
  padding: 8px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  max-height: 320px;
  background: #090d16;
  outline: none;
  scrollbar-width: thin;
  scrollbar-color: #1f293d #090d16;
}

.journey-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  border-radius: 6px;
  background: #111827;
  border: 1px solid #1f2937;
  font-family: "JetBrains Mono", Menlo, monospace;
  font-size: 11px;
}

.journey-index {
  color: #6b7280;
  font-weight: 700;
  min-width: 14px;
}

.journey-badge {
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.badge-click {
  background: #062e21;
  color: #6ee7b7;
  border: 1px solid #10b981;
}

.badge-input {
  background: #3b2606;
  color: #fcd34d;
  border: 1px solid #f59e0b;
}

.badge-navigation {
  background: #0d2238;
  color: #60a5fa;
  border: 1px solid #1d4ed8;
}

.journey-info {
  display: flex;
  flex-direction: column;
  flex: 1;
  overflow: hidden;
  gap: 1px;
}

.journey-target {
  color: #f3f4f6;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.journey-detail {
  color: #9ca3af;
  font-size: 10px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.journey-time {
  color: #6b7280;
  font-size: 10px;
  flex-shrink: 0;
}

/* LOG ITEM CARD */
.log-item {
  padding: 8px 10px;
  border-radius: 6px;
  background: #111827;
  border: 1px solid #1f2937;
  display: flex;
  flex-direction: column;
  gap: 6px;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease;
  user-select: text;
}

.log-item:hover {
  border-color: #374151;
  background: #141d30;
}

.log-item.is-expanded {
  border-color: #4b5563;
  background: #131b2c;
}

.log-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
}

.log-tag-group {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.method-chip {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  letter-spacing: 0.02em;
}

.method-get {
  background: #0d2238;
  color: #60a5fa;
  border: 1px solid #1d4ed8;
}

.method-post {
  background: #3b2606;
  color: #fcd34d;
  border: 1px solid #f59e0b;
}

.method-put,
.method-patch {
  background: #2a1b3d;
  color: #c084fc;
  border: 1px solid #7e22ce;
}

.method-delete {
  background: #3f1219;
  color: #fca5a5;
  border: 1px solid #f43f5e;
}

.badge {
  font-family: "JetBrains Mono", Menlo, monospace;
  font-size: 11px;
  font-weight: 600;
  padding: 1px 5px;
  border-radius: 3px;
  letter-spacing: 0.02em;
}

.badge-console {
  background: #3f1219;
  color: #fca5a5;
  border: 1px solid #f43f5e;
}

.badge-network.badge-5xx {
  background: #3f1219;
  color: #fca5a5;
  border: 1px solid #f43f5e;
}

.badge-network.badge-4xx {
  background: #3b2606;
  color: #fcd34d;
  border: 1px solid #f59e0b;
}

.badge-network.badge-neterr {
  background: #2e1022;
  color: #f472b6;
  border: 1px solid #db2777;
}

.log-meta-right {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.time {
  font-family: "JetBrains Mono", Menlo, monospace;
  color: #6b7280;
  font-size: 11px;
}

.btn-copy-log {
  background: transparent;
  border: none;
  cursor: pointer;
  color: #9ca3af;
  font-size: 11px;
  padding: 2px 4px;
  border-radius: 3px;
  transition: all 0.15s ease;
}

.btn-copy-log:hover {
  background: #1f293d;
  color: #ffffff;
}

.expand-icon {
  color: #6b7280;
  display: inline-flex;
  align-items: center;
  transition: transform 0.2s ease;
}

.expand-icon.is-open {
  transform: rotate(180deg);
  color: #f9fafb;
}

/* LOG BODY & CLEAN TELEMETRY */
.log-body {
  font-family: "JetBrains Mono", Menlo, monospace;
  font-size: 11px;
  line-height: 1.4;
}

.console-msg {
  color: #fca5a5;
  white-space: pre-wrap;
  word-break: break-all;
  display: block;
}

.console-msg.clamp-preview {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* ENDPOINT SUMMARY */
.endpoint-summary {
  display: flex;
  align-items: center;
  gap: 5px;
  flex-wrap: wrap;
  word-break: break-all;
}

.endpoint-host {
  color: #9ca3af;
  font-weight: 500;
}

.endpoint-path {
  color: #f9fafb;
  font-weight: 600;
}

.params-indicator {
  font-size: 10px;
  padding: 1px 5px;
  background: #1f293d;
  color: #f59e0b;
  border: 1px solid #374151;
  border-radius: 3px;
  font-weight: 500;
}

/* EXPANDED DETAILS ACCORDION */
.network-expanded-details {
  margin-top: 8px;
  padding-top: 8px;
  border-top: 1px dashed #28354f;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: text;
}

.detail-row {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}

.detail-header-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.detail-label {
  color: #6b7280;
  font-size: 10px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 700;
}

.detail-val {
  color: #d1d5db;
}

.detail-section {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.btn-copy-mini {
  background: #1f293d;
  border: 1px solid #374151;
  color: #9ca3af;
  font-size: 9px;
  padding: 1px 5px;
  border-radius: 3px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-copy-mini:hover {
  background: #28354f;
  color: #f9fafb;
  border-color: #4b5563;
}

.full-url-box,
.payload-box {
  background: #090d16;
  border: 1px solid #1f2937;
  border-radius: 4px;
  padding: 6px 8px;
  overflow-x: auto;
  word-break: break-all;
  max-height: 100px;
  scrollbar-width: thin;
  scrollbar-color: #1f293d #090d16;
}

.full-url-box code,
.payload-box code {
  color: #e5e7eb;
  font-size: 10px;
  white-space: pre-wrap;
}

.response-box {
  border-color: #3b2606;
  background: #0c0f17;
}

.response-box code {
  color: #fcd34d;
}

.params-table {
  background: #090d16;
  border: 1px solid #1f2937;
  border-radius: 4px;
  padding: 4px 8px;
  max-height: 120px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 3px;
  scrollbar-width: thin;
  scrollbar-color: #1f293d #090d16;
}

.param-row {
  display: flex;
  gap: 6px;
  font-size: 10px;
  line-height: 1.3;
}

.param-key {
  color: #f59e0b;
  font-weight: 600;
  flex-shrink: 0;
}

.param-val {
  color: #d1d5db;
  word-break: break-all;
}

/* EMPTY STATE */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 28px 16px;
  color: #6b7280;
  gap: 4px;
  text-align: center;
}

.empty-icon {
  font-size: 16px;
  color: #10b981;
  margin-bottom: 2px;
}

.empty-title {
  font-size: 12px;
  font-weight: 600;
  color: #9ca3af;
}

.empty-subtitle {
  font-size: 11px;
}

/* FULLSCREEN LIGHTBOX */
.lightbox-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.85);
  backdrop-filter: blur(4px);
  z-index: 2147483647;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.lightbox-content {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 8px;
  overflow: hidden;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.9);
}

.lightbox-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 14px;
  background: #090d16;
  border-bottom: 1px solid #1f2937;
  font-size: 12px;
  font-weight: 600;
  color: #f3f4f6;
}

.lightbox-close {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.lightbox-close:hover {
  background: #1f293d;
  color: #ffffff;
}

.lightbox-img {
  max-width: 100%;
  max-height: calc(90vh - 40px);
  object-fit: contain;
}

/* ==========================================================================
   v0.4: ZERO-FRICTION DISPATCH ACTIONS & GITHUB MODAL
   ========================================================================== */

/* BOTTOM DISPATCH ACTION BAR */
.panel-dispatch-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #111827;
  border-top: 1px solid #1f2937;
  gap: 8px;
}

.dispatch-actions-left {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-dispatch {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  background: #1f293d;
  color: #f9fafb;
  border: 1px solid #374151;
  border-radius: 5px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-dispatch:hover:not(:disabled) {
  background: #28354f;
  border-color: #4b5563;
}

.btn-dispatch:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-dispatch-gh:hover:not(:disabled) {
  border-color: #9ca3af;
}

.btn-dispatch-slack:hover:not(:disabled) {
  border-color: #60a5fa;
}

.dispatch-badge-setup {
  font-family: "JetBrains Mono", monospace;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  background: #3b2606;
  color: #fcd34d;
  border: 1px solid #f59e0b;
  letter-spacing: 0.02em;
}

.btn-export-md {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 4px 8px;
  background: transparent;
  color: #9ca3af;
  border: 1px solid #374151;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-export-md:hover:not(:disabled) {
  background: #1f293d;
  color: #f3f4f6;
  border-color: #4b5563;
}

.btn-export-md:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* DISPATCH NOTIFICATION TOAST */
.dispatch-toast {
  position: absolute;
  bottom: 48px;
  left: 12px;
  right: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  box-shadow:
    0 10px 25px -3px rgba(0, 0, 0, 0.8),
    0 4px 6px -2px rgba(0, 0, 0, 0.4);
  z-index: 2147483647;
  animation: toastFadeIn 0.2s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes toastFadeIn {
  from {
    opacity: 0;
    transform: translateY(6px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.toast-icon {
  font-weight: 700;
  font-size: 12px;
}

.toast-message {
  flex: 1;
  line-height: 1.4;
  word-break: break-word;
}

.toast-success {
  background: #062e21;
  color: #6ee7b7;
  border: 1px solid #10b981;
}

.toast-error {
  background: #3f1219;
  color: #fca5a5;
  border: 1px solid #f43f5e;
}

.toast-info {
  background: #111827;
  color: #93c5fd;
  border: 1px solid #3b82f6;
}

/* GITHUB MODAL */
.gh-modal-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
  z-index: 2147483647;
}

.gh-modal-content {
  background: #111827;
  border: 1px solid #374151;
  border-radius: 10px;
  width: 100%;
  max-width: 350px;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.85);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  animation: modalScaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1);
}

@keyframes modalScaleIn {
  from {
    opacity: 0;
    transform: scale(0.95);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.gh-modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  background: #090d16;
  border-bottom: 1px solid #1f2937;
}

.gh-title-group {
  display: flex;
  align-items: center;
  gap: 6px;
}

.gh-title-icon {
  font-size: 14px;
}

.gh-title-text {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  color: #f9fafb;
}

.gh-modal-close {
  background: transparent;
  border: none;
  color: #9ca3af;
  font-size: 14px;
  cursor: pointer;
  padding: 2px 6px;
  border-radius: 4px;
}

.gh-modal-close:hover {
  background: #1f293d;
  color: #ffffff;
}

.gh-modal-body {
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.gh-meta-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.gh-label {
  font-size: 11px;
  color: #9ca3af;
}

.gh-repo-chip {
  font-family: "JetBrains Mono", monospace;
  font-size: 11px;
  font-weight: 600;
  color: #6ee7b7;
  background: #062e21;
  border: 1px solid #10b981;
  padding: 2px 6px;
  border-radius: 4px;
}

.gh-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gh-field-label {
  font-size: 11px;
  font-weight: 500;
  color: #d1d5db;
}

.gh-input-title {
  background: #090d16;
  border: 1px solid #374151;
  border-radius: 5px;
  padding: 7px 10px;
  font-size: 12px;
  color: #f9fafb;
  box-sizing: border-box;
}

.gh-input-title:focus {
  outline: none;
  border-color: #f43f5e;
}

.gh-summary-box {
  background: #090d16;
  border: 1px solid #1f2937;
  border-radius: 6px;
  padding: 8px 10px;
}

.gh-summary-title {
  font-size: 10px;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.gh-summary-list {
  margin: 6px 0 0 0;
  padding-left: 14px;
  font-size: 10px;
  color: #d1d5db;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.gh-result-box {
  padding: 8px 10px;
  border-radius: 6px;
  font-size: 11px;
}

.gh-result-box.is-success {
  background: #062e21;
  color: #6ee7b7;
  border: 1px solid #10b981;
}

.gh-result-box.is-error {
  background: #3f1219;
  color: #fca5a5;
  border: 1px solid #f43f5e;
}

.gh-result-success {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.gh-result-text {
  font-weight: 600;
}

.gh-issue-link {
  color: #60a5fa;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.gh-modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 10px 14px;
  background: #090d16;
  border-top: 1px solid #1f2937;
}

.btn-gh-cancel {
  background: transparent;
  border: 1px solid #374151;
  color: #9ca3af;
  border-radius: 5px;
  padding: 5px 12px;
  font-size: 11px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-gh-cancel:hover {
  background: #1f293d;
  color: #f3f4f6;
}

.btn-gh-submit {
  background: #f43f5e;
  border: 1px solid #e11d48;
  color: #ffffff;
  border-radius: 5px;
  padding: 5px 14px;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-gh-submit:hover:not(:disabled) {
  background: #fb7185;
}

.btn-gh-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* ==========================================================================
   v0.5: AI DIAGNOSTICS & ROOT CAUSE STYLING
   ========================================================================== */

.tab-badge-ai {
  font-family: "JetBrains Mono", monospace;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 4px;
  border-radius: 3px;
  background: #062e21;
  color: #6ee7b7;
  border: 1px solid #10b981;
}

.ai-diagnosis-container {
  flex: 1;
  min-height: 220px;
  max-height: 320px;
  overflow-y: auto;
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
}

/* LOADING STATE */
.ai-loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 30px 16px;
  gap: 10px;
}

.ai-pulse-spinner {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 2px solid #1f293d;
  border-top-color: #f43f5e;
  animation: aiSpin 0.8s linear infinite;
}

@keyframes aiSpin {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.ai-loading-title {
  font-size: 12px;
  font-weight: 600;
  color: #f9fafb;
}

.ai-loading-desc {
  font-size: 10px;
  color: #9ca3af;
  max-width: 260px;
  line-height: 1.4;
}

/* ERROR STATE */
.ai-error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 20px 14px;
  gap: 8px;
}

.ai-error-title {
  font-size: 12px;
  font-weight: 600;
  color: #fca5a5;
}

.ai-error-msg {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: #f87171;
  max-width: 300px;
  word-break: break-word;
  line-height: 1.35;
  margin: 0;
}

.btn-ai-retry {
  background: #1f293d;
  border: 1px solid #374151;
  color: #f9fafb;
  padding: 5px 14px;
  border-radius: 4px;
  font-size: 11px;
  cursor: pointer;
  margin-top: 4px;
  transition: all 0.15s ease;
}

.btn-ai-retry:hover {
  background: #28354f;
  border-color: #4b5563;
}

/* EMPTY / CTA STATE */
.ai-empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 24px 16px;
  gap: 8px;
}

.ai-state-icon {
  font-size: 26px;
}

.ai-empty-title {
  font-size: 13px;
  font-weight: 600;
  color: #f9fafb;
}

.ai-empty-desc {
  font-size: 11px;
  color: #9ca3af;
  max-width: 280px;
  line-height: 1.4;
  margin: 0;
}

.btn-ai-primary {
  background: #f43f5e;
  border: 1px solid #e11d48;
  color: #ffffff;
  border-radius: 6px;
  padding: 7px 18px;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  margin-top: 6px;
  transition: all 0.15s ease;
}

.btn-ai-primary:hover:not(:disabled) {
  background: #fb7185;
}

.btn-ai-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.ai-key-hint {
  font-size: 10px;
  color: #f59e0b;
  max-width: 280px;
  line-height: 1.35;
  margin-top: 4px;
}

/* RESULTS WRAPPER */
.ai-results-wrapper {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ai-results-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 6px;
  border-bottom: 1px solid #1f2937;
}

.ai-header-meta {
  display: flex;
  align-items: center;
  gap: 6px;
}

.ai-result-tag {
  font-family: "JetBrains Mono", monospace;
  font-size: 9px;
  font-weight: 700;
  color: #9ca3af;
  letter-spacing: 0.04em;
}

.ai-confidence-pill {
  font-family: "JetBrains Mono", monospace;
  font-size: 9px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  background: #062e21;
  color: #6ee7b7;
  border: 1px solid #10b981;
}

.ai-header-actions {
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-ai-copy {
  background: #1f293d;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #f3f4f6;
  font-size: 10px;
  padding: 3px 8px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-ai-copy:hover {
  background: #28354f;
}

.btn-ai-reanalyze {
  background: transparent;
  border: 1px solid #374151;
  border-radius: 4px;
  color: #9ca3af;
  font-size: 11px;
  padding: 2px 6px;
  cursor: pointer;
  transition: all 0.15s ease;
}

.btn-ai-reanalyze:hover {
  background: #1f293d;
  color: #ffffff;
}

.ai-card {
  background: #090d16;
  border: 1px solid #1f2937;
  border-radius: 6px;
  padding: 9px 12px;
}

.ai-card-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 5px;
}

.ai-card-bullet {
  width: 6px;
  height: 6px;
  border-radius: 50%;
}

.bullet-crimson {
  background: #f43f5e;
}

.bullet-amber {
  background: #f59e0b;
}

.bullet-emerald {
  background: #10b981;
}

.ai-card-title {
  margin: 0;
  font-size: 11px;
  font-weight: 600;
  color: #f9fafb;
}

.ai-card-content {
  margin: 0;
  font-size: 11px;
  color: #d1d5db;
  line-height: 1.45;
}

.ai-steps-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.ai-step-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.ai-step-badge {
  font-family: "JetBrains Mono", monospace;
  font-size: 9px;
  font-weight: 700;
  min-width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #3b2606;
  color: #fcd34d;
  border: 1px solid #f59e0b;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  margin-top: 1px;
}

.ai-step-text {
  font-size: 11px;
  color: #d1d5db;
  line-height: 1.35;
}

.ai-fix-box {
  background: #04070d;
  border: 1px solid #1f2937;
  border-radius: 4px;
  padding: 6px 8px;
}

.ai-fix-box code {
  font-family: "JetBrains Mono", monospace;
  font-size: 10px;
  color: #6ee7b7;
  white-space: pre-wrap;
  line-height: 1.4;
}
</style>
