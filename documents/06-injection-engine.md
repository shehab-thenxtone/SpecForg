# SpecForge — Feature: Injection Engine

## Overview

The Injection Engine automates the creation of Azure DevOps Test Cases directly from validated, user-approved test case data. It handles form navigation, field population, step injection, and error recovery — all without requiring the user to manually interact with ADO forms.

---

## Injection Flow

```
User clicks "Inject Selected (N)"
            ↓
Validation Layer confirms all selected cases are valid
            ↓
For each selected TestCase:
    ↓
    Open new ADO Test Case form
    ↓
    Populate metadata fields (title, priority, area path)
    ↓
    Inject test steps (action + expected)
    ↓
    Add tags
    ↓
    Set linked parent work item (source User Story)
    ↓
    Save as draft
    ↓
    Confirm creation (capture new TC ID)
            ↓
Report injection summary to user
```

---

## Fields Populated During Injection

| Field | Source | Method |
|-------|--------|--------|
| Title | `TestCase.title` | DOM input fill |
| Priority | `TestCase.priority` | Dropdown select |
| Area Path | Inherited from parent story | Dropdown select |
| Iteration | Inherited from parent story | Dropdown select |
| Tags | `TestCase.tags` | Tag chip injection |
| Test Steps | `TestCase.steps[]` | Grid injection (see below) |
| Parent Link | Source story ID | Relations panel |

---

## Test Steps Grid — Primary Challenge

The ADO test steps grid is the most technically complex injection target.

### Approach

Three-layer strategy (applied in priority order):

#### Layer 1: Keyboard + Focus Simulation
```typescript
// Tab into the steps grid, type action, Tab to expected, Enter for next row
stepCell.focus()
stepCell.dispatchEvent(new KeyboardEvent('keydown', { key: 'Tab' }))
```

#### Layer 2: Clipboard-Assisted Insertion
```typescript
// For longer step content, use clipboard paste to avoid character-by-character slowness
await navigator.clipboard.writeText(stepText)
stepCell.focus()
document.execCommand('paste')
```

#### Layer 3: Direct DOM Value + Event Dispatch
```typescript
// As fallback — set value and dispatch input/change events
const input = stepCell.querySelector('input, textarea')
if (input) {
  (input as HTMLInputElement).value = stepText
  input.dispatchEvent(new Event('input', { bubbles: true }))
  input.dispatchEvent(new Event('change', { bubbles: true }))
}
```

---

## Async UI Synchronization

ADO's test steps grid is dynamically rendered. Each step row must wait for the previous row to stabilize before proceeding.

```typescript
async function waitForStepRowReady(rowIndex: number): Promise<void> {
  return new Promise((resolve) => {
    const observer = new MutationObserver(() => {
      const row = getStepRow(rowIndex)
      if (row && row.querySelector('[data-step-ready]')) {
        observer.disconnect()
        resolve()
      }
    })
    observer.observe(stepsGrid, { childList: true, subtree: true })
    setTimeout(resolve, 2000) // fallback timeout
  })
}
```

---

## Selector Strategy

All selectors use accessibility attributes, not positional CSS chains.

```typescript
// ✅ Preferred
document.querySelector('[aria-label="Title field"]')
document.querySelector('[aria-label="Priority"]')
document.querySelector('[data-testid="test-step-action"]')

// ❌ Avoid
div:nth-child(5) > span > input
.ms-TextField-field:last-child
```

---

## Retry & Error Handling

| Failure Scenario | Recovery |
|------------------|----------|
| Selector not found | Wait 500ms and retry up to 3 times |
| Form not ready | Delay 1s and retry |
| Step row didn't appear | Skip row after 3 retries; log error |
| Save failed | Retry save once; surface error if still failing |
| ADO permission error | Surface permission error to user; stop injection |

---

## Injection Progress Reporting

Side panel displays live progress during multi-case injection:

```
Injecting test cases...
✅ TC-01: Created (#4521)
✅ TC-02: Created (#4522)
⏳ TC-03: Injecting steps...
⬜ TC-04: Pending
⬜ TC-05: Pending
```

---

## Post-Injection Summary

After all cases are processed:

```
✅ 4 of 5 test cases created successfully.
⚠ 1 test case failed injection — see errors below.

Created:
  • #4521 — Successful login
  • #4522 — Invalid password error
  • #4523 — Session expiry
  • #4524 — Concurrent login blocked

Failed:
  • TC-03 — Step injection timed out. Please create manually.
  [ View Details ]
```

---

## Parent Linking

After creating each test case, SpecForge automatically links it back to the source User Story using ADO's Relations API or DOM-based linking UI.

Relationship type: `Tested By` / `Tests`

---

## Performance Target

| Action | Target |
|--------|--------|
| Per test case injection (form + steps + save) | < 10 seconds |

---

## Acceptance Criteria

- [ ] Test case form opens and all metadata fields are populated correctly
- [ ] All test steps (action + expected) are injected correctly
- [ ] Steps are injected in correct order
- [ ] Tags are applied to each test case
- [ ] Area path and iteration are inherited from source story
- [ ] Test case is linked back to source User Story
- [ ] Draft is saved without user interaction required
- [ ] Live progress displayed per case during injection
- [ ] Failures surface actionable errors without stopping the rest of the queue
- [ ] Injection completes within 10 seconds per test case under normal conditions
