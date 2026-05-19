import type { UserStory } from '~/types/user-story'
import type { EnrichedStory, CoverageAnalysis } from '~/types/test-case'

export const PROMPT_VERSIONS = {
  step1: '1.0',
  step2: '1.0',
  step3: '1.0',
  step4: '1.0',
  step5: '1.0',
}

function fmtList(items: string[] | undefined): string {
  if (!items || items.length === 0) return 'None'
  return items.join(', ')
}

function fmtLinkedItems(
  items: { id: string; type: string; title: string; relationship: string }[] | undefined
): string {
  if (!items || items.length === 0) return 'None'
  return items.map(i => `[${i.id}] ${i.type}: ${i.title} (${i.relationship})`).join('\n')
}

// ---------------------------------------------------------------------------
// Step 1 — Story Enrichment
// Normalize sparse story; infer missing acceptance criteria and domain.
// ---------------------------------------------------------------------------

export function buildStep1Prompt(story: UserStory): { system: string; user: string } {
  const system = `You are a senior business analyst and QA architect with deep expertise in Azure DevOps agile workflows.
Your task is to enrich a User Story by:
1. Identifying the business domain (e.g. authentication, payments, notifications)
2. Filling in missing or sparse description and acceptance criteria using best-practice BDD patterns
3. Listing any ambiguities that require clarification

Return ONLY a valid JSON object matching this exact schema — no markdown, no prose outside JSON:
{
  "domain": string,
  "description": string,
  "acceptanceCriteria": string,
  "ambiguities": string[],
  "enriched": true
}`

  const user = `Enrich the following Azure DevOps User Story.

Story ID: ${story.id}
Title: ${story.title}

Description:
${story.description || '(not provided)'}

Acceptance Criteria:
${story.acceptanceCriteria || '(not provided)'}

Priority: ${story.priority ?? 'Not set'}
Tags: ${fmtList(story.tags)}
Area Path: ${story.areaPath ?? 'Not set'}
Iteration: ${story.iteration ?? 'Not set'}

Return ONLY the JSON object described in the system prompt.`

  return { system, user }
}

// ---------------------------------------------------------------------------
// Step 2 — Risk & Coverage Analysis
// Identify high-risk areas and required coverage types.
// ---------------------------------------------------------------------------

export function buildStep2Prompt(enriched: EnrichedStory): { system: string; user: string } {
  const system = `You are a QA architect specializing in risk-based test design using the ado-test-case-creator methodology.
Your task is to analyse an enriched User Story and produce a coverage analysis plan.

Return ONLY a valid JSON object matching this exact schema — no markdown, no prose outside JSON:
{
  "highRiskAreas": string[],
  "requiredCoverageTypes": string[],
  "complianceConcerns": string[],
  "estimatedTestCaseCount": number,
  "generationGuidance": string
}

Coverage types include: functional, negative, edge-case, boundary, security, performance, accessibility, compliance, integration, regression.`

  const user = `Analyse the following enriched User Story for test coverage requirements.

Story ID: ${enriched.id}
Title: ${enriched.title}
Domain: ${enriched.domain}

Description:
${enriched.description}

Acceptance Criteria:
${enriched.acceptanceCriteria}

Priority: ${enriched.priority ?? 'Not set'}
Tags: ${fmtList(enriched.tags)}
Ambiguities: ${fmtList(enriched.ambiguities)}

Existing Test Cases: ${fmtList(enriched.existingTestCases)}

Return ONLY the JSON coverage analysis object.`

  return { system, user }
}

// ---------------------------------------------------------------------------
// Step 3 — Test Case Generation
// Core generation using the ado-test-case-creator skill.
// ---------------------------------------------------------------------------

