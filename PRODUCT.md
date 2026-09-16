# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary users are Quality Assurance (QA) engineers, software developers, and product managers testing web applications within staging and preview environments. Their job is identifying software defects, verifying features, and reporting actionable bugs back to the development team without manual friction.

## Product Purpose

CatchBug is a lightweight browser extension designed to eliminate bug reporting friction on staging/test environments. It aggregates visual evidence, intercepted runtime diagnostics (console errors, failed HTTP network calls), and environment metadata into clear, structured, ready-to-copy bug reports.

## Positioning

Unlike bloated issue-tracking suites or generic full-page screen capture tools, CatchBug runs as an unobtrusive in-page companion specifically tuned for staging QA: automatic zero-friction interception of recent console errors and failed API calls (4xx/5xx) coupled with instant screenshot capture and multi-destination formatting (GitHub Issues, Trello, WhatsApp, Markdown).

## Operating Context

- **Environment:** Web browser extension running on staging/preview web applications and QA testing environments.
- **Surfaces:**
  - Floating overlay / widget injected into target pages for instant capture and status.
  - Extension popup for quick controls, settings, and status.
  - Export modal / drawer to preview, annotate, and copy or dispatch formatted bug reports.
- **Output destinations:** GitHub Issues, Trello, WhatsApp, Markdown, or clipboard.

## Capabilities and Constraints

- **Automatic Interception:** Captures recent JavaScript console errors/warnings and failed API/fetch/XHR calls (HTTP 4xx / 5xx).
- **Visual Capture:** Screenshot capture of current viewport or selected visual bug area.
- **Diagnostic Metadata:** Automatic collection of OS, browser vendor/version, viewport/screen resolution, current URL, and timestamp.
- **Report Generator:** Formats aggregated data into structured templates ready for one-click copy or direct export.
- **Technical Stack:** WXT (Next-gen Web Extension Framework), Vue 3, TypeScript, Manifest V3.

## Brand Commitments

- **Name:** CatchBug
- **Tone & Voice:** Fast, developer-grade, precise, reliable, lightweight, and unobtrusive.
- **UX Feel:** Should feel like a sleek, native dev tool companion—never clunky, never getting in the way of testing the underlying web app.

## Product Principles

1. **Zero-friction capture:** Diagnostics (errors, network failures, metadata) must be collected automatically without requiring the user to open browser DevTools.
2. **Actionable out of the box:** Every generated report must contain enough technical fidelity for a developer to reproduce and diagnose the bug immediately.
3. **Respect the testing surface:** Overlays and controls must be compact, collapsible, and non-intrusive so they never obstruct QA testing.
4. **Fast export anywhere:** Support instant copying in clean Markdown or team-specific formats (GitHub, Trello, chat).
