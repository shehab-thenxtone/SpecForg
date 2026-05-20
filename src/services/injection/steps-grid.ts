import { safeLog } from '~/utils/safe-log'

const STEPS_GRID_SELECTOR = '[aria-label="Test steps"]'
const STEP_ROW_TIMEOUT_MS = 2000

export class StepInjectionError extends Error {
  constructor(
    public readonly stepIndex: number,
    public readonly action: string,
    public readonly expected: string
  ) {
    super(`Failed to inject step ${stepIndex + 1}: "${action.slice(0, 40)}"`)
    this.name = 'StepInjectionError'
  }
}

function getStepsGrid(): Element | null {
  return document.querySelector(STEPS_GRID_SELECTOR)
}

export function getStepRow(rowIndex: number): Element | null {
  const grid = getStepsGrid()
  if (!grid) return null
  const rows = grid.querySelectorAll('[role="row"]')
  return (rows[rowIndex] as Element | undefined) ?? null
}

function getCells(row: Element): { action: HTMLElement | null; expected: HTMLElement | null } {
  const cells = row.querySelectorAll('[role="gridcell"]')
  return {
    action: (cells[0] as HTMLElement | undefined) ?? null,
    expected: (cells[1] as HTMLElement | undefined) ?? null,
  }
}

function getEditable(cell: HTMLElement): HTMLInputElement | HTMLTextAreaElement | HTMLElement | null {
  const input = cell.querySelector('input') ?? cell.querySelector('textarea')
  if (input) return input as HTMLInputElement | HTMLTextAreaElement
  if (cell.contentEditable === 'true') return cell
  return null
}

function getTextValue(el: HTMLElement): string {
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) return el.value
  return el.textContent ?? ''
}

async function injectViaKeyboard(cell: HTMLElement, text: string): Promise<boolean> {
  try {
    const el = getEditable(cell)
    if (!el) return false
    el.focus()
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.value = ''
    } else {
      el.textContent = ''
    }
    for (const char of text) {
      el.dispatchEvent(new KeyboardEvent('keydown', { key: char, bubbles: true }))
      if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
        el.value += char
      } else {
        el.textContent = (el.textContent ?? '') + char
      }
      el.dispatchEvent(new InputEvent('input', { bubbles: true, data: char }))
      el.dispatchEvent(new KeyboardEvent('keyup', { key: char, bubbles: true }))
    }
    return getTextValue(el).trim() === text.trim()
  } catch {
    return false
  }
}

async function injectViaClipboard(cell: HTMLElement, text: string): Promise<boolean> {
  try {
    const el = getEditable(cell)
    if (!el) return false
    await navigator.clipboard.writeText(text)
    el.focus()
    document.execCommand('paste')
    await new Promise(r => setTimeout(r, 50))
    return getTextValue(el).trim() === text.trim()
  } catch {
    return false
  }
}

function injectViaDom(cell: HTMLElement, text: string): boolean {
  try {
    const el = getEditable(cell)
    if (!el) return false
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.value = text
    } else {
      el.textContent = text
    }
    el.dispatchEvent(new Event('input', { bubbles: true }))
    el.dispatchEvent(new Event('change', { bubbles: true }))
    return getTextValue(el).trim() === text.trim()
  } catch {
    return false
  }
}

async function injectCellValue(cell: HTMLElement, text: string): Promise<boolean> {
  if (await injectViaKeyboard(cell, text)) return true
  if (await injectViaClipboard(cell, text)) return true
  return injectViaDom(cell, text)
}

export async function waitForStepRowReady(rowIndex: number): Promise<void> {
  return new Promise(resolve => {
    const grid = getStepsGrid()
    if (!grid) {
      setTimeout(resolve, STEP_ROW_TIMEOUT_MS)
      return
    }

    const existing = getStepRow(rowIndex)
    if (existing) {
      resolve()
      return
    }

    let resolved = false

    const timer = setTimeout(() => {
      if (resolved) return
      resolved = true
      observer.disconnect()
      resolve()
    }, STEP_ROW_TIMEOUT_MS)

    const observer = new MutationObserver(() => {
      if (resolved) return
      if (getStepRow(rowIndex)) {
        resolved = true
        clearTimeout(timer)
        observer.disconnect()
        resolve()
      }
    })

    observer.observe(grid, { childList: true, subtree: true })
  })
}

export async function injectStep(stepIndex: number, action: string, expected: string): Promise<void> {
  const row = getStepRow(stepIndex)
  if (!row) throw new StepInjectionError(stepIndex, action, expected)

  const { action: actionCell, expected: expectedCell } = getCells(row)
  if (!actionCell || !expectedCell) throw new StepInjectionError(stepIndex, action, expected)

  const actionOk = await injectCellValue(actionCell, action)
  if (!actionOk) throw new StepInjectionError(stepIndex, action, expected)

  const expectedOk = await injectCellValue(expectedCell, expected)
  if (!expectedOk) throw new StepInjectionError(stepIndex, action, expected)

  row.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }))
  safeLog.info(`Step ${stepIndex + 1} injected`)
}

export async function injectAllSteps(steps: { action: string; expected: string }[]): Promise<void> {
  for (let i = 0; i < steps.length; i++) {
    await waitForStepRowReady(i)
    await injectStep(i, steps[i].action, steps[i].expected)
  }
}
