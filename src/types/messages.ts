import type { UserStory } from './user-story'
import type { GeneratedTestCase, ValidatedTestCase } from './test-case'

export interface InjectionProgress {
  total: number
  completed: number
  current: string
  results: {
    title: string
    id?: string
    status: 'success' | 'failed' | 'pending'
  }[]
}

export interface InjectionSummary {
  total: number
  succeeded: number
  failed: number
  results: {
    title: string
    adoId?: string
    status: 'success' | 'failed'
    error?: string
  }[]
}

export type Message =
  // ── Content script → runtime ──────────────────────────────────────────────
  /** Content script detected a supported work-item page. */
  | { type: 'WORK_ITEM_DETECTED'; payload: { workItemType: string } }
  /** Content script left a work-item page (navigation away). */
  | { type: 'WORK_ITEM_LEFT' }
  /** Content script opens the side panel when the toolbar button is clicked. */
  | { type: 'OPEN_SIDE_PANEL' }
  // ── Side panel → content script (state query) ─────────────────────────────
  /** Side panel asks the content script for the current work-item type on mount.
   *  Handles the race where the panel opens after WORK_ITEM_DETECTED was already sent. */
  | { type: 'QUERY_WORK_ITEM' }
  /** Content script reply to QUERY_WORK_ITEM. */
  | { type: 'WORK_ITEM_STATE'; payload: { workItemType: string | null } }
  // ── Side panel ↔ background worker ────────────────────────────────────────
  | { type: 'EXTRACT_STORY' }
  | { type: 'STORY_EXTRACTED'; payload: UserStory }
  | { type: 'GENERATE_TEST_CASES'; payload: UserStory }
  | { type: 'GENERATION_COMPLETE'; payload: GeneratedTestCase[] }
  | { type: 'INJECT_TEST_CASES'; payload: ValidatedTestCase[] }
  | { type: 'INJECTION_PROGRESS'; payload: InjectionProgress }
  | { type: 'INJECTION_COMPLETE'; payload: InjectionSummary }
  | { type: 'ERROR'; payload: { code: string; message: string } }
