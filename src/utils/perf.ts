import { safeLog } from './safe-log'

export function perfMark(name: string): void {
  if (typeof performance !== 'undefined') {
    performance.mark(name)
  }
}

export function perfMeasure(name: string, startMark: string, endMark: string): number {
  if (typeof performance === 'undefined') return 0
  try {
    performance.measure(name, startMark, endMark)
    const entries = performance.getEntriesByName(name, 'measure')
    return entries[entries.length - 1]?.duration ?? 0
  } catch {
    return 0
  }
}

export function logPerfMetric(label: string, durationMs: number): void {
  safeLog.debug(`[perf] ${label}: ${durationMs.toFixed(1)}ms`)
}
