# SpecForge — Claude Code Prompt Chain

> Paste each phase prompt into Claude Code in order.
> Complete the exit checklist before moving to the next phase.
> Each phase ends with a git commit.

---

## How to Use This File

1. Open your project root in Claude Code
2. Paste **Phase 0** first — this scaffolds the entire project
3. Wait for Claude Code to finish generating all files
4. Run the exit checklist for that phase
5. Commit, then move to the next phase
6. Never skip a phase — each one builds on the last

---

## UI Theme Reference

Apply consistently across all UI phases (Side Panel, Popup):

```
Background:       #0A0A0C   — dominant base
Text / Structure: #E5E7EB   — primary readable content
Borders:          #27272A   — dividers, card outlines, input borders
Accent Blue:      #3B82F6   — primary CTA, active states, links
Accent Mint:      #10B981   — success, valid, injected, positive states
Accent Violet:    #8B5CF6   — AI generation indicator, tags, secondary actions
Error / Danger:   #EF4444   — validation errors, failures
Warning:          #F59E0B   — warnings, duplicates, pending states
```

All UI components must use these as CSS custom properties:

```css
:root {
  --sf-bg:        #0A0A0C;
  --sf-text:      #E5E7EB;
  --sf-border:    #27272A;
  --sf-blue:      #3B82F6;
  --sf-mint:      #10B981;
  --sf-violet:    #8B5CF6;
  --sf-error:     #EF4444;
  --sf-warning:   #F59E0B;
}
```

---

---

# PHASE 0 — Project Scaffold

**Paste this first. Run once only.**

---

```
You are setting up the SpecForge browser extension project from scratch.

SpecForge is a cross-browser AI-powered QA engineering extension built with:
- Plasmo (extension framework)
- React + TypeScript
- Tailwind CSS
- Zustand (state management)
- Zod (schema validation)
- Vitest (unit testing)
- Playwright (E2E testing)

## Task

Scaffold the complete project using Plasmo. Do the following in order:

### 1. Initialise the Plasmo project

Run:
  pnpm create plasmo specforge --with-src

Then install all dependencies:
  pnpm add zustand zod
  pnpm add -D vitest @vitest/coverage-v8 playwright @playwright/test @types/chrome

### 2. Configure Tailwind CSS

Install and configure Tailwind CSS for Plasmo following the official Plasmo + Tailwind guide.
Create `tailwind.config.ts` with the SpecForge design token extension:

```ts
extend: {
  colors: {
    sf: {
      bg:      '#0A0A0C',
      text:    '#E5E7EB',
      border:  '#27272A',
      blue:    '#3B82F6',
      mint:    '#10B981',
      violet:  '#8B5CF6',
      error:   '#EF4444',
      warning: '#F59E0B',
    }
  }
}
```

Also inject the CSS custom properties into the global stylesheet:
```css
:root {
  --sf-bg: #0A0A0C;
  --sf-text: #E5E7EB;
  --sf-border: #27272A;
  --sf-blue: #3B82F6;
  --sf-mint: #10B981;
  --sf-violet: #8B5CF6;
  --sf-error: #EF4444;
  --sf-warning: #F59E0B;
}
```

### 3. Create the full folder structure

Create all folders and placeholder index files exactly as follows:

```
src/
├── background/
│   ├── index.ts
│   ├── claude-client.ts
│   ├── retry-queue.ts
│   └── message-router.ts
├── content/
│   ├── index.ts
│   ├── detector.ts
│   ├── extractor.ts
│   └── toolbar.ts
├── sidepanel/
│   ├── index.tsx
│   ├── store.ts
│   └── components/
│       ├── TestCaseCard.tsx
│       ├── StepEditor.tsx
│       ├── ValidationBanner.tsx
│       └── InjectionProgress.tsx
├── popup/
│   ├── index.tsx
│   └── Settings.tsx
├── services/
│   ├── ado/
│   │   ├── detector.ts
│   │   └── extractor.ts
│   ├── claude/
│   │   ├── client.ts
│   │   └── prompt-builder.ts
│   ├── injection/
│   │   ├── injector.ts
│   │   └── steps-grid.ts
│   └── validators/
│       └── test-case.schema.ts
├── schemas/
│   └── test-case.zod.ts
├── storage/
│   └── storage.ts
├── types/
│   ├── user-story.ts
│   ├── test-case.ts
│   └── messages.ts
└── utils/
    ├── safe-log.ts
    ├── html-sanitizer.ts
    └── dom-wait.ts
tests/
├── unit/
│   └── .gitkeep
└── e2e/
    └── .gitkeep
assets/
└── icon.png   ← create a simple 128x128 placeholder PNG
```

Each placeholder file should export an empty function or comment like:
`// Phase N implementation`

### 4. Configure `package.json` scripts

Add these scripts:
```json
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage",
"test:e2e": "playwright test",
"build:chrome": "plasmo build",
"build:firefox": "plasmo build --target=firefox-mv2",
"build:edge": "plasmo build --target=edge-mv3",
"dev": "plasmo dev"
```

### 5. Configure `vitest.config.ts`

```ts
import { defineConfig } from 'vitest/config'
export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    coverage: { provider: 'v8', reporter: ['text', 'html'] }
  }
})
```

### 6. Configure `playwright.config.ts`

Basic setup for Chromium only (for now):
```ts
import { defineConfig } from '@playwright/test'
export default defineConfig({
  testDir: './tests/e2e',
  use: { browserName: 'chromium' }
})
```

### 7. Initialise Git and make first commit

Run:
  git init
  git add .
  git commit -m "chore: scaffold SpecForge project with Plasmo, React, TypeScript, Tailwind, Zustand, Zod"

## Exit Checklist

Before moving to Phase 1, verify:
- [ ] `pnpm dev` starts without errors
- [ ] `pnpm build:chrome` builds without errors
- [ ] All folders and placeholder files exist
- [ ] Tailwind config has sf colour tokens
- [ ] Git repo initialised with one commit
```

---

---

# PHASE 1 — Core Extraction

**Goal:** ADO work item detection and field extraction. No UI, no AI. Pure content script logic.

**Reference files:** `02-user-story-detection.md`, `03-extraction-engine.md`

---

```
You are implementing Phase 1 of the SpecForge browser extension: Core Extraction.

