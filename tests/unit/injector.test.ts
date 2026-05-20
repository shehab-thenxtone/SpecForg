import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import type { ValidatedTestCase } from '~/schemas/test-case.zod'
import type { InjectionProgress } from '~/types/messages'

vi.mock('~/services/injection/steps-grid', () => ({
  injectAllSteps: vi.fn().mockResolvedValue(undefined),
  waitForStepRowReady: vi.fn().mockResolvedValue(undefined),
}))

vi.mock('~/utils/dom-wait', () => ({
  waitForElement: vi.fn(),
  waitForValue: vi.fn(),
  debounce: vi.fn(),
}))

vi.mock('~/utils/safe-log', () => ({
  safeLog: { info: vi.fn(), warn: vi.fn(), error: vi.fn(), debug: vi.fn() },
}))

import {
  injectTestCase,
  injectAllTestCases,
  retryOperation,
  extractAdoIdFromUrl,
} from '~/services/injection/injector'
import { injectAllSteps } from '~/services/injection/steps-grid'
import { waitForElement } from '~/utils/dom-wait'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTestCase(overrides: Partial<ValidatedTestCase> = {}): ValidatedTestCase {
  return {
    title: 'Login flow',
    priority: 'High',
    preconditions: ['User is logged out'],
    steps: [
      { action: 'Navigate to login page', expected: 'Login page shown' },
      { action: 'Submit credentials', expected: 'Dashboard shown' },
    ],
    tags: ['smoke'],
    coverageType: 'functional',
    acReference: null,
    ...overrides,
  }
}

function makeInputEl(value = ''): HTMLInputElement {
  const el = document.createElement('input')
  el.value = value
  return el
}

function mockDom(): void {
  vi.mocked(waitForElement).mockImplementation(async (selector: string) => {
    if (selector === '[aria-label="Title field"]') return makeInputEl()
    if (selector === '[aria-label="Priority"]') {
      const sel = document.createElement('select')
      const opt = document.createElement('option')
      opt.value = 'High'
      sel.appendChild(opt)
      return sel
    }
    if (selector === '[aria-label="Save work item"]') return document.createElement('button')
    return document.createElement('div')
  })
}

function setAdoLocation(): void {
  Object.defineProperty(window, 'location', {
    value: {
      href: 'https://dev.azure.com/org/proj/_workitems/edit/42',
      assign: vi.fn(),
    },
    writable: true,
    configurable: true,
  })
}

// ---------------------------------------------------------------------------
// extractAdoIdFromUrl
// ---------------------------------------------------------------------------

describe('extractAdoIdFromUrl', () => {
  it('extracts ID from /workitems/edit/:id URL', () => {
    expect(
      extractAdoIdFromUrl('https://dev.azure.com/org/proj/_workitems/edit/4521')
    ).toBe('4521')
  })

  it('extracts ID from ?id= query param', () => {
    expect(
      extractAdoIdFromUrl('https://dev.azure.com/org/proj/_workitems?id=99')
    ).toBe('99')
  })

  it('returns null for unrecognised URLs', () => {
    expect(extractAdoIdFromUrl('https://example.com')).toBeNull()
  })
})

// ---------------------------------------------------------------------------
// retryOperation
// ---------------------------------------------------------------------------

