export const ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  RATE_LIMITED: 'RATE_LIMITED',
  NETWORK_ERROR: 'NETWORK_ERROR',
  GENERATION_FAILED: 'GENERATION_FAILED',
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  EXTRACTION_FAILED: 'EXTRACTION_FAILED',
  INJECTION_FAILED: 'INJECTION_FAILED',
  SELECTOR_NOT_FOUND: 'SELECTOR_NOT_FOUND',
  SERVER_ERROR: 'SERVER_ERROR',
} as const

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES]

export const ERROR_MESSAGES: Record<ErrorCode, string> = {
  UNAUTHORIZED: 'Claude API key is missing or invalid. Check your settings.',
  RATE_LIMITED: 'Claude API quota exceeded. Check your usage at console.anthropic.com.',
  NETWORK_ERROR: 'Network request failed. Check your connection and try again.',
  GENERATION_FAILED: 'Test case generation failed. Please try again.',
  VALIDATION_FAILED: 'Generated output did not match the expected format. Please try again.',
  EXTRACTION_FAILED: 'Could not extract story data from this page. Try refreshing.',
  INJECTION_FAILED: 'Test case injection failed. Check ADO permissions and try again.',
  SELECTOR_NOT_FOUND: 'ADO form element not found. The page may have changed — try refreshing.',
  SERVER_ERROR: 'An unexpected error occurred. Please try again.',
}

export class SpecForgeError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message?: string
  ) {
    super(message ?? ERROR_MESSAGES[code])
    this.name = 'SpecForgeError'
  }
}

export class ExtractionError extends SpecForgeError {
  constructor(message?: string) {
    super(ERROR_CODES.EXTRACTION_FAILED, message)
    this.name = 'ExtractionError'
  }
}

export class GenerationError extends SpecForgeError {
  constructor(
    code: ErrorCode = ERROR_CODES.GENERATION_FAILED,
    message?: string
  ) {
    super(code, message)
    this.name = 'GenerationError'
  }
}

export class ValidationError extends SpecForgeError {
  constructor(message?: string) {
    super(ERROR_CODES.VALIDATION_FAILED, message)
    this.name = 'ValidationError'
  }
}