This phase has no UI and no AI. Focus entirely on the content script layer.

Reference the following specification files in the project docs:
- 02-user-story-detection.md
- 03-extraction-engine.md

## Task

Implement the following files with full production code (no placeholders):

---

### src/types/user-story.ts

Define and export the full TypeScript interface:

```ts
interface LinkedWorkItem {
  id: string
  type: string
  title: string
  relationship: string
}

interface UserStory {
  id: string
  title: string
  description: string
  acceptanceCriteria: string
  priority?: 'Critical' | 'High' | 'Medium' | 'Low'
  tags: string[]
  areaPath?: string
  iteration?: string
  comments?: string[]
  linkedWorkItems?: LinkedWorkItem[]
  existingTestCases?: string[]
}
```

---

### src/types/messages.ts

Define and export the full message union type used across all extension contexts:

```ts
type Message =
  | { type: 'EXTRACT_STORY' }
  | { type: 'STORY_EXTRACTED'; payload: UserStory }
  | { type: 'GENERATE_TEST_CASES'; payload: UserStory }
  | { type: 'GENERATION_COMPLETE'; payload: GeneratedTestCase[] }
  | { type: 'INJECT_TEST_CASES'; payload: ValidatedTestCase[] }
  | { type: 'INJECTION_PROGRESS'; payload: InjectionProgress }
  | { type: 'INJECTION_COMPLETE'; payload: InjectionSummary }
  | { type: 'ERROR'; payload: { code: string; message: string } }

interface InjectionProgress {
  total: number
  completed: number
  current: string
  results: { title: string; id?: string; status: 'success' | 'failed' | 'pending' }[]
}

interface InjectionSummary {
  total: number
  succeeded: number
  failed: number
  results: { title: string; adoId?: string; status: 'success' | 'failed'; error?: string }[]
}
```

---

### src/utils/dom-wait.ts

Implement:

```ts
// waitForElement(selector, timeout?) → Promise<Element>
// Polls every 200ms for up to `timeout` ms (default 5000)
// Rejects with descriptive error if not found

// waitForValue(selector, timeout?) → Promise<string>
// Waits until element.textContent is non-empty
// Same polling interval and timeout

// debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T
```

---

### src/utils/html-sanitizer.ts

Implement:

```ts
// sanitizeHtml(rawHtml: string): string
// - Strips all HTML tags except: p, br, ul, ol, li, strong, em, h1-h6
// - Preserves structural whitespace
// - Collapses multiple blank lines into one
// - Returns clean plain-text-friendly string

// extractTextContent(element: Element): string
// - Recursively gets text content preserving list structure
// - Converts <li> items to "- item" format
// - Converts <br> to newline
```

---

### src/utils/safe-log.ts

Implement a logging utility that:
- Redacts any string matching API key patterns (sk-ant-*, Bearer tokens)
- Redacts PAT token patterns (base64 strings > 30 chars)
- Only logs in development mode (`process.env.NODE_ENV !== 'production'`)
- Exports: `safeLog.info()`, `safeLog.warn()`, `safeLog.error()`, `safeLog.debug()`

---

### src/services/ado/detector.ts

Implement the ADO work item detector:

```ts
// Supported work item types
const SUPPORTED_TYPES = ['User Story', 'Product Backlog Item', 'Feature', 'Requirement']

// isAdoWorkItemPage(): boolean
// - Checks URL matches https://dev.azure.com/*
// - Checks DOM contains a work item type badge
// - Returns false for boards, repos, pipelines, settings pages

// getWorkItemType(): string | null
// - Returns the work item type string from the DOM
// - Uses aria-label selectors only — no positional CSS

// createWorkItemObserver(onDetect: () => void, onLeave: () => void): MutationObserver
// - Watches for SPA navigation (URL changes without page reload)
// - Calls onDetect when a supported work item is loaded
// - Calls onLeave when navigating away
// - Uses MutationObserver on document.body + URL change events
// - Debounces callbacks by 300ms
```

---

### src/services/ado/extractor.ts

Implement the full field extraction engine:

All selectors must use aria-label attributes. Never use positional CSS selectors.

```ts
// extractTitle(): string
// extractDescription(): string  — sanitized HTML
// extractAcceptanceCriteria(): string  — sanitized HTML, preserves list structure
// extractPriority(): UserStory['priority'] | undefined
// extractTags(): string[]
// extractAreaPath(): string | undefined
// extractIteration(): string | undefined
// extractComments(): string[]
// extractLinkedWorkItems(): LinkedWorkItem[]
// extractExistingTestCases(): string[]
// extractWorkItemId(): string  — from URL or DOM header
// extractFullStory(): Promise<UserStory>
//   - Calls all extractors
//   - Waits for title to be non-empty before starting (uses dom-wait.ts)
//   - Times out at 5 seconds with descriptive error
//   - Handles missing optional fields gracefully (returns [] or undefined)
//   - Logs extraction summary via safe-log
```

---

### src/content/detector.ts

Re-export and coordinate the ADO detector. This is the content-script-facing wrapper.

---

### src/content/extractor.ts

Re-export and coordinate the ADO extractor. Content-script-facing wrapper.

---

### src/content/index.ts

The content script entry point. Must:
1. Import detector and extractor
2. On load: check if current page is a supported ADO work item
3. Set up MutationObserver for SPA navigation
4. On detection: send `STORY_EXTRACTED` message to background with extracted story
5. On leave: clean up observers
6. Handle extraction errors gracefully with `safeLog.error()`

The content script runs on: `https://dev.azure.com/*`
Configure this in the Plasmo manifest config at the top of the file.

---

### tests/unit/detector.test.ts

Write Vitest unit tests covering:
- `isAdoWorkItemPage()` returns true for valid ADO work item URLs
- `isAdoWorkItemPage()` returns false for boards/repos/pipelines URLs
- `getWorkItemType()` returns correct type from mocked DOM
- Observer debounce works correctly (use fake timers)

---

### tests/unit/extractor.test.ts

