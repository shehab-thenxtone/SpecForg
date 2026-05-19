# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## What Is SpecForge

SpecForge is a cross-browser AI-powered browser extension that integrates with Azure DevOps (ADO). It detects User Story work items on `https://dev.azure.com/*`, extracts requirement data, runs it through a 5-step Claude AI prompt chain, and automatically injects the generated test cases back into ADO Test Case forms — all without leaving the browser.

> This repository is currently in the **pre-implementation (design) phase**. All source code is yet to be written. The `documents/` folder is the authoritative spec.

---

## Technology Stack

| Layer | Technology |
|-------|------------|
| Extension framework | [Plasmo](https://www.plasmo.com/) |
| UI | React + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand (side panel store) |
| Schema validation | Zod |
| AI | Claude API — `claude-sonnet-4-20250514` |
| Unit tests | Vitest |
| E2E tests | Playwright |

---

## Commands

Once the project is scaffolded with Plasmo, the expected commands are:

```bash
# Install dependencies
pnpm install

# Development (hot reload, loads unpacked extension)
pnpm dev                              # Chrome (default)
pnpm dev --target=firefox-mv2         # Firefox

# Production build
pnpm build                            # Chrome MV3
pnpm build --target=firefox-mv2       # Firefox MV2
pnpm build --target=edge-mv3          # Edge

# Unit tests (Vitest)
pnpm test                             # run all unit tests
pnpm test -- --run <path/to/test>     # run a single test file
pnpm test -- --coverage               # with coverage report

# E2E tests (Playwright)
pnpm e2e                              # run all E2E tests
pnpm e2e -- --grep "story detection"  # run a single test by name
```

The build output lands in `build/chrome-mv3-prod/` (or the equivalent target directory). Load this folder as an unpacked extension in the browser for manual testing.

---

## Architecture

### Extension Context Map

The extension has four distinct browser contexts. Understanding which context owns which responsibility is critical — security and correctness depend on it.

```
Content Script          Background Worker         Side Panel / Popup
(runs on ADO page)      (service worker)          (React UI)
      │                        │                        │
      │  EXTRACT_STORY →       │                        │
      │                        │  → Claude API          │
      │                        │  ← TestCase[]          │
      │  ← GENERATION_COMPLETE │  → GENERATION_COMPLETE │
      │                        │                        │
      │  (user clicks inject)  │                        │
      │  INJECT_TEST_CASES →   │                        │
      │  ← INJECTION_PROGRESS  │                 ← live progress
```

**Rule: credentials never leave the background worker.** The content script never holds the Claude API key or ADO PAT. All external API calls are made from `src/background/`.

All cross-context messages use `chrome.runtime.sendMessage` and are typed via a shared `Message` discriminated union in `src/types/`.

### Key Service Boundaries

| Service | Location | Responsibility |
|---------|----------|----------------|
| `detector.ts` | `src/content/` | SPA-aware ADO page detection via `MutationObserver` + URL listeners |
| `extractor.ts` | `src/content/` | DOM field extraction (title, AC, priority, tags, etc.) |
| `claude-client.ts` | `src/background/` | Executes all 5 prompt-chain steps; holds API key |
| `prompt-builder.ts` | `src/services/claude/` | Assembles step prompts from templates in `src/services/prompts/` |
| `injector.ts` | `src/services/injection/` | Populates ADO test case form fields via DOM automation |
| `steps-grid.ts` | `src/services/injection/` | Injects test steps into ADO's dynamic steps grid |
| `test-case.zod.ts` | `src/schemas/` | Zod schemas shared by Claude client and injection engine |

---

## The 5-Step Claude Prompt Chain

Generation is not a single API call. It is a sequential chain defined in `documents/PROMPT_CHAIN.md` and implemented in `src/services/prompts/`:

| Step | File | Purpose | Short-circuits if… |
|------|------|---------|-------------------|
| 1 — Enrichment | `step1-enrichment.ts` | Normalize sparse story; infer missing AC | Story already has full description + AC |
| 2 — Risk Analysis | `step2-risk-analysis.ts` | Identify high-risk areas and required coverage types | Fails → use default coverage plan |
| 3 — Generation | `step3-generation.ts` | Core generation with `ado-test-case-creator` skill | Fails after 1 retry → abort chain |
| 4 — Self-Validation | `step4-self-validation.ts` | Claude corrects its own output before Zod runs | Fails → use Step 3 output directly |
| 5 — Tagging | `step5-tagging.ts` | Normalize tags and priorities | Fails → use Step 4 output directly |

All steps: model `claude-sonnet-4-20250514`, temperature `0`, JSON-only output. Steps 1, 2, and 5 are resilient — failures skip them and proceed. Step 3 failure is fatal.

---

## ADO DOM Automation Rules

ADO is a React SPA with an unstable DOM. Two non-negotiable rules:

1. **Use accessibility selectors only.** Never use positional CSS chains.
   ```typescript
   // ✅
   document.querySelector('[aria-label="Title field"]')
   // ❌
   div:nth-child(5) > span > input
   ```

2. **The steps grid requires async synchronization.** Each step row must be awaited before the next is injected. `src/utils/dom-wait.ts` provides the `MutationObserver`-based wait helper.

The injection engine uses a three-layer fallback: keyboard simulation → clipboard paste → direct DOM value + event dispatch.

---

## Validation Flow

Claude output must pass this pipeline before the inject button is enabled:

```
JSON.parse → array check → Zod schema → field integrity → step integrity → duplicate detection
```

Zod schemas live in `src/schemas/test-case.zod.ts` and are the single source of truth imported by both the Claude client and the injection engine. Critical failures block injection; warnings (duplicate titles, near-duplicate steps) surface as non-blocking UI indicators.

---

## Security Rules

- Credentials (`claudeApiKey`, `adoPat`) are stored only in `chrome.storage.local` and accessed only from the background worker.
- The content script never calls any external API directly.
- All log output must pass through `src/utils/safe-log.ts`, which redacts credential patterns.
- Manifest permissions are minimally scoped: `storage`, `sidePanel`, `scripting`, `activeTab`, plus host permissions for `https://dev.azure.com/*` and `https://api.anthropic.com/*` only.

---

## Documentation

All feature specifications are in `documents/`. Read them before implementing any feature:

| File | What it specifies |
|------|------------------|
| `PRD.md` | Full product requirements |
| `PROMPT_CHAIN.md` | Complete 5-step AI chain with all prompts and contracts |
| `09-technical-architecture.md` | Definitive folder structure and messaging types |
| `06-injection-engine.md` | Steps grid injection strategy |
| `07-validation-layer.md` | Zod schemas and validation rules |
| `08-security-auth.md` | Credential handling and permissions |
