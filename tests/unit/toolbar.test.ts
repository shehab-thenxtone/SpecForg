import { describe, it, expect, vi, beforeEach } from 'vitest'
import { injectToolbarButton, removeToolbarButton } from '~/content/toolbar'

const BTN_SELECTOR = '[data-specforge="toolbar-btn"]'

function addToolbar(role = 'toolbar'): HTMLElement {
  const el = document.createElement('div')
  el.setAttribute('role', role)
  document.body.appendChild(el)
  return el
}

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('injectToolbarButton', () => {
  it('creates a button with data-specforge="toolbar-btn"', () => {
    addToolbar()
    injectToolbarButton(() => {})
    const btn = document.querySelector(BTN_SELECTOR)
    expect(btn).not.toBeNull()
    expect(btn?.getAttribute('data-specforge')).toBe('toolbar-btn')
  })

  it('sets aria-label on the button', () => {
    addToolbar()
    injectToolbarButton(() => {})
    const btn = document.querySelector(BTN_SELECTOR)
    expect(btn?.getAttribute('aria-label')).toBeTruthy()
  })

  it('removes existing button before adding a new one (no duplicates)', () => {
    addToolbar()
    injectToolbarButton(() => {})
    injectToolbarButton(() => {})
    expect(document.querySelectorAll(BTN_SELECTOR).length).toBe(1)
  })

  it('does nothing when no toolbar container is found', () => {
    injectToolbarButton(() => {})
    expect(document.querySelector(BTN_SELECTOR)).toBeNull()
  })

  it('calls onClick when the button is clicked', () => {
    addToolbar()
    const onClick = vi.fn()
    injectToolbarButton(onClick)
    document.querySelector<HTMLElement>(BTN_SELECTOR)?.click()
    expect(onClick).toHaveBeenCalledTimes(1)
  })

  it('appends button inside the toolbar container', () => {
    const toolbar = addToolbar()
    injectToolbarButton(() => {})
    expect(toolbar.querySelector(BTN_SELECTOR)).not.toBeNull()
  })

  it('finds toolbar by aria-label="Toolbar" when role="toolbar" is absent', () => {
    const el = document.createElement('div')
    el.setAttribute('aria-label', 'Toolbar')
    document.body.appendChild(el)
    injectToolbarButton(() => {})
    expect(el.querySelector(BTN_SELECTOR)).not.toBeNull()
  })
})

describe('removeToolbarButton', () => {
  it('removes the button when it is present', () => {
    addToolbar()
    injectToolbarButton(() => {})
    expect(document.querySelector(BTN_SELECTOR)).not.toBeNull()
    removeToolbarButton()
    expect(document.querySelector(BTN_SELECTOR)).toBeNull()
  })

  it('does nothing when no button is present', () => {
    expect(() => removeToolbarButton()).not.toThrow()
  })

  it('removes only the SpecForge button, not other toolbar children', () => {
    const toolbar = addToolbar()
    const other = document.createElement('button')
    other.textContent = 'Other'
    toolbar.appendChild(other)

    injectToolbarButton(() => {})
    removeToolbarButton()

    expect(toolbar.querySelector(BTN_SELECTOR)).toBeNull()
    expect(toolbar.contains(other)).toBe(true)
  })
})
