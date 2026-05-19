# SpecForge — Feature: Side Panel UI

## Overview

The Side Panel is the primary user interface for SpecForge. It displays generated test cases, allows editing and regeneration, provides validation feedback, and controls the injection workflow.

---

## Panel Layout

```
┌──────────────────────────────────┐
│  SpecForge                  ⚙️   │
│  Story: #1234 — Login Flow       │
├──────────────────────────────────┤
│  [ Generate AI Test Cases ]      │
│  [ Regenerate ]                  │
├──────────────────────────────────┤
│  Generated Test Cases (5)        │
│                                  │
│  ┌────────────────────────────┐  │
│  │ ☑ TC-01: Happy path login  │  │
│  │ Priority: High             │  │
│  │ Steps: 4 | Tags: smoke     │  │
│  └────────────────────────────┘  │
│                                  │
│  ┌────────────────────────────┐  │
│  │ ☑ TC-02: Invalid password  │  │
│  │ Priority: Medium           │  │
│  │ Steps: 3 | Tags: negative  │  │
│  └────────────────────────────┘  │
│  ...                             │
├──────────────────────────────────┤
│  ⚠ Validation errors (if any)    │
├──────────────────────────────────┤
│  [ Inject Selected (5) ]         │
└──────────────────────────────────┘
```

---

## Panel States

| State | UI Behavior |
|-------|-------------|
| Idle (story detected) | Shows "Generate AI Test Cases" button |
| Extracting | Shows extraction progress indicator |
| Generating | Shows AI generation spinner with estimated time |
| Results ready | Displays test case cards with edit/select controls |
| Validation error | Highlights failing test cases; blocks injection |
| Injecting | Shows per-case injection progress |
| Complete | Shows success summary with links to created test cases |
| Error | Shows actionable error message with retry option |

---

## Test Case Card

Each generated test case is displayed as an expandable card:

### Collapsed View
```
☑ TC-01: Successful login with valid credentials
Priority: High | Steps: 4 | Tags: smoke, positive
```

### Expanded View
```
Title: [editable text field]
Priority: [High ▾]
Preconditions:
  - User account exists
  - User is on the login page

Steps:
  1. Action: Navigate to /login
     Expected: Login page renders correctly
  2. Action: Enter valid username
     Expected: Username field accepts input
  ...

Tags: [smoke] [positive] [+add]

[ Save Changes ]
```

---

## Editing Capabilities

| Field | Editable |
|-------|----------|
| Title | ✅ Inline text input |
| Priority | ✅ Dropdown: Low / Medium / High |
| Preconditions | ✅ Add / edit / delete items |
| Steps (Action) | ✅ Inline text input |
| Steps (Expected) | ✅ Inline text input |
| Add step | ✅ |
| Remove step | ✅ |
| Tags | ✅ Add / remove chips |

---

## Controls

| Control | Behavior |
|---------|----------|
| Generate AI Test Cases | Triggers full extraction → generation pipeline |
| Regenerate | Re-runs generation with same story data (new results) |
| Select All / Deselect All | Bulk checkbox toggle |
| Inject Selected (N) | Injects checked test cases into ADO |
| Settings (⚙️) | Opens API key and preferences panel |

---

## Validation Error Display

Validation errors are shown inline per test case and in a summary banner:

```
⚠ 2 test cases have validation errors and cannot be injected:
  • TC-03: Missing step expected result on step 2
  • TC-05: Title is empty
```

Individual invalid test cases are highlighted in red. Injection button is disabled until all selected cases pass validation.

---

## Settings Panel

Accessible via ⚙️ icon:

| Setting | Type |
|---------|------|
| Claude API Key | Password input (masked) |
| Azure DevOps PAT | Password input (masked) |
| Default test case priority | Dropdown |
| Auto-select all generated cases | Toggle |
| Show advanced generation options | Toggle |

---

## Regeneration Behavior

- Clicking **Regenerate** discards current results and re-calls Claude
- User is prompted to confirm if any edits have been made
- Previous results are not recoverable after regeneration

---

## Performance Targets

| Action | Target |
|--------|--------|
| Side panel open | < 200ms |
| Generation results display | Immediate after API response |
| Edit interactions | < 50ms response |

---

## Acceptance Criteria

- [ ] Side panel opens within 200ms of toolbar button click
- [ ] All generated test cases displayed as cards
- [ ] Each test case is individually selectable via checkbox
- [ ] All fields (title, priority, steps, tags) are editable inline
- [ ] Validation errors shown per card and in summary banner
- [ ] Inject button disabled when validation errors exist in selected cases
- [ ] Regenerate prompts for confirmation if edits are present
- [ ] Settings panel accessible and saves credentials to local storage
- [ ] Panel correctly shows loading state during extraction and generation
