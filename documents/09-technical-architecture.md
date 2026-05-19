# SpecForge — Technical Architecture & Stack

## High-Level Architecture

```
┌──────────────────────────────────────────┐
│         Browser Extension (SpecForge)     │
│                                          │
│  ┌────────────┐   ┌────────────────────┐ │
│  │ Side Panel │   │  Popup / Settings  │ │
│  └────────────┘   └────────────────────┘ │
│         ↕                               │
│  ┌─────────────────────────────────────┐ │
│  │         Background Worker           │ │
│  │  - Claude API Orchestration         │ │
│  │  - Retry Queue                      │ │
│  │  - Storage Access                   │ │
│  │  - Browser Messaging Hub            │ │
│  └─────────────────────────────────────┘ │
│         ↕                               │
│  ┌─────────────────────────────────────┐ │
│  │         Content Script              │ │
│  │  - ADO Page Detection               │ │
│  │  - Story Extraction                 │ │
│  │  - Form Injection Automation        │ │
│  │  - UI Control Injection             │ │
│  └─────────────────────────────────────┘ │
└───────────────────┬──────────────────────┘
                    │
         ┌──────────┴──────────┐
         │                     │
         ▼                     ▼
┌─────────────────┐   ┌──────────────────┐
│  Azure DevOps   │   │   Claude API     │
│  (dev.azure.com)│   │ (api.anthropic.com│
└─────────────────┘   └──────────────────┘
```

---

## Technology Stack

### Extension Framework

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Extension Framework | [Plasmo](https://www.plasmo.com/) | Cross-browser extension framework; simplifies manifest, hot reload, React integration |
| UI Framework | React | Component model for Side Panel and Popup |
| Language | TypeScript | Type safety across extraction, validation, and injection layers |
| Styling | Tailwind CSS | Utility-first; consistent design tokens; minimal bundle overhead |
| State Management | Zustand | Lightweight; no boilerplate; works well with extension message passing |

### Validation

| Purpose | Technology |
|---------|------------|
| Schema Validation | Zod | Runtime type checking of Claude API responses |

### AI Integration

| Purpose | Technology |
|---------|------------|
| AI Provider | Claude API (`claude-sonnet-4-20250514`) |
| Skill | `ado-test-case-creator` |

### Testing

| Purpose | Technology |
|---------|------------|
| E2E Testing | Playwright | Browser automation against real ADO environments |
| Unit Testing | Vitest | Fast unit tests for extraction, validation, and prompt logic |

---

## Extension Component Map

### 11.1 Content Script

**Runs on:** `https://dev.azure.com/*`

Responsibilities:
- Detect ADO work item pages (SPA-aware)
- Extract work item fields via DOM
- Inject SpecForge toolbar button
- Automate ADO test case forms during injection
- Communicate with Background Worker via `chrome.runtime.sendMessage`

---

### 11.2 Background Worker

**Runs as:** Service Worker (Chrome/Edge), Background Script (Firefox)

Responsibilities:
- Hold and manage Claude API key securely
- Construct and execute Claude API requests
- Handle retry logic and request queuing
- Route messages between content script and side panel
- Manage `chrome.storage.local` reads/writes

---

### 11.3 Side Panel

**Type:** Browser Side Panel (Chrome Side Panel API / Firefox equivalent)

Responsibilities:
- Render generated test case cards
- Enable inline editing of test cases
- Show validation errors
- Trigger regeneration
- Trigger injection workflow
- Show injection progress and summary

---

### 11.4 Popup / Settings

**Type:** Extension popup

Responsibilities:
- Claude API key configuration
- ADO PAT configuration
- User preferences
- Quick status overview

---

### 11.5 Storage Layer

**Storage:** `chrome.storage.local`

Stores:
- `claudeApiKey`
- `adoPat`
- `userPreferences`
- `promptTemplates` (future: custom prompt overrides)

---

## Folder Structure

```
specforge/
├── src/
│   ├── background/
│   │   ├── index.ts              # Service worker entry
│   │   ├── claude-client.ts      # Claude API calls
│   │   ├── retry-queue.ts        # Retry + queue logic
│   │   └── message-router.ts     # chrome.runtime message hub
│   │
│   ├── content/
│   │   ├── index.ts              # Content script entry
│   │   ├── detector.ts           # Work item detection
│   │   ├── extractor.ts          # Field extraction
│   │   └── toolbar.ts            # Toolbar button injection
│   │
│   ├── sidepanel/
│   │   ├── index.tsx             # Side panel entry
│   │   ├── components/
│   │   │   ├── TestCaseCard.tsx
│   │   │   ├── StepEditor.tsx
│   │   │   ├── ValidationBanner.tsx
│   │   │   └── InjectionProgress.tsx
│   │   └── store.ts              # Zustand state
│   │
│   ├── popup/
│   │   ├── index.tsx
│   │   └── Settings.tsx
│   │
│   ├── services/
│   │   ├── ado/
│   │   │   ├── detector.ts
│   │   │   └── extractor.ts
│   │   ├── claude/
│   │   │   ├── client.ts
│   │   │   └── prompt-builder.ts
│   │   ├── injection/
│   │   │   ├── injector.ts
│   │   │   └── steps-grid.ts
│   │   └── validators/
│   │       └── test-case.schema.ts
│   │
│   ├── schemas/
│   │   └── test-case.zod.ts
│   │
│   ├── storage/
│   │   └── storage.ts
│   │
│   ├── types/
│   │   ├── user-story.ts
│   │   └── test-case.ts
│   │
│   └── utils/
│       ├── safe-log.ts
│       ├── html-sanitizer.ts
│       └── dom-wait.ts
│
├── tests/
│   ├── unit/
│   └── e2e/
│
├── assets/
├── manifest.json                 # Managed by Plasmo
└── package.json
```

---

## Messaging Architecture

All cross-context communication uses `chrome.runtime.sendMessage`:

```typescript
// Message types
type Message =
  | { type: 'EXTRACT_STORY' }
  | { type: 'GENERATE_TEST_CASES'; payload: UserStory }
  | { type: 'INJECT_TEST_CASES'; payload: TestCase[] }
  | { type: 'GENERATION_COMPLETE'; payload: TestCase[] }
  | { type: 'INJECTION_PROGRESS'; payload: InjectionProgress }
  | { type: 'ERROR'; payload: { code: string; message: string } }
```

---

## Acceptance Criteria

- [ ] Plasmo framework builds extension for Chrome, Edge, and Firefox
- [ ] Content script correctly scoped to `https://dev.azure.com/*`
- [ ] Background worker holds all credentials; content script has no direct API access
- [ ] Side panel state managed via Zustand store
- [ ] All inter-context messages typed using shared Message types
- [ ] Zod schemas co-located in `/schemas` and imported by both Claude client and injection engine
- [ ] Unit tests cover extraction, prompt building, validation, and retry logic
- [ ] E2E tests cover the full generation + injection workflow on a real ADO test environment
