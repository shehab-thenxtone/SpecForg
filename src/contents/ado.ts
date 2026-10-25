/**
 * Content script entry point — Plasmo picks up files in src/contents/*.
 * Runs on every https://dev.azure.com/* page at document_idle.
 *
 * Responsibilities:
 *  - Detect ADO work-item pages and notify the side panel.
 *  - Inject/remove the ⚡ toolbar button.
 *  - Respond to EXTRACT_STORY messages.
 *  - Reply to QUERY_WORK_ITEM so the side panel can learn the type after it opens.
 */

import type { PlasmoCSConfig } from 'plasmo'

import { createWorkItemObserver, getWorkItemType } from '~/content/detector'
import { extractFullStory } from '~/content/extractor'
import { injectToolbarButton, removeToolbarButton } from '~/content/toolbar'
import type { Message } from '~/types/messages'
import { browserAPI } from '~/utils/browser-api'
import { safeLog } from '~/utils/safe-log'

export const config: PlasmoCSConfig = {
  matches: ['https://dev.azure.com/*'],
  run_at: 'document_idle',
}

// ─── Plasmo HMR guard ─────────────────────────────────────────────────────────
// In dev mode Plasmo's reconnect loop calls chrome.runtime.connect() after an
// extension reload. If the context is already invalid that throws synchronously
// and shows up in chrome://extensions → Errors. We patch the function once at
// content-script load time so it returns a safe no-op Port instead of throwing.
;(function guardRuntimeConnect() {
  if (!chrome?.runtime?.connect) return
  try {
    const orig = chrome.runtime.connect.bind(chrome.runtime)
    const noop = (): chrome.runtime.Port => ({
      name: '',
      disconnect() {},
      postMessage() {},
      sender: undefined,
      onDisconnect: { addListener() {}, removeListener() {}, hasListener() { return false }, hasListeners() { return false } },
      onMessage: { addListener() {}, removeListener() {}, hasListener() { return false }, hasListeners() { return false } },
    })
    chrome.runtime.connect = function (...args: Parameters<typeof chrome.runtime.connect>) {
      if (!chrome.runtime?.id) return noop()
      try { return orig(...args) } catch { return noop() }
    }
  } catch {
    // Property is non-writable on this platform — fall back to window-level catch
    window.addEventListener('error', e => {
      if (e.message === 'Extension context invalidated.') e.preventDefault()
    }, true)
  }
})()

// ─── Safe messaging ───────────────────────────────────────────────────────────

// After an extension reload the content script stays alive but the runtime
// context is invalidated. Guard every outgoing sendMessage call so that
// reloading in dev mode doesn't throw uncaught errors on the ADO page.
function safeSend(message: Message): void {
  if (!chrome.runtime?.id) return
  try {
    browserAPI.runtime.sendMessage(message)
  } catch {
    // context invalidated — silently ignore
  }
}

// ─── Work-item lifecycle ──────────────────────────────────────────────────────

function handleDetect(type: string): void {
  safeLog.info('Work item detected:', type)
  safeSend({ type: 'WORK_ITEM_DETECTED', payload: { workItemType: type } })
  injectToolbarButton(() => safeSend({ type: 'OPEN_SIDE_PANEL' }))
}

function handleLeave(): void {
  safeLog.info('Left work item page')
  safeSend({ type: 'WORK_ITEM_LEFT' })
  removeToolbarButton()
}

const observer = createWorkItemObserver(handleDetect, handleLeave)

// ─── Message handler ──────────────────────────────────────────────────────────

browserAPI.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (!chrome.runtime?.id) return false

  if (message.type === 'QUERY_WORK_ITEM') {
    try {
      sendResponse({
        type: 'WORK_ITEM_STATE',
        payload: { workItemType: getWorkItemType() },
      } satisfies Message)
    } catch { /* context closed */ }
    return true
  }

  if (message.type === 'EXTRACT_STORY') {
    extractFullStory()
      .then(story => {
        try { sendResponse({ type: 'STORY_EXTRACTED', payload: story } satisfies Message) }
        catch { /* context closed */ }
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        try {
          sendResponse({ type: 'ERROR', payload: { code: 'EXTRACTION_FAILED', message: msg } } satisfies Message)
        } catch { /* context closed */ }
      })
    return true
  }

  return false
})

window.addEventListener('beforeunload', () => observer.disconnect())
