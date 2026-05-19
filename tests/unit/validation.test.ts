import { describe, it, expect } from 'vitest'
import { validateGeneratedOutput } from '../../src/services/validators/test-case.schema'
import { TestCaseSchema, GeneratedOutputSchema } from '../../src/schemas/test-case.zod'

const validStep = { action: 'Click login button', expected: 'User is redirected to dashboard' }

const validTestCase = {
  title: 'User can log in with valid credentials',
  priority: 'High',
  preconditions: ['User has an account'],
  steps: [validStep],
  tags: ['authentication', 'positive'],
  coverageType: 'functional',
  acReference: 'AC-1',
}

describe('TestCaseSchema (Zod)', () => {
  it('passes a valid test case', () => {
    const result = TestCaseSchema.safeParse(validTestCase)
    expect(result.success).toBe(true)
  })

  it('fails when title is missing', () => {
    const result = TestCaseSchema.safeParse({ ...validTestCase, title: undefined })
    expect(result.success).toBe(false)
  })

  it('fails when title is too short (< 3 chars)', () => {
    const result = TestCaseSchema.safeParse({ ...validTestCase, title: 'OK' })
    expect(result.success).toBe(false)
  })

  it('fails when priority is "Critical" (not in enum)', () => {
    const result = TestCaseSchema.safeParse({ ...validTestCase, priority: 'Critical' })
    expect(result.success).toBe(false)
  })

  it('accepts all valid priority values', () => {
    for (const priority of ['Low', 'Medium', 'High']) {
      const result = TestCaseSchema.safeParse({ ...validTestCase, priority })
      expect(result.success).toBe(true)
    }
  })

  it('fails when steps is empty array', () => {
    const result = TestCaseSchema.safeParse({ ...validTestCase, steps: [] })
    expect(result.success).toBe(false)
  })

  it('fails when step action is empty string', () => {
    const result = TestCaseSchema.safeParse({
      ...validTestCase,
      steps: [{ action: '', expected: 'Something happens' }],
    })
    expect(result.success).toBe(false)
  })

  it('fails when step expected is empty string', () => {
    const result = TestCaseSchema.safeParse({
      ...validTestCase,
      steps: [{ action: 'Do something', expected: '' }],
    })
    expect(result.success).toBe(false)
  })

  it('allows optional coverageType to default to "functional"', () => {
    const { coverageType, ...withoutCoverageType } = validTestCase
    const result = TestCaseSchema.safeParse(withoutCoverageType)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.coverageType).toBe('functional')
    }
  })

  it('allows acReference to be null', () => {
    const result = TestCaseSchema.safeParse({ ...validTestCase, acReference: null })
    expect(result.success).toBe(true)
  })
})

describe('validateGeneratedOutput', () => {
  it('returns success for a valid array', () => {
    const result = validateGeneratedOutput([validTestCase])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toHaveLength(1)
      expect(result.warnings).toHaveLength(0)
    }
  })

  it('returns failure for non-JSON string input', () => {
    const result = validateGeneratedOutput('this is not json at all')
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].field).toBe('root')
      expect(result.errors[0].message).toContain('JSON')
    }
  })

  it('parses a valid JSON string successfully', () => {
    const result = validateGeneratedOutput(JSON.stringify([validTestCase]))
    expect(result.success).toBe(true)
  })

  it('returns failure for non-array JSON', () => {
    const result = validateGeneratedOutput({ title: 'not an array' })
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors[0].message).toContain('array')
    }
  })

  it('returns failure for empty array', () => {
    const result = validateGeneratedOutput([])
    expect(result.success).toBe(false)
  })

  it('returns failure when title is missing', () => {
    const { title, ...noTitle } = validTestCase
    const result = validateGeneratedOutput([noTitle])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.some(e => e.field.includes('title') || e.message.toLowerCase().includes('title'))).toBe(true)
    }
  })

  it('returns failure when priority is "Critical"', () => {
    const result = validateGeneratedOutput([{ ...validTestCase, priority: 'Critical' }])
    expect(result.success).toBe(false)
  })

  it('returns failure for empty steps array', () => {
    const result = validateGeneratedOutput([{ ...validTestCase, steps: [] }])
    expect(result.success).toBe(false)
  })

  it('returns failure when step action is whitespace-only', () => {
    const result = validateGeneratedOutput([{
      ...validTestCase,
      steps: [{ action: '   ', expected: 'Something' }],
    }])
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.errors.some(e => e.field.includes('action'))).toBe(true)
    }
  })

  it('detects duplicate titles and returns them as warnings (not errors)', () => {
    const result = validateGeneratedOutput([
      validTestCase,
      { ...validTestCase, title: validTestCase.title }, // exact duplicate
    ])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.warnings.length).toBeGreaterThan(0)
      expect(result.warnings[0].field).toBe('title')
      expect(result.warnings[0].message).toContain('Duplicate')
    }
  })

  it('detects case-insensitive duplicate titles', () => {
    const result = validateGeneratedOutput([
      { ...validTestCase, title: 'User Can Log In' },
      { ...validTestCase, title: 'user can log in' },
    ])
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.warnings.length).toBeGreaterThan(0)
    }
  })

  it('includes caseIndex in errors for per-item failures', () => {
    const result = validateGeneratedOutput([
      validTestCase,
      { ...validTestCase, priority: 'Critical' },
    ])
    expect(result.success).toBe(false)
    if (!result.success) {
      const indexed = result.errors.filter(e => e.caseIndex !== undefined)
      expect(indexed.length).toBeGreaterThan(0)
      expect(indexed[0].caseIndex).toBe(1)
    }
  })
})
