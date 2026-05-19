# PRD — SpecForge Extension

## Product Name

**SpecForge**

## Product Type

Cross-browser AI-powered QA engineering extension.

## Supported Browsers

* Google Chrome
* Microsoft Edge
* Mozilla Firefox
* Safari (Phase 2 support)

---

# 1. Product Overview

SpecForge is an AI-powered browser extension that integrates with Azure DevOps (ADO) to automatically generate structured QA test cases from User Stories using Claude AI.

The extension detects Azure DevOps work items, extracts all relevant requirements data, sends structured payloads to Claude using the predefined skill:

```text
ado-test-case-creator
```

Claude returns structured test cases which SpecForge automatically injects into Azure DevOps Test Case forms.

The product focuses on:

* reducing QA effort
* increasing requirement coverage
* standardizing test design
* accelerating SDLC workflows
* improving traceability between requirements and validation

---

# 2. Product Vision

Transform Azure DevOps User Stories into enterprise-grade test cases in seconds using deterministic AI-assisted workflows.

---

# 3. Goals

## Business Goals

* Reduce manual test design effort
* Improve QA consistency
* Increase release velocity
* Enable scalable AI-assisted QA workflows
* Create reusable QA engineering intelligence

---

## User Goals

* Generate high-quality test cases quickly
* Reduce repetitive work
* Improve edge-case coverage
* Maintain human review control
* Avoid switching between tools

---

# 4. Target Users

## Primary Users

* QA Engineers
* SDETs
* Test Leads
* Manual Testers

---

## Secondary Users

* Business Analysts
* Product Owners
* Engineering Managers

---

# 5. Core Workflow

```text
User opens Azure DevOps User Story
            ↓
SpecForge detects supported work item
            ↓
Extracts story data
            ↓
Calls Claude skill:
ado-test-case-creator
            ↓
Receives structured test cases
            ↓
Displays editable preview
            ↓
Creates Azure DevOps Test Cases
            ↓
Injects test steps automatically
            ↓
User reviews and saves
```

---

# 6. Core Features

## MVP Features

### 6.1 User Story Detection

Detect supported Azure DevOps work item pages automatically.

Supported:

* User Story
* Product Backlog Item
* Feature
* Requirement

---

### 6.2 Intelligent Story Extraction

Extract:

* Title
* Description
* Acceptance Criteria
* Priority
* Tags
* Area Path
* Iteration
* Comments
* Linked Work Items
* Existing Test Cases

---

### 6.3 Claude AI Integration

Use Claude API with:

* deterministic prompts
* strict JSON schema
* predefined Claude skill:

```text
ado-test-case-creator
```

---

### 6.4 AI Test Case Generation

Generate:

* positive test cases
* negative test cases
* edge cases
* validation scenarios
* workflow coverage
* business rule validation

---

### 6.5 Side Panel Preview

Allow:

* review generated tests
* edit before injection
* regenerate
* selective creation

---

### 6.6 Automated ADO Injection

Automatically:

* open new test case form
* populate fields
* inject steps
* set metadata
* save draft

---

# 7. Non-Goals (MVP)

Excluded from initial release:

* OCR attachments parsing
* image analysis
* multi-story bulk processing
* Jira integration
* test automation code generation
* AI-based deduplication
* regression suite optimization

---

# 8. Technical Architecture

# High-Level Architecture

```text
┌─────────────────────────────┐
│ Browser Extension           │
│ (SpecForge)                 │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Azure DevOps Web Page       │
│ Content Script Automation   │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Extraction Engine           │
│ Story Parsing Layer         │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Claude API Connector        │
│ Skill: ado-test-case-creator│
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Validation Layer            │
│ Zod Schema Validation       │
└──────────────┬──────────────┘
               │
               ▼
┌─────────────────────────────┐
│ Injection Engine            │
│ ADO Form Automation         │
└─────────────────────────────┘
```

---

# 9. Technology Stack

## Frontend

| Layer               | Technology   |
| ------------------- | ------------ |
| Extension Framework | Plasmo       |
| UI Framework        | React        |
| Language            | TypeScript   |
| Styling             | Tailwind CSS |
| State Management    | Zustand      |

---

## Validation

| Purpose           | Technology |
| ----------------- | ---------- |
| Schema Validation | Zod        |

---

## AI Integration

| Purpose     | Technology            |
| ----------- | --------------------- |
| AI Provider | Claude API            |
| Skill       | ado-test-case-creator |

---

## Testing

| Purpose      | Technology |
| ------------ | ---------- |
| E2E Testing  | Playwright |
| Unit Testing | Vitest     |

---

# 10. Browser Support Architecture

## Chrome

Primary platform.

---

## Microsoft Edge

Chromium-compatible.
Minimal changes required.

---

## Mozilla Firefox

Supported through:

* WebExtensions compatibility layer
* Manifest adaptation

Potential limitations:

* service worker differences
* side panel APIs

---

## Safari

Phase 2 support.

Requires:

* Safari Web Extensions conversion
* Apple developer packaging
* additional permission handling

---

# 11. Extension Architecture

# Components

## 11.1 Content Script

Responsibilities:

* detect Azure DevOps pages
* extract work item data
* inject UI controls
* automate forms

Runs on:

```text
https://dev.azure.com/*
```

---

## 11.2 Background Worker

Responsibilities:

