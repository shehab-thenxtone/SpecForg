# SpecForge — Feature: Validation Layer

## Overview

The Validation Layer sits between Claude's raw output and the Injection Engine. It ensures that every test case is structurally sound, complete, and safe to inject into Azure DevOps before any automation begins.

---

## Validation Pipeline

```
Claude Raw JSON Response
          ↓
JSON Parse Check
          ↓
Zod Schema Validation
          ↓
Field Integrity Checks
          ↓
Step Integrity Checks
          ↓
Duplicate Detection
          ↓
Empty-Field Prevention
          ↓
✅ Valid TestCase[] — passed to Side Panel & Injection Engine
❌ Invalid — errors surfaced to user; injection blocked
```

---

## Validation Rules

### 1. JSON Parse Check

| Check | Rule |
|-------|------|
| Response is valid JSON | Must parse without error |
| Response is an array | Root element must be `[]` |
| Array is non-empty | At least 1 test case must be present |

Failure behavior: Trigger Claude retry with stricter JSON-only prompt.

---

### 2. Zod Schema Validation

Schema definition:

```typescript
import { z } from 'zod'

const StepSchema = z.object({
  action: z.string().min(1, 'Step action cannot be empty'),
  expected: z.string().min(1, 'Step expected result cannot be empty'),
})

const TestCaseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  priority: z.enum(['Low', 'Medium', 'High']),
  preconditions: z.array(z.string()),
  steps: z.array(StepSchema).min(1, 'At least one step is required'),
  tags: z.array(z.string()),
})

const GeneratedOutputSchema = z.array(TestCaseSchema)
```

---

### 3. Field Integrity Checks

| Field | Rule |
|-------|------|
| `title` | Not empty, not duplicate within batch |
| `priority` | Must be `Low`, `Medium`, or `High` only |
| `preconditions` | Array (may be empty) |
| `steps` | At least 1 step required |
| `tags` | Array (may be empty) |

---

### 4. Step Integrity Checks

Per step:

| Field | Rule |
|-------|------|
| `action` | Not empty, not whitespace-only |
| `expected` | Not empty, not whitespace-only |
| Step count | Maximum 50 steps per test case |

---

### 5. Duplicate Detection

Within a single generation batch:
- Test case titles must be unique (case-insensitive)
- Near-duplicate steps flagged as warnings (not blocking)

Against existing ADO test cases (if provided in extraction):
- If generated title matches an existing linked test case, surface as warning
- Do not block injection, but prompt user to review

---

### 6. Empty-Field Prevention

All string fields are trimmed before validation.
Fields that become empty after trimming are treated as missing.

---

## Validation Error Types

| Error Type | Severity | Behavior |
|------------|----------|----------|
| JSON parse failure | 🔴 Critical | Retry generation |
| Schema type mismatch | 🔴 Critical | Block injection; show error |
| Empty required field | 🔴 Critical | Block injection; show error |
| Duplicate title in batch | 🟡 Warning | Show warning; allow injection |
| Near-duplicate step | 🟡 Warning | Show warning; allow injection |
| Duplicate vs existing ADO TC | 🟡 Warning | Prompt for review |

---

## Error Display in Side Panel

### Per-Card Errors

```
⚠ TC-03: "Invalid credentials test"
  ✗ Step 2: Expected result is empty
  ✗ Title: Too short (min 3 characters)
```

### Summary Banner

```
⚠ 2 test cases have validation errors and cannot be injected.
Fix errors or deselect these cases to proceed.
```

### Inject Button State

| Condition | Inject Button State |
|-----------|---------------------|
| All selected cases valid | ✅ Enabled |
| Any selected case has error | ❌ Disabled |
| No cases selected | ❌ Disabled |

---

## Retry on Validation Failure

If Zod validation fails on first generation:
1. Append validation errors to retry prompt: `"Previous output failed validation: [errors]. Correct and return only valid JSON."`
2. Retry Claude call once
3. If second attempt also fails, surface errors to user and stop

---

## Acceptance Criteria

- [ ] All Claude output passes JSON parse check before any processing
- [ ] Zod schema validates every field on every test case
- [ ] Missing required fields block injection with clear error messages
- [ ] Duplicate titles within a batch are detected and flagged
- [ ] Empty string fields (after trimming) are treated as missing
- [ ] Validation errors are shown per test case in the side panel
- [ ] Inject button is disabled when any selected case has errors
- [ ] Validation failure triggers one retry with corrective prompt
- [ ] Warning-level issues (duplicates, near-duplicates) do not block injection
