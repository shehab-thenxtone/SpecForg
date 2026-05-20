import { debounce } from '~/utils/dom-wait'
import { safeLog } from '~/utils/safe-log'
import { ADO_SELECTORS } from './selectors'

export const SUPPORTED_TYPES = new Set([
  'User Story',
  'Product Backlog Item',
  'Feature',
  'Requirement',
])

const DETECTION_DEBOUNCE_MS = 300

function resolveWorkItemType(): string | null {
  const badge = document.querySelector(ADO_SELECTORS.WORK_ITEM_TYPE_BADGE)
  if (!badge) return null
  return badge.textContent?.trim() ?? null
}

export function isAdoWorkItemPage(): boolean {
  const hasBadge = document.querySelector(ADO_SELECTORS.WORK_ITEM_TYPE_BADGE) !== null
  const hasTitle = document.querySelector(ADO_SELECTORS.TITLE_FIELD) !== null
  return hasBadge && hasTitle
}

export function getWorkItemType(): string | null {
  const type = resolveWorkItemType()
  if (!type || !SUPPORTED_TYPES.has(type)) return null
  return type
}

function patchHistory(onNavigate: () => void): () => void {
  const originalPushState = history.pushState.bind(history)
  const originalReplaceState = history.replaceState.bind(history)

  history.pushState = function (...args) {
    originalPushState(...args)
    onNavigate()
  }
  history.replaceState = function (...args) {
    originalReplaceState(...args)
    onNavigate()
  }

  return () => {
    history.pushState = originalPushState
    history.replaceState = originalReplaceState
  }
}

export function createWorkItemObserver(
  onDetect: (type: string) => void,
  onLeave: () => void
): MutationObserver {
  let lastType: string | null = null

  const check = debounce(() => {
    const currentType = getWorkItemType()

    if (currentType && currentType !== lastType) {
      lastType = currentType
      safeLog.info('Work item detected:', currentType)
      onDetect(currentType)
      return
    }

    if (!currentType && lastType !== null) {
      lastType = null
      safeLog.info('Work item page left')
      onLeave()
    }
  }, DETECTION_DEBOUNCE_MS)

  // Synchronous initial check — covers the case where the page is already
  // loaded when the observer is created (no mutation fires in that case).
  const initialType = getWorkItemType()
  if (initialType) {
    lastType = initialType
    safeLog.info('Work item detected:', initialType)
    onDetect(initialType)
  }

  const observer = new MutationObserver(check)

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-label'],
  })

  const unpatchHistory = patchHistory(check)
  window.addEventListener('popstate', check)
  window.addEventListener('hashchange', check)

  const originalDisconnect = observer.disconnect.bind(observer)
  observer.disconnect = () => {
    originalDisconnect()
    unpatchHistory()
    window.removeEventListener('popstate', check)
    window.removeEventListener('hashchange', check)
  }

  return observer
}
