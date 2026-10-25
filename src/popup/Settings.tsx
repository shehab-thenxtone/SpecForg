import { useEffect, useState } from 'react'
import {
  getClaudeProjectUrl,
  getUserPreferences,
  setClaudeProjectUrl,
  setUserPreferences,
} from '~/storage/storage'
import type { UserPreferences } from '~/storage/storage'

type ToastKind = 'success' | 'error'

interface Toast {
  message: string
  kind: ToastKind
}

export function Settings() {
  const [claudeProjectUrl, setClaudeProjectUrlState] = useState('')
  const [prefs, setPrefs] = useState<UserPreferences>({
    defaultPriority: 'Medium',
    autoSelectAll: true,
    showAdvancedOptions: false,
  })
  const [toast, setToast] = useState<Toast | null>(null)

  useEffect(() => {
    void Promise.all([
      getClaudeProjectUrl(),
      getUserPreferences(),
    ]).then(([projectUrl, userPrefs]) => {
      if (projectUrl) setClaudeProjectUrlState(projectUrl)
      setPrefs(userPrefs)
    })
  }, [])

  function showToast(message: string, kind: ToastKind) {
    setToast({ message, kind })
    setTimeout(() => setToast(null), 3000)
  }

  async function handleSave() {
    try {
      await Promise.all([
        setClaudeProjectUrl(claudeProjectUrl.trim()),
        setUserPreferences(prefs),
      ])
      showToast('Settings saved', 'success')
    } catch {
      showToast('Failed to save settings', 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Claude Integration
        </h2>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Claude Project URL</label>
          <input
            type="url"
            value={claudeProjectUrl}
            onChange={e => setClaudeProjectUrlState(e.target.value)}
            placeholder="https://claude.ai/project/…  (leave blank for new chat)"
            className="w-full rounded bg-black/20 border border-sf-border px-2 py-1.5 text-sm text-sf-text placeholder-zinc-600 focus:outline-none focus:border-sf-blue"
          />
          <p className="text-xs text-zinc-600 mt-1">
            "Start" opens this URL and invokes /ado-test-case-creator automatically.
          </p>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          Preferences
        </h2>
        <div>
          <label className="text-xs text-zinc-500 mb-1 block">Default priority</label>
          <select
            value={prefs.defaultPriority}
            onChange={e =>
              setPrefs(p => ({
                ...p,
                defaultPriority: e.target.value as UserPreferences['defaultPriority'],
              }))
            }
            className="rounded bg-black/20 border border-sf-border px-2 py-1 text-sm text-sf-text focus:outline-none focus:border-sf-blue"
          >
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.autoSelectAll}
            onChange={e => setPrefs(p => ({ ...p, autoSelectAll: e.target.checked }))}
            className="w-4 h-4 accent-sf-blue"
          />
          <span className="text-sm text-sf-text">Auto-select all generated cases</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={prefs.showAdvancedOptions}
            onChange={e => setPrefs(p => ({ ...p, showAdvancedOptions: e.target.checked }))}
            className="w-4 h-4 accent-sf-blue"
          />
          <span className="text-sm text-sf-text">Show advanced options</span>
        </label>
      </div>

      <button
        type="button"
        onClick={() => void handleSave()}
        className="w-full py-2 rounded bg-sf-blue text-white text-sm font-medium hover:bg-blue-500 transition-colors"
      >
        Save Settings
      </button>

      {toast && (
        <div
          className={`rounded px-3 py-2 text-sm text-center ${
            toast.kind === 'success'
              ? 'bg-sf-mint/10 text-sf-mint'
              : 'bg-sf-error/10 text-sf-error'
          }`}
        >
          {toast.message}
        </div>
      )}
    </div>
  )
}
