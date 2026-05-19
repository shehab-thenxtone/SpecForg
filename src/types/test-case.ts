import type { UserStory } from './user-story'

export interface TestCaseStep {
  action: string
  expected: string
}

export interface GeneratedTestCase {
  title: string
  priority: 'Low' | 'Medium' | 'High'
  preconditions: string[]
  steps: TestCaseStep[]
  tags: string[]
  coverageType: string
  acReference: string | null
}

export type ValidatedTestCase = GeneratedTestCase

export interface CoverageAnalysis {
  highRiskAreas: string[]
  requiredCoverageTypes: string[]
  complianceConcerns: string[]
  estimatedTestCaseCount: number
  generationGuidance: string
}

export interface EnrichedStory extends UserStory {
  domain: string
  ambiguities: string[]
  enriched: boolean
}
