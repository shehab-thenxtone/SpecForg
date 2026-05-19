import type { EditableTestCase } from '../store'

interface ValidationBannerProps {
  testCases: EditableTestCase[]
}

function hasCardErrors(tc: { title: string; steps: { action: string; expected: string }[] }): boolean {
  if (tc.title.trim().length < 3) return true
  return tc.steps.some(s => !s.action.trim() || !s.expected.trim())
}

function firstError(tc: { title: string; steps: { action: string; expected: string }[] }): string {
  if (tc.title.trim().length < 3) return 'title too short'
  for (let i = 0; i < tc.steps.length; i++) {
    if (!tc.steps[i].action.trim()) return `step ${i + 1}: empty action`
    if (!tc.steps[i].expected.trim()) return `step ${i + 1}: empty expected result`
  }
  return 'validation error'
}

export function ValidationBanner({ testCases }: ValidationBannerProps) {
  const problematic = testCases
    .map((tc, i) => ({ tc, i }))
    .filter(({ tc }) => hasCardErrors(tc))

  if (problematic.length === 0) return null

  return (
    <div
      className="rounded-lg px-3 py-2 text-sm"
      style={{
        backgroundColor: 'rgba(239, 68, 68, 0.08)',
        borderLeft: '3px solid var(--sf-error)',
      }}
    >
      <p className="text-sf-error font-medium mb-1">
        ⚠ {problematic.length} test case{problematic.length !== 1 ? 's' : ''}{' '}
        {problematic.length !== 1 ? 'have' : 'has'} validation errors and cannot be injected:
      </p>
      <ul className="text-zinc-400 space-y-0.5">
        {problematic.map(({ tc, i }) => (
          <li key={i}>
            • TC-{String(i + 1).padStart(2, '0')}: {firstError(tc)}
          </li>
        ))}
      </ul>
    </div>
  )
}
