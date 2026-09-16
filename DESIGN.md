---
name: CatchBug
description: Lightweight, developer-grade staging bug catcher and diagnostic companion
colors:
  primary: "#f43f5e"
  primary-hover: "#e11d48"
  primary-subtle: "#3f1219"
  primary-text: "#fca5a5"
  warning: "#f59e0b"
  warning-hover: "#d97706"
  warning-subtle: "#3b2606"
  warning-text: "#fcd34d"
  success: "#10b981"
  success-subtle: "#062e21"
  success-text: "#6ee7b7"
  surface-base: "#090d16"
  surface-raised: "#111827"
  surface-overlay: "#1f293d"
  surface-overlay-hover: "#28354f"
  border-subtle: "#1f2937"
  border-highlight: "#374151"
  text-primary: "#f9fafb"
  text-secondary: "#9ca3af"
  text-muted: "#6b7280"
typography:
  display:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.3
  title:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, -apple-system, BlinkMacSystemFont, sans-serif"
    fontSize: "0.8125rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "JetBrains Mono, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "0.02em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "10px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
components:
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  button-primary-hover:
    backgroundColor: "{colors.primary-hover}"
  button-secondary:
    backgroundColor: "{colors.surface-overlay}"
    textColor: "{colors.text-primary}"
    rounded: "{rounded.md}"
    padding: "6px 12px"
  card:
    backgroundColor: "{colors.surface-raised}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
---

# Design System: CatchBug

## Overview

**Creative North Star: "The Flight Deck Cockpit"**

CatchBug is built for QA engineers and developers moving fast in preview and staging environments. The visual language is high-density, precise, and unobtrusive. It borrows the utilitarian confidence of an avionics cockpit: deep slate backgrounds, laser-focused typography, high-contrast status accents, and zero visual fluff.

Every pixel serves rapid diagnosis. Interactive in-page triggers stay compact and whisper-quiet until an error occurs, at which point crisp diagnostic telemetry (crimson error badges, amber network warnings, monospace stack frames) alerts the user with surgical clarity.

**Key Characteristics:**
- **Cockpit Density:** Compact touch targets, 12px/13px base typography, and tight 4px/8px rhythm optimized for technical widgets and overlays.
- **Tonal Hierarchy:** Deep slate `#090d16` base with subtly tiered `#111827` and `#1f293d` elevation, keeping focus on logs and screenshots.
- **Diagnostic Color Sparks:** High-chroma rose crimson (`#f43f5e`) and amber (`#f59e0b`) are strictly reserved for faults, failures, and primary action gates.
- **Monospace Telemetry:** HTTP codes, stack frames, timestamps, and selectors are consistently typeset in crisp monospace.

## Colors

The palette is engineered for a dark-first developer tool where status colors carry unambiguous semantic meaning.

### Primary
- **Bug Crimson** (`#f43f5e`): The signature alert color. Used for critical errors, 5xx API failures, active recording state, and primary CTA actions ("Capture Bug", "Copy Report").
- **Crimson Hover** (`#e11d48`): Elevated hover state for primary action buttons.
- **Crimson Subtle** (`#3f1219`): Deep tinted background for active error pills and alert rows.
- **Crimson Text** (`#fca5a5`): Readable high-contrast tinted text on crimson subtle surfaces.

### Secondary
- **Telemetry Amber** (`#f59e0b`): Warning indicators, 4xx client errors, intercepted network warnings, and pending actions.
- **Amber Hover** (`#d97706`): Hover state for warning/undo buttons.
- **Amber Subtle** (`#3b2606`): Background tint for warning states and caution tags.
- **Amber Text** (`#fcd34d`): Tinted readable text on amber subtle surfaces.

### Tertiary
- **Signal Emerald** (`#10b981`): Healthy state indicators, successful export toasts ("Copied to Clipboard"), and verified test checkpoints.
- **Emerald Subtle** (`#062e21`): Background tint for success chips and confirmation badges.
- **Emerald Text** (`#6ee7b7`): High-contrast readable text on emerald subtle surfaces.

### Neutral
- **Deep Void** (`#090d16`): The primary root background for popups and overlay panels.
- **Cockpit Slate** (`#111827`): Card backgrounds, list item surfaces, and header bars.
- **Cockpit Elevated** (`#1f293d`): Floating controls, hover surfaces, inputs, and active button backgrounds.
- **Cockpit Elevated Hover** (`#28354f`): Active hover state for neutral buttons and chips.
- **Border Subtle** (`#1f2937`): Hairline dividers and container boundaries.
- **Border Highlight** (`#374151`): Elevated container borders and active control outlines.
- **Text Primary** (`#f9fafb`): High-contrast readable headings, key values, and button labels.
- **Text Secondary** (`#9ca3af`): Body copy, labels, and secondary actions.
- **Text Muted** (`#6b7280`): Timestamps, inactive shortcuts, and metadata captions.

### Named Rules
**The Status-Rarity Rule.** Saturated crimson and amber are never used for decorative elements or arbitrary badges. Their presence always signals an active fault, warning, or primary commitment.

## Typography