Write Vitest unit tests covering:
- `extractTitle()` reads from correct aria-label selector
- `extractTags()` returns clean string array from mocked chip elements
- `sanitizeHtml()` strips disallowed tags and preserves structure
- `extractFullStory()` handles missing optional fields without throwing
- `extractFullStory()` rejects after 5 seconds if title never appears

Mock all DOM interactions. Do not rely on a real browser in unit tests.

---

### tests/unit/safe-log.test.ts

Write Vitest unit tests covering:
- API keys (sk-ant-* patterns) are redacted from all log levels
- Long base64 strings are redacted
- Logging is suppressed in production mode

---

## After implementation, run:

```sh
git add .
git commit -m "feat(phase-1): ADO work item detection and field extraction engine"
```

## Exit Checklist

Before moving to Phase 2, verify:
- [ ] `pnpm test` passes all unit tests
- [ ] No positional CSS selectors anywhere in detector.ts or extractor.ts
- [ ] `extractFullStory()` handles all optional fields gracefully
- [ ] `safeLog` redacts sk-ant-* patterns correctly
- [ ] Content script has Plasmo manifest config scoping it to dev.azure.com
- [ ] Git commit made with message above
```

---

---

# PHASE 2 — Claude AI Integration

**Goal:** Background worker, Claude API client, 5-step prompt chain, Zod validation layer.

**Reference files:** `04-claude-ai-integration.md`, `07-validation-layer.md`, `PROMPT_CHAIN.md`

---

```
You are implementing Phase 2 of the SpecForge browser extension: Claude AI Integration.

Reference the following specification files in the project docs:
- 04-claude-ai-integration.md
- 07-validation-layer.md
- PROMPT_CHAIN.md

## Task

Implement the following files with full production code:

---

### src/types/test-case.ts

Define and export all test case types:

```ts
interface GeneratedTestCase {
  title: string
  priority: 'Low' | 'Medium' | 'High'
  preconditions: string[]
  steps: { action: string; expected: string }[]
  tags: string[]
  coverageType: string
  acReference: string | null
}

// ValidatedTestCase = GeneratedTestCase (same shape, post-Zod)
type ValidatedTestCase = GeneratedTestCase

interface CoverageAnalysis {
  highRiskAreas: string[]
  requiredCoverageTypes: string[]
  complianceConcerns: string[]
  estimatedTestCaseCount: number
  generationGuidance: string
}

interface EnrichedStory extends UserStory {
  domain: string
  ambiguities: string[]
  enriched: boolean
}
```

---

### src/schemas/test-case.zod.ts

Implement the complete Zod schema:

```ts
import { z } from 'zod'

// StepSchema — action and expected both required, min 1 char after trim
// TestCaseSchema — all fields, priority enum enforced
// GeneratedOutputSchema — z.array(TestCaseSchema), min 1 item

// Export: StepSchema, TestCaseSchema, GeneratedOutputSchema
// Export type: ValidatedTestCase (z.infer<typeof TestCaseSchema>)
```

---

### src/services/validators/test-case.schema.ts

Implement the full validation pipeline:

```ts
// validateGeneratedOutput(raw: unknown): ValidationResult
// where ValidationResult = { success: true; data: ValidatedTestCase[] }
//                        | { success: false; errors: ValidationError[] }

// ValidationError = { field: string; message: string; caseIndex?: number }

// Steps performed in order:
// 1. JSON parse check (if raw is string)
// 2. Array check
// 3. Zod schema validation per item
// 4. Step integrity: no empty action/expected after trim
// 5. Duplicate title detection (case-insensitive) — returns as warnings not errors
// 6. Empty-field prevention (title after trim)
```

---

### src/services/claude/prompt-builder.ts

Implement all 5 prompt builders from PROMPT_CHAIN.md:

```ts
// buildStep1Prompt(story: UserStory): { system: string; user: string }
// buildStep2Prompt(enriched: EnrichedStory): { system: string; user: string }
// buildStep3Prompt(enriched: EnrichedStory, analysis: CoverageAnalysis): { system: string; user: string }
// buildStep4Prompt(step3Output: string): { system: string; user: string }
// buildStep5Prompt(step4Output: string, story: EnrichedStory, analysis: CoverageAnalysis): { system: string; user: string }
```

Each prompt must exactly match the system and user prompts specified in PROMPT_CHAIN.md.

Include a prompt version header in each file:
```ts
export const PROMPT_VERSIONS = {
  step1: '1.0', step2: '1.0', step3: '1.0', step4: '1.0', step5: '1.0'
}
```

---

### src/services/claude/client.ts

Implement the Claude API client:

```ts
const CLAUDE_CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: { step1: 1000, step2: 800, step3: 4096, step4: 4096, step5: 2048 },
  temperature: 0,
  timeoutMs: 15000,
}

// callClaude(
//   prompt: { system: string; user: string },
//   maxTokens: number,
//   apiKey: string
// ): Promise<string>
// - Calls https://api.anthropic.com/v1/messages
// - Sets anthropic-version header
// - Extracts text content from response
// - Throws typed error on: timeout, 401, 429, 5xx, parse failure

// runPromptChain(story: UserStory, apiKey: string): Promise<ValidatedTestCase[]>
// Executes all 5 steps in order:
//   Step 1: Story Enrichment (skip if description > 100 chars AND AC > 100 chars)
//   Step 2: Risk & Coverage Analysis
//   Step 3: Test Case Generation
//   Step 4: Self-Validation & Correction
//   Step 5: Priority & Tagging Assignment
// Each step has retry logic:
//   - Parse failure → retry once with stricter JSON prompt
//   - Steps 1, 2: on failure after retry → proceed with defaults (don't abort)
//   - Step 3: on failure after retry → throw error (abort chain)
//   - Steps 4, 5: on failure → skip, use previous step's output
// After Step 5: run validateGeneratedOutput()
// If Zod fails: throw ValidationError with details
// Returns: ValidatedTestCase[]
```

---

### src/background/retry-queue.ts

Implement a simple promise-based retry utility:

```ts
// withRetry<T>(
//   fn: () => Promise<T>,
//   maxAttempts: number,
//   delayMs: number
// ): Promise<T>
// - Retries fn up to maxAttempts times
// - Waits delayMs between attempts (exponential backoff: delay * attempt)
// - Throws last error if all attempts fail
```

