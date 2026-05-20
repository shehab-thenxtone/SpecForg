import type { ValidatedTestCase } from '~/schemas/test-case.zod'
import type { InjectionProgress, InjectionSummary } from '~/types/messages'
import { waitForElement } from '~/utils/dom-wait'
import { injectAllSteps } from './steps-grid'
import { safeLog } from '~/utils/safe-log'
import { SpecForgeError, ERROR_CODES } from '~/utils/errors'
import { perfMark, perfMeasure, logPerfMetric } from '~/utils/perf'
import { ADO_SELECTORS } from '~/services/ado/selectors'

export class InjectionError extends SpecForgeError {
  constructor(
    public readonly step: string,
    public readonly reason: string
  ) {
    super(ERROR_CODES.INJECTION_FAILED, `Injection failed at "${step}": ${reason}`)
    this.name = 'InjectionError'
  }
}

const RETRY_ATTEMPTS = 3
const RETRY_DELAY_MS = 500

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export async function retryOperation<T>(fn: () => Promise<T>): Promise<T> {
  let lastError: Error | undefined
  for (let attempt = 0; attempt < RETRY_ATTEMPTS; attempt++) {
    try {
      return await fn()
    } catch (err) {
      lastError = err instanceof Error ? err : new Error(String(err))
      if (attempt < RETRY_ATTEMPTS - 1) await delay(RETRY_DELAY_MS)
    }
  }
  throw lastError
}

async function fillField(selector: string, value: string): Promise<void> {
  const el = await waitForElement(selector)
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
    el.value = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
  } else if (el instanceof HTMLElement) {
    el.textContent = value
    el.dispatchEvent(new Event('input', { bubbles: true }))
  }
}

async function selectOption(selector: string, value: string): Promise<void> {
  const el = await waitForElement(selector)
  if (el instanceof HTMLSelectElement) {
    el.value = value
    el.dispatchEvent(new Event('change', { bubbles: true }))
  }
}

async function clickEl(selector: string): Promise<void> {
  const el = await waitForElement(selector)
  if (el instanceof HTMLElement) el.click()
}

export function extractAdoIdFromUrl(url: string): string | null {
  const match = /[?&]id=(\d+)|workitems\/edit\/(\d+)/.exec(url)
  return match?.[1] ?? match?.[2] ?? null
}

function getAdoBaseUrl(currentUrl: string): string {
  const match = /https:\/\/dev\.azure\.com\/[^/]+\/[^/]+/.exec(currentUrl)
  return match?.[0] ?? ''
}

export async function injectTestCase(
  testCase: ValidatedTestCase,
  parentStoryId: string,
  onProgress?: (step: string) => void
): Promise<{ adoId: string }> {
  perfMark('inject:start')

  const report = (step: string): void => {
    onProgress?.(step)
    safeLog.info('Injection step:', step)
  }

  // 1. Navigate to new test case form
  report('Navigating to new Test Case form')
  const baseUrl = getAdoBaseUrl(window.location.href)
  if (!baseUrl) throw new InjectionError('navigate', 'Could not determine ADO base URL')
  window.location.assign(`${baseUrl}/_workitems/create/Test%20Case`)

  // 2. Wait for form to load
  report('Waiting for form')
  await retryOperation(() => waitForElement(ADO_SELECTORS.TITLE_FIELD))

  // 3. Fill title
  report('Filling title')
  await retryOperation(() => fillField(ADO_SELECTORS.TITLE_FIELD, testCase.title))

  // 4. Set priority
  report('Setting priority')
  await retryOperation(() => selectOption(ADO_SELECTORS.PRIORITY, testCase.priority)).catch(() => {
    safeLog.warn('Priority field not found, skipping')
  })

  // 5. Add tags
  if (testCase.tags.length > 0) {
    report('Adding tags')
    await retryOperation(async () => {
      const tagsInput = await waitForElement(ADO_SELECTORS.TAGS_INPUT)
      if (tagsInput instanceof HTMLInputElement) {
        for (const tag of testCase.tags) {
          tagsInput.value = tag
          tagsInput.dispatchEvent(new Event('input', { bubbles: true }))
          tagsInput.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
        }
      }
    }).catch(() => safeLog.warn('Tags field not found, skipping'))
  }

  // 6. Inject steps
  report('Injecting test steps')
  await injectAllSteps(testCase.steps)

  // 7. Link to parent story
  if (parentStoryId) {
    report('Linking to parent story')
    await retryOperation(async () => {
      await clickEl(ADO_SELECTORS.ADD_LINK)
      const linkType = await waitForElement(ADO_SELECTORS.LINK_DIALOG_TYPE)
      if (linkType instanceof HTMLSelectElement) {
        linkType.value = 'Tested By'
        linkType.dispatchEvent(new Event('change', { bubbles: true }))
      }
      await fillField(ADO_SELECTORS.WORK_ITEM_ID, parentStoryId)
      await clickEl(ADO_SELECTORS.LINK_DIALOG_OK)
    }).catch(() => safeLog.warn('Parent linking failed, skipping'))
  }

  // 8. Save
  report('Saving')
  await retryOperation(() => clickEl(ADO_SELECTORS.SAVE_WORK_ITEM))

  // 9. Confirm saved ID
  report('Confirming save')
  await waitForElement(ADO_SELECTORS.CONFIRM_SAVED).catch(() => {})
  const adoId = extractAdoIdFromUrl(window.location.href) ?? 'unknown'

  perfMark('inject:end')
  logPerfMetric('injectTestCase', perfMeasure('injection', 'inject:start', 'inject:end'))

  return { adoId }
}

export async function injectAllTestCases(
  testCases: ValidatedTestCase[],
  parentStoryId: string,
  onProgress: (progress: InjectionProgress) => void
): Promise<InjectionSummary> {
  const results: InjectionSummary['results'] = testCases.map(tc => ({
    title: tc.title,
    status: 'failed' as const,
  }))

  let succeeded = 0
  let failed = 0

  const buildProgress = (completedIndex: number, currentTitle: string): InjectionProgress => ({
    total: testCases.length,
    completed: completedIndex,
    current: currentTitle,
    results: results.map(r => ({ title: r.title, id: r.adoId, status: r.status as 'success' | 'failed' | 'pending' })),
  })

  onProgress({
    total: testCases.length,
    completed: 0,
    current: testCases[0]?.title ?? '',
    results: testCases.map(tc => ({ title: tc.title, status: 'pending' as const })),
  })

  for (let i = 0; i < testCases.length; i++) {
    const tc = testCases[i]
    onProgress(buildProgress(i, tc.title))

    try {
      const { adoId } = await injectTestCase(tc, parentStoryId, step => {
        onProgress(buildProgress(i, `${tc.title}: ${step}`))
      })
      results[i] = { title: tc.title, adoId, status: 'success' }
      succeeded++
      safeLog.info(`Injected "${tc.title}" → #${adoId}`)
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err)
      results[i] = { title: tc.title, status: 'failed', error }
      failed++
      safeLog.error(`Failed to inject "${tc.title}":`, error)
    }
  }

  onProgress(buildProgress(testCases.length, ''))

  return { total: testCases.length, succeeded, failed, results }
}
