# Contributing to CatchBug

Thank you for your interest in contributing to **CatchBug**! 🐞⚡

CatchBug is built with an **Open-Core** model: the browser extension client is completely open-source (under the permissive MIT License), empowering any developer or QA tester to capture, redact, annotate, and export high-fidelity bug reports locally for free.

Whether you are fixing bugs, proposing new features, tuning the Dark Cockpit UI, or improving documentation, we welcome your contributions!

---

## 🧭 Code of Conduct

All contributors and maintainers are expected to uphold our [Code of Conduct](./CODE_OF_CONDUCT.md). Please read it before participating in discussions or opening pull requests.

---

## 🛠️ Development Setup

CatchBug is built using [WXT](https://wxt.dev/) (Next-gen Web Extension Framework), **Vue 3**, **TypeScript**, and uses **pnpm** as its package manager.

### Prerequisites
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **pnpm**: v8.0.0 or higher (`npm install -g pnpm`)
- **Chromium Browser**: Google Chrome, Brave, Arc, or Microsoft Edge

### Getting Started

1. **Fork and clone the repository:**
   ```bash
   git clone https://github.com/m-iqbal-r/catch-bug.git
   cd catch-bug
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Start the local development server:**
   ```bash
   pnpm dev
   ```
   This compiles the extension in watch mode to `.output/chrome-mv3` and starts a persistent dev server.

4. **Load the extension into your browser:**
   - Open your Chromium browser and navigate to `chrome://extensions`.
   - Enable **Developer mode** (toggle in the top-right corner).
   - Click **Load unpacked** and select the `.output/chrome-mv3` folder inside this project directory.
   - The CatchBug floating dock icon will appear on eligible web pages (test on `https://example.com` or local dev servers).

---

## 🏛️ Architectural Guardrails & Best Practices

When contributing to CatchBug, keep these non-negotiable architectural principles in mind:

### 1. Complete Style & DOM Isolation (Shadow DOM)
- Injected UI components (such as [FloatingWidget.vue](file:///home/iqbal/Documents/Iqbal/programming/extensions/catch-bug/src/components/FloatingWidget.vue) and [AnnotationModal.vue](file:///home/iqbal/Documents/Iqbal/programming/extensions/catch-bug/src/components/AnnotationModal.vue)) **must** reside inside a closed or isolated Shadow Root.
- Host page styles must never bleed into the CatchBug UI, and CatchBug styles must never interfere with host application layout.

### 2. Zero-Credential Leak & Privacy by Design
- CatchBug operates under a strict Zero-Credential Leak policy.
- Any new telemetry or payload interceptor **must** pipe through [masking.ts](file:///home/iqbal/Documents/Iqbal/programming/extensions/catch-bug/src/utils/masking.ts).
- Passwords, authorization headers, cookies, Bearer tokens, and secrets must be redacted before they are persisted to `chrome.storage.local` or exported.

### 3. Background Proxy for Network & Cross-Origin Requests
- To adhere to Manifest V3 CSP and prevent CORS issues, external API dispatches (GitHub API, Slack Webhooks, AI Providers) must run through the background service worker ([background.ts](file:///home/iqbal/Documents/Iqbal/programming/extensions/catch-bug/src/entrypoints/background.ts)) rather than content scripts.

### 4. Cockpit Dark Design System
- Follow the design tokens defined in [DESIGN.md](./DESIGN.md).
- Use `#0F172A` (Slate-900) canvas, `#1E293B` cards, `#0D9488` teal accents, and `#EF4444` recording red.
- Avoid default browser controls; use crisp micro-interactions and smooth transitions.

---

## 🌿 Branching & Commit Conventions

### Branch Naming
- `feat/feature-name` (e.g., `feat/jira-integration`)
- `fix/bug-description` (e.g., `fix/canvas-retina-scaling`)
- `docs/topic` (e.g., `docs/setup-guide`)
- `refactor/scope` (e.g., `refactor/telemetry-ring-buffer`)

### Conventional Commits
We follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:
```
<type>(<scope>): <short summary>

[optional body]

[optional footer(s)]
```
Types:
- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Changes that do not affect the meaning of the code (formatting, white-space)
- `refactor`: A code change that neither fixes a bug nor adds a feature
- `perf`: A code change that improves performance
- `test`: Adding missing tests or correcting existing tests
- `chore`: Changes to build process, dependency updates, tooling

Example:
```bash
git commit -m "feat(export): add Jira Cloud REST API dispatch"
```

---

## 🧪 Pre-Flight Checks & Quality Gates

Before pushing your branch and opening a Pull Request, make sure all checks pass locally:

1. **Type-check TypeScript:**
   ```bash
   pnpm compile
   ```
2. **Build production bundle:**
   ```bash
   pnpm build
   ```
   Verify that the build outputs without errors or warnings.

---

## 🚀 Submitting a Pull Request

1. Push your branch to your fork:
   ```bash
   git push origin feat/your-feature-name
   ```
2. Open a Pull Request against the `main` branch of `m-iqbal-r/catch-bug`.
3. Complete the PR template, describing your motivation, changes, and screenshots/screen recordings for UI changes.
4. Maintainers will review your PR, provide feedback, and merge once approved.

Thank you for building the future of developer diagnostics with us! 🚀
