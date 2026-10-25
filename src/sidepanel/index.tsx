import { useEffect, useState } from 'react'
import '../style.css'
import type { UserStory } from '~/types/user-story'
import type { Message } from '~/types/messages'
import { getAndClearAutoStart } from '~/storage/storage'
import { usePanelStore } from './store'
import { Settings } from '../popup/Settings'

interface RuntimeMessage {
  type: string
  payload?: unknown
}

function Spinner({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div
        className="w-8 h-8 rounded-full border-2 border-sf-border animate-spin"
        style={{ borderTopColor: 'var(--sf-blue)' }}
      />
      <p className="text-sm text-zinc-400">{label}</p>
    </div>
  )
}

function isAdoWorkItemUrl(tabs: chrome.tabs.Tab[]): boolean {
  const url = tabs[0]?.url ?? ''
  return /dev\.azure\.com/.test(url) && /workitems\/edit\/\d+/.test(url)
}

export default function SidePanel() {
  const store = usePanelStore()
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    chrome.tabs.query({ active: true, currentWindow: true }, tabs => {
      if (!isAdoWorkItemUrl(tabs)) return

      const tabId = tabs[0]?.id
      if (!tabId) {
        store.setWorkItemType('Work Item')
        return
      }

      chrome.tabs.sendMessage(
        tabId,
        { type: 'QUERY_WORK_ITEM' } satisfies Message,
        (response: unknown) => {
          if (chrome.runtime.lastError) {
            store.setWorkItemType('Work Item')
          } else {
            const msg = response as { payload?: { workItemType?: string | null } }
            store.setWorkItemType(msg?.payload?.workItemType ?? 'Work Item')
          }

          // If the popup's "Start" button triggered this open, auto-run the cycle.
          void getAndClearAutoStart().then(shouldStart => {
            if (shouldStart) void handleStart()
          })
        }
      )
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const listener = (message: RuntimeMessage) => {
      if (message.type === 'WORK_ITEM_DETECTED') {
        const p = message.payload as { workItemType: string }
        store.setWorkItemType(p.workItemType)
      } else if (message.type === 'WORK_ITEM_LEFT') {
        store.setWorkItemType(null)
        store.reset()
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  async function extractStoryFromTab(): Promise<UserStory> {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
    const tabId = tabs[0]?.id
    if (!tabId) throw new Error('No active tab found')

    return new Promise<UserStory>((resolve, reject) => {
      chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_STORY' } as Message, response => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message ?? 'Content script unavailable'))
          return
        }
        const msg = response as RuntimeMessage
        if (msg.type !== 'STORY_EXTRACTED') {
          const err = (msg.payload as { message?: string })?.message ?? 'Story extraction failed'
          reject(new Error(err))
          return
        }
        resolve(msg.payload as UserStory)
      })
    })
  }

  async function handleStart() {
    store.setPanelState('extracting')
    try {
      const story = await extractStoryFromTab()
      store.setStory(story)
      store.setPanelState('generating')

      const response = await new Promise<RuntimeMessage>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'OPEN_CLAUDE_WITH_SKILL', payload: story } as Message,
          res => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message ?? 'Background worker unavailable'))
            } else {
              resolve(res as RuntimeMessage)
            }
          }
        )
      })

      if (response.type === 'CLAUDE_TAB_OPENED') {
        store.reset()
        store.setWorkItemType(store.workItemType)
      } else {
        const errPayload = response.payload as { message?: string }
        store.setError(errPayload?.message ?? 'Failed to open Claude.ai')
      }
    } catch (err) {
      store.setError(err instanceof Error ? err.message : String(err))
    }
  }

  if (showSettings) {
    return (
      <div className="bg-sf-bg text-sf-text min-h-screen flex flex-col">
        <header className="flex items-center gap-2 px-4 py-3 border-b border-sf-border flex-shrink-0">
          <button
            type="button"
            onClick={() => setShowSettings(false)}
            className="text-zinc-400 hover:text-sf-text transition-colors text-sm"
          >
            ← Back
          </button>
          <span className="text-sm font-medium text-sf-text ml-1">Settings</span>
        </header>
        <div className="flex-1 overflow-y-auto p-4">
          <Settings />
        </div>
      </div>
    )
  }

  return (
    <div className="bg-sf-bg text-sf-text min-h-screen flex flex-col">
      <header className="flex items-center justify-between px-4 py-3 border-b border-sf-border flex-shrink-0">
        <div>
          <span className="text-sf-blue font-bold text-sm">SpecForge</span>
          {store.story && (
            <p className="text-xs text-zinc-500 truncate max-w-[200px]">
              #{store.story.id} — {store.story.title}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setShowSettings(true)}
          title="Settings"
          className="text-zinc-500 hover:text-sf-text transition-colors text-base"
        >
          ⚙
        </button>
      </header>

      <main className="flex-1 overflow-y-auto p-4">
        {store.panelState === 'error' && (
          <div className="space-y-3">
            <div
              className="rounded-lg px-3 py-3 text-sm"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderLeft: '3px solid var(--sf-error)' }}
            >
              <p className="text-sf-error font-medium mb-1">Error</p>
              <p className="text-zinc-400 text-xs">{store.errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => { store.reset(); store.setWorkItemType(store.workItemType) }}
              className="w-full py-2 rounded bg-zinc-800 text-sf-text text-sm hover:bg-zinc-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {store.panelState === 'idle' && !store.workItemType && (
          <p className="text-zinc-500 text-sm text-center py-12">
            Navigate to an Azure DevOps work item to get started.
          </p>
        )}

        {store.panelState === 'idle' && store.workItemType && (
          <div className="space-y-2">
            <p className="text-xs text-zinc-500 mb-3">{store.workItemType} detected</p>
            <button
              type="button"
              onClick={() => void handleStart()}
              className="w-full py-2.5 rounded bg-sf-blue text-white text-sm font-medium hover:bg-blue-500 transition-colors"
            >
              Start
            </button>
          </div>
        )}

        {store.panelState === 'extracting' && <Spinner label="Extracting story…" />}
        {store.panelState === 'generating' && <Spinner label="Opening Claude.ai…" />}
      </main>
    </div>
  )
}
