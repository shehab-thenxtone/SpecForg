import { useEffect, useRef } from 'react'

interface Step {
  action: string
  expected: string
}

interface AutoTextareaProps {
  value: string
  placeholder: string
  onChange: (value: string) => void
}

function AutoTextarea({ value, placeholder, onChange }: AutoTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = 'auto'
      ref.current.style.height = `${ref.current.scrollHeight}px`
    }
  }, [value])

  return (
    <textarea
      ref={ref}
      value={value}
      placeholder={placeholder}
      rows={1}
      onChange={e => onChange(e.target.value)}
      className="w-full resize-none rounded bg-black/20 border border-sf-border px-2 py-1 text-xs text-sf-text placeholder-zinc-600 focus:outline-none focus:border-sf-blue"
      style={{ overflow: 'hidden' }}
    />
  )
}

interface StepEditorProps {
  steps: Step[]
  onChange: (steps: Step[]) => void
}

export function StepEditor({ steps, onChange }: StepEditorProps) {
  function updateStep(index: number, field: keyof Step, value: string) {
    onChange(steps.map((s, i) => (i === index ? { ...s, [field]: value } : s)))
  }

  function addStep() {
    onChange([...steps, { action: '', expected: '' }])
  }

  function removeStep(index: number) {
    if (steps.length === 1) return
    onChange(steps.filter((_, i) => i !== index))
  }

  return (
    <div className="space-y-2">
      {steps.map((step, i) => (
        <div key={i} className="grid gap-2" style={{ gridTemplateColumns: 'auto 1fr auto' }}>
          <span className="text-xs text-zinc-600 pt-1.5 w-5 text-center select-none">
            {i + 1}
          </span>
          <div className="space-y-1">
            <AutoTextarea
              value={step.action}
              placeholder="Action"
              onChange={v => updateStep(i, 'action', v)}
            />
            <AutoTextarea
              value={step.expected}
              placeholder="Expected result"
              onChange={v => updateStep(i, 'expected', v)}
            />
          </div>
          <button
            type="button"
            onClick={() => removeStep(i)}
            disabled={steps.length === 1}
            title="Remove step"
            className="mt-1 text-zinc-600 hover:text-sf-error disabled:opacity-30 transition-colors text-base leading-none"
          >
            ×
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={addStep}
        className="text-xs text-sf-blue hover:text-blue-400 transition-colors"
      >
        + Add step
      </button>
    </div>
  )
}
