# SpecForge — Feature: Extraction Engine

## Overview

The Extraction Engine is responsible for reading all relevant data from the currently open Azure DevOps work item and assembling it into a structured payload ready for Claude AI processing.

---

## Extracted Fields

| Field | Source | Required |
|-------|--------|----------|
| `id` | URL or work item header | ✅ |
| `title` | Title field | ✅ |
| `description` | Description rich-text area | ✅ |
| `acceptanceCriteria` | Acceptance Criteria field | ✅ |
| `priority` | Priority dropdown | ⬜ Optional |
| `tags` | Tags field | ⬜ Optional |
| `areaPath` | Area Path field | ⬜ Optional |
| `iteration` | Iteration path field | ⬜ Optional |
| `comments` | Discussion / comments section | ⬜ Optional |
| `linkedWorkItems` | Relations/Links section | ⬜ Optional |
| `existingTestCases` | Linked test cases | ⬜ Optional |

---

## Data Model

```typescript
interface UserStory {
  id: string
  title: string
  description: string
  acceptanceCriteria: string
  priority?: "Critical" | "High" | "Medium" | "Low"
  tags: string[]
  areaPath?: string
  iteration?: string
  comments?: string[]
  linkedWorkItems?: LinkedWorkItem[]
  existingTestCases?: string[]
}

interface LinkedWorkItem {
  id: string
  type: string
  title: string
  relationship: string
}
```

---

## Extraction Strategy

### Rich Text Fields

`description` and `acceptanceCriteria` are rendered as HTML in ADO rich text editors.

Extraction approach:
1. Locate the field container via `aria-label`
2. Read `innerHTML` or `innerText` depending on downstream needs
3. Strip unsafe HTML; preserve structural formatting (lists, paragraphs)
4. Normalize whitespace

```typescript
// Preferred approach
const descriptionEl = document.querySelector('[aria-label="Description"]')
const rawHtml = descriptionEl?.querySelector('.rich-text-content')?.innerHTML ?? ''
const cleanText = sanitizeHtml(rawHtml)
```

---

### Acceptance Criteria

Same approach as description. Additional handling:
- Detect and preserve structured lists (Given/When/Then, BDD-style)
- Preserve numbered acceptance conditions if present

---

### Tags

Tags are comma-separated tokens rendered as chips.

```typescript
const tagChips = document.querySelectorAll('[aria-label="Tags"] .tag-item')
const tags = Array.from(tagChips).map(el => el.textContent?.trim() ?? '')
```

---

### Comments

Iterate the discussion thread and collect non-empty comment bodies:

```typescript
const comments = Array.from(
  document.querySelectorAll('.discussion-item .comment-body')
).map(el => el.textContent?.trim() ?? '').filter(Boolean)
```

---

### Linked Work Items

Read the Relations section if present, extract type + title + relationship type.

---

## Extraction Timing

ADO lazy-loads field content after initial page render.

Required guards:
- Wait for `[aria-label="Title field"]` to be non-empty before extraction
- Use `MutationObserver` with a 500ms debounce as a fallback
- Timeout with error after 5 seconds if fields remain empty

---

## Partial Extraction Handling

If optional fields are missing or empty:
- Include them as `null` or `[]` in the payload
- Do NOT block extraction or generation

If required fields (`title`, `description`, `acceptanceCriteria`) are missing:
- Display actionable error in side panel
- Block generation until resolved

---

## Extraction Performance Target

| Action | Target |
|--------|--------|
| Full extraction from loaded page | < 2 seconds |

---

## Acceptance Criteria

- [ ] All required fields extracted correctly from a fully loaded User Story
- [ ] HTML in description and AC is sanitized and readable
- [ ] Tags extracted as clean array of strings
- [ ] Extraction handles missing optional fields gracefully (no crash)
- [ ] Extraction times out with error if page fields don't load within 5 seconds
- [ ] Linked work items extracted when Relations section is present
- [ ] Existing linked test cases detected and included in payload