---

### src/background/message-router.ts

Implement the message router for the background worker:

```ts
// Handles incoming chrome.runtime.onMessage events
// Routes by message.type:
//   'GENERATE_TEST_CASES' → calls runPromptChain() → sends GENERATION_COMPLETE
//   On any error → sends ERROR message back to sender
// All responses sent via sendResponse callback (return true for async)
```

---

### src/background/index.ts

The background service worker entry point:

```ts
// Import and initialise message-router
// Set up chrome.runtime.onMessage listener
// Log startup (via safeLog) — this confirms the worker is alive
// Handle chrome.storage.onChanged for credential updates
```

---

### src/storage/storage.ts

Implement typed storage helpers:

```ts
// getClaudeApiKey(): Promise<string | null>
// setClaudeApiKey(key: string): Promise<void>
// getAdoPat(): Promise<string | null>
// setAdoPat(pat: string): Promise<void>
// clearAllCredentials(): Promise<void>
// getUserPreferences(): Promise<UserPreferences>
// setUserPreferences(prefs: Partial<UserPreferences>): Promise<void>

interface UserPreferences {
  defaultPriority: 'Low' | 'Medium' | 'High'
  autoSelectAll: boolean
  showAdvancedOptions: boolean
}
```

---

### tests/unit/prompt-builder.test.ts

Write Vitest unit tests covering:
- Each of the 5 prompt builders returns an object with `system` and `user` strings
- Step 3 prompt contains the story title, description, and AC
- Step 4 prompt contains the raw step 3 output
- No prompt builder throws on minimal valid input

---

### tests/unit/validation.test.ts

Write Vitest unit tests covering:
- Valid GeneratedTestCase[] passes Zod validation
- Missing `title` returns validation error
- Priority value `"Critical"` fails (not in enum)
- Empty `steps` array fails
- Empty `action` in step fails after trim
- Duplicate titles are detected and returned as warnings
- `validateGeneratedOutput()` handles non-JSON string input gracefully

---

### tests/unit/retry-queue.test.ts

Write Vitest unit tests covering:
- `withRetry` resolves on first success
- `withRetry` retries correct number of times on failure
- `withRetry` throws after max attempts exhausted
- Exponential backoff delay is applied (use fake timers)

---

## After implementation, run:

```sh
git add .
git commit -m "feat(phase-2): Claude AI 5-step prompt chain, Zod validation, background worker"
```

## Exit Checklist

Before moving to Phase 3, verify:
- [ ] `pnpm test` passes all unit tests including prompt-builder, validation, retry
- [ ] All 5 prompt builders match PROMPT_CHAIN.md specifications exactly
- [ ] `runPromptChain()` skips Step 1 when story has sufficient content
- [ ] Step 3 abort on failure works; Steps 4/5 gracefully skip
- [ ] Zod schema correctly rejects all invalid shapes
- [ ] `safeLog` used throughout — no raw `console.log` calls with credentials
- [ ] `storage.ts` exports typed helpers using `chrome.storage.local`
- [ ] Git commit made with message above
```

---

---

# PHASE 3 — UI Layer

**Goal:** Side panel, test case cards, inline editing, validation display, settings popup.

**Reference files:** `05-side-panel-ui.md`, `08-security-auth.md`

---

```
You are implementing Phase 3 of the SpecForge browser extension: UI Layer.

Reference the following specification files in the project docs:
- 05-side-panel-ui.md
- 08-security-auth.md

## Design System

Apply the SpecForge dark theme across all components. Use CSS custom properties:

```css
--sf-bg:       #0A0A0C   /* dominant background */
--sf-text:     #E5E7EB   /* primary text */
--sf-border:   #27272A   /* borders and dividers */
--sf-blue:     #3B82F6   /* primary CTA, active states */
--sf-mint:     #10B981   /* success, valid, injected */
--sf-violet:   #8B5CF6   /* AI generation states, tags */
--sf-error:    #EF4444   /* errors, failures */
--sf-warning:  #F59E0B   /* warnings, pending */
```

Use Tailwind's `sf-*` colour tokens (configured in Phase 0) where possible.
For all surfaces, default background is `bg-sf-bg`. Default text is `text-sf-text`.
Card backgrounds should be slightly elevated: use `#111113` (define as `bg-sf-surface`).

Font: Use `font-mono` for step content. Use system sans-serif for card titles and labels.

---

## Task

Implement the following with full production-quality React + TypeScript code:

---

### src/sidepanel/store.ts

Implement the Zustand store with these slices:

```ts
type PanelState =
  | 'idle'          // story detected, waiting for user to click generate
  | 'extracting'    // extraction in progress
  | 'generating'    // Claude chain in progress
  | 'results'       // test cases ready for review
  | 'injecting'     // injection in progress
  | 'complete'      // all done
  | 'error'         // terminal error

interface SidePanelStore {
  state: PanelState
  detectedStory: UserStory | null
  testCases: ValidatedTestCase[]
  editedTestCases: ValidatedTestCase[]   // user edits, separate from original
  selectedIndices: Set<number>
  validationErrors: Record<number, string[]>  // index → errors
  injectionProgress: InjectionProgress | null
  injectionSummary: InjectionSummary | null
  error: { code: string; message: string } | null
  hasUnsavedEdits: boolean

  // Actions
  setStory: (story: UserStory) => void
  setGenerating: () => void
  setResults: (cases: ValidatedTestCase[]) => void
  updateTestCase: (index: number, updated: Partial<ValidatedTestCase>) => void
  toggleSelect: (index: number) => void
  selectAll: () => void
  deselectAll: () => void
  setInjecting: () => void
  updateInjectionProgress: (progress: InjectionProgress) => void
  setComplete: (summary: InjectionSummary) => void
  setError: (error: { code: string; message: string }) => void
  reset: () => void
}
```

---

### src/sidepanel/components/TestCaseCard.tsx

Implement an expandable test case card:

**Collapsed state:**
```
☑  TC-01: Successful login with valid credentials
   High · 4 steps · smoke positive
```

