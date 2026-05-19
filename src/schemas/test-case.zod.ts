import { z } from 'zod'

export const StepSchema = z.object({
  action: z.string().min(1, 'Step action cannot be empty'),
  expected: z.string().min(1, 'Step expected result cannot be empty'),
})

export const TestCaseSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  priority: z.enum(['Low', 'Medium', 'High']),
  preconditions: z.array(z.string()),
  steps: z.array(StepSchema).min(1, 'At least one step is required'),
  tags: z.array(z.string()),
  coverageType: z.string().optional().default('functional'),
  acReference: z.string().nullable().optional().default(null),
})

export const GeneratedOutputSchema = z.array(TestCaseSchema).min(1, 'At least one test case is required')

export type ValidatedTestCase = z.infer<typeof TestCaseSchema>
