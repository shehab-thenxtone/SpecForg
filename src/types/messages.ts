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
  | { type: 'EXTRACT_STORY' }
  | { type: 'STORY_EXTRACTED'; payload: UserStory }
  | { type: 'GENERATE_TEST_CASES'; payload: UserStory }
  | { type: 'GENERATION_COMPLETE'; payload: GeneratedTestCase[] }
  | { type: 'INJECT_TEST_CASES'; payload: ValidatedTestCase[] }
  | { type: 'INJECTION_PROGRESS'; payload: InjectionProgress }
  | { type: 'INJECTION_COMPLETE'; payload: InjectionSummary }
  | { type: 'ERROR'; payload: { code: string; message: string } }
