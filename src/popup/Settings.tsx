import { useEffect, useState } from 'react'
import {
  clearAllCredentials,
  getAdoPat,
  getClaudeApiKey,
  getUserPreferences,
  setAdoPat,
  setClaudeApiKey,
  setUserPreferences,
} from '~/storage/storage'
import type { UserPreferences } from '~/storage/storage'

type ToastKind = 'success' | 'error'

interface Toast {
  message: string
  kind: ToastKind
}

function MaskedInput({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
}) {
  const [visible, setVisible] = useState(false)

  return (
    <div>
      <label className="text-xs text-zinc-500 mb-1 block">{label}</label>
      <div className="flex gap-2">
        <input
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          className="flex-1 rounded bg-black/20 border border-sf-border px-2 py-1.5 text-sm text-sf-text placeholder-zinc-600 focus:outline-none focus:border-sf-blue font-mono"
        />
        <button
          type="button"
          onClick={() => setVisible(v => !v)}
          className="px-2 text-xs text-zinc-500 hover:text-sf-text transition-colors"
          title={visible ? 'Hide' : 'Show'}
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </div>
    </div>
  )
}

export function Settings() {
  const [apiKey, setApiKey] = useState('')
  const [adoPat, setAdoPatState] = useState('')
  const [prefs, setPrefs] = useState<UserPreferences>({
    defaultPriority: 'Medium',
    autoSelectAll: true,
    showAdvancedOptions: false,
  })
  const [toast, setToast] = useState<Toast | null>(null)
  const [confirmClear, setConfirmClear] = useState(false)

  useEffect(() => {
    void Promise.all([
      getClaudeApiKey(),
      getAdoPat(),
      getUserPreferences(),
    ]).then(([key, pat, userPrefs]) => {
      if (key) setApiKey(key)
      if (pat) setAdoPatState(pat)
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
        setClaudeApiKey(apiKey.trim()),
        setAdoPat(adoPat.trim()),
        setUserPreferences(prefs),
      ])
      showToast('Settings saved', 'success')
    } catch {
      showToast('Failed to save settings', 'error')
    }
  }

  async function handleClearCredentials() {
    if (!confirmClear) {
      setConfirmClear(true)
      setTimeout(() => setConfirmClear(false), 5000)
      return
    }
    try {
      await clearAllCredentials()
      setApiKey('')
      setAdoPatState('')
      setConfirmClear(false)
      showToast('Credentials cleared', 'success')
    } catch {
      showToast('Failed to clear credentials', 'error')
    }
  }

  return (
    <div className="space-y-5">
      <div className="space-y-3">
        <h2 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
          API Credentials
        </h2>
        <MaskedInput
          label="Claude API Key"
          value={apiKey}
          onChange={setApiKey}
          placeholder="sk-ant-…"
        />
        <MaskedInput
          label="Azure DevOps PAT"
          value={adoPat}
          onChange={setAdoPatState}
          placeholder="Personal Access Token"
        />
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
          <span className="text-sm text-sf-text">Show advanced generation options</span>
        </label>
      </div>

      <div className="flex flex-col gap-2 pt-1">
        <button
          type="button"
          onClick={() => void handleSave()}
          className="w-full py-2 rounded bg-sf-blue text-white text-sm font-medium hover:bg-blue-500 transition-colors"
        >
          Save Settings
        </button>
        <button
          type="button"
          onClick={() => void handleClearCredentials()}
          className={`w-full py-2 rounded text-sm font-medium transition-colors ${
            confirmClear
              ? 'bg-sf-error text-white hover:bg-red-600'
              : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
          }`}
        >
          {confirmClear ? 'Click again to confirm clear' : 'Clear All Credentials'}
        </button>
      </div>

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
