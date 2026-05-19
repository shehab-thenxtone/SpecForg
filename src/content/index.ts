import type { PlasmoCSConfig } from 'plasmo'
import { createWorkItemObserver, getWorkItemType } from './detector'
import { extractFullStory } from './extractor'
import { safeLog } from '~/utils/safe-log'

export const config: PlasmoCSConfig = {
  matches: ['https://dev.azure.com/*'],
  run_at: 'document_idle',
}

function handleDetect(type: string): void {
  safeLog.info('Supported work item detected:', type)
  chrome.runtime.sendMessage({
    type: 'WORK_ITEM_DETECTED',
    payload: { workItemType: type },
  })
}

function handleLeave(): void {
  safeLog.info('Left work item page')
  chrome.runtime.sendMessage({ type: 'WORK_ITEM_LEFT', payload: undefined })
}

const observer = createWorkItemObserver(handleDetect, handleLeave)

// Check immediately in case the page is already loaded
const initialType = getWorkItemType()
if (initialType) {
  handleDetect(initialType)
}

// Expose extractFullStory for messages from background/popup
chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.type !== 'EXTRACT_STORY') return false

  extractFullStory()
    .then(story => sendResponse({ type: 'STORY_EXTRACTED', payload: story }))
    .catch((err: unknown) => {
      const msg = err instanceof Error ? err.message : String(err)
      sendResponse({ type: 'EXTRACTION_ERROR', payload: { message: msg } })
    })

  return true // keep channel open for async sendResponse
})

// Clean up observer when content script is unloaded
window.addEventListener('beforeunload', () => observer.disconnect())