**Display Font:** Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
**Body Font:** Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif
**Label/Mono Font:** JetBrains Mono, "Fira Code", Menlo, monospace

**Character:** Technical, neutral, and compact. High x-height ensures excellent legibility even at 12px within dense extension popups and in-page widgets.

### Hierarchy
- **Display** (600, `1.25rem` / 20px, line-height 1.2): Section titles and modal headers.
- **Headline** (600, `1rem` / 16px, line-height 1.3): Panel headings and bug report summaries.
- **Title** (600, `0.875rem` / 14px, line-height 1.4): Card titles, group labels, and dialog prompts.
- **Body** (400, `0.8125rem` / 13px, line-height 1.5): Descriptions, instructions, and standard copy.
- **Label / Code** (500, `0.75rem` / 12px, line-height 1.2, letter-spacing +0.02em): HTTP status badges, console methods, timestamps, keyboard shortcuts, and device metadata.

### Named Rules
**The Monospace Telemetry Rule.** Any string representing runtime machine data (URLs, paths, error types, HTTP status codes, coordinates, and timings) must be rendered in the mono font stack.

## Layout

CatchBug operates in bounded spaces: an in-page floating widget (approx 44px collapsed to 350px expanded drawer) and an extension popup (fixed 380px width, max 520px height).

- **Spacing Rhythm:** Strictly on an 4px base (`4px`, `8px`, `12px`, `16px`, `24px`).
- **Density:** High density. Standard item padding is `8px 12px`; tight rows use `6px 8px`.
- **Z-Index Layering:**
  - Floating Trigger: `2147483640` (above web page content).
  - Floating Drawer / Flyout: `2147483645`.
  - Capture Overlay / Crop Canvas: `2147483647`.

## Elevation & Depth

CatchBug uses layered dark surfaces with crisp 1px borders rather than heavy ambient blur shadows. Depth is communicated structurally through luminance steps (`#090d16` → `#111827` → `#1f293d`).

### Shadow Vocabulary
- **Cockpit Flyout** (`box-shadow: 0 16px 36px -4px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08)`): Used on floating overlay cards and export drawers.
- **Action Glow** (`box-shadow: 0 0 16px -2px rgba(244, 63, 94, 0.4)`): Used on active recording indicators or when new critical errors trigger the floating counter.

### Named Rules
**The Tonal Boundary Rule.** Every elevated surface must define a 1px boundary (`border: 1px solid #1f2937` or `#374151`) to preserve contrast against arbitrary webpage backgrounds underneath.

## Shapes

- **Radius Scale:**
  - Micro (`4px`): Badges, HTTP status chips, code tokens.
  - Standard (`6px`): Buttons, input fields, dropdown triggers.
  - Container (`10px`): Cards, flyout panels, modal frames.
  - Pill (`9999px`): Floating trigger bubble, status pills, counter badges.
- **Borders:** Consistent 1px crisp borders. No heavy 2px/3px outlines except for accessible focus rings.

## Components

### Buttons
- **Shape:** Standard (`6px` radius).
- **Primary:** Background `{colors.primary}` (`#f43f5e`), text `{colors.text-primary}` (`#ffffff`), font weight 600. Padding `6px 14px`.
- **Secondary / Ghost:** Background `{colors.surface-overlay}` (`#1f293d`), border `1px solid #374151`, text `#f9fafb`.
- **Hover / Focus:** Hover shifts background slightly lighter; focus-visible applies `outline: 2px solid #f43f5e` with `2px` offset.

### Chips / Status Badges
- **Style:** Compact pill or 4px rounded token with tinted background and 1px border.
- **Error Chip:** Background `#3f1219`, border `1px solid #f43f5e`, text `#fca5a5`.
- **Warning Chip:** Background `#3b2606`, border `1px solid #f59e0b`, text `#fcd34d`.
- **Success Chip:** Background `#062e21`, border `1px solid #10b981`, text `#6ee7b7`.

### Cards & Container Panels
- **Corner Style:** Rounded `10px`.
- **Background:** `{colors.surface-raised}` (`#111827`) with `1px solid #1f2937`.
- **Internal Padding:** `12px 16px`.

### Telemetry List Items (Console & Network Logs)
- **Style:** Compact row with fixed height (~32px), monospace badge on the left, truncated message in the middle, and timestamp on the right.
- **Hover:** Tonal shift to `#1f293d` with copy shortcut trigger on hover.

## Do's and Don'ts

### Do:
- **Do** format technical metadata (URL, browser version, viewport size, status codes) with the monospace font.
- **Do** provide an immediate tactile response (toast or copy confirmation) when the user captures or copies data.
- **Do** keep in-page injected elements scoped (e.g. inside Shadow DOM) with clear boundary borders so host page CSS never corrupts CatchBug.
- **Do** reserve crimson for genuine errors and primary commitment buttons.

### Don't:
- **Don't** use generic default browser blue or purple accents.
- **Don't** add large decorative illustrations or empty margins in extension popups; space is precious.
- **Don't** let floating overlays cover the host application without an easy collapse/minimize gesture.
- **Don't** use translucent glassy blur without an opaque background fallback, as arbitrary webpage colors beneath would destroy legibility.