**Expanded state:**
Full inline editor for:
- Title (text input)
- Priority (dropdown: Low / Medium / High)
- Preconditions (add/edit/delete list items)
- Steps (action + expected, add/remove rows, reorder not required)
- Tags (chip input: add/remove)

**Visual design:**
- Card border: `var(--sf-border)` default, `var(--sf-blue)` when selected, `var(--sf-error)` when has validation errors
- Priority badge: High=`sf-error`, Medium=`sf-warning`, Low=`sf-mint`
- Coverage type badge: always `sf-violet` background
- Tag chips: `sf-border` background, `sf-violet` text

**Behaviour:**
- Checkbox toggles `selectedIndices` in store
- Expand/collapse via chevron button
- All edits call `updateTestCase(index, changes)` in store
- Validation errors shown inline below relevant field

Props:
```ts
interface TestCaseCardProps {
  index: number
  testCase: ValidatedTestCase
  selected: boolean
  errors: string[]
  onToggle: (index: number) => void
  onUpdate: (index: number, updated: Partial<ValidatedTestCase>) => void
}
```

---

### src/sidepanel/components/StepEditor.tsx

A focused component for editing a single test step row:

```
| Action [_______________________] | Expected [_______________________] | 🗑 |
```

- Each field is a growing textarea (auto-resize)
- Delete button removes the step
- New step button at the bottom of the list: `[ + Add Step ]`

Props:
```ts
interface StepEditorProps {
  steps: { action: string; expected: string }[]
  onChange: (steps: { action: string; expected: string }[]) => void
}
```

---

### src/sidepanel/components/ValidationBanner.tsx

A banner shown at the top of the side panel when validation errors exist:

```
⚠ 2 test cases have validation errors and cannot be injected.
  Fix errors or deselect these cases to proceed.
```

- Background: subtle `sf-error` tint (`rgba(239,68,68,0.1)`)
- Border-left: `3px solid var(--sf-error)`
- Hidden when no errors in selected cases

Props:
```ts
interface ValidationBannerProps {
  errorCount: number
  affectedCaseCount: number
}
```

---

### src/sidepanel/components/InjectionProgress.tsx

Live injection progress display:

```
Injecting test cases...

✅ TC-01: Created (#4521)
✅ TC-02: Created (#4522)
⏳ TC-03: Injecting steps...    ← pulsing animation
⬜ TC-04: Pending
⬜ TC-05: Pending
```

After completion, show summary:

```
✅ 4 of 5 test cases created successfully.

Created:  #4521 · #4522 · #4523 · #4524
Failed:   TC-03 — Step injection timed out.
          [ View Details ]
```

Props:
```ts
interface InjectionProgressProps {
  progress: InjectionProgress | null
  summary: InjectionSummary | null
}
```

---

### src/sidepanel/index.tsx

The main side panel entry point. Compose all components.

**Layout:**
```
┌─────────────────────────────────┐
│ ⚡ SpecForge            ⚙️     │  ← header, bg: #0A0A0C
├─────────────────────────────────┤
│ Story: #1234 — [title]          │  ← story chip, shown when detected
├─────────────────────────────────┤
│ [Generate AI Test Cases]        │  ← sf-blue button, full width
│ [Regenerate]                    │  ← sf-violet ghost button, only if results
├─────────────────────────────────┤
│ <ValidationBanner />            │  ← only if errors in selected
├─────────────────────────────────┤
│ Generated Test Cases (5)        │
│ [Select All] [Deselect All]     │
│                                 │
│ <TestCaseCard /> × N            │
├─────────────────────────────────┤
│ [Inject Selected (N)]           │  ← sf-mint button, full width, disabled if errors
└─────────────────────────────────┘
```

**State-driven rendering:**
- `idle`: show "Waiting for Azure DevOps User Story..." placeholder with SpecForge logo
- `extracting`: show spinner + "Extracting story data..."
- `generating`: show spinner + "Generating test cases with AI..." + violet pulsing dot
- `results`: show full card list + controls
- `injecting`: show `<InjectionProgress />`
- `complete`: show `<InjectionProgress summary />` + "Done" state
- `error`: show error card with message + retry button

**Message listener:**
Listen for `chrome.runtime.onMessage` for:
- `STORY_EXTRACTED` → call `store.setStory()`, show Idle→Ready state
- `GENERATION_COMPLETE` → call `store.setResults()`
- `INJECTION_PROGRESS` → call `store.updateInjectionProgress()`
- `INJECTION_COMPLETE` → call `store.setComplete()`
- `ERROR` → call `store.setError()`

**Generate button click:**
Send `GENERATE_TEST_CASES` message to background with `store.detectedStory`

**Regenerate confirmation:**
If `store.hasUnsavedEdits`, show an inline confirmation before regenerating:
```
⚠ You have unsaved edits. Regenerate will discard them.
[ Cancel ] [ Regenerate Anyway ]
```

---

### src/popup/Settings.tsx

The settings panel rendered inside the extension popup.

**Sections:**

#### Credentials
```
Claude API Key
[ ●●●●●●●●●●●●●●●●●● ] [👁 Show] [✓ Save]

Azure DevOps PAT
[ ●●●●●●●●●●●●●●●●●● ] [👁 Show] [✓ Save]

[ Clear All Credentials ]   ← confirmation required
```

#### Preferences
```
Default Priority
[ Medium ▾ ]

Auto-select all generated cases
[ ● ] On

Show advanced generation options
[ ○ ] Off
```

- All saves go to `storage.ts` helpers
- Show success toast on save: "Saved ✓" (sf-mint, fades after 2s)
- Show error toast on failure
- "Clear All Credentials" requires a confirmation step before deletion

---

### src/popup/index.tsx

Popup entry point. Renders `<Settings />` inside a styled container matching the dark theme.

Width: `360px`
Background: `var(--sf-bg)`

---

## After implementation, run:

```sh
git add .
git commit -m "feat(phase-3): side panel UI, test case cards, inline editing, settings popup"
```

## Exit Checklist

