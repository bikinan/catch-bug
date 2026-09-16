# Security Policy

At **CatchBug**, security, privacy, and data isolation are fundamental engineering pillars. Because CatchBug captures browser telemetry, network requests, console logs, and DOM snapshots, we adhere to a strict **Security by Design** and **Zero-Credential Leak** architecture.

This document outlines our security philosophy, supported versions, and how to responsibly disclose security vulnerabilities.

---

## 🛡️ Security Architecture & Privacy Guarantees

CatchBug is designed from the ground up to prevent data leaks and protect user privacy:

1. **Local-First Telemetry**: All captured screenshots, screen recordings, network logs, and console entries reside solely in browser local memory (`chrome.storage.local`). No telemetry is broadcast to external cloud servers unless explicitly initiated by the user.
2. **Automated Credential Masking**: Network payloads, request headers, query strings, and cookies are automatically sanitized via our client-side regex pipeline ([src/utils/masking.ts](./src/utils/masking.ts)). Bearer tokens, passwords, session tokens, API keys, and credit cards are scrubbed before storage or export.
3. **Shadow DOM Sandbox**: CatchBug user interface widgets are injected inside closed Shadow DOM containers with zero CSS bleed and scoped event handling to prevent malicious page scripts from hijacking extension UI.
4. **Isolated Background Proxying**: Third-party API calls (e.g., GitHub Issues, Slack Webhooks, AI provider gateways) are brokered exclusively via the background service worker, maintaining strict Content Security Policy (CSP) separation from host page contexts.

---

## 📦 Supported Versions

Only the latest active minor release receives official security patches and bug fixes.

| Version | Supported | Notes |
| :--- | :---: | :--- |
| **0.1.x** | ✅ Yes | Current active open-core release |
| < 0.1.0 | ❌ No | Pre-release alpha builds |

---

## 🚨 Reporting a Vulnerability

We take all security vulnerability reports seriously. If you discover a security vulnerability in CatchBug, please disclose it responsibly so we can resolve it before public release.

### How to Report

**Please DO NOT report security vulnerabilities via public GitHub issues or public discussions.**

Instead, please report vulnerabilities through one of the following channels:

1. **GitHub Private Vulnerability Reporting (Preferred)**:
   Navigate to the repository's **Security** tab and click **"Report a vulnerability"**.
2. **Email Disclosure**:
   Send an encrypted or private email to:
   - Maintainer: **Iqbal Ramadan**
   - Email: `security@catchbug.dev` (or directly via maintainer profile: `iqbalramadan.dev@gmail.com`)

### What to Include in Your Report

To help us investigate and patch the vulnerability as quickly as possible, please include:
- A clear, step-by-step description of the vulnerability and its potential impact.
- Proof of Concept (PoC) code or exact reproduction steps.
- Target browser version (e.g., Chrome 128, Brave 1.68) and OS.
- Any suggested remediations or patches, if you have one.

---

## ⏱️ Response Timelines & SLA

When you submit a vulnerability report:
- **Acknowledgement**: We will acknowledge receipt of your report within **48 hours**.
- **Assessment**: We will triage and validate the vulnerability severity within **5 business days**.
- **Remediation**: If confirmed, a fix will be developed, tested, and published in a security patch release.
- **Credit**: You will be credited in the release notes and on our [CONTRIBUTORS.md](./CONTRIBUTORS.md) board (unless you prefer anonymity).

Thank you for helping keep CatchBug and our developer community safe! 🛡️
