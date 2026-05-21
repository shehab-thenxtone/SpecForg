/**
 * Content script entry point — Plasmo picks up files in src/contents/*.
 * Runs on every https://dev.azure.com/* page at document_idle.
 *
 * Responsibilities:
 *  - Detect ADO work-item pages and notify the side panel.
 *  - Inject/remove the ⚡ Generate Tests toolbar button.
 *  - Respond to EXTRACT_STORY and INJECT_TEST_CASES messages.
 *  - Reply to QUERY_WORK_ITEM so the side panel can learn the type after it opens.
 */
import type { PlasmoCSConfig } from 'plasmo'

import { createWorkItemObserver, getWorkItemType } from '~/content/detector'
import { extractFullStory } from '~/content/extractor'
import { injectToolbarButton, removeToolbarButton } from '~/content/toolbar'
import { injectAllTestCases } from '~/services/injection/injector'
import type { InjectionProgress, Message } from '~/types/messages'
import { browserAPI } from '~/utils/browser-api'
import { safeLog } from '~/utils/safe-log'

// Tell Plasmo where to inject this script.
export const config: PlasmoCSConfig = {
  matches: ['https://dev.azure.com/*'],
  run_at: 'document_idle',
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Extract the numeric ADO work-item ID from the current URL. */
function getCurrentStoryId(): string {
  // ADO URL shape: .../dev.azure.com/org/project/_workitems/edit/12345
  const match = /workitems\/edit\/(\d+)/i.exec(window.location.href)
  return match?.[1] ?? ''
}

// ─── Work-item lifecycle ──────────────────────────────────────────────────────

/** Called when a supported work-item page is first detected. */
function handleDetect(type: string): void {
  safeLog.info('Work item detected:', type)

  // Notify the side panel (if open) so it can update its state immediately.
  browserAPI.runtime.sendMessage({
    type: 'WORK_ITEM_DETECTED',
    payload: { workItemType: type },
  } satisfies Message)

  // Inject the toolbar button; clicking it asks the background to open the side panel.
  injectToolbarButton(() => {
    browserAPI.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' } satisfies Message)
  })
}

/** Called when the user navigates away from a supported work-item page. */
function handleLeave(): void {
  safeLog.info('Left work item page')
  browserAPI.runtime.sendMessage({ type: 'WORK_ITEM_LEFT' } satisfies Message)
  removeToolbarButton()
}

// Start observing — triggers handleDetect immediately if already on a work-item page.
const observer = createWorkItemObserver(handleDetect, handleLeave)

// ─── Message handler ──────────────────────────────────────────────────────────

browserAPI.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  // Side panel requests the current work-item type when it first opens.
  // Handles the race condition where the panel opens after WORK_ITEM_DETECTED was sent.
  if (message.type === 'QUERY_WORK_ITEM') {
    const workItemType = getWorkItemType()
    sendResponse({
      type: 'WORK_ITEM_STATE',
      payload: { workItemType },
    } satisfies Message)
    return true
  }

  // Side panel → background → content script: extract story data from the DOM.
  if (message.type === 'EXTRACT_STORY') {
    extractFullStory()
      .then(story =>
        sendResponse({ type: 'STORY_EXTRACTED', payload: story } satisfies Message)
      )
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        sendResponse({
          type: 'ERROR',
          payload: { code: 'EXTRACTION_FAILED', message: msg },
        } satisfies Message)
      })
    return true // Keep message channel open for the async response.
  }

  // Background forwards INJECT_TEST_CASES here; run injection and stream progress back.
  if (message.type === 'INJECT_TEST_CASES') {
    const storyId = getCurrentStoryId()
    const cases = message.payload

    void injectAllTestCases(cases, storyId, (progress: InjectionProgress) => {
      browserAPI.runtime.sendMessage({
        type: 'INJECTION_PROGRESS',
        payload: progress,
      } satisfies Message)
    })
      .then(summary => {
        browserAPI.runtime.sendMessage({
          type: 'INJECTION_COMPLETE',
          payload: summary,
        } satisfies Message)
      })
      .catch((err: unknown) => {
        safeLog.error('Fatal injection error:', err)
      })

    return false
  }

  return false
})

// Disconnect the DOM observer when the page unloads to avoid memory leaks.
window.addEventListener('beforeunload', () => observer.disconnect())
