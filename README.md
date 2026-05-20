# SpecForge

AI-powered QA engineering browser extension for Azure DevOps. Detects User Story work items, extracts requirement data, generates structured test cases via Claude AI, and injects them directly into ADO Test Case forms — without leaving the browser.

---

## Features

- **Auto-detection** — identifies User Story, Feature, and PBI work items as you navigate ADO
- **Smart extraction** — captures title, description, acceptance criteria, tags, priority, area path, iteration, comments, and linked items
- **5-step Claude prompt chain** — enrichment → risk analysis → generation → self-validation → tagging
- **Inline review** — edit generated test cases in the side panel before injecting
- **One-click injection** — automates ADO Test Case form population including test steps grid
- **Live progress** — real-time injection status per test case

---

## Browser Support

| Browser | Status |
|---------|--------|
| Chrome | ✅ Primary |
| Edge | ✅ Supported |
| Firefox | ✅ Supported (MV2) |
| Safari | 🔜 Phase 2 |

---

## Tech Stack

- **Extension framework**: [Plasmo](https://www.plasmo.com/) 0.90.5
- **UI**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **State**: Zustand
- **Schema validation**: Zod
- **AI**: Claude API (`claude-sonnet-4-20250514`)
- **Unit tests**: Vitest
- **E2E tests**: Playwright

---

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm 8+
- A Claude API key from [console.anthropic.com](https://console.anthropic.com)

### Install

```bash
pnpm install
```

### Development

```bash
pnpm dev                          # Chrome (hot reload)
pnpm dev --target=firefox-mv2    # Firefox
```

Load the `build/chrome-mv3-dev/` folder as an unpacked extension in `chrome://extensions`.

---

## Configuration

After loading the extension, open the settings panel and enter your **Claude API key**. The key is stored only in `chrome.storage.local` and never leaves your browser except for direct calls to `api.anthropic.com`.

---

## Building

```bash
pnpm build              # Chrome MV3
pnpm build:firefox      # Firefox MV2
pnpm build:edge         # Edge MV3
```

Output lands in `build/<target>/`.

---

## Testing

```bash
pnpm test                        # All unit tests
pnpm test -- --run path/to.test  # Single test file
pnpm test:coverage               # With coverage report

# E2E (requires live ADO environment)
E2E_ADO_STORY_URL=https://dev.azure.com/... \
E2E_CLAUDE_API_KEY=sk-ant-... \
pnpm test:e2e
```

---

## Architecture

The extension has four browser contexts with strict boundaries:

```
Content Script          Background Worker         Side Panel
(ADO page)              (service worker)          (React UI)
     │                        │                        │
     │── EXTRACT_STORY ──────>│                        │
     │                        │──> Claude API          │
     │                        │<── TestCase[]          │
     │<── GENERATION_COMPLETE─│──> GENERATION_COMPLETE─│
     │                        │                        │
     │<── INJECT_TEST_CASES ──│<── INJECT_TEST_CASES ──│
     │── INJECTION_PROGRESS ──────────────────────────>│
     │── INJECTION_COMPLETE ──────────────────────────>│
```

**Security invariant**: credentials never leave the background worker. The content script never holds a Claude API key or ADO PAT.

All cross-context messages are typed via a discriminated union in `src/types/messages.ts`.

---

## AI Prompt Chain

Generation runs as a sequential 5-step chain:

| Step | Purpose | Failure behaviour |
|------|---------|-------------------|
| 1 — Enrichment | Normalise sparse story, infer missing AC | Skip, continue |
| 2 — Risk Analysis | Identify high-risk areas and coverage types | Skip, continue |
| 3 — Generation | Core test case generation | Fatal — aborts chain |
| 4 — Self-Validation | Claude corrects its own output | Skip, use step 3 output |
| 5 — Tagging | Normalise tags and priorities | Skip, use step 4 output |

All steps use `claude-sonnet-4-20250514`, temperature `0`, JSON-only output.

---

## Project Structure

```
src/
├── background/          # Service worker — Claude API calls, message routing
├── content/             # Content script — detection, extraction, injection, toolbar
├── sidepanel/           # Side panel React app
├── popup/               # Settings popup
├── services/
│   ├── ado/             # ADO selectors, detector, extractor
│   ├── claude/          # Claude API client, prompt builder
│   ├── injection/       # Injector, steps-grid automation
│   ├── prompts/         # 5-step prompt templates
│   └── validators/      # Zod schema validation
├── schemas/             # Shared Zod schemas
├── storage/             # chrome.storage wrapper
├── types/               # Shared TypeScript types
└── utils/               # dom-wait, safe-log, errors, perf, browser-api
tests/
├── unit/                # Vitest unit tests
└── e2e/                 # Playwright E2E tests
```

---

## Contributing

1. Branch from `main`
2. Run `pnpm test` — all tests must pass
3. Follow the selector abstraction rule: add new ADO selectors to `src/services/ado/selectors.ts` only
4. All log output must go through `src/utils/safe-log.ts` — never use `console.*` directly
5. Credentials must never appear in content script or UI code

---

## License

MIT