Before moving to Phase 4, verify:
- [ ] Side panel renders without errors in Chrome extension dev mode
- [ ] All 5 panel states (idle, generating, results, injecting, complete) render correctly
- [ ] Test case cards expand and collapse correctly
- [ ] All fields editable inline (title, priority, steps, tags)
- [ ] ValidationBanner shows and hides based on selection errors
- [ ] Inject button disabled when selected cases have errors
- [ ] Regenerate shows confirmation when edits exist
- [ ] Settings panel saves and retrieves credentials from chrome.storage.local
- [ ] All colours match the sf design tokens
- [ ] Git commit made with message above
```

---

---

# PHASE 4 — Injection Engine

**Goal:** Full ADO test case form automation — populate fields, inject steps, link parent, save.

**Reference files:** `06-injection-engine.md`

---

```
You are implementing Phase 4 of the SpecForge browser extension: Injection Engine.

Reference the following specification file in the project docs:
- 06-injection-engine.md

## Task

Implement the following with full production code:

---

### src/services/injection/steps-grid.ts

Implement the 3-layer ADO test steps grid injection strategy:

```ts
// injectStep(
//   stepIndex: number,
//   action: string,
//   expected: string
// ): Promise<void>
//
// Tries layers in order:
//   Layer 1: Keyboard + Focus simulation
//     - Focus the action cell, type action, Tab to expected cell, type expected, Enter for next row
//   Layer 2: Clipboard-assisted insertion
//     - Copy text to clipboard, focus cell, paste
//   Layer 3: Direct DOM value + event dispatch
//     - Set .value directly, dispatch 'input' and 'change' events
//
// After each layer: verify the value appeared in the DOM before proceeding
// If all 3 layers fail: throw StepInjectionError with step index + content
//
// waitForStepRowReady(rowIndex: number): Promise<void>
//   - Uses MutationObserver on the steps grid container
//   - Resolves when the new row is available
//   - Falls back to 2-second timeout

// injectAllSteps(steps: { action: string; expected: string }[]): Promise<void>
//   - Injects steps sequentially
//   - Awaits waitForStepRowReady between each step
//   - Logs per-step success via safeLog
```

---

### src/services/injection/injector.ts

Implement the full ADO test case form injection engine:

```ts
// injectTestCase(
//   testCase: ValidatedTestCase,
//   parentStoryId: string,
//   onProgress?: (step: string) => void
// ): Promise<{ adoId: string }>
//
// Steps in order:
//   1. Navigate to new ADO test case form (open in current tab or new tab)
//      URL pattern: https://dev.azure.com/{org}/{project}/_workitems/create/Test%20Case
//   2. Wait for form to load: waitForElement('[aria-label="Title field"]')
//   3. Populate title field
//   4. Set priority dropdown
//   5. Set area path (if available)
//   6. Set iteration (if available)
//   7. Inject tags
//   8. Call injectAllSteps(testCase.steps)
//   9. Link to parent story (parentStoryId) via Relations panel
//   10. Save (click Save button or keyboard shortcut)
//   11. Wait for new work item ID to appear in URL or header
//   12. Return { adoId: string }
//
// All selectors must use aria-label. Never use positional CSS.
// Each step has retry: up to 3 attempts, 500ms delay between.
// Throws InjectionError with { step: string; reason: string } on terminal failure.

// injectAllTestCases(
//   testCases: ValidatedTestCase[],
//   parentStoryId: string,
//   onProgress: (progress: InjectionProgress) => void
// ): Promise<InjectionSummary>
//
// - Injects each test case sequentially (not parallel — avoids ADO race conditions)
// - Calls onProgress after each case completes or fails
// - Continues to next case even if one fails
// - Returns full InjectionSummary
```

---

### src/content/toolbar.ts

Implement the toolbar button injector:

```ts
// injectToolbarButton(onClick: () => void): void
// - Creates a styled button matching SpecForge theme
// - Inserts it into the ADO work item toolbar area
// - Uses aria-label selector to find the toolbar container
// - Removes existing button if present (prevents duplicates on SPA nav)
// - Button text: "⚡ Generate Tests"
// - Button style: background sf-blue, text white, border-radius 4px

// removeToolbarButton(): void
// - Removes the injected button if present

// Styling must not conflict with ADO's own styles
// Use a unique data attribute: data-specforge="toolbar-btn"
```

---

### Update src/content/index.ts

Update the content script to:

1. Import and use `injectToolbarButton()` when a supported work item is detected
2. Remove the toolbar button on SPA navigation away from a work item
3. When the toolbar button is clicked:
   - Send `EXTRACT_STORY` message to background
   - Background responds with `STORY_EXTRACTED` (already handled in Phase 2)
   - Open the side panel via `chrome.sidePanel.open()`
4. Listen for `INJECT_TEST_CASES` messages from the side panel:
   - Call `injectAllTestCases()` with the received cases
   - Send `INJECTION_PROGRESS` messages back to side panel via `chrome.runtime.sendMessage`
   - Send `INJECTION_COMPLETE` when done

---

### Update src/background/message-router.ts

Add routing for:
- `INJECT_TEST_CASES` → forward to content script (injection happens in content script context)
- `INJECTION_PROGRESS` → forward to side panel
- `INJECTION_COMPLETE` → forward to side panel

Background worker forwards these rather than handling them directly, since DOM automation must run in the content script.

---

### tests/unit/injector.test.ts

Write Vitest unit tests (mocking all DOM interactions) covering:
- `injectTestCase()` calls `injectAllSteps()` with correct steps
- `injectTestCase()` retries up to 3 times when a selector is not found
- `injectAllTestCases()` continues after one case fails
- `InjectionSummary` correctly counts succeeded and failed cases
- `waitForStepRowReady()` resolves after MutationObserver fires
- `waitForStepRowReady()` falls back to timeout after 2 seconds

---

### tests/unit/toolbar.test.ts

Write Vitest unit tests covering:
- `injectToolbarButton()` creates an element with correct data attribute
- `injectToolbarButton()` removes existing button before adding new one
- `removeToolbarButton()` removes the element if present
- `removeToolbarButton()` does nothing if not present

---

## After implementation, run:

```sh
git add .
git commit -m "feat(phase-4): ADO injection engine, steps grid automation, toolbar button"
```

## Exit Checklist

