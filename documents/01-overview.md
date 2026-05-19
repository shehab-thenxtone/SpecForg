# SpecForge — Product Overview & Vision

## Product Name
**SpecForge**

## Product Type
Cross-browser AI-powered QA engineering extension.

## Tagline
> An AI-assisted QA engineering workflow platform embedded directly into Azure DevOps.

---

## Product Summary

SpecForge is a browser extension that integrates with Azure DevOps (ADO) to automatically generate structured QA test cases from User Stories using Claude AI.

The extension:
1. Detects Azure DevOps work item pages
2. Extracts all relevant requirement fields
3. Sends a structured payload to Claude via the `ado-test-case-creator` skill
4. Receives structured test cases
5. Injects them directly into ADO Test Case forms

---

## Product Vision

Transform Azure DevOps User Stories into enterprise-grade test cases in seconds using deterministic, AI-assisted workflows — without leaving the browser.

---

## Business Goals

| Goal | Description |
|------|-------------|
| Reduce manual effort | Minimize repetitive test design work for QA engineers |
| Improve consistency | Standardize test structure and coverage patterns |
| Increase release velocity | Accelerate SDLC through automated QA workflows |
| Enable scalability | Build reusable AI-driven QA intelligence |
| Improve traceability | Link requirements directly to generated test cases |

---

## User Goals

| Goal | Description |
|------|-------------|
| Speed | Generate high-quality test cases in seconds |
| Coverage | Improve edge-case and negative scenario coverage |
| Control | Maintain human review before injection |
| Focus | Avoid context-switching between tools |
| Repeatability | Reduce repetitive manual test writing |

---

## Target Users

### Primary
- QA Engineers
- SDETs (Software Development Engineers in Test)
- Test Leads
- Manual Testers

### Secondary
- Business Analysts
- Product Owners
- Engineering Managers

---

## Supported Browsers

| Browser | Support Level |
|---------|---------------|
| Google Chrome | ✅ Primary |
| Microsoft Edge | ✅ MVP (Chromium-compatible) |
| Mozilla Firefox | ✅ MVP (WebExtensions layer) |
| Safari | 🔜 Phase 2 |

---

## Core Workflow

```
User opens Azure DevOps User Story
            ↓
SpecForge detects supported work item
            ↓
Extracts story data (title, AC, priority, tags, etc.)
            ↓
Calls Claude skill: ado-test-case-creator
            ↓
Receives structured JSON test cases
            ↓
Displays editable side panel preview
            ↓
User reviews, edits, approves
            ↓
SpecForge creates Azure DevOps Test Cases
            ↓
Injects test steps automatically
            ↓
User saves
```

---

## Non-Goals (MVP Exclusions)

The following are intentionally excluded from the initial release:

- OCR / attachment parsing
- Image analysis
- Multi-story bulk processing
- Jira integration
- Test automation code generation
- AI-based deduplication
- Regression suite optimization