describe('retryOperation', () => {
  afterEach(() => { vi.useRealTimers() })

  it('returns immediately on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    await expect(retryOperation(fn)).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries exactly 3 times before throwing', async () => {
    vi.useFakeTimers()
    const fn = vi.fn().mockRejectedValue(new Error('fail'))
    const promise = retryOperation(fn)
    // Attach rejection handler BEFORE running timers to avoid unhandled-rejection warning
    const check = expect(promise).rejects.toThrow('fail')
    await vi.runAllTimersAsync()
    await check
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('succeeds on the third attempt', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok')
    const promise = retryOperation(fn)
    await vi.runAllTimersAsync()
    await expect(promise).resolves.toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })
})

// ---------------------------------------------------------------------------
// injectTestCase
// ---------------------------------------------------------------------------

describe('injectTestCase', () => {
  beforeEach(() => {
    setAdoLocation()
    mockDom()
    vi.mocked(injectAllSteps).mockResolvedValue(undefined)
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('calls injectAllSteps with the correct steps', async () => {
    const tc = makeTestCase()
    await injectTestCase(tc, 'story-42')
    expect(injectAllSteps).toHaveBeenCalledWith(tc.steps)
  })

  it('returns the ADO ID parsed from the location URL', async () => {
    const { adoId } = await injectTestCase(makeTestCase(), 'story-42')
    expect(adoId).toBe('42')
  })

  it('retries waitForElement up to 3 times when selector is initially missing', async () => {
    vi.useFakeTimers()
    let titleCalls = 0
    vi.mocked(waitForElement).mockImplementation(async (selector: string) => {
      if (selector === '[aria-label="Title field"]') {
        titleCalls++
        if (titleCalls < 3) throw new Error('not found')
        return makeInputEl()
      }
      return document.createElement('div')
    })
    const promise = injectTestCase(makeTestCase(), 'story-42')
    await vi.runAllTimersAsync()
    await promise
    // retryOperation wraps the lookup; it must have been attempted ≥ 3 times
    expect(titleCalls).toBeGreaterThanOrEqual(3)
  })

  it('throws InjectionError when ADO base URL cannot be determined', async () => {
    Object.defineProperty(window, 'location', {
      value: { href: 'https://example.com/not-ado', assign: vi.fn() },
      writable: true,
      configurable: true,
    })
    await expect(injectTestCase(makeTestCase(), 'story-42')).rejects.toMatchObject({
      name: 'InjectionError',
      step: 'navigate',
    })
  })
})

// ---------------------------------------------------------------------------
// injectAllTestCases
// ---------------------------------------------------------------------------

describe('injectAllTestCases', () => {
  beforeEach(() => {
    setAdoLocation()
    mockDom()
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.useRealTimers()
  })

  it('continues injecting after one case fails', async () => {
    vi.mocked(injectAllSteps)
      .mockRejectedValueOnce(new Error('step injection failed'))
      .mockResolvedValue(undefined)

    const summary = await injectAllTestCases(
      [makeTestCase({ title: 'TC 1' }), makeTestCase({ title: 'TC 2' })],
      'story-42',
      vi.fn()
    )

    expect(summary.total).toBe(2)
    expect(injectAllSteps).toHaveBeenCalledTimes(2)
  })

  it('correctly counts succeeded and failed in InjectionSummary', async () => {
    vi.mocked(injectAllSteps)
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue(undefined)

    const summary = await injectAllTestCases(
      [makeTestCase({ title: 'Fails' }), makeTestCase({ title: 'Succeeds' })],
      'story-42',
      vi.fn()
    )

    expect(summary.succeeded).toBe(1)
    expect(summary.failed).toBe(1)
    expect(summary.results[0].status).toBe('failed')
    expect(summary.results[1].status).toBe('success')
  })

  it('calls onProgress for each case plus initial and final', async () => {
    vi.mocked(injectAllSteps).mockResolvedValue(undefined)
    const onProgress = vi.fn()

    await injectAllTestCases([makeTestCase()], 'story-42', onProgress)

    expect(onProgress).toHaveBeenCalled()
    const lastCall: InjectionProgress = onProgress.mock.lastCall[0]
    expect(lastCall.completed).toBe(1)
    expect(lastCall.total).toBe(1)
  })

  it('records the error message in the failed result', async () => {
    vi.mocked(injectAllSteps).mockRejectedValue(new Error('timeout'))

    const summary = await injectAllTestCases([makeTestCase()], 'story-42', vi.fn())

    expect(summary.results[0].error).toContain('timeout')
  })
})

// ---------------------------------------------------------------------------
// waitForStepRowReady  (uses real implementation, not the mock above)
// ---------------------------------------------------------------------------

describe('waitForStepRowReady', () => {
  let realWaitForStepRowReady: (rowIndex: number) => Promise<void>

  beforeEach(async () => {
    const mod = await vi.importActual<typeof import('~/services/injection/steps-grid')>(
      '~/services/injection/steps-grid'
    )
    realWaitForStepRowReady = mod.waitForStepRowReady
    document.body.innerHTML = ''
  })

  afterEach(() => { vi.useRealTimers() })

  it('resolves immediately when the row already exists', async () => {
    document.body.innerHTML = `
      <div aria-label="Test steps">
        <div role="row">
          <div role="gridcell"><input /></div>
          <div role="gridcell"><input /></div>
        </div>
      </div>`
    await expect(realWaitForStepRowReady(0)).resolves.toBeUndefined()
  })

  it('resolves when row is appended via MutationObserver', async () => {
    document.body.innerHTML = '<div aria-label="Test steps"></div>'
    const grid = document.querySelector('[aria-label="Test steps"]')!

    const waitPromise = realWaitForStepRowReady(0)

    const row = document.createElement('div')
    row.setAttribute('role', 'row')
    row.innerHTML = '<div role="gridcell"></div><div role="gridcell"></div>'
    grid.appendChild(row)

    await expect(waitPromise).resolves.toBeUndefined()
  })

  it('falls back to 2-second timeout when row never appears', async () => {
    vi.useFakeTimers()
    document.body.innerHTML = '<div aria-label="Test steps"></div>'

    const waitPromise = realWaitForStepRowReady(0)
    vi.advanceTimersByTime(2000)
    await expect(waitPromise).resolves.toBeUndefined()
  })

  it('resolves via timeout when grid container is missing', async () => {
    vi.useFakeTimers()
    document.body.innerHTML = ''

    const waitPromise = realWaitForStepRowReady(0)
    vi.advanceTimersByTime(2000)
    await expect(waitPromise).resolves.toBeUndefined()
  })
})
