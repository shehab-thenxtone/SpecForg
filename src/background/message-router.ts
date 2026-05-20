import type { UserStory } from '~/types/user-story'
import type { ValidatedTestCase } from '~/schemas/test-case.zod'
import { runPromptChain } from '~/services/claude/client'
import { getClaudeApiKey } from '~/storage/storage'
import { safeLog } from '~/utils/safe-log'
import { browserAPI } from '~/utils/browser-api'
import type { Message } from '~/types/messages'

type SendResponse = (response: Message) => void
type MessageSender = chrome.runtime.MessageSender

async function handleGenerateTestCases(story: UserStory, sendResponse: SendResponse): Promise<void> {
  try {
    const apiKey = await getClaudeApiKey()
    if (!apiKey) {
      sendResponse({
        type: 'ERROR',
        payload: {
          code: 'UNAUTHORIZED',
          message: 'Claude API key is not configured. Please set it in the extension settings.',
        },
      })
      return
    }

    safeLog.info('Starting prompt chain for story', story.id)
    const testCases: ValidatedTestCase[] = await runPromptChain(story, apiKey)

    sendResponse({
      type: 'GENERATION_COMPLETE',
      payload: testCases,
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    safeLog.error('Prompt chain failed:', message)
    sendResponse({
      type: 'ERROR',
      payload: { code: 'SERVER_ERROR', message },
    })
  }
}

async function forwardToActiveTab(message: Message): Promise<void> {
  const tabs = await browserAPI.tabs.query({ active: true, currentWindow: true })
  const tabId = tabs[0]?.id
  if (tabId) {
    browserAPI.tabs.sendMessage(tabId, message)
  }
}

export function setupMessageRouter(): void {
  browserAPI.runtime.onMessage.addListener(
    (message: Message, sender: MessageSender, sendResponse: SendResponse) => {
      if (message.type === 'GENERATE_TEST_CASES') {
        void handleGenerateTestCases(message.payload, sendResponse)
        return true
      }

      if (message.type === 'INJECT_TEST_CASES') {
        void forwardToActiveTab(message)
        return false
      }

      if (message.type === 'INJECTION_PROGRESS' || message.type === 'INJECTION_COMPLETE') {
        // Side panel receives these directly from the content script via runtime.onMessage.
        return false
      }

      if (message.type === 'OPEN_SIDE_PANEL') {
        const tabId = sender.tab?.id
        if (tabId) {
          void browserAPI.sidePanel.open({ tabId })
        }
        return false
      }

      return false
    }
  )
}
