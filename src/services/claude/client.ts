import type { UserStory } from '~/types/user-story'
import type { EnrichedStory, CoverageAnalysis } from '~/types/test-case'
import type { ValidatedTestCase } from '~/schemas/test-case.zod'
import {
  buildStep1Prompt,
  buildStep2Prompt,
  buildStep3Prompt,
  buildStep4Prompt,
  buildStep5Prompt,
} from './prompt-builder'
import { validateGeneratedOutput } from '~/services/validators/test-case.schema'
import { safeLog } from '~/utils/safe-log'

export const CLAUDE_CONFIG = {
  model: 'claude-sonnet-4-20250514',
  maxTokens: { step1: 1000, step2: 800, step3: 4096, step4: 4096, step5: 2048 },
  temperature: 0,
  timeoutMs: 15000,
} as const

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'
const ANTHROPIC_VERSION = '2023-06-01'

export class ClaudeError extends Error {
  constructor(
    message: string,
    public readonly code:
      | 'TIMEOUT'
      | 'UNAUTHORIZED'
      | 'RATE_LIMITED'
      | 'SERVER_ERROR'
      | 'PARSE_ERROR'
      | 'VALIDATION_ERROR'
      | 'NETWORK_ERROR'
  ) {
    super(message)
    this.name = 'ClaudeError'
  }
}

interface ClaudeMessage {
  role: 'user'
  content: string
}

interface ClaudeRequestBody {
  model: string
  max_tokens: number
  temperature: number
  system: string
  messages: ClaudeMessage[]
}

interface ClaudeResponseContent {
  type: string
  text: string
}

interface ClaudeResponse {
  content: ClaudeResponseContent[]
}

export async function callClaude(
  prompt: { system: string; user: string },
  maxTokens: number,
  apiKey: string
): Promise<string> {
  const body: ClaudeRequestBody = {
    model: CLAUDE_CONFIG.model,
    max_tokens: maxTokens,
    temperature: CLAUDE_CONFIG.temperature,
    system: prompt.system,
    messages: [{ role: 'user', content: prompt.user }],
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), CLAUDE_CONFIG.timeoutMs)

  let response: Response
  try {
    response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': ANTHROPIC_VERSION,
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    })
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof Error && err.name === 'AbortError') {
      throw new ClaudeError('Request timed out after 15 seconds', 'TIMEOUT')
    }
    throw new ClaudeError(`Network error: ${err instanceof Error ? err.message : String(err)}`, 'NETWORK_ERROR')
  } finally {
    clearTimeout(timeoutId)
  }

  if (response.status === 401) {
    throw new ClaudeError('Invalid Claude API key', 'UNAUTHORIZED')
  }
  if (response.status === 429) {
    throw new ClaudeError('Claude API rate limit exceeded', 'RATE_LIMITED')
  }
  if (response.status >= 500) {
    throw new ClaudeError(`Claude API server error (${response.status})`, 'SERVER_ERROR')
  }
  if (!response.ok) {
    throw new ClaudeError(`Unexpected API response status: ${response.status}`, 'SERVER_ERROR')
  }

  let data: ClaudeResponse
  try {
    data = (await response.json()) as ClaudeResponse
  } catch {
    throw new ClaudeError('Failed to parse Claude API response as JSON', 'PARSE_ERROR')
  }

  const textBlock = data.content?.find(c => c.type === 'text')
  if (!textBlock?.text) {
    throw new ClaudeError('Claude API response contained no text content', 'PARSE_ERROR')
  }

  return textBlock.text.trim()
}

function buildStrictJsonRetryPrompt(
  original: { system: string; user: string },
  previousOutput: string
): { system: string; user: string } {
  return {
    system: original.system,
    user: `${original.user}

IMPORTANT: Your previous response was not valid JSON. Previous response:
${previousOutput}

Return ONLY raw JSON — no markdown code fences, no explanation, no prose. Start directly with [ or {.`,
  }
}

async function callWithRetry(
  prompt: { system: string; user: string },
  maxTokens: number,
  apiKey: string
): Promise<string> {
  let lastOutput = ''
  try {
    lastOutput = await callClaude(prompt, maxTokens, apiKey)
    JSON.parse(lastOutput)
    return lastOutput
  } catch (err) {
    if (err instanceof ClaudeError) throw err
    // JSON parse failure — retry with strict prompt
    safeLog.warn('Step output was not valid JSON, retrying with strict prompt')
    const retryPrompt = buildStrictJsonRetryPrompt(prompt, lastOutput)
    return callClaude(retryPrompt, maxTokens, apiKey)
  }
}

function buildDefaultEnrichment(story: UserStory): EnrichedStory {
  return {
    ...story,
    domain: 'general',
    ambiguities: [],
    enriched: false,
  }
}

function buildDefaultCoverageAnalysis(): CoverageAnalysis {
  return {
    highRiskAreas: [],
    requiredCoverageTypes: ['functional', 'negative', 'edge-case'],
    complianceConcerns: [],
    estimatedTestCaseCount: 5,
    generationGuidance: 'Generate comprehensive test cases covering positive, negative, and edge-case scenarios.',
  }
}

