import { describe, it, expect } from 'vitest'
import {
  buildStep1Prompt,
  buildStep2Prompt,
  buildStep3Prompt,
  buildStep4Prompt,
  buildStep5Prompt,
  PROMPT_VERSIONS,
} from '../../src/services/claude/prompt-builder'
import type { UserStory } from '../../src/types/user-story'
import type { EnrichedStory, CoverageAnalysis } from '../../src/types/test-case'

const minimalStory: UserStory = {
  id: '42',
  title: 'User login',
  description: 'As a user I want to log in',
  acceptanceCriteria: 'Given I am on the login page',
  tags: [],
}

const enrichedStory: EnrichedStory = {
  ...minimalStory,
  domain: 'authentication',
  ambiguities: ['What happens after 3 failed attempts?'],
  enriched: true,
}

const analysis: CoverageAnalysis = {
  highRiskAreas: ['account lockout', 'credential exposure'],
  requiredCoverageTypes: ['functional', 'negative', 'security'],
  complianceConcerns: ['GDPR'],
  estimatedTestCaseCount: 6,
  generationGuidance: 'Focus on auth flows and error handling.',
}

describe('PROMPT_VERSIONS', () => {
  it('exports a version for each step', () => {
    expect(PROMPT_VERSIONS.step1).toBe('1.0')
    expect(PROMPT_VERSIONS.step2).toBe('1.0')
    expect(PROMPT_VERSIONS.step3).toBe('1.0')
    expect(PROMPT_VERSIONS.step4).toBe('1.0')
    expect(PROMPT_VERSIONS.step5).toBe('1.0')
  })
})

describe('buildStep1Prompt', () => {
  it('returns an object with system and user strings', () => {
    const prompt = buildStep1Prompt(minimalStory)
    expect(typeof prompt.system).toBe('string')
    expect(typeof prompt.user).toBe('string')
    expect(prompt.system.length).toBeGreaterThan(0)
    expect(prompt.user.length).toBeGreaterThan(0)
  })

  it('does not throw on minimal valid input', () => {
    expect(() => buildStep1Prompt(minimalStory)).not.toThrow()
  })

  it('includes the story title in the user prompt', () => {
    const prompt = buildStep1Prompt(minimalStory)
    expect(prompt.user).toContain(minimalStory.title)
  })

  it('instructs Claude to return JSON in system prompt', () => {
    const prompt = buildStep1Prompt(minimalStory)
    expect(prompt.system).toContain('JSON')
  })
})

describe('buildStep2Prompt', () => {
  it('returns an object with system and user strings', () => {
    const prompt = buildStep2Prompt(enrichedStory)
    expect(typeof prompt.system).toBe('string')
    expect(typeof prompt.user).toBe('string')
  })

  it('does not throw on minimal valid input', () => {
    expect(() => buildStep2Prompt(enrichedStory)).not.toThrow()
  })

  it('includes the domain in the user prompt', () => {
    const prompt = buildStep2Prompt(enrichedStory)
    expect(prompt.user).toContain(enrichedStory.domain)
  })
})

describe('buildStep3Prompt', () => {
  it('returns an object with system and user strings', () => {
    const prompt = buildStep3Prompt(enrichedStory, analysis)
    expect(typeof prompt.system).toBe('string')
    expect(typeof prompt.user).toBe('string')
  })

  it('does not throw on minimal valid input', () => {
    expect(() => buildStep3Prompt(enrichedStory, analysis)).not.toThrow()
  })

  it('contains the story title', () => {
    const prompt = buildStep3Prompt(enrichedStory, analysis)
    expect(prompt.user).toContain(enrichedStory.title)
  })

  it('contains the story description', () => {
    const prompt = buildStep3Prompt(enrichedStory, analysis)
    expect(prompt.user).toContain(enrichedStory.description)
  })

  it('contains the acceptance criteria', () => {
    const prompt = buildStep3Prompt(enrichedStory, analysis)
    expect(prompt.user).toContain(enrichedStory.acceptanceCriteria)
  })

  it('mentions ado-test-case-creator skill in system prompt', () => {
    const prompt = buildStep3Prompt(enrichedStory, analysis)
    expect(prompt.system).toContain('ado-test-case-creator')
  })

  it('includes coverage guidance from analysis', () => {
    const prompt = buildStep3Prompt(enrichedStory, analysis)
    expect(prompt.user).toContain(analysis.highRiskAreas[0])
  })
})

describe('buildStep4Prompt', () => {
  const step3Output = JSON.stringify([{ title: 'Login works', priority: 'High', preconditions: [], steps: [{ action: 'Go to login', expected: 'Login page shown' }], tags: [] }])

  it('returns an object with system and user strings', () => {
    const prompt = buildStep4Prompt(step3Output)
    expect(typeof prompt.system).toBe('string')
    expect(typeof prompt.user).toBe('string')
  })

  it('does not throw on minimal valid input', () => {
    expect(() => buildStep4Prompt(step3Output)).not.toThrow()
  })

  it('contains the raw step 3 output in user prompt', () => {
    const prompt = buildStep4Prompt(step3Output)
    expect(prompt.user).toContain(step3Output)
  })

  it('instructs Claude to correct structural issues', () => {
    const prompt = buildStep4Prompt(step3Output)
    expect(prompt.system.toLowerCase()).toMatch(/correct|fix|validator/)
  })
})

describe('buildStep5Prompt', () => {
  const step4Output = JSON.stringify([{ title: 'Login works', priority: 'Medium', preconditions: [], steps: [{ action: 'Log in', expected: 'Dashboard shown' }], tags: ['functional'] }])

  it('returns an object with system and user strings', () => {
    const prompt = buildStep5Prompt(step4Output, enrichedStory, analysis)
    expect(typeof prompt.system).toBe('string')
    expect(typeof prompt.user).toBe('string')
  })

  it('does not throw on minimal valid input', () => {
    expect(() => buildStep5Prompt(step4Output, enrichedStory, analysis)).not.toThrow()
  })

  it('contains the step 4 output in user prompt', () => {
    const prompt = buildStep5Prompt(step4Output, enrichedStory, analysis)
    expect(prompt.user).toContain(step4Output)
  })

  it('references the domain from the story', () => {
    const prompt = buildStep5Prompt(step4Output, enrichedStory, analysis)
    expect(prompt.user).toContain(enrichedStory.domain)
  })
})