* Claude API orchestration
* retry handling
* request queue
* browser messaging
* storage access

---

## 11.3 Side Panel

Responsibilities:

* display generated tests
* editing
* regeneration
* approval workflow

---

## 11.4 Storage Layer

Stores:

* PAT tokens
* Claude API key
* prompt templates
* user settings

---

# 12. Folder Structure

```text
specforge/
├── src/
│   ├── background/
│   ├── content/
│   ├── sidepanel/
│   ├── popup/
│   ├── services/
│   │   ├── ado/
│   │   ├── claude/
│   │   ├── prompts/
│   │   ├── parser/
│   │   ├── injection/
│   │   └── validators/
│   ├── schemas/
│   ├── storage/
│   ├── types/
│   └── utils/
├── tests/
├── assets/
└── package.json
```

---

# 13. Azure DevOps Automation Strategy

## Approach

Use:

* DOM automation
* stable accessibility selectors
* keyboard simulation
* event-driven interactions

Avoid:

* fragile CSS chains
* deep nested selectors

---

## Recommended Selectors

Preferred:

```typescript
document.querySelector('[aria-label="Title field"]')
```

Avoid:

```typescript
div:nth-child(5) > span > input
```

---

# 14. Claude AI Strategy

## Claude Invocation

Use:

* structured prompt templates
* deterministic JSON output
* strict schema enforcement

---

## Claude Skill

```text
ado-test-case-creator
```

---

## Prompt Objectives

Generate:

* functional tests
* negative scenarios
* edge cases
* business validation
* workflow coverage
* high-risk paths

---

# 15. Data Contracts

# User Story Model

```typescript
interface UserStory {
  id: string
  title: string
  description: string
  acceptanceCriteria: string
  priority?: string
  tags: string[]
  comments?: string[]
}
```

---

# Test Case Model

```typescript
interface TestCase {
  title: string
  priority: "Low" | "Medium" | "High"
  preconditions: string[]
  steps: {
    action: string
    expected: string
  }[]
  tags: string[]
}
```

---

# 16. Validation Layer

All AI output must pass:

* JSON validation
* schema validation
* step integrity checks
* duplicate detection
* empty-field prevention

Validation failures must:

* block injection
* display actionable errors

---

# 17. Injection Engine

# Responsibilities

* create test case form
* populate metadata
* inject steps
* save draft
* handle retries

---

# Injection Challenges

Most difficult area:

* ADO test steps grid

Solution:

* keyboard event simulation
* clipboard-assisted insertion
* async UI synchronization

---

# 18. Security Requirements

## Authentication

Use:

* Azure DevOps PAT
* Claude API key

Stored using:

```text
chrome.storage.local
```

Optional future enhancement:

* encrypted local storage

---

## Data Protection

Must never transmit:

* secrets
* credentials
* customer-sensitive data

---

## Logging

Sensitive data must be redacted from:

* logs
* telemetry
* diagnostics

---

# 19. Performance Requirements

## Target Performance

| Action           | Target       |
| ---------------- | ------------ |
| Story Extraction | < 2 seconds  |
| AI Generation    | < 15 seconds |
| Injection        | < 10 seconds |

---

# 20. UX Requirements

## User Experience Goals

* minimal clicks
* transparent AI behavior
* editable outputs
* no context switching

---

## UI Components

### Toolbar Button

```text
Generate AI Test Cases
```

---

### Side Panel

Contains:

* generated cases
* regenerate button
* edit controls
* inject controls
* validation errors

---

# 21. Error Handling

## AI Failures

Handle:

* malformed JSON
* API failures
* timeout
* quota limits

---

## ADO Failures

Handle:

* selector failures
* DOM changes
* permission issues
* form synchronization delays

---

# 22. Telemetry (Optional Future)

Possible analytics:

* generation success rate
* average generation time
* injection failure rate
* test creation metrics

Must be opt-in.

---

# 23. Scalability Roadmap

## Phase 2

* Safari support
* attachment analysis
* bulk generation
* smarter traceability

---

## Phase 3

* Jira support
* AI automation code generation
* risk-based testing
* regression intelligence
* test coverage mapping

---

# 24. Risks

## Highest Technical Risk

Azure DevOps DOM instability.

Mitigation:

* selector abstraction layer
* centralized injector engine
* automated UI compatibility tests

---

## AI Risks

* hallucinated steps
* invalid formatting
* duplicate cases

Mitigation:

* schema validation
* deterministic prompting
* review workflow

---

# 25. Success Metrics

## Primary KPIs

* reduction in manual QA effort
* successful test creation rate
* generation accuracy
* average workflow time reduction

---

# 26. Development Phases

## Phase 1 — Core Extraction

* detect ADO story
* extract fields

---

## Phase 2 — Claude Integration

* call ado-test-case-creator
* receive JSON output

---

## Phase 3 — UI Layer

* side panel
* editing
* approvals

---

## Phase 4 — Injection Engine

* create ADO test cases
* inject steps

---

## Phase 5 — Hardening

* retries
* selector resilience
* browser compatibility
* performance optimization

---

# 27. Final Positioning

## Product Positioning

SpecForge is not a chatbot.

SpecForge is:

> an AI-assisted QA engineering workflow platform embedded directly into Azure DevOps.

Core value:

* structured extraction
* deterministic AI generation
* automated workflow execution
* enterprise-grade QA acceleration
