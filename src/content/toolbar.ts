const TOOLBAR_BTN_ATTR = 'data-specforge'
const TOOLBAR_BTN_VALUE = 'toolbar-btn'
const TOOLBAR_BTN_SELECTOR = `[${TOOLBAR_BTN_ATTR}="${TOOLBAR_BTN_VALUE}"]`

function findToolbarContainer(): Element | null {
  return (
    document.querySelector('[role="toolbar"]') ??
    document.querySelector('[aria-label="Toolbar"]') ??
    document.querySelector('[aria-label="work item actions toolbar"]') ??
    null
  )
}

export function injectToolbarButton(onClick: () => void): void {
  removeToolbarButton()

  const container = findToolbarContainer()
  if (!container) return

  const btn = document.createElement('button')
  btn.setAttribute(TOOLBAR_BTN_ATTR, TOOLBAR_BTN_VALUE)
  btn.setAttribute('aria-label', 'Generate test cases with SpecForge')
  btn.type = 'button'
  btn.textContent = '⚡ Generate Tests'
  btn.style.cssText = [
    'background: #3B82F6',
    'color: #fff',
    'border: none',
    'border-radius: 4px',
    'padding: 4px 10px',
    'font-size: 12px',
    'cursor: pointer',
    'margin-left: 8px',
    'line-height: 1.4',
  ].join(';')

  btn.addEventListener('click', onClick)
  container.appendChild(btn)
}

export function removeToolbarButton(): void {
  document.querySelector(TOOLBAR_BTN_SELECTOR)?.remove()
}
