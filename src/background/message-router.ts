import type { UserStory } from '~/types/user-story'
import type { ValidatedTestCase } from '~/schemas/test-case.zod'
import { runPromptChain } from '~/services/claude/client'
import { getClaudeApiKey } from '~/storage/storage'
import { safeLog } from '~/utils/safe-log'
import type { Message } from '~/types/messages'

type SendResponse = (response: Message) => void

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

export function setupMessageRouter(): void {
  chrome.runtime.onMessage.addListener(
    (message: Message, _sender, sendResponse: SendResponse) => {
      if (message.type === 'GENERATE_TEST_CASES') {
        void handleGenerateTestCases(message.payload, sendResponse)
        return true
      }
      return false
    }
  )
}
