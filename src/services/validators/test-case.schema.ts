import { TestCaseSchema } from '~/schemas/test-case.zod'
import type { ValidatedTestCase } from '~/schemas/test-case.zod'

export type { ValidatedTestCase }

export interface ValidationError {
  field: string
  message: string
  caseIndex?: number
}

export type ValidationResult =
  | { success: true; data: ValidatedTestCase[]; warnings: ValidationError[] }
  | { success: false; errors: ValidationError[]; warnings: ValidationError[] }

function checkStepIntegrity(items: ValidatedTestCase[]): ValidationError[] {
  const errors: ValidationError[] = []
  for (let i = 0; i < items.length; i++) {
    const tc = items[i]
    for (let j = 0; j < tc.steps.length; j++) {
      if (!tc.steps[j].action.trim()) {
        errors.push({ field: `steps[${j}].action`, message: 'Step action cannot be empty after trim', caseIndex: i })
      }
      if (!tc.steps[j].expected.trim()) {
        errors.push({ field: `steps[${j}].expected`, message: 'Step expected result cannot be empty after trim', caseIndex: i })
      }
    }
    if (tc.steps.length > 50) {
      errors.push({ field: 'steps', message: `Maximum 50 steps per test case (got ${tc.steps.length})`, caseIndex: i })
    }
  }
  return errors
}

function detectDuplicateTitles(items: ValidatedTestCase[]): ValidationError[] {
  const warnings: ValidationError[] = []
  const seen = new Map<string, number>()
  for (let i = 0; i < items.length; i++) {
    const key = items[i].title.toLowerCase().trim()
    if (seen.has(key)) {
      warnings.push({ field: 'title', message: `Duplicate title: "${items[i].title}"`, caseIndex: i })
    } else {
      seen.set(key, i)
    }
  }
  return warnings
}

function checkEmptyFields(items: ValidatedTestCase[]): ValidationError[] {
  const errors: ValidationError[] = []
  for (let i = 0; i < items.length; i++) {
    if (!items[i].title.trim()) {
      errors.push({ field: 'title', message: 'Title cannot be empty after trim', caseIndex: i })
    }
  }
  return errors
}

export function validateGeneratedOutput(raw: unknown): ValidationResult {
  // Step 1: JSON parse check
  let parsed: unknown = raw
  if (typeof raw === 'string') {
    try {
      parsed = JSON.parse(raw)
    } catch {
      return {
        success: false,
        errors: [{ field: 'root', message: 'Response is not valid JSON' }],
        warnings: [],
      }
    }
  }

  // Step 2: Array check
  if (!Array.isArray(parsed)) {
    return {
      success: false,
      errors: [{ field: 'root', message: 'Response must be a JSON array' }],
      warnings: [],
    }
  }

  if (parsed.length === 0) {
    return {
      success: false,
      errors: [{ field: 'root', message: 'Response array must contain at least one test case' }],
      warnings: [],
    }
  }

  // Step 3: Zod schema validation per item
  const zodErrors: ValidationError[] = []
  const validItems: ValidatedTestCase[] = []

  for (let i = 0; i < parsed.length; i++) {
    const result = TestCaseSchema.safeParse(parsed[i])
    if (result.success) {
      validItems.push(result.data as unknown as ValidatedTestCase)
    } else {
      for (const issue of result.error.issues) {
        zodErrors.push({
          field: issue.path.join('.') || 'unknown',
          message: issue.message,
          caseIndex: i,
        })
      }
    }
  }

  if (zodErrors.length > 0) {
    return { success: false, errors: zodErrors, warnings: [] }
  }

  // Step 4: Step integrity checks
  const integrityErrors = checkStepIntegrity(validItems)
  if (integrityErrors.length > 0) {
    return { success: false, errors: integrityErrors, warnings: [] }
  }

  // Step 5: Duplicate title detection (warnings only)
  const warnings = detectDuplicateTitles(validItems)

  // Step 6: Empty-field prevention
  const emptyFieldErrors = checkEmptyFields(validItems)
  if (emptyFieldErrors.length > 0) {
    return { success: false, errors: emptyFieldErrors, warnings }
  }

  return { success: true, data: validItems, warnings }
}
