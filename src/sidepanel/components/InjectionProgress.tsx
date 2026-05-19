import type { InjectionProgress, InjectionSummary } from '~/types/messages'

interface InjectionProgressPanelProps {
  progress: InjectionProgress | null
  summary: InjectionSummary | null
}

export function InjectionProgressPanel({ progress, summary }: InjectionProgressPanelProps) {
  if (summary) {
    return (
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <span className="text-sf-mint text-lg">✓</span>
          <p className="text-sf-text font-medium">
            Injection complete — {summary.succeeded} of {summary.total} created
          </p>
        </div>
        <ul className="space-y-1">
          {summary.results.map((r, i) => (
            <li key={i} className="flex items-center gap-2 text-sm">
              <span className={r.status === 'success' ? 'text-sf-mint' : 'text-sf-error'}>
                {r.status === 'success' ? '✓' : '✗'}
              </span>
              <span className="text-sf-text flex-1 truncate">{r.title}</span>
              {r.adoId && (
                <span className="text-zinc-500 text-xs font-mono">#{r.adoId}</span>
              )}
              {r.error && (
                <span className="text-sf-error text-xs">{r.error}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    )
  }

  if (!progress) return null

  return (
    <div className="space-y-2">
      <p className="text-sm text-zinc-400">
        Injecting {progress.completed} of {progress.total}…
      </p>
      <ul className="space-y-1">
        {progress.results.map((r, i) => (
          <li key={i} className="flex items-center gap-2 text-sm">
            <span
              className={
                r.status === 'success'
                  ? 'text-sf-mint'
                  : r.status === 'failed'
                  ? 'text-sf-error'
                  : r.title === progress.current
                  ? 'text-sf-blue animate-pulse'
                  : 'text-zinc-600'
              }
            >
              {r.status === 'success' ? '✓' : r.status === 'failed' ? '✗' : '○'}
            </span>
            <span
              className={
                r.title === progress.current ? 'text-sf-text' : 'text-zinc-500'
              }
            >
              {r.title}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