Before moving to Phase 5, verify:
- [ ] `pnpm test` passes all unit tests including injector and toolbar
- [ ] All DOM selectors use aria-label — no positional CSS anywhere
- [ ] 3-layer step injection strategy implemented with fallback chain
- [ ] `injectAllTestCases()` continues when one case fails
- [ ] `InjectionProgress` messages sent after each case
- [ ] Toolbar button rendered and removed correctly on SPA navigation
- [ ] Side panel `chrome.sidePanel.open()` called on toolbar button click
- [ ] Git commit made with message above
```

---

---

# PHASE 5 — Hardening

**Goal:** Retry resilience, Firefox build, selector abstraction, E2E tests, performance verification, README.

**Reference files:** `10-browser-compatibility.md`, `11-error-handling-performance.md`, `12-roadmap-risks.md`

---

```
You are implementing Phase 5 of the SpecForge browser extension: Hardening.

Reference the following specification files in the project docs:
- 10-browser-compatibility.md
- 11-error-handling-performance.md
- 12-roadmap-risks.md

## Task

---

### 1. Selector Abstraction Layer

Create `src/services/ado/selectors.ts`:

```ts
// Single source of truth for ALL ADO DOM selectors.
// Import this file everywhere instead of hardcoding selector strings.

export const ADO_SELECTORS = {
  // Detection
  workItemTypeBadge:    '[aria-label="Work item type"]',
  workItemTitle:        '[aria-label="Title field"]',

  // Extraction
  descriptionField:     '[aria-label="Description"]',
  acceptanceCriteria:   '[aria-label="Acceptance Criteria"]',
  priorityField:        '[aria-label="Priority"]',
  tagsField:            '[aria-label="Tags"]',
  tagItem:              '[aria-label="Tags"] .tag-item',
  areaPath:             '[aria-label="Area Path"]',
  iteration:            '[aria-label="Iteration"]',
  commentItem:          '.discussion-item .comment-body',
  linkedItems:          '.related-work-items-control .work-item-link',
  existingTestCases:    '.test-cases-control .test-case-link',

  // Injection
  newTestCaseSaveBtn:   '[aria-label="Save work item"]',
  testStepsGrid:        '[aria-label="Test steps"]',
  testStepActionCell:   (index: number) => `[data-row-index="${index}"] [aria-label="Action"]`,
  testStepExpectedCell: (index: number) => `[data-row-index="${index}"] [aria-label="Expected Result"]`,
  priorityDropdown:     '[aria-label="Priority"]',
  relationsTab:         '[aria-label="Links"]',
  addLinkButton:        '[aria-label="Add link"]',
  toolbar:              '[aria-label="Work item toolbar"]',
} as const
```

Update all existing files (`detector.ts`, `extractor.ts`, `injector.ts`, `toolbar.ts`, `steps-grid.ts`) to import from this file instead of using hardcoded strings.

---

### 2. Error Handling Improvements

Create `src/utils/errors.ts`:

```ts
// Define typed error classes:

class SpecForgeError extends Error {
  constructor(public code: string, message: string) { super(message) }
}

class ExtractionError extends SpecForgeError {}        // code: EXTRACTION_*
class GenerationError extends SpecForgeError {}        // code: GENERATION_*
class ValidationError extends SpecForgeError {         // code: VALIDATION_*
  constructor(code: string, message: string, public errors: string[]) { super(code, message) }
}
class InjectionError extends SpecForgeError {          // code: INJECTION_*
  constructor(code: string, message: string, public step?: string) { super(code, message) }
}

// Error code constants:
export const ERROR_CODES = {
  EXTRACTION_TIMEOUT:      'EXTRACTION_TIMEOUT',
  EXTRACTION_FIELD_MISSING:'EXTRACTION_FIELD_MISSING',
  GENERATION_API_FAILURE:  'GENERATION_API_FAILURE',
  GENERATION_QUOTA:        'GENERATION_QUOTA_EXCEEDED',
  GENERATION_AUTH:         'GENERATION_AUTH_FAILURE',
  GENERATION_TIMEOUT:      'GENERATION_TIMEOUT',
  GENERATION_INVALID_JSON: 'GENERATION_INVALID_JSON',
  GENERATION_EMPTY:        'GENERATION_EMPTY_RESPONSE',
  VALIDATION_SCHEMA:       'VALIDATION_SCHEMA_FAILURE',
  INJECTION_SELECTOR:      'INJECTION_SELECTOR_NOT_FOUND',
  INJECTION_STEP:          'INJECTION_STEP_FAILED',
  INJECTION_SAVE:          'INJECTION_SAVE_FAILED',
  INJECTION_PERMISSION:    'INJECTION_PERMISSION_DENIED',
} as const

// User-friendly error messages for each code:
export const ERROR_MESSAGES: Record<string, string> = {
  [ERROR_CODES.GENERATION_QUOTA]: 'Claude API quota exceeded. Check your usage at console.anthropic.com.',
  [ERROR_CODES.GENERATION_AUTH]: 'Invalid Claude API key. Update it in SpecForge Settings.',
  [ERROR_CODES.GENERATION_TIMEOUT]: 'AI generation timed out. Please try again.',
  // ... all codes
}
```

Update `claude-client.ts` and `injector.ts` to throw typed errors using these classes and codes.

Update `src/sidepanel/index.tsx` to display `ERROR_MESSAGES[error.code]` in the error state (with "Check Settings" action where appropriate).

---

### 3. Firefox Compatibility

Install webextension-polyfill:
```sh
pnpm add webextension-polyfill
pnpm add -D @types/webextension-polyfill
```

Create `src/utils/browser-api.ts`:

```ts
// Unified browser API wrapper
import browser from 'webextension-polyfill'

export const browserAPI = {
  storage: browser.storage,
  runtime: browser.runtime,
  tabs: browser.tabs,
  sidePanel: (chrome as any).sidePanel ?? null, // Chrome-only; Firefox uses sidebar_action
}
```

Update all files that currently call `chrome.*` directly to use `browserAPI.*` instead (except sidePanel which remains Chrome-only for MVP).

Create `src/sidepanel/firefox-sidebar.tsx`:
- A lightweight sidebar entry point for Firefox
- Same content as `index.tsx` but registered as `sidebar_action` in the Firefox manifest

