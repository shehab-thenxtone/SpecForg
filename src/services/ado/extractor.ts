import type { UserStory, LinkedWorkItem } from '~/types/user-story'
import { waitForValue } from '~/utils/dom-wait'
import { sanitizeHtml } from '~/utils/html-sanitizer'
import { safeLog } from '~/utils/safe-log'
import { perfMark, perfMeasure, logPerfMetric } from '~/utils/perf'
import { ADO_SELECTORS } from './selectors'

const PRIORITY_VALUES = new Set(['Critical', 'High', 'Medium', 'Low'])

function extractId(): string {
  const match = window.location.href.match(/workItems\/(\d+)/)
  if (match) return match[1]

  const headerEl = document.querySelector(ADO_SELECTORS.WORK_ITEM_ID)
  return headerEl?.textContent?.trim() ?? ''
}

function extractTitle(): string {
  const el = document.querySelector(ADO_SELECTORS.TITLE_FIELD)
  if (!el) return ''
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    return el.value.trim()
  }
  return el.textContent?.trim() ?? ''
}

function extractRichTextField(containerSelector: string): string {
  const container = document.querySelector(containerSelector)
  if (!container) return ''
  const richEl = container.querySelector(ADO_SELECTORS.RICH_TEXT)
  const source = richEl ?? container
  const raw = (source as HTMLElement).innerHTML ?? ''
  return sanitizeHtml(raw)
}

function extractPriority(): UserStory['priority'] | undefined {
  const el = document.querySelector(ADO_SELECTORS.PRIORITY)
  const value = el?.textContent?.trim()
  if (value && PRIORITY_VALUES.has(value)) {
    return value as UserStory['priority']
  }
  return undefined
}

function extractTags(): string[] {
  const chips = document.querySelectorAll(ADO_SELECTORS.TAGS_CHIPS)
  return Array.from(chips)
    .map(el => el.textContent?.trim() ?? '')
    .filter(Boolean)
}

function extractAreaPath(): string | undefined {
  const el = document.querySelector(ADO_SELECTORS.AREA_PATH)
  return el?.textContent?.trim() || undefined
}

function extractIteration(): string | undefined {
  const el = document.querySelector(ADO_SELECTORS.ITERATION_PATH)
  return el?.textContent?.trim() || undefined
}

function extractComments(): string[] {
  return Array.from(document.querySelectorAll(ADO_SELECTORS.COMMENT))
    .map(el => el.textContent?.trim() ?? '')
    .filter(Boolean)
}

function extractLinkedWorkItems(): LinkedWorkItem[] {
  return Array.from(document.querySelectorAll(ADO_SELECTORS.LINK_ROW))
    .map((row): LinkedWorkItem | null => {
      const idEl = row.querySelector(ADO_SELECTORS.LINK_ID_CELL)
      const typeEl = row.querySelector(ADO_SELECTORS.LINK_TYPE_CELL)
      const titleEl = row.querySelector(ADO_SELECTORS.LINK_TITLE_CELL)
      const relEl = row.querySelector(ADO_SELECTORS.LINK_RELATIONSHIP_CELL)

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
  return Array.from(document.querySelectorAll(ADO_SELECTORS.LINK_ROW))
    .filter(row => {
      const typeEl = row.querySelector(ADO_SELECTORS.LINK_TYPE_CELL)
      return typeEl?.textContent?.trim() === 'Test Case'
    })
    .map(row => {
      const titleEl = row.querySelector(ADO_SELECTORS.LINK_TITLE_CELL)
      return titleEl?.textContent?.trim() ?? ''
    })
    .filter(Boolean)
}

export async function extractFullStory(): Promise<UserStory> {
  perfMark('extract:start')
  safeLog.info('Waiting for title field to be populated…')
  try {
    await waitForValue(ADO_SELECTORS.TITLE_FIELD, 5000)
  } catch {
    throw new Error('ExtractionError: title field did not load within 5 seconds')
  }

  const title = extractTitle()
  const description = extractRichTextField(ADO_SELECTORS.DESCRIPTION)
  const acceptanceCriteria = extractRichTextField(ADO_SELECTORS.ACCEPTANCE_CRITERIA)

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

  perfMark('extract:end')
  logPerfMetric('extractFullStory', perfMeasure('extraction', 'extract:start', 'extract:end'))
  safeLog.info('Extraction complete for work item', story.id)
  return story
}
