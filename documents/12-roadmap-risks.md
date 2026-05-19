# SpecForge — Roadmap, Risks & Success Metrics

---

## Development Phases

### Phase 1 — Core Extraction
**Goal:** Detect ADO stories and extract all relevant fields reliably.

Deliverables:
- Content script with work item type detection
- SPA-aware navigation tracking
- Full field extraction (title, description, AC, tags, priority, area path, iteration, comments, linked items)
- Extraction unit tests
- Selector resilience layer

Exit criteria:
- Extraction completes in < 2s on a standard User Story
- All required fields captured correctly
- No false positives on non-work-item pages

---

### Phase 2 — Claude Integration
**Goal:** Generate structured test cases from extracted story data.

Deliverables:
- Background worker with Claude API client
- Prompt builder with `ado-test-case-creator` skill
- Zod schema validation layer
- Retry logic for API and validation failures
- Unit tests for prompt construction and validation

Exit criteria:
- Generation returns valid JSON in > 95% of cases
- Schema validation catches all malformed responses
- Retry logic handles network failures and quota errors correctly

---

### Phase 3 — UI Layer
**Goal:** Give users a productive review and editing experience.

Deliverables:
- Side panel with test case cards
- Inline editing for all fields
- Validation error display
- Regenerate workflow
- Settings / credentials panel

Exit criteria:
- Side panel opens in < 200ms
- All fields editable without full regeneration
- Validation errors visible per card
- Regenerate prompts for confirmation when edits are present

---

### Phase 4 — Injection Engine
**Goal:** Automate creation of Azure DevOps Test Cases from validated test case data.

Deliverables:
- ADO test case form automation
- Test steps grid injection (keyboard + clipboard + direct DOM)
- Parent story linking
- Live injection progress in side panel
- Injection error handling and recovery

Exit criteria:
- Injection completes for a 5-step test case in < 10 seconds
- Steps injected in correct order
- Parent story linked correctly
- Failures surface actionable errors without stopping the queue

---

### Phase 5 — Hardening
**Goal:** Production-ready reliability across all supported browsers.

Deliverables:
- Retry and selector resilience improvements
- Firefox build and testing
- Edge compatibility verification
- Performance profiling and optimization
- E2E Playwright test suite against live ADO environments
- Security review

Exit criteria:
- Extension passes E2E tests on Chrome, Edge, and Firefox
- All performance targets met (p95)
- Security review complete

---

## Scalability Roadmap

### Phase 2 Features (Post-MVP)
- Safari extension support
- Attachment / image analysis (OCR-based)
- Bulk generation from multiple stories
- Smarter requirement traceability (AC-to-test-case linking)
- Custom prompt template editor

### Phase 3 Features
- Jira integration
- AI-generated test automation code (Playwright, Selenium)
- Risk-based test prioritization
- Regression suite intelligence
- Test coverage mapping dashboard
- Opt-in telemetry and analytics

---

## Risks

### Highest Technical Risk: ADO DOM Instability

| Risk | Description |
|------|-------------|
| Severity | 🔴 High |
| Likelihood | 🔴 High |
| Impact | Injection and extraction can break on ADO updates |

Mitigation:
- Selector abstraction layer (single source of truth for all DOM queries)
- Centralized injector engine (changes require updates in one place)
- Automated UI compatibility tests against live ADO on every release

---

### AI Quality Risks

| Risk | Description | Mitigation |
|------|-------------|------------|
| Hallucinated steps | Claude generates steps that don't reflect the story | Deterministic prompting; Zod schema; human review workflow |
| Invalid formatting | JSON doesn't match expected schema | Zod validation; retry with corrective prompt |
| Duplicate test cases | Generated cases overlap with existing ADO TCs | Duplicate detection in validation layer; user warning |
| Incomplete coverage | Not all ACs covered | Explicit coverage requirements in prompt |

---

### Operational Risks

| Risk | Description | Mitigation |
|------|-------------|------------|
| API quota limits | Claude API rate limits at scale | Retry with backoff; surface quota errors clearly |
| ADO permission changes | User's PAT loses permissions mid-session | Detect 403 errors; surface re-authentication prompt |
| Browser API deprecation | Chrome/Firefox changes extension APIs | Monitor browser release notes; abstract API calls |

---

## Success Metrics

### Primary KPIs

| Metric | Target |
|--------|--------|
| Reduction in manual test design time | ≥ 50% time saved per story |
| Successful test creation rate | ≥ 95% of injection attempts succeed |
| Generation accuracy | ≥ 90% of generated cases accepted without major edits |
| Workflow time (story → test cases in ADO) | < 2 minutes end-to-end |

### Secondary KPIs

| Metric | Description |
|--------|-------------|
| AC coverage rate | % of acceptance criteria items covered by generated tests |
| Negative scenario coverage | % of stories with at least 1 negative test case |
| User-edited cases rate | % of generated cases requiring edits before injection |
| Retry rate | % of generations requiring retry (target < 10%) |

---

## Acceptance Criteria

- [ ] All 5 development phases have defined exit criteria
- [ ] ADO selector abstraction layer implemented before injection engine
- [ ] Compatibility tests run against live ADO on every Phase 5 release
- [ ] Primary KPIs tracked from first production release
- [ ] Risk register reviewed at start of each phase