Update `package.json` Firefox build script:
```sh
plasmo build --target=firefox-mv2
```

Verify the Firefox build completes without errors.

---

### 4. Performance Instrumentation

Create `src/utils/perf.ts`:

```ts
// Simple performance timing utility
// perfMark(label: string): void  — records start time
// perfMeasure(label: string): number  — returns elapsed ms since mark
// logPerfMetric(label: string, ms: number): void  — safeLog.info only in dev

// Wrap key operations:
// - Story extraction: mark before extractFullStory(), measure after
// - AI generation: mark before runPromptChain(), measure after
// - Per-case injection: mark/measure each injectTestCase()
// Alert to side panel if generation > 15000ms or injection > 10000ms
```

Add perf instrumentation to `extractor.ts`, `claude-client.ts`, and `injector.ts`.

---

### 5. E2E Tests

Create `tests/e2e/full-workflow.spec.ts`:

```ts
// Playwright E2E test suite
// Note: These tests require a real Azure DevOps environment and valid credentials.
// Set via environment variables: ADO_URL, ADO_PAT, CLAUDE_API_KEY
// Skip gracefully if env vars not set.

// Test: Extension loads on ADO User Story page
//   - Load extension in Chrome
//   - Navigate to ADO_URL (a real User Story)
//   - Assert: SpecForge toolbar button appears within 2 seconds

// Test: Story extraction completes
//   - Click SpecForge toolbar button
//   - Assert: Side panel opens
//   - Assert: Story title appears in side panel within 3 seconds

// Test: Generate test cases
//   - Click "Generate AI Test Cases"
//   - Assert: Generating state shown
//   - Assert: Test case cards appear within 20 seconds
//   - Assert: At least 1 test case card rendered
//   - Assert: At least 1 positive and 1 negative test case

// Test: Inline editing
//   - Expand first test case card
//   - Edit the title field
//   - Assert: Updated title appears in card

// Test: Validation error prevents injection
//   - Clear a step's action field
//   - Assert: Validation error shown on card
//   - Assert: Inject button is disabled

// IMPORTANT: Do NOT run injection against a real ADO in CI.
// The injection test is marked as `.skip` by default.
// Only run manually with explicit flag: ENABLE_INJECTION_TEST=true
```

---

### 6. README

Create `README.md` in the project root with the following sections:

#### Header
```md
# ⚡ SpecForge

> AI-powered QA engineering extension for Azure DevOps.
> Generate enterprise-grade test cases from User Stories in seconds.
```

#### Sections to include:

**Overview**
Brief product description (2–3 sentences). Core value proposition.

**Features**
Bulleted feature list covering all MVP capabilities.

**Browser Support**
Table: Chrome ✅, Edge ✅, Firefox ✅, Safari 🔜

**Tech Stack**
Table: Plasmo, React, TypeScript, Tailwind, Zustand, Zod, Vitest, Playwright

**Getting Started**
Step-by-step setup:
1. Clone the repo
2. `pnpm install`
3. `pnpm dev`
4. Load unpacked extension in Chrome from `build/chrome-mv3-dev`
5. Open Azure DevOps → navigate to a User Story
6. Click ⚡ SpecForge button

**Configuration**
How to enter the Claude API key and ADO PAT via the Settings popup.

**Building**
Commands for all browsers:
```sh
pnpm build:chrome
pnpm build:firefox
pnpm build:edge
```

**Testing**
```sh
pnpm test             # unit tests
pnpm test:coverage    # with coverage report
pnpm test:e2e         # E2E (requires ADO env vars)
```

**Architecture**
Brief description of the 4 extension contexts (content script, background, side panel, popup) and the 5-step AI prompt chain.

**AI Prompt Chain**
Table summarising the 5 steps: Enrichment → Risk Analysis → Generation → Self-Validation → Tagging.

**Design System**
Colour palette table with hex values and usage descriptions.

**Project Structure**
The full folder tree from `09-technical-architecture.md`.

**Contributing**
Basic notes: TypeScript strict mode, no positional CSS selectors, run tests before committing.

**License**
MIT

---

## After implementation, run:

```sh
pnpm test
pnpm build:chrome
pnpm build:firefox
git add .
git commit -m "feat(phase-5): selector abstraction, Firefox compat, E2E tests, error hardening, README"
```

## Exit Checklist

Before declaring MVP complete, verify:
- [ ] `pnpm test` passes all unit tests (all phases)
- [ ] `pnpm build:chrome` succeeds without errors
- [ ] `pnpm build:firefox` succeeds without errors
- [ ] `pnpm build:edge` succeeds without errors
- [ ] All ADO selectors centralised in `selectors.ts` — no hardcoded strings elsewhere
- [ ] All `chrome.*` calls replaced with `browserAPI.*`
- [ ] Typed error classes used throughout — no generic `throw new Error(...)`
- [ ] E2E tests run against real ADO (with env vars set) and extraction test passes
- [ ] Performance instrumentation logs extraction and generation times in dev mode
- [ ] README is complete with all required sections
- [ ] Git commit made with message above
```

---

---

## Summary

| Phase | Focus | Commit Message |
|-------|-------|----------------|
| 0 | Scaffold | `chore: scaffold SpecForge project` |
| 1 | Detection + Extraction | `feat(phase-1): ADO work item detection and field extraction engine` |
| 2 | Claude AI + Validation | `feat(phase-2): Claude AI 5-step prompt chain, Zod validation, background worker` |
| 3 | UI Layer | `feat(phase-3): side panel UI, test case cards, inline editing, settings popup` |
| 4 | Injection Engine | `feat(phase-4): ADO injection engine, steps grid automation, toolbar button` |
| 5 | Hardening + README | `feat(phase-5): selector abstraction, Firefox compat, E2E tests, error hardening, README` |

---

## Tips for Claude Code

- Always paste one phase at a time. Never combine phases.
- If Claude Code asks clarifying questions, answer concisely and let it continue.
- After each phase, run `pnpm test` and `pnpm build:chrome` before proceeding.
- If a build fails, paste the error output and ask Claude Code to fix it before moving on.
- Keep the feature files (01–12) open in a separate editor tab for reference during each phase.