import { create } from 'zustand'
import type { ValidatedTestCase } from '~/schemas/test-case.zod'
import type { UserStory } from '~/types/user-story'
import type { InjectionProgress, InjectionSummary } from '~/types/messages'

export type PanelState =
  | 'idle'
  | 'extracting'
  | 'generating'
  | 'results'
  | 'injecting'
  | 'complete'
  | 'error'

export interface EditableTestCase extends ValidatedTestCase {
  selected: boolean
  hasEdits: boolean
}

interface StoreState {
  panelState: PanelState
  workItemType: string | null
  story: UserStory | null
  testCases: EditableTestCase[]
  injectionProgress: InjectionProgress | null
  injectionSummary: InjectionSummary | null
  errorMessage: string | null
}

interface StoreActions {
  setPanelState: (state: PanelState) => void
  setWorkItemType: (type: string | null) => void
  setStory: (story: UserStory) => void
  setTestCases: (cases: ValidatedTestCase[]) => void
  toggleSelect: (index: number) => void
  selectAll: () => void
  deselectAll: () => void
  updateTestCase: (index: number, updates: Partial<ValidatedTestCase>) => void
  setInjectionProgress: (progress: InjectionProgress) => void
  setInjectionSummary: (summary: InjectionSummary) => void
  setError: (message: string) => void
  reset: () => void
  hasAnyEdits: () => boolean
  selectedCount: () => number
  selectedCases: () => EditableTestCase[]
}

export type SidePanelStore = StoreState & StoreActions

const initialState: StoreState = {
  panelState: 'idle',
  workItemType: null,
  story: null,
  testCases: [],
  injectionProgress: null,
  injectionSummary: null,
  errorMessage: null,
}

export const usePanelStore = create<SidePanelStore>((set, get) => ({
  ...initialState,

  setPanelState: panelState => set({ panelState }),
  setWorkItemType: workItemType => set({ workItemType }),
  setStory: story => set({ story }),

  setTestCases: cases =>
    set({
      testCases: cases.map(tc => ({ ...tc, selected: true, hasEdits: false })),
      panelState: 'results',
    }),

  toggleSelect: index =>
    set(s => ({
      testCases: s.testCases.map((tc, i) =>
        i === index ? { ...tc, selected: !tc.selected } : tc
      ),
    })),

  selectAll: () =>
    set(s => ({
      testCases: s.testCases.map(tc => ({ ...tc, selected: true })),
    })),

  deselectAll: () =>
    set(s => ({
      testCases: s.testCases.map(tc => ({ ...tc, selected: false })),
    })),

  updateTestCase: (index, updates) =>
    set(s => ({
      testCases: s.testCases.map((tc, i) =>
        i === index ? { ...tc, ...updates, hasEdits: true } : tc
      ),
    })),

  setInjectionProgress: progress => set({ injectionProgress: progress }),

  setInjectionSummary: summary =>
    set({ injectionSummary: summary, panelState: 'complete' }),

  setError: message =>
    set({ errorMessage: message, panelState: 'error' }),

  reset: () =>
    set({
      panelState: 'idle',
      story: null,
      testCases: [],
      injectionProgress: null,
      injectionSummary: null,
      errorMessage: null,
    }),

  hasAnyEdits: () => get().testCases.some(tc => tc.hasEdits),
  selectedCount: () => get().testCases.filter(tc => tc.selected).length,
  selectedCases: () => get().testCases.filter(tc => tc.selected),
}))
