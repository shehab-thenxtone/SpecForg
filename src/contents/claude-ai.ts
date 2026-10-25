/**
 * Content script injected into https://claude.ai/* pages.
 *
 * When a pending skill invocation is stored (written by the background worker
 * after the user clicks "Start"), this script waits for the Claude.ai chat
 * input to become interactive, types the pre-formatted message, and submits it.
 */
import type { PlasmoCSConfig } from 'plasmo'
import { getPendingSkillInvocation, clearPendingSkillInvocation } from '~/storage/storage'

export const config: PlasmoCSConfig = {
  matches: ['https://claude.ai/*'],
  run_at: 'document_idle',
}

// ─── Selectors (Claude.ai DOM — checked in priority order) ───────────────────

const INPUT_SELECTORS = [
  'div[contenteditable="true"][data-lexical-editor="true"]',
  'div[contenteditable="true"].ProseMirror',
  'div[contenteditable="true"]',
  'textarea[placeholder]',
]

const SUBMIT_SELECTORS = [
  'button[aria-label="Send message"]',
  'button[aria-label="Send Message"]',
  'button[type="submit"]',
  'button[data-testid="send-button"]',
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

function findInputElement(): Element | null {
  for (const selector of INPUT_SELECTORS) {
    const el = document.querySelector(selector)
    if (el) return el
  }
  return null
}

function findSubmitButton(): HTMLButtonElement | null {
  for (const selector of SUBMIT_SELECTORS) {
    const el = document.querySelector(selector)
    if (el instanceof HTMLButtonElement) return el
  }
  return null
}

function insertTextIntoElement(el: Element, text: string): void {
  el.focus()

  // Primary method: execCommand — works in most contenteditable editors
  const inserted = document.execCommand('insertText', false, text)

  if (!inserted) {
    // Fallback: clipboard paste event
    const dt = new DataTransfer()
    dt.setData('text/plain', text)
    el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: dt, bubbles: true }))
  }

  // Dispatch input event so the framework picks up the change
  el.dispatchEvent(new Event('input', { bubbles: true }))
}

function waitForInput(timeoutMs = 8000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const el = findInputElement()
    if (el) { resolve(el); return }

    const deadline = Date.now() + timeoutMs
    const observer = new MutationObserver(() => {
      const found = findInputElement()
      if (found) {
        observer.disconnect()
        resolve(found)
      } else if (Date.now() > deadline) {
        observer.disconnect()
        reject(new Error('Claude.ai input field not found within timeout'))
      }
    })
    observer.observe(document.body, { childList: true, subtree: true })

    setTimeout(() => {
      observer.disconnect()
      reject(new Error('Claude.ai input field not found within timeout'))
    }, timeoutMs)
  })
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function injectSkillInvocation(): Promise<void> {
  const message = await getPendingSkillInvocation()
  if (!message) return

  try {
    const inputEl = await waitForInput()

    // Small delay to let the page settle after navigation/hydration
    await new Promise<void>(r => setTimeout(r, 600))

    insertTextIntoElement(inputEl, message)

    // Wait briefly for the submit button to become enabled
    await new Promise<void>(r => setTimeout(r, 300))

    const submitBtn = findSubmitButton()
    if (submitBtn && !submitBtn.disabled) {
      submitBtn.click()
    } else {
      // Fallback: press Enter
      inputEl.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
    }

    await clearPendingSkillInvocation()
  } catch (err) {
    // Non-fatal: user can still interact with Claude.ai manually
    console.warn('[SpecForge] Could not auto-fill skill invocation:', err)
  }
}

void injectSkillInvocation()
