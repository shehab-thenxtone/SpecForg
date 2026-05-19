import { useState } from 'react'
import type { ValidatedTestCase } from '~/schemas/test-case.zod'
import type { EditableTestCase } from '../store'
import { StepEditor } from './StepEditor'

interface TestCaseCardProps {
  tc: EditableTestCase
  index: number
  onToggleSelect: () => void
  onUpdate: (updates: Partial<ValidatedTestCase>) => void
}

function getCardErrors(tc: ValidatedTestCase): string[] {
  const errors: string[] = []
  if (tc.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters')
  }
  tc.steps.forEach((s, i) => {
    if (!s.action.trim()) errors.push(`Step ${i + 1}: action is empty`)
    if (!s.expected.trim()) errors.push(`Step ${i + 1}: expected result is empty`)
  })
  return errors
}

const PRIORITY_COLORS: Record<string, string> = {
  High: 'text-sf-error',
  Medium: 'text-sf-warning',
  Low: 'text-zinc-400',
}

function TagInput({ onAdd }: { onAdd: (tag: string) => void }) {
  const [value, setValue] = useState('')

  function commit() {
    const trimmed = value.trim().toLowerCase()
    if (trimmed) {
      onAdd(trimmed)
      setValue('')
    }
  }

  return (
    <input
      type="text"
      value={value}
      onChange={e => setValue(e.target.value)}
      onKeyDown={e => {
        if (e.key === 'Enter' || e.key === ',') {
          e.preventDefault()
          commit()
        }
      }}
      onBlur={commit}
      placeholder="+ tag"
      className="px-2 py-0.5 rounded-full text-xs bg-zinc-800/50 border border-dashed border-zinc-700 text-zinc-400 placeholder-zinc-600 focus:outline-none focus:border-sf-blue w-14"
    />
  )
}

export function TestCaseCard({ tc, index, onToggleSelect, onUpdate }: TestCaseCardProps) {
  const [expanded, setExpanded] = useState(false)
  const [draft, setDraft] = useState<ValidatedTestCase>({ ...tc })
  const [isDirty, setIsDirty] = useState(false)

  const errors = getCardErrors(tc)
  const hasErrors = errors.length > 0

  const borderColor = hasErrors
    ? 'var(--sf-error)'
    : tc.selected
    ? 'var(--sf-blue)'
    : 'var(--sf-border)'

  function updateDraft<K extends keyof ValidatedTestCase>(field: K, value: ValidatedTestCase[K]) {
    setDraft(prev => ({ ...prev, [field]: value }))
    setIsDirty(true)
  }

  function handleSave() {
    onUpdate(draft)
    setIsDirty(false)
  }

  function handleCancel() {
    setDraft({ ...tc })
    setIsDirty(false)
    setExpanded(false)
  }

  return (
    <div
      className="rounded-lg overflow-hidden"
      style={{ border: `1px solid ${borderColor}` }}
    >
      <div
        className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/[0.03] transition-colors select-none"
        onClick={() => setExpanded(e => !e)}
      >
        <input
          type="checkbox"
          checked={tc.selected}
          onChange={e => { e.stopPropagation(); onToggleSelect() }}
          onClick={e => e.stopPropagation()}
          className="w-4 h-4 flex-shrink-0 accent-sf-blue"
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-sf-text truncate">
            TC-{String(index + 1).padStart(2, '0')}: {tc.title}
          </p>
          <p className="text-xs text-zinc-500">
            <span className={PRIORITY_COLORS[tc.priority] ?? 'text-zinc-400'}>{tc.priority}</span>
            {' · '}Steps: {tc.steps.length}
            {tc.tags.length > 0 &&
              ` · ${tc.tags.slice(0, 3).join(', ')}${tc.tags.length > 3 ? '…' : ''}`}
          </p>
        </div>
        {hasErrors && <span className="text-sf-error text-xs flex-shrink-0">⚠</span>}
        {tc.hasEdits && !hasErrors && <span className="text-sf-mint text-xs flex-shrink-0">✓</span>}
        <span className="text-zinc-600 text-xs flex-shrink-0">{expanded ? '▲' : '▼'}</span>
      </div>

      {expanded && (
        <div className="px-3 pb-3 pt-2 space-y-3 border-t border-sf-border">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Title</label>
            <input
              type="text"
              value={draft.title}
              onChange={e => updateDraft('title', e.target.value)}
              className="w-full rounded bg-black/20 border border-sf-border px-2 py-1 text-sm text-sf-text focus:outline-none focus:border-sf-blue"
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Priority</label>
            <select
              value={draft.priority}
              onChange={e =>
                updateDraft('priority', e.target.value as 'Low' | 'Medium' | 'High')
              }
              className="rounded bg-black/20 border border-sf-border px-2 py-1 text-sm text-sf-text focus:outline-none focus:border-sf-blue"
            >
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Preconditions</label>
            <div className="space-y-1">
              {draft.preconditions.map((p, i) => (
                <div key={i} className="flex items-center gap-2">
                  <input
                    type="text"
                    value={p}
                    onChange={e =>
                      updateDraft(
                        'preconditions',
                        draft.preconditions.map((x, j) => (j === i ? e.target.value : x))
                      )
                    }
                    className="flex-1 rounded bg-black/20 border border-sf-border px-2 py-1 text-xs text-sf-text focus:outline-none focus:border-sf-blue"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft(
                        'preconditions',
                        draft.preconditions.filter((_, j) => j !== i)
                      )
                    }
                    className="text-zinc-600 hover:text-sf-error transition-colors"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <button
              type="button"
              onClick={() => updateDraft('preconditions', [...draft.preconditions, ''])}
              className="mt-1 text-xs text-sf-blue hover:text-blue-400 transition-colors"
            >
              + Add precondition
            </button>
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Steps</label>
            <StepEditor
              steps={draft.steps}
              onChange={steps => updateDraft('steps', steps)}
            />
          </div>

          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Tags</label>
            <div className="flex flex-wrap gap-1">
              {draft.tags.map((tag, i) => (
                <span
                  key={i}
                  className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-zinc-800 text-zinc-400"
                >
                  {tag}
                  <button
                    type="button"
                    onClick={() =>
                      updateDraft('tags', draft.tags.filter((_, j) => j !== i))
                    }
                    className="hover:text-sf-error transition-colors"
                  >
                    ×
                  </button>
                </span>
              ))}
              <TagInput onAdd={tag => updateDraft('tags', [...draft.tags, tag])} />
            </div>
          </div>

          {isDirty && (
            <div className="flex gap-2 pt-1">
              <button
                type="button"
                onClick={handleSave}
                className="px-3 py-1 text-xs rounded bg-sf-blue text-white hover:bg-blue-500 transition-colors"
              >
                Save Changes
              </button>
              <button
                type="button"
                onClick={handleCancel}
                className="px-3 py-1 text-xs rounded bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {hasErrors && (
            <ul className="text-xs text-sf-error space-y-0.5">
              {errors.map((e, i) => (
                <li key={i}>• {e}</li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
