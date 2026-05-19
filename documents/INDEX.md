# SpecForge — Documentation Index

> AI-powered QA engineering extension for Azure DevOps.

---

## Feature Files

| # | File | Description |
|---|------|-------------|
| 01 | [01-overview.md](./01-overview.md) | Product overview, vision, goals, target users, core workflow |
| 02 | [02-user-story-detection.md](./02-user-story-detection.md) | ADO work item detection, SPA handling, toolbar injection |
| 03 | [03-extraction-engine.md](./03-extraction-engine.md) | Field extraction, data model, HTML parsing, timing |
| 04 | [04-claude-ai-integration.md](./04-claude-ai-integration.md) | Claude API config, prompt templates, retry strategy |
| 05 | [05-side-panel-ui.md](./05-side-panel-ui.md) | Side panel layout, test case cards, editing, controls |
| 06 | [06-injection-engine.md](./06-injection-engine.md) | ADO form automation, steps grid injection, progress reporting |
| 07 | [07-validation-layer.md](./07-validation-layer.md) | Zod schemas, integrity checks, duplicate detection, retry |
| 08 | [08-security-auth.md](./08-security-auth.md) | Credential storage, data protection, permissions model |
| 09 | [09-technical-architecture.md](./09-technical-architecture.md) | Full stack, component map, folder structure, messaging |
| 10 | [10-browser-compatibility.md](./10-browser-compatibility.md) | Chrome, Edge, Firefox, Safari support matrix |
| 11 | [11-error-handling-performance.md](./11-error-handling-performance.md) | Error handling, performance targets, telemetry |
| 12 | [12-roadmap-risks.md](./12-roadmap-risks.md) | Development phases, risk register, success metrics |

---

## AI Workflow

| File | Description |
|------|-------------|
| [PROMPT_CHAIN.md](./PROMPT_CHAIN.md) | 5-step Claude prompt chain: enrichment → risk analysis → generation → self-validation → tagging |

---

## Quick Reference

### Core Workflow
```
Detect Story → Extract Fields → Enrich (Step 1) → Risk Analysis (Step 2)
→ Generate (Step 3) → Self-Validate (Step 4) → Tag (Step 5)
→ Zod Validate → Side Panel Preview → User Review → Inject into ADO
```

### Key Performance Targets
| Action | Target |
|--------|--------|
| Story detection | < 2s |
| Extraction | < 2s |
| AI generation | < 15s |
| Injection per TC | < 10s |

### Technology Stack
| Layer | Tech |
|-------|------|
| Framework | Plasmo + React + TypeScript |
| Styling | Tailwind CSS |
| State | Zustand |
| Validation | Zod |
| AI | Claude API (`claude-sonnet-4-20250514`) |
| Testing | Playwright + Vitest |

### Supported Browsers
- ✅ Chrome (primary)
- ✅ Edge (Chromium-compatible)
- ✅ Firefox (WebExtensions layer)
- 🔜 Safari (Phase 2)
