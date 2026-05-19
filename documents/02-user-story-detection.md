# SpecForge — Feature: User Story Detection

## Overview

SpecForge automatically detects when the user is viewing a supported Azure DevOps work item page, and activates the extension UI without requiring manual triggering.

---

## Supported Work Item Types

| Work Item Type | Supported |
|----------------|-----------|
| User Story | ✅ |
| Product Backlog Item (PBI) | ✅ |
| Feature | ✅ |
| Requirement | ✅ |
| Bug | ❌ (Phase 2 consideration) |
| Task | ❌ |

---

## Detection Trigger

The content script runs on:

```
https://dev.azure.com/*
```

Detection checks:
1. URL pattern matches ADO domain and project path
2. Page contains a recognized work item type indicator (e.g., `aria-label` on the type badge)
3. Work item is in a readable/editable state (not loading)

---

## Detection States

| State | Behavior |
|-------|----------|
| Supported work item detected | Extension toolbar button activates; side panel becomes available |
| Unsupported work item | Extension remains inactive; no UI injected |
| Non-ADO page | Extension fully dormant |
| ADO page loading | Extension waits for DOM stability before detecting |

---

## Toolbar Button

When detection succeeds, the extension injects a toolbar button:

```
[ Generate AI Test Cases ]
```

- Positioned within the ADO toolbar area
- Visually consistent with ADO design language
- Single-click to trigger extraction → generation pipeline

---

## Detection Robustness Requirements

- Must survive ADO's single-page navigation (URL changes without full reload)
- Must re-detect when the user switches between work items
- Must handle ADO's lazy-loaded DOM (content loaded after initial render)
- Must not false-positive on non-work-item ADO pages (boards, backlogs, repos)

---

## ADO Page Navigation Handling

ADO is a SPA (Single Page Application). Detection must use:

- `MutationObserver` to track DOM changes
- URL change listeners (`popstate`, `hashchange`, history patching)
- Debounced re-detection on navigation events

---

## Selector Strategy

Preferred approach for detection:

```typescript
// Detect work item type badge
document.querySelector('[aria-label="Work item type"]')

// Detect title field presence
document.querySelector('[aria-label="Title field"]')
```

Avoid brittle positional selectors:

```typescript
// ❌ Never use
div:nth-child(3) > span.workItemTypeName
```

---

## Acceptance Criteria

- [ ] Extension detects a User Story within 2 seconds of page load
- [ ] Extension detects a PBI, Feature, and Requirement correctly
- [ ] Extension does NOT activate on ADO boards, repos, pipelines, or settings pages
- [ ] Extension re-detects correctly after SPA navigation between work items
- [ ] Toolbar button appears only when a supported work item is detected
- [ ] No UI injection occurs on unsupported work item types
