// Patterns that match sensitive credential material
const REDACT_PATTERNS: RegExp[] = [
  /sk-ant-[A-Za-z0-9_-]+/g,             // Anthropic API keys
  /Bearer\s+[A-Za-z0-9_.~+/-]+=*/g,    // Bearer tokens
  /[A-Za-z0-9+/]{30,}={0,2}/g,          // Base64 blobs > 30 chars (ADO PATs)
]

const REDACTED = '[REDACTED]'

function redactString(value: string): string {
  let result = value
  for (const pattern of REDACT_PATTERNS) {
    result = result.replace(pattern, REDACTED)
  }
  return result
}

function redact(value: unknown): unknown {
  if (typeof value === 'string') return redactString(value)

  if (Array.isArray(value)) return value.map(redact)

  if (value !== null && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [k, redact(v)])
    )
  }

  return value
}

function redactArgs(args: unknown[]): unknown[] {
  return args.map(redact)
}

const PREFIX = '[SpecForge]'

function isDev(): boolean {
  return process.env.NODE_ENV !== 'production'
}

export const safeLog = {
  info: (...args: unknown[]): void => {
    if (isDev()) console.info(PREFIX, ...redactArgs(args))
  },
  warn: (...args: unknown[]): void => {
    if (isDev()) console.warn(PREFIX, ...redactArgs(args))
  },
  error: (...args: unknown[]): void => {
    if (isDev()) console.error(PREFIX, ...redactArgs(args))
  },
  debug: (...args: unknown[]): void => {
    if (isDev()) console.debug(PREFIX, ...redactArgs(args))
  },
}
