# SpecForge — Feature: Browser Compatibility

## Overview

SpecForge targets four browsers with varying levels of support. The architecture is designed to maximize code reuse while accommodating browser-specific APIs.

---

## Browser Support Matrix

| Browser | Engine | Support Level | Notes |
|---------|--------|---------------|-------|
| Google Chrome | Chromium | ✅ Primary | Full MVP support |
| Microsoft Edge | Chromium | ✅ MVP | Minimal changes required |
| Mozilla Firefox | Gecko | ✅ MVP | WebExtensions layer required |
| Safari | WebKit | 🔜 Phase 2 | Requires Apple packaging toolchain |

---

## Chrome (Primary Platform)

- Full Manifest V3 support
- Chrome Side Panel API (`chrome.sidePanel`) available
- Service Worker background script
- `chrome.storage.local` fully supported
- Primary development and testing target

---

## Microsoft Edge

- Chromium-based: shares Chrome's extension APIs
- Manifest V3 compatible
- No separate build required
- Minor manifest adjustments may be needed for Edge Add-ons Store submission
- Testing should include Edge-specific DOM rendering edge cases

---

## Mozilla Firefox

Firefox requires specific adaptations:

### Manifest Differences

| Feature | Chrome | Firefox |
|---------|--------|---------|
| Manifest version | V3 | V2 (Firefox MV3 in progress) |
| Background | Service Worker | Background Script (`background.scripts`) |
| Side Panel | `chrome.sidePanel` | Sidebar Action (`sidebar_action`) |
| Storage | `chrome.storage` | `browser.storage` |

### Compatibility Layer

Use a browser compatibility shim:

```typescript
const browserAPI = typeof browser !== 'undefined' ? browser : chrome
```

Or use [webextension-polyfill](https://github.com/mozilla/webextension-polyfill) (Mozilla's official polyfill):

```typescript
import browser from 'webextension-polyfill'
browser.storage.local.set({ ... })
browser.runtime.sendMessage({ ... })
```

### Firefox-Specific Limitations

| Feature | Limitation |
|---------|------------|
| Side Panel | Firefox uses `sidebar_action`, not `sidePanel` API — requires separate sidebar implementation |
| Service Workers | Not supported in Firefox MV2 — use persistent background page instead |
| Clipboard API | May require `clipboardWrite` permission explicitly |

### Firefox Build Strategy

- Plasmo handles Firefox manifest generation with `--target=firefox-mv2`
- Side panel component must have a Firefox-compatible sidebar entry point
- Background worker wrapped in Firefox-safe background script

---

## Safari (Phase 2)

Safari support requires a separate pipeline:

| Requirement | Details |
|-------------|---------|
| Toolchain | Xcode + Safari Web Extension converter (`xcrun safari-web-extension-converter`) |
| Manifest | Converted from Chrome MV3 to Safari-compatible format |
| Distribution | App Store submission (macOS/iOS) |
| Additional permissions | Safari requires explicit user approval for cross-site requests |
| Limitations | Some Chrome-specific APIs unavailable; must use `browser.*` namespace |

Phase 2 deliverable: Safari extension packaged via Xcode, submitted to Mac App Store.

---

## Cross-Browser Testing Strategy

| Browser | Test Environment |
|---------|-----------------|
| Chrome | Playwright with Chrome driver |
| Edge | Playwright with Edge driver |
| Firefox | Playwright with Firefox driver |
| Safari | Manual testing + WebKit-based Playwright (limited) |

### Compatibility Test Coverage

For each browser:
- [ ] Extension loads without errors
- [ ] Content script detects ADO work item pages
- [ ] Side panel / sidebar opens correctly
- [ ] Extraction completes successfully
- [ ] Claude API call succeeds from background context
- [ ] Injection workflow completes for a simple test case

---

## Known Cross-Browser Risks

| Risk | Browsers Affected | Mitigation |
|------|-------------------|------------|
| Service Worker vs Background Page | Firefox | Use background page for Firefox; conditional build via Plasmo |
| Side Panel API not available | Firefox, Safari | Implement sidebar action fallback |
| Clipboard API restrictions | Firefox, Safari | Fallback to keyboard simulation for step injection |
| MV3 not yet stable | Firefox | Target MV2 for Firefox until Firefox MV3 is stable |
| ADO DOM differences | All | Use accessibility-based selectors; run compatibility tests per browser |

---

## Acceptance Criteria

- [ ] Extension builds successfully for Chrome, Edge, and Firefox via Plasmo
- [ ] Content script runs correctly on all three browsers against live ADO
- [ ] Side panel opens on Chrome and Edge; sidebar opens on Firefox
- [ ] Background Claude API calls work on all three browsers
- [ ] Injection workflow completes on all three browsers
- [ ] Clipboard injection fallback works on Firefox and Edge
- [ ] Safari Phase 2 plan documented and toolchain confirmed
