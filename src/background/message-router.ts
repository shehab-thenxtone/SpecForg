import type { UserStory } from '~/types/user-story'
import { getClaudeProjectUrl, setPendingSkillInvocation, setAutoStart } from '~/storage/storage'
import { safeLog } from '~/utils/safe-log'
import { browserAPI } from '~/utils/browser-api'
import type { Message } from '~/types/messages'

type SendResponse = (response: Message) => void
type MessageSender = chrome.runtime.MessageSender

function buildSkillInvocationMessage(story: UserStory): string {
  const lines: string[] = [`/ado-test-case-creator ${story.url}`, '']

  lines.push('## Work Item Details', '')
  lines.push(`**ID:** ${story.id}`)
  lines.push(`**Title:** ${story.title}`)
  if (story.priority) lines.push(`**Priority:** ${story.priority}`)
  if (story.areaPath) lines.push(`**Area Path:** ${story.areaPath}`)
  if (story.iteration) lines.push(`**Iteration:** ${story.iteration}`)
  if (story.tags.length > 0) lines.push(`**Tags:** ${story.tags.join(', ')}`)

  if (story.description) {
    lines.push('', '## Description', '', story.description)
  }

  if (story.acceptanceCriteria) {
    lines.push('', '## Acceptance Criteria', '', story.acceptanceCriteria)
  }

  if (story.linkedWorkItems && story.linkedWorkItems.length > 0) {
    lines.push('', '## Related Work Items', '')
    for (const item of story.linkedWorkItems) {
      lines.push(`- **${item.relationship}** | #${item.id} — ${item.title} (${item.type})`)
    }
  }

  return lines.join('\n')
}

async function handleOpenClaudeWithSkill(story: UserStory, sendResponse: SendResponse): Promise<void> {
  try {
    const message = buildSkillInvocationMessage(story)
    await setPendingSkillInvocation(message)

    const projectUrl = await getClaudeProjectUrl()
    const targetUrl = projectUrl ?? 'https://claude.ai/new'

    await browserAPI.tabs.create({ url: targetUrl })
    safeLog.info('Opened Claude.ai tab for skill invocation, story', story.id)

    sendResponse({ type: 'CLAUDE_TAB_OPENED' } satisfies Message)
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    safeLog.error('Failed to open Claude.ai:', msg)
    sendResponse({ type: 'ERROR', payload: { code: 'SERVER_ERROR', message: msg } })
  }
}

export function setupMessageRouter(): void {
  browserAPI.runtime.onMessage.addListener(
    (message: Message, sender: MessageSender, sendResponse: SendResponse) => {
      if (message.type === 'OPEN_CLAUDE_WITH_SKILL') {
        void handleOpenClaudeWithSkill(message.payload, sendResponse)
        return true
      }

      if (message.type === 'OPEN_SIDE_PANEL') {
        const tabId = message.payload?.tabId ?? sender.tab?.id
        if (tabId) {
          // sidePanel.open() MUST be called synchronously within the user-gesture
          // handler — putting it inside a .then() breaks the gesture chain.
          void browserAPI.sidePanel.open({ tabId })
          if (message.payload?.autoStart) {
            void setAutoStart()
          }
        }
        return false
      }

      return false
    }
  )
}