export function buildStep3Prompt(
  enriched: EnrichedStory,
  analysis: CoverageAnalysis
): { system: string; user: string } {
  const system = `You are a QA engineering expert using the ado-test-case-creator skill.
You receive a structured Azure DevOps User Story and return ONLY a valid JSON array of test cases.
Do not return any text outside the JSON. No markdown. No preamble.
Follow the exact schema provided.`

  const coverageGuidance = [
    `- High-risk areas: ${fmtList(analysis.highRiskAreas)}`,
    `- Required coverage types: ${fmtList(analysis.requiredCoverageTypes)}`,
    `- Compliance concerns: ${fmtList(analysis.complianceConcerns)}`,
    `- Target test case count: ${analysis.estimatedTestCaseCount}`,
    `- Guidance: ${analysis.generationGuidance}`,
  ].join('\n')

  const user = `Generate comprehensive QA test cases for the following Azure DevOps User Story.

Story ID: ${enriched.id}
Title: ${enriched.title}

Description:
${enriched.description}

Acceptance Criteria:
${enriched.acceptanceCriteria}

Priority: ${enriched.priority ?? 'Not set'}
Tags: ${fmtList(enriched.tags)}
Area Path: ${enriched.areaPath ?? 'Not set'}
Iteration: ${enriched.iteration ?? 'Not set'}

Additional Context:
- Comments: ${fmtList(enriched.comments)}
- Linked Work Items:\n${fmtLinkedItems(enriched.linkedWorkItems)}
- Existing Test Cases: ${fmtList(enriched.existingTestCases)}

Coverage Requirements:
${coverageGuidance}

Return ONLY a JSON array matching this schema:
[
  {
    "title": string,
    "priority": "Low" | "Medium" | "High",
    "preconditions": string[],
    "steps": [
      {
        "action": string,
        "expected": string
      }
    ],
    "tags": string[],
    "coverageType": string,
    "acReference": string | null
  }
]

Mandatory coverage requirements:
- At least 1 positive/happy-path test case
- At least 1 negative test case
- At least 1 edge case
- Business rule validation scenarios
- All acceptance criteria must be covered`

  return { system, user }
}

// ---------------------------------------------------------------------------
// Step 4 — Self-Validation & Correction
// Claude reviews its own Step 3 output and fixes structural issues.
// ---------------------------------------------------------------------------

export function buildStep4Prompt(step3Output: string): { system: string; user: string } {
  const system = `You are a strict QA test case validator and corrector.
Review the provided JSON array of test cases and correct any structural or quality issues:
- Remove duplicate test cases (keep the better one)
- Ensure every step has a non-empty action AND expected result
- Ensure every title is unique and descriptive (min 3 characters)
- Ensure priority is one of: Low, Medium, High
- Ensure preconditions and tags are arrays (not null or undefined)
- Remove any markdown formatting, code fences, or prose that leaked into the JSON

Return ONLY the corrected JSON array — no markdown, no explanation.`

  const user = `Review and correct the following test case array:

${step3Output}

Return ONLY the corrected JSON array.`

  return { system, user }
}

// ---------------------------------------------------------------------------
// Step 5 — Priority & Tagging Assignment
// Normalize priorities and tags based on story context.
// ---------------------------------------------------------------------------

export function buildStep5Prompt(
  step4Output: string,
  story: EnrichedStory,
  analysis: CoverageAnalysis
): { system: string; user: string } {
  const system = `You are a test case taxonomy and prioritisation expert.
Your task is to review test cases and normalise their priority and tags.

Priority rules:
- High: tests that cover critical security, data integrity, or business-blocking scenarios
- Medium: tests that cover core functional paths and acceptance criteria
- Low: tests that cover edge cases, UI polish, or non-critical paths

Tag normalisation rules:
- Add the domain as a tag (e.g. "authentication", "payments")
- Add the coverage type as a tag (e.g. "positive", "negative", "edge-case")
- Add compliance tags where applicable (e.g. "gdpr", "wcag", "accessibility")
- Use lowercase, hyphenated tags

Return ONLY the updated JSON array — no markdown, no explanation.`

  const user = `Normalise the priority and tags of the following test cases.

Story domain: ${story.domain}
Story priority: ${story.priority ?? 'Not set'}
High-risk areas: ${fmtList(analysis.highRiskAreas)}
Required coverage types: ${fmtList(analysis.requiredCoverageTypes)}
Compliance concerns: ${fmtList(analysis.complianceConcerns)}

Test cases to normalise:
${step4Output}

Return ONLY the updated JSON array.`

  return { system, user }
}
