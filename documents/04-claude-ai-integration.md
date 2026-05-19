# SpecForge — Feature: Claude AI Integration

## Overview

SpecForge uses the Claude API with the `ado-test-case-creator` skill to convert extracted User Story data into structured, validated QA test cases. The integration is deterministic, schema-enforced, and designed for enterprise reliability.

---

## Claude Skill

```
ado-test-case-creator
```

This skill is purpose-built for generating Azure DevOps–compatible test cases from agile work items. It handles:
- Functional test scenarios
- Negative test cases
- Edge cases
- Business rule validation
- Workflow coverage
- High-risk path identification
- GDPR/EU compliance scenarios (when applicable)
- Accessibility scenarios (WCAG / EN 301 549)

---

## AI Integration Architecture

```
Extraction Engine
      ↓
Prompt Builder
      ↓
Claude API (claude-sonnet-4-20250514)
Skill: ado-test-case-creator
      ↓
Raw JSON Response
      ↓
Zod Schema Validation
      ↓
Validated TestCase[]
      ↓
Side Panel / Injection Engine
```

---

## API Configuration

| Setting | Value |
|---------|-------|
| Model | `claude-sonnet-4-20250514` |
| Max Tokens | `4096` |
| Temperature | `0` (deterministic) |
| Response Format | Strict JSON only |
| Skill | `ado-test-case-creator` |

---

## Prompt Construction

### System Prompt

```
You are a QA engineering expert using the ado-test-case-creator skill.
You receive a structured Azure DevOps User Story and return ONLY a valid JSON array of test cases.
Do not return any text outside the JSON. No markdown. No preamble.
Follow the exact schema provided.
```

### User Prompt Template

```
Generate comprehensive QA test cases for the following Azure DevOps User Story.

Story ID: {{id}}
Title: {{title}}

Description:
{{description}}

Acceptance Criteria:
{{acceptanceCriteria}}

Priority: {{priority}}
Tags: {{tags}}
Area Path: {{areaPath}}
Iteration: {{iteration}}

Additional Context:
- Comments: {{comments}}
- Linked Work Items: {{linkedWorkItems}}
- Existing Test Cases: {{existingTestCases}}

Return ONLY a JSON array matching this schema:
[
  {
    "title": string,
    "priority": "Low" | "Medium" | "High",
    "preconditions": string[],
    "steps": [
      {
        "action": string,
        "expected": string
      }
    ],
    "tags": string[]
  }
]

Coverage requirements:
- At least 1 positive/happy-path test case
- At least 1 negative test case
- At least 1 edge case
- Business rule validation scenarios
- All acceptance criteria must be covered
```

---

## Expected Output Schema

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

type GeneratedTestCases = TestCase[]
```

---

## Retry Strategy

| Scenario | Behavior |
|----------|----------|
| API timeout (> 15s) | Retry once; show error if second attempt fails |
| Malformed JSON response | Retry with stricter JSON-only prompt |
| Zod validation failure | Retry once; surface specific validation errors if second attempt fails |
| API quota exceeded | Show quota error; do not retry |
| Network failure | Retry up to 2 times with exponential backoff |

---

## API Key Management

- Claude API key stored in `chrome.storage.local`
- Key never transmitted to any third party
- Key never logged or included in telemetry
- Key loaded by background worker at runtime; never exposed to content script directly

---

## Generation Performance Target

| Action | Target |
|--------|--------|
| Claude API response | < 15 seconds |

---

## Generation Coverage Requirements

Every generation must include test cases covering:

| Coverage Type | Requirement |
|---------------|-------------|
| Positive / happy path | ✅ At least 1 |
| Negative / failure path | ✅ At least 1 |
| Edge cases | ✅ At least 1 |
| All acceptance criteria | ✅ Every AC item |
| Business rule validation | ✅ Where identifiable |
| High-risk workflow paths | ✅ Where identifiable |

---

## Acceptance Criteria

- [ ] Claude API called with correct model and zero-temperature setting
- [ ] Prompt includes all extracted story fields
- [ ] Response is parsed as strict JSON (no markdown or prose)
- [ ] Zod schema validation runs on every response before use
- [ ] Invalid responses trigger at least one retry
- [ ] Generation covers positive, negative, edge case, and AC scenarios
- [ ] API key is never exposed outside the background worker
- [ ] Generation completes within 15 seconds under normal conditions
