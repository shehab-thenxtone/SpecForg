const POLL_INTERVAL = 200

/**
 * Polls every 200ms for the given selector. Resolves with the element when
 * found, rejects with a descriptive error if not found within `timeout` ms.
 */
export function waitForElement(selector: string, timeout = 5000): Promise<Element> {
  return new Promise((resolve, reject) => {
    const existing = document.querySelector(selector)
    if (existing) {
      resolve(existing)
      return
    }

    let elapsed = 0
    const interval = setInterval(() => {
      elapsed += POLL_INTERVAL
      const el = document.querySelector(selector)
      if (el) {
        clearInterval(interval)
        resolve(el)
        return
      }
      if (elapsed >= timeout) {
        clearInterval(interval)
        reject(new Error(`waitForElement: "${selector}" not found within ${timeout}ms`))
      }
    }, POLL_INTERVAL)
  })
}

/**
 * Polls every 200ms until the element at `selector` has non-empty text/value.
 * Handles both input elements (uses .value) and regular elements (uses .textContent).
 * Rejects with a descriptive error if the timeout is reached.
 */
export function waitForValue(selector: string, timeout = 5000): Promise<string> {
  const getValue = (): string | null => {
    const el = document.querySelector(selector)
    if (!el) return null
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      return el.value.trim() || null
    }
    return el.textContent?.trim() || null
  }

  return new Promise((resolve, reject) => {
    const initial = getValue()
    if (initial) {
      resolve(initial)
      return
    }

    let elapsed = 0
    const interval = setInterval(() => {
      elapsed += POLL_INTERVAL
      const value = getValue()
      if (value) {
        clearInterval(interval)
        resolve(value)
        return
      }
      if (elapsed >= timeout) {
        clearInterval(interval)
        reject(
          new Error(`waitForValue: "${selector}" had no value within ${timeout}ms`)
        )
      }
    }, POLL_INTERVAL)
  })
}

/**
 * Returns a debounced version of `fn` that delays invocation until `delay` ms
 * have elapsed since the last call.
 */
export function debounce<T extends (...args: unknown[]) => void>(fn: T, delay: number): T {
  let timer: ReturnType<typeof setTimeout>
  return ((...args: unknown[]) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }) as T
}