function parseEnrichedStory(story: UserStory, raw: string): EnrichedStory {
  const parsed = JSON.parse(raw)
  return {
    ...story,
    domain: typeof parsed.domain === 'string' ? parsed.domain : 'general',
    description: typeof parsed.description === 'string' ? parsed.description : story.description,
    acceptanceCriteria: typeof parsed.acceptanceCriteria === 'string' ? parsed.acceptanceCriteria : story.acceptanceCriteria,
    ambiguities: Array.isArray(parsed.ambiguities) ? parsed.ambiguities : [],
    enriched: true,
  }
}

function parseCoverageAnalysis(raw: string): CoverageAnalysis {
  const parsed = JSON.parse(raw)
  return {
    highRiskAreas: Array.isArray(parsed.highRiskAreas) ? parsed.highRiskAreas : [],
    requiredCoverageTypes: Array.isArray(parsed.requiredCoverageTypes) ? parsed.requiredCoverageTypes : ['functional', 'negative'],
    complianceConcerns: Array.isArray(parsed.complianceConcerns) ? parsed.complianceConcerns : [],
    estimatedTestCaseCount: typeof parsed.estimatedTestCaseCount === 'number' ? parsed.estimatedTestCaseCount : 5,
    generationGuidance: typeof parsed.generationGuidance === 'string' ? parsed.generationGuidance : '',
  }
}

export async function runPromptChain(
  story: UserStory,
  apiKey: string
): Promise<ValidatedTestCase[]> {
  // Step 1 — Enrichment (skip if story already has sufficient content)
  let enriched: EnrichedStory
  const hasFullContent =
    story.description.length > 100 && story.acceptanceCriteria.length > 100

  if (hasFullContent) {
    safeLog.info('Step 1 skipped: story has sufficient description and AC')
    enriched = buildDefaultEnrichment(story)
  } else {
    try {
      const prompt = buildStep1Prompt(story)
      const raw = await callWithRetry(prompt, CLAUDE_CONFIG.maxTokens.step1, apiKey)
      enriched = parseEnrichedStory(story, raw)
      safeLog.info('Step 1 complete: story enriched')
    } catch (err) {
      safeLog.warn('Step 1 failed, proceeding with default enrichment:', err)
      enriched = buildDefaultEnrichment(story)
    }
  }

  // Step 2 — Risk & Coverage Analysis
  let analysis: CoverageAnalysis
  try {
    const prompt = buildStep2Prompt(enriched)
    const raw = await callWithRetry(prompt, CLAUDE_CONFIG.maxTokens.step2, apiKey)
    analysis = parseCoverageAnalysis(raw)
    safeLog.info('Step 2 complete: coverage analysis ready')
  } catch (err) {
    safeLog.warn('Step 2 failed, proceeding with default coverage plan:', err)
    analysis = buildDefaultCoverageAnalysis()
  }

  // Step 3 — Test Case Generation (fatal on failure)
  let step3Output: string
  try {
    const prompt = buildStep3Prompt(enriched, analysis)
    step3Output = await callWithRetry(prompt, CLAUDE_CONFIG.maxTokens.step3, apiKey)
    safeLog.info('Step 3 complete: test cases generated')
  } catch (err) {
    safeLog.error('Step 3 failed — aborting chain:', err)
    throw new ClaudeError(
      `Test case generation failed: ${err instanceof Error ? err.message : String(err)}`,
      'SERVER_ERROR'
    )
  }

  // Step 4 — Self-Validation & Correction (skip on failure, use step 3 output)
  let step4Output = step3Output
  try {
    const prompt = buildStep4Prompt(step3Output)
    step4Output = await callWithRetry(prompt, CLAUDE_CONFIG.maxTokens.step4, apiKey)
    safeLog.info('Step 4 complete: test cases self-validated')
  } catch (err) {
    safeLog.warn('Step 4 failed, using Step 3 output directly:', err)
  }

  // Step 5 — Priority & Tagging Assignment (skip on failure, use step 4 output)
  let step5Output = step4Output
  try {
    const prompt = buildStep5Prompt(step4Output, enriched, analysis)
    step5Output = await callWithRetry(prompt, CLAUDE_CONFIG.maxTokens.step5, apiKey)
    safeLog.info('Step 5 complete: priorities and tags normalised')
  } catch (err) {
    safeLog.warn('Step 5 failed, using Step 4 output:', err)
  }

  // Final validation
  const result = validateGeneratedOutput(step5Output)
  if (result.success === false) {
    const details = result.errors.map(e => `[${e.caseIndex ?? '?'}] ${e.field}: ${e.message}`).join('; ')
    throw new ClaudeError(`Generated test cases failed validation: ${details}`, 'VALIDATION_ERROR')
  }

  if (result.warnings.length > 0) {
    safeLog.warn('Validation warnings:', result.warnings.map(w => w.message).join('; '))
  }

  safeLog.info(`Chain complete: ${result.data.length} validated test cases`)
  return result.data
}
