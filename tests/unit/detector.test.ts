import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SUPPORTED_TYPES,
  isAdoWorkItemPage,
  getWorkItemType,
  createWorkItemObserver,
} from '../../src/services/ado/detector'

function setDom(html: string) {
  document.body.innerHTML = html
}

function badge(type: string) {
  return `<span aria-label="Work item type">${type}</span>`
}

const titleField = `<input aria-label="Title field" value="My Story" />`

beforeEach(() => {
  document.body.innerHTML = ''
})

describe('SUPPORTED_TYPES', () => {
  it('includes User Story, Product Backlog Item, Feature, Requirement', () => {
    expect(SUPPORTED_TYPES.has('User Story')).toBe(true)
    expect(SUPPORTED_TYPES.has('Product Backlog Item')).toBe(true)
    expect(SUPPORTED_TYPES.has('Feature')).toBe(true)
    expect(SUPPORTED_TYPES.has('Requirement')).toBe(true)
  })

  it('does not include Bug or Task', () => {
    expect(SUPPORTED_TYPES.has('Bug')).toBe(false)
    expect(SUPPORTED_TYPES.has('Task')).toBe(false)
  })
})

describe('isAdoWorkItemPage', () => {
  it('returns true when both badge and title field are present', () => {
    setDom(badge('User Story') + titleField)
    expect(isAdoWorkItemPage()).toBe(true)
  })

  it('returns false when badge is absent', () => {
    setDom(titleField)
    expect(isAdoWorkItemPage()).toBe(false)
  })

  it('returns false when title field is absent', () => {
    setDom(badge('User Story'))
    expect(isAdoWorkItemPage()).toBe(false)
  })

  it('returns false on empty page', () => {
    setDom('')
    expect(isAdoWorkItemPage()).toBe(false)
  })
})

describe('getWorkItemType', () => {
  it('returns the type for a supported work item page', () => {
    setDom(badge('User Story') + titleField)
    expect(getWorkItemType()).toBe('User Story')
  })

  it('returns null for an unsupported type', () => {
    setDom(badge('Bug') + titleField)
    expect(getWorkItemType()).toBe(null)
  })

  it('returns null when badge is missing', () => {
    setDom(titleField)
    expect(getWorkItemType()).toBe(null)
  })

  it('returns null on a non-work-item page', () => {
    setDom('<div>Boards</div>')
    expect(getWorkItemType()).toBe(null)
  })

  it('handles each supported type', () => {
    for (const type of SUPPORTED_TYPES) {
      setDom(badge(type) + titleField)
      expect(getWorkItemType()).toBe(type)
    }
  })
})

describe('createWorkItemObserver', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('returns a MutationObserver', () => {
    const obs = createWorkItemObserver(() => {}, () => {})
    expect(obs).toBeInstanceOf(MutationObserver)
    obs.disconnect()
  })

  it('calls onDetect via debounced DOM mutation when supported type added', async () => {
    setDom('')
    const onDetect = vi.fn()
    const onLeave = vi.fn()
    const obs = createWorkItemObserver(onDetect, onLeave)

    document.body.innerHTML = badge('Feature') + titleField

    // Wait for debounce (300ms) + a small buffer
    await new Promise(r => setTimeout(r, 500))

    expect(onDetect).toHaveBeenCalledWith('Feature')
    expect(onLeave).not.toHaveBeenCalled()
    obs.disconnect()
  })

  it('calls onLeave when work item DOM is removed', async () => {
    setDom(badge('User Story') + titleField)
    const onDetect = vi.fn()
    const onLeave = vi.fn()
    const obs = createWorkItemObserver(onDetect, onLeave)

    // Wait for initial detection
    await new Promise(r => setTimeout(r, 500))
    expect(onDetect).toHaveBeenCalledTimes(1)

    // Remove work item DOM
    document.body.innerHTML = '<div>Backlog</div>'
    await new Promise(r => setTimeout(r, 500))

    expect(onLeave).toHaveBeenCalledTimes(1)
    obs.disconnect()
  })

  it('observer.disconnect() removes popstate and hashchange listeners', () => {
    const removeSpy = vi.spyOn(window, 'removeEventListener')
    const obs = createWorkItemObserver(() => {}, () => {})
    obs.disconnect()
    expect(removeSpy).toHaveBeenCalledWith('popstate', expect.any(Function))
    expect(removeSpy).toHaveBeenCalledWith('hashchange', expect.any(Function))
  })
})
