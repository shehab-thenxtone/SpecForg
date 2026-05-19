import type { UserStory, LinkedWorkItem } from '~/types/user-story'
import { waitForValue } from '~/utils/dom-wait'
import { sanitizeHtml } from '~/utils/html-sanitizer'
import { safeLog } from '~/utils/safe-log'

const TITLE_SELECTOR = '[aria-label="Title field"]'
const DESCRIPTION_SELECTOR = '[aria-label="Description"]'
const AC_SELECTOR = '[aria-label="Acceptance Criteria"]'
const PRIORITY_SELECTOR = '[aria-label="Priority"]'
const TAGS_SELECTOR = '[aria-label="Tags"] .tag-item'
const AREA_PATH_SELECTOR = '[aria-label="Area Path"]'
const ITERATION_SELECTOR = '[aria-label="Iteration Path"]'
const COMMENT_SELECTOR = '.discussion-item .comment-body'
const LINK_ROW_SELECTOR = '.links-control-link-list .workitem-link-row'

const RICH_TEXT_SELECTOR = '.rich-text-content'
const PRIORITY_VALUES = new Set(['Critical', 'High', 'Medium', 'Low'])

function extractId(): string {
  const match = window.location.href.match(/workItems\/(\d+)/)
  if (match) return match[1]

  const headerEl = document.querySelector('[aria-label="Work item ID"]')
  return headerEl?.textContent?.trim() ?? ''
}

function extractTitle(): string {
  const el = document.querySelector(TITLE_SELECTOR)
  if (!el) return ''
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value.trim()
  }
  return el.textContent?.trim() ?? ''
}

function extractRichTextField(containerSelector: string): string {
  const container = document.querySelector(containerSelector)
  if (!container) return ''
  const richEl = container.querySelector(RICH_TEXT_SELECTOR)
  const source = richEl ?? container
  const raw = (source as HTMLElement).innerHTML ?? ''
  return sanitizeHtml(raw)
}

function extractPriority(): UserStory['priority'] | undefined {
  const el = document.querySelector(PRIORITY_SELECTOR)
  const value = el?.textContent?.trim()
  if (value && PRIORITY_VALUES.has(value)) {
    return value as UserStory['priority']
  }
  return undefined
}

function extractTags(): string[] {
  const chips = document.querySelectorAll(TAGS_SELECTOR)
  return Array.from(chips)
    .map(el => el.textContent?.trim() ?? '')
    .filter(Boolean)
}

function extractAreaPath(): string | undefined {
  const el = document.querySelector(AREA_PATH_SELECTOR)
  return el?.textContent?.trim() || undefined
}

function extractIteration(): string | undefined {
  const el = document.querySelector(ITERATION_SELECTOR)
  return el?.textContent?.trim() || undefined
}

function extractComments(): string[] {
  return Array.from(document.querySelectorAll(COMMENT_SELECTOR))
    .map(el => el.textContent?.trim() ?? '')
    .filter(Boolean)
}

function extractLinkedWorkItems(): LinkedWorkItem[] {
  return Array.from(document.querySelectorAll(LINK_ROW_SELECTOR))
    .map((row): LinkedWorkItem | null => {
      const idEl = row.querySelector('[aria-label="Link ID"]')
      const typeEl = row.querySelector('[aria-label="Link Type"]')
      const titleEl = row.querySelector('[aria-label="Link Title"]')
      const relEl = row.querySelector('[aria-label="Link Relationship"]')

      const id = idEl?.textContent?.trim()
      const title = titleEl?.textContent?.trim()

      if (!id || !title) return null

      return {
        id,
        type: typeEl?.textContent?.trim() ?? '',
        title,
        relationship: relEl?.textContent?.trim() ?? '',
      }
    })
    .filter((item): item is LinkedWorkItem => item !== null)
}

function extractExistingTestCases(): string[] {
  return Array.from(document.querySelectorAll(LINK_ROW_SELECTOR))
    .filter(row => {
      const typeEl = row.querySelector('[aria-label="Link Type"]')
      return typeEl?.textContent?.trim() === 'Test Case'
    })
    .map(row => {
      const titleEl = row.querySelector('[aria-label="Link Title"]')
      return titleEl?.textContent?.trim() ?? ''
    })
    .filter(Boolean)
}

export async function extractFullStory(): Promise<UserStory> {
  safeLog.info('Waiting for title field to be populated…')
  try {
    await waitForValue(TITLE_SELECTOR, 5000)
  } catch {
    throw new Error('ExtractionError: title field did not load within 5 seconds')
  }

  const title = extractTitle()
  const description = extractRichTextField(DESCRIPTION_SELECTOR)
  const acceptanceCriteria = extractRichTextField(AC_SELECTOR)

  if (!title) throw new Error('ExtractionError: title field is empty after wait')

  const story: UserStory = {
    id: extractId(),
    title,
    description,
    acceptanceCriteria,
    tags: extractTags(),
  }

  const priority = extractPriority()
  if (priority !== undefined) story.priority = priority

  const areaPath = extractAreaPath()
  if (areaPath) story.areaPath = areaPath

  const iteration = extractIteration()
  if (iteration) story.iteration = iteration

  const comments = extractComments()
  if (comments.length > 0) story.comments = comments

  const linkedWorkItems = extractLinkedWorkItems()
  if (linkedWorkItems.length > 0) story.linkedWorkItems = linkedWorkItems

  const existingTestCases = extractExistingTestCases()
  if (existingTestCases.length > 0) story.existingTestCases = existingTestCases

  safeLog.info('Extraction complete for work item', story.id)
  return story
}
