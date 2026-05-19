import { runPromptChain } from '~/services/claude/client'
import { getClaudeApiKey } from '~/storage/storage'
import { safeLog } from '~/utils/safe-log'
import type { Message } from '~/types/messages'

type SendResponse = (response: Message) => void

async function handleGenerateTestCases(
  payload: { story: unknown },
  sendResponse: SendResponse
): Promise<void> {
  try {
    const apiKey = await getClaudeApiKey()
    if (!apiKey) {
      sendResponse({
        type: 'ERROR',
        payload: { message: 'Claude API key is not configured. Please set it in the extension settings.' },
      })
      return
    }

    safeLog.info('Starting prompt chain for story extraction')
    const testCases = await runPromptChain(payload.story as Parameters<typeof runPromptChain>[0], apiKey)

    sendResponse({
      type: 'GENERATION_COMPLETE',
      payload: { testCases },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    safeLog.error('Prompt chain failed:', message)
    sendResponse({
      type: 'ERROR',
      payload: { message },
    })
  }
}

export function setupMessageRouter(): void {
  chrome.runtime.onMessage.addListener(
    (message: Message, _sender, sendResponse: SendResponse) => {
      if (message.type === 'GENERATE_TEST_CASES') {
        handleGenerateTestCases(message.payload as { story: unknown }, sendResponse)
        return true // keep channel open for async response
      }
      return false
    }
  )
}
