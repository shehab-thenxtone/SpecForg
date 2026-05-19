import { describe, it, expect, vi, afterEach } from 'vitest'
import { withRetry } from '../../src/background/retry-queue'

afterEach(() => {
  vi.useRealTimers()
})

describe('withRetry', () => {
  it('resolves immediately on first success', async () => {
    const fn = vi.fn().mockResolvedValue('result')
    expect(await withRetry(fn, 3, 0)).toBe('result')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries the correct number of times on failure', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok')
    expect(await withRetry(fn, 3, 0)).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('throws after max attempts exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('always fails'))
    await expect(withRetry(fn, 3, 0)).rejects.toThrow('always fails')
    expect(fn).toHaveBeenCalledTimes(3)
  })

  it('resolves on second attempt when first fails', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('transient'))
      .mockResolvedValue('recovered')
    expect(await withRetry(fn, 2, 0)).toBe('recovered')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('applies exponential backoff between retries (fake timers)', async () => {
    vi.useFakeTimers()
    const fn = vi.fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('ok')

    const baseDelay = 200
    const promise = withRetry(fn, 3, baseDelay)

    // Attempt 1 fires synchronously before any timer
    expect(fn).toHaveBeenCalledTimes(1)

    // Advance past delay * 1 → attempt 2 fires
    await vi.advanceTimersByTimeAsync(baseDelay * 1)
    expect(fn).toHaveBeenCalledTimes(2)

    // Advance past delay * 2 → attempt 3 fires
    await vi.advanceTimersByTimeAsync(baseDelay * 2)
    expect(fn).toHaveBeenCalledTimes(3)

    expect(await promise).toBe('ok')
  })

  it('does not wait after the last failed attempt', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('nope'))
    await expect(withRetry(fn, 1, 5000)).rejects.toThrow('nope')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('rethrows the last error when all attempts fail', async () => {
    const errs = [new Error('error 1'), new Error('error 2'), new Error('final error')]
    let i = 0
    const fn = vi.fn().mockImplementation(() => Promise.reject(errs[i++]))
    await expect(withRetry(fn, 3, 0)).rejects.toThrow('final error')
  })
})
