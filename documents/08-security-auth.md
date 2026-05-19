# SpecForge — Feature: Security & Authentication

## Overview

SpecForge handles sensitive credentials (Claude API key, Azure DevOps PAT) and user story data. This document defines the security requirements, credential handling rules, and data protection standards.

---

## Authentication Credentials

| Credential | Purpose | Storage |
|------------|---------|---------|
| Claude API Key | Authenticate Claude API calls | `chrome.storage.local` |
| Azure DevOps PAT | Authenticate ADO API calls (if needed) | `chrome.storage.local` |

---

## Credential Storage

All credentials stored using:

```typescript
chrome.storage.local.set({ claudeApiKey: encryptedKey })
chrome.storage.local.get(['claudeApiKey'], (result) => { ... })
```

### Requirements

- Credentials are **never** stored in:
  - `localStorage` (accessible to page scripts)
  - `sessionStorage`
  - Extension source code or config files
  - Logs or telemetry
- Credentials are loaded only by the **background worker** at runtime
- Credentials are **never** passed to content scripts directly

### Future Enhancement

- Implement AES-GCM encryption layer over `chrome.storage.local`
- Derive encryption key from browser fingerprint (non-exportable)

---

## Data Protection

### What Must Never Leave the Extension

| Data Type | Restriction |
|-----------|-------------|
| Claude API key | Never transmitted to any third party |
| Azure DevOps PAT | Never transmitted to any third party |
| User Story content | Only sent to Claude API — never cached externally |
| Generated test cases | Only sent to Azure DevOps — never cached externally |
| Customer PII or business data | Never logged or transmitted |

### Claude API Transmission

The only external transmission allowed:
- User Story payload → Claude API (`api.anthropic.com`)
- Governed by Anthropic's data processing terms

No data is sent to:
- Third-party analytics
- Extension developer servers
- Any telemetry endpoints (unless opt-in, Phase 2)

---

## Content Script Isolation

| Rule | Requirement |
|------|-------------|
| Credentials | Never accessible in content script context |
| API calls | Made only from background worker, never from content script |
| Messaging | Background worker exposes API via `chrome.runtime.sendMessage` only |

Message interface (content script → background):

```typescript
// Content script sends:
chrome.runtime.sendMessage({
  type: 'GENERATE_TEST_CASES',
  payload: extractedStory
})

// Background worker responds:
// { success: true, testCases: [...] }
// or
// { success: false, error: 'API quota exceeded' }
```

---

## Logging & Diagnostics

| Data Category | Logging Rule |
|---------------|--------------|
| API keys | ❌ Never logged |
| PAT tokens | ❌ Never logged |
| User story content | ⚠ Debug only — must be opt-in and scrubbed before telemetry |
| Error messages | ✅ Allowed (must not contain credential fragments) |
| Performance metrics | ✅ Allowed |

All log calls must pass through a `safeLog()` utility that redacts known sensitive patterns before output.

---

## Permissions Model

Manifest permissions (minimum required):

```json
{
  "permissions": [
    "storage",
    "sidePanel",
    "scripting",
    "activeTab"
  ],
  "host_permissions": [
    "https://dev.azure.com/*",
    "https://api.anthropic.com/*"
  ]
}
```

No unnecessary permissions requested.
No broad host permissions (`<all_urls>`).

---

## User-Controlled Data Deletion

Users must be able to:
- Clear Claude API key from settings panel
- Clear ADO PAT from settings panel
- These deletions must immediately remove data from `chrome.storage.local`

---

## Security Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| API key exposed in content script | Credentials only in background worker |
| Key extraction via XSS | Host permissions scoped to `dev.azure.com` only |
| Story content leaked to third parties | Only sent to `api.anthropic.com` |
| Man-in-the-middle on API calls | HTTPS only; no custom certificate handling |
| Credential persistence after uninstall | `chrome.storage.local` is cleared on extension uninstall |

---

## Acceptance Criteria

- [ ] Claude API key is stored only in `chrome.storage.local`
- [ ] ADO PAT is stored only in `chrome.storage.local`
- [ ] Credentials are never accessible in content script context
- [ ] All Claude API calls are made from the background worker only
- [ ] No credentials appear in logs, errors, or telemetry
- [ ] User can clear all stored credentials from settings panel
- [ ] Extension requests only minimum required permissions
- [ ] No data is transmitted to any host other than `api.anthropic.com` and `dev.azure.com`
