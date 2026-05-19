export async function withRetry<T>(
  fn: () => Promise<T>,
  maxAttempts: number,
  delayMs: number
): Promise<T> {
  let lastError: unknown
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const p = fn()
    // Eagerly attach a no-op catch so the rejection is never momentarily
    // "unhandled" before the await machinery registers its own handler.
    p.catch(() => undefined)
    try {
      return await p
    } catch (err) {
      lastError = err
      if (attempt < maxAttempts) {
        await new Promise<void>(resolve => setTimeout(resolve, delayMs * attempt))
      }
    }
  }
  throw lastError
}
