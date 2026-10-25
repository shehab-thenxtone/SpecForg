import { create } from 'zustand'
import type { UserStory } from '~/types/user-story'

export type PanelState = 'idle' | 'extracting' | 'generating' | 'error'

interface StoreState {
  panelState: PanelState
  workItemType: string | null
  story: UserStory | null
  errorMessage: string | null
}

interface StoreActions {
  setPanelState: (state: PanelState) => void
  setWorkItemType: (type: string | null) => void
  setStory: (story: UserStory) => void
  setError: (message: string) => void
  reset: () => void
}

export type SidePanelStore = StoreState & StoreActions

const initialState: StoreState = {
  panelState: 'idle',
  workItemType: null,
  story: null,
  errorMessage: null,
}

export const usePanelStore = create<SidePanelStore>(set => ({
  ...initialState,

  setPanelState: panelState => set({ panelState }),
  setWorkItemType: workItemType => set({ workItemType }),
  setStory: story => set({ story }),
  setError: message => set({ errorMessage: message, panelState: 'error' }),
  reset: () => set({ ...initialState }),
}))
