import { useEffect, useState } from 'react'
import '../style.css'
import { Settings } from './Settings'

export default function Popup() {
  const [view, setView] = useState<'main' | 'settings'>('main')
  const [adoUrl, setAdoUrl] = useState<string | null>(null)
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      const url = tabs[0]?.url ?? ''
      if (/dev\.azure\.com/.test(url)) setAdoUrl(url)
    })
  }, [])

  async function handleStart() {
    if (!adoUrl) return
    setStarting(true)

    const message = `/ado-test-case-creator ${adoUrl}`
    const stored = await chrome.storage.local.get('claudeProjectUrl')
    const targetUrl = (stored.claudeProjectUrl as string | undefined) || 'https://claude.ai/new'

    await chrome.storage.local.set({ pendingSkillInvocation: message })
    chrome.tabs.create({ url: targetUrl })
    window.close()
  }

  if (view === 'settings') {
    return (
      <div className="bg-sf-bg text-sf-text" style={{ width: 360, minHeight: 300, padding: 16 }}>
        <header className="flex items-center gap-2 mb-5">
          <button type="button" onClick={() => setView('main')}
            className="text-zinc-400 hover:text-sf-text transition-colors text-sm">
            ← Back
          </button>
          <span className="text-sm font-medium ml-1">Settings</span>
        </header>
        <Settings />
      </div>
    )
  }

  return (
    <div className="bg-sf-bg text-sf-text flex flex-col" style={{ width: 360, minHeight: 200, padding: 16 }}>
      <header className="flex items-center justify-between mb-5">
        <span className="text-sf-blue font-bold text-base">SpecForge</span>
        <button type="button" onClick={() => setView('settings')}
          className="text-zinc-500 hover:text-sf-text transition-colors text-sm">
          Settings
        </button>
      </header>

      {adoUrl ? (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-zinc-500 truncate">{adoUrl}</p>
          <button
            type="button"
            onClick={() => void handleStart()}
            disabled={starting}
            className="w-full py-2.5 rounded bg-sf-blue text-white text-sm font-medium hover:bg-blue-500 disabled:opacity-60 transition-colors"
          >
            {starting ? 'Opening Claude…' : 'Start'}
          </button>
        </div>
      ) : (
        <p className="text-sm text-zinc-500 text-center py-6">
          Navigate to an Azure DevOps page to use SpecForge.
        </p>
      )}
    </div>
  )
}
