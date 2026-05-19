# SpecForge — Error Handling, Performance & Telemetry

---

## Error Handling

### AI / Claude API Errors

| Error Type | Detection | Behavior |
|------------|-----------|----------|
| Malformed JSON response | JSON parse failure | Retry with stricter JSON-only prompt |
| Schema validation failure | Zod error | Retry with validation error context in prompt |
| API timeout (> 15s) | Request timeout | Retry once; show error on second failure |
| Quota / rate limit exceeded | HTTP 429 | Show quota error; do not retry |
| Authentication failure | HTTP 401 | Show "Invalid API key" error; direct user to settings |
| Network failure | Fetch error | Retry up to 2x with exponential backoff |
| Empty response | Empty array or null | Retry once; show error if still empty |

Error message format for users:

```
⚠ Test case generation failed.
Reason: Claude API quota exceeded.
Action: Check your API key usage at console.anthropic.com.
[ Try Again ] [ Settings ]
```

---

### Azure DevOps Injection Errors

| Error Type | Detection | Behavior |
|------------|-----------|----------|
| Selector not found | `querySelector` returns null | Wait 500ms and retry up to 3 times |
| Form not ready | Element not interactive | Delay 1s and retry |
| Step row didn't appear | MutationObserver timeout | Skip row; log error; continue with next step |
| Save failed | No confirmation ID returned | Retry save once; surface error if still failing |
| ADO permission error | DOM error indicator or HTTP 403 | Surface permission error; stop injection for that case |
| DOM changed during injection | Selector match fails mid-inject | Abort case; log failure; continue with next case |
| SPA navigation during injection | ADO URL changed unexpectedly | Abort injection; show error |

---

### Extension Internal Errors

| Error Type | Behavior |
|------------|----------|
| Background worker crash | Chrome auto-restarts service worker; side panel shows reconnect state |
| Storage read failure | Surface error; prompt user to re-enter credentials |
| Message timeout (content ↔ background) | Retry message up to 2 times; show generic error |
| Content script not injected | Prompt user to refresh the page |

---

### Error Display Principles

- Always show a human-readable reason
- Always show an action ("Try Again", "Check Settings", "Refresh Page")
- Never expose raw stack traces to users
- Log detailed errors to browser console (debug only)
- Never log credentials or story content in error messages

---

## Performance Requirements

### Targets

| Action | Target |
|--------|--------|
| Work item detection | < 2 seconds from page load |
| Story extraction | < 2 seconds |
| AI generation (Claude API) | < 15 seconds |
| Per test case injection | < 10 seconds |
| Side panel open | < 200ms |
| Edit interaction response | < 50ms |

### Performance Monitoring

- Log generation start/end timestamps in console (debug mode)
- Track injection duration per test case
- Alert user if generation exceeds 15s threshold with progress indicator

---

## Telemetry (Optional — Phase 2)

Telemetry is **opt-in only**. No data is collected without explicit user consent.

### Proposed Metrics

| Metric | Description |
|--------|-------------|
| Generation success rate | % of generation attempts that return valid test cases |
| Average generation time | Mean Claude API response time |
| Injection failure rate | % of test cases that fail during injection |
| Test cases created per session | Count of successfully injected test cases |
| Retry rate | % of generations or injections that required retry |

### Privacy Requirements

- No PII collected
- No story content collected
- No work item data collected
- All telemetry anonymized
- Telemetry can be disabled at any time from settings
- Collected via privacy-preserving endpoint only (no third-party analytics SDKs in MVP)

---

## Acceptance Criteria

### Error Handling
- [ ] All Claude API error types surface actionable user messages
- [ ] All ADO injection errors surface actionable user messages
- [ ] No raw stack traces exposed in user-facing UI
- [ ] Retry logic covers network failures, JSON failures, and schema failures
- [ ] Injection continues for remaining test cases when one fails

### Performance
- [ ] Work item detection completes within 2 seconds
- [ ] Extraction completes within 2 seconds
- [ ] Generation completes within 15 seconds (p95)
- [ ] Injection per test case completes within 10 seconds
- [ ] Side panel opens within 200ms

### Telemetry
- [ ] No telemetry collected in MVP without opt-in
- [ ] Telemetry toggle available in settings (Phase 2)
- [ ] No credentials or story content ever included in telemetry
