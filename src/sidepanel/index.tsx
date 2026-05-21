import { useEffect, useState } from 'react'
import '../style.css'
import type { UserStory } from '~/types/user-story'
import type { ValidatedTestCase } from '~/schemas/test-case.zod'
import type { InjectionProgress, InjectionSummary, Message } from '~/types/messages'
import { usePanelStore } from './store'
import { TestCaseCard } from './components/TestCaseCard'
import { ValidationBanner } from './components/ValidationBanner'
import { InjectionProgressPanel } from './components/InjectionProgress'
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

  // On mount, ask the content script for the current work-item type.
  // This handles the race condition where the side panel opens after the
  // content script already sent WORK_ITEM_DETECTED (which the panel missed).
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
            // Content script not yet injected (rare on first load); use generic label.
            store.setWorkItemType('Work Item')
            return
          }
          const msg = response as { payload?: { workItemType?: string | null } }
          const workItemType = msg?.payload?.workItemType
          store.setWorkItemType(workItemType ?? 'Work Item')
        }
      )
    })
  }, [])

  useEffect(() => {
    const listener = (message: RuntimeMessage) => {
      switch (message.type) {
        case 'WORK_ITEM_DETECTED': {
          const p = message.payload as { workItemType: string }
          store.setWorkItemType(p.workItemType)
          break
        }
        case 'WORK_ITEM_LEFT':
          store.setWorkItemType(null)
          store.reset()
          break
        case 'INJECTION_PROGRESS':
          store.setInjectionProgress(message.payload as InjectionProgress)
          break
        case 'INJECTION_COMPLETE':
          store.setInjectionSummary(message.payload as InjectionSummary)
          break
      }
    }
    chrome.runtime.onMessage.addListener(listener)
    return () => chrome.runtime.onMessage.removeListener(listener)
  }, [])

  async function handleGenerate() {
    store.setPanelState('extracting')
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true })
      const tabId = tabs[0]?.id
      if (!tabId) throw new Error('No active tab found')

      const extractResponse = await new Promise<RuntimeMessage>((resolve, reject) => {
        chrome.tabs.sendMessage(tabId, { type: 'EXTRACT_STORY' } as Message, response => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message ?? 'Content script unavailable'))
          } else {
            resolve(response as RuntimeMessage)
          }
        })
      })

      if (extractResponse.type !== 'STORY_EXTRACTED') {
        const errPayload = extractResponse.payload as { message?: string }
        throw new Error(errPayload?.message ?? 'Story extraction failed')
      }

      const story = extractResponse.payload as UserStory
      store.setStory(story)
      store.setPanelState('generating')

      const genResponse = await new Promise<RuntimeMessage>((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'GENERATE_TEST_CASES', payload: story } as Message,
          response => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message ?? 'Background worker unavailable'))
            } else {
              resolve(response as RuntimeMessage)
            }
          }
        )
      })

      if (genResponse.type === 'GENERATION_COMPLETE') {
        store.setTestCases(genResponse.payload as ValidatedTestCase[])
      } else {
        const errPayload = genResponse.payload as { message?: string }
        store.setError(errPayload?.message ?? 'Generation failed')
      }
    } catch (err) {
      store.setError(err instanceof Error ? err.message : String(err))
    }
  }

  function handleRegenerate() {
    if (store.hasAnyEdits()) {
      if (!window.confirm('You have edited test cases. Regenerating will discard all changes. Continue?')) {
        return
      }
    }
    store.reset()
    void handleGenerate()
  }

  function handleInject() {
    const cases = store.selectedCases()
    if (cases.length === 0) return
    store.setPanelState('injecting')
    chrome.runtime.sendMessage({ type: 'INJECT_TEST_CASES', payload: cases } as Message)
  }

  const hasSelectedErrors = store.testCases.some(tc => {
    if (!tc.selected) return false
    if (tc.title.trim().length < 3) return true
    return tc.steps.some(s => !s.action.trim() || !s.expected.trim())
  })
  const canInject = store.selectedCount() > 0 && !hasSelectedErrors

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

      <main className="flex-1 overflow-y-auto">
        {store.panelState === 'error' && (
          <div className="p-4 space-y-3">
            <div
              className="rounded-lg px-3 py-3 text-sm"
              style={{ backgroundColor: 'rgba(239,68,68,0.08)', borderLeft: '3px solid var(--sf-error)' }}
            >
              <p className="text-sf-error font-medium mb-1">Generation failed</p>
              <p className="text-zinc-400 text-xs">{store.errorMessage}</p>
            </div>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              className="w-full py-2 rounded bg-zinc-800 text-sf-text text-sm hover:bg-zinc-700 transition-colors"
            >
              Retry
            </button>
          </div>
        )}

        {store.panelState === 'idle' && !store.workItemType && (
          <div className="p-4 text-center py-12">
            <p className="text-zinc-500 text-sm">
              Navigate to an Azure DevOps User Story to get started.
            </p>
          </div>
        )}

        {store.panelState === 'idle' && store.workItemType && (
          <div className="p-4">
            <p className="text-xs text-zinc-500 mb-3">{store.workItemType} detected</p>
            <button
              type="button"
              onClick={() => void handleGenerate()}
              className="w-full py-2.5 rounded bg-sf-blue text-white text-sm font-medium hover:bg-blue-500 transition-colors"
            >
              Generate AI Test Cases
            </button>
          </div>
        )}

        {store.panelState === 'extracting' && <Spinner label="Extracting story…" />}
        {store.panelState === 'generating' && <Spinner label="Generating test cases with AI…" />}

        {store.panelState === 'results' && (
          <div className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-zinc-400">
                Generated Test Cases ({store.testCases.length})
              </span>
              <div className="flex gap-2">
                <button type="button" onClick={store.selectAll}
                  className="text-xs text-sf-blue hover:text-blue-400 transition-colors">
                  All
                </button>
                <span className="text-zinc-700">·</span>
                <button type="button" onClick={store.deselectAll}
                  className="text-xs text-zinc-500 hover:text-sf-text transition-colors">
                  None
                </button>
              </div>
            </div>
            <div className="space-y-2">
              {store.testCases.map((tc, i) => (
                <TestCaseCard
                  key={i}
                  tc={tc}
                  index={i}
                  onToggleSelect={() => store.toggleSelect(i)}
                  onUpdate={updates => store.updateTestCase(i, updates)}
                />
              ))}
            </div>
            <ValidationBanner testCases={store.testCases} />
          </div>
        )}

        {store.panelState === 'injecting' && (
          <div className="p-4">
            <InjectionProgressPanel progress={store.injectionProgress} summary={null} />
          </div>
        )}

        {store.panelState === 'complete' && (
          <div className="p-4">
            <InjectionProgressPanel progress={null} summary={store.injectionSummary} />
          </div>
        )}
      </main>

      {(store.panelState === 'results' || store.panelState === 'complete') && (
        <footer className="border-t border-sf-border p-4 space-y-2 flex-shrink-0">
          {store.panelState === 'results' && (
            <>
              <button
                type="button"
                onClick={handleInject}
                disabled={!canInject}
                className="w-full py-2.5 rounded bg-sf-mint text-sf-bg text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity"
              >
                Inject Selected ({store.selectedCount()})
              </button>
              <button
                type="button"
                onClick={handleRegenerate}
                className="w-full py-2 rounded bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors"
              >
                Regenerate
              </button>
            </>
          )}
          {store.panelState === 'complete' && (
            <button
              type="button"
              onClick={() => { store.reset(); store.setWorkItemType(store.workItemType) }}
              className="w-full py-2 rounded bg-zinc-800 text-zinc-400 text-sm hover:bg-zinc-700 transition-colors"
            >
              Generate New
            </button>
          )}
        </footer>
      )}
    </div>
  )
}
