import type { PlasmoCSConfig } from 'plasmo'
import { createWorkItemObserver, getWorkItemType } from './detector'
import { extractFullStory } from './extractor'
import { injectToolbarButton, removeToolbarButton } from './toolbar'
import { injectAllTestCases } from '~/services/injection/injector'
import { safeLog } from '~/utils/safe-log'
import type { Message, InjectionProgress } from '~/types/messages'

export const config: PlasmoCSConfig = {
  matches: ['https://dev.azure.com/*'],
  run_at: 'document_idle',
}

function getCurrentStoryId(): string {
  const match = /workitems\/edit\/(\d+)/.exec(window.location.href)
  return match?.[1] ?? ''
}

function handleDetect(type: string): void {
  safeLog.info('Supported work item detected:', type)
  chrome.runtime.sendMessage({ type: 'WORK_ITEM_DETECTED', payload: { workItemType: type } })
  injectToolbarButton(() => {
    chrome.runtime.sendMessage({ type: 'OPEN_SIDE_PANEL' } satisfies Message)
  })
}

function handleLeave(): void {
  safeLog.info('Left work item page')
  chrome.runtime.sendMessage({ type: 'WORK_ITEM_LEFT', payload: undefined })
  removeToolbarButton()
}

const observer = createWorkItemObserver(handleDetect, handleLeave)

const initialType = getWorkItemType()
if (initialType) handleDetect(initialType)

chrome.runtime.onMessage.addListener((message: Message, _sender, sendResponse) => {
  if (message.type === 'EXTRACT_STORY') {
    extractFullStory()
      .then(story => sendResponse({ type: 'STORY_EXTRACTED', payload: story }))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err)
        sendResponse({ type: 'EXTRACTION_ERROR', payload: { message: msg } } as unknown as Message)
      })
    return true
  }

  if (message.type === 'INJECT_TEST_CASES') {
    const storyId = getCurrentStoryId()
    const cases = message.payload

    void injectAllTestCases(cases, storyId, (progress: InjectionProgress) => {
      chrome.runtime.sendMessage({ type: 'INJECTION_PROGRESS', payload: progress } satisfies Message)
    }).then(summary => {
      chrome.runtime.sendMessage({ type: 'INJECTION_COMPLETE', payload: summary } satisfies Message)
    }).catch((err: unknown) => {
      safeLog.error('Fatal injection error:', err)
    })

    return false
  }

  return false
})

window.addEventListener('beforeunload', () => observer.disconnect())
