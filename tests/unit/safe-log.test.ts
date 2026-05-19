import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

describe('safeLog', () => {
  beforeEach(() => {
    vi.spyOn(console, 'info').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'debug').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllEnvs()
  })

  it('logs in development mode', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { safeLog } = await import('../../src/utils/safe-log')
    safeLog.info('hello')
    expect(console.info).toHaveBeenCalledWith('[SpecForge]', 'hello')
  })

  it('suppresses output in production mode', async () => {
    vi.stubEnv('NODE_ENV', 'production')
    const { safeLog } = await import('../../src/utils/safe-log')
    safeLog.info('should be silent')
    expect(console.info).not.toHaveBeenCalled()
  })

  it('redacts Anthropic API keys (sk-ant-*)', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { safeLog } = await import('../../src/utils/safe-log')
    safeLog.info('key is sk-ant-api03-ABCDEFGHIJ1234567890')
    const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call.join(' ')).toContain('[REDACTED]')
    expect(call.join(' ')).not.toContain('sk-ant-')
  })

  it('redacts Bearer tokens', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { safeLog } = await import('../../src/utils/safe-log')
    safeLog.warn('Authorization: Bearer eyJhbGciOiJSUzI1Ni')
    const call = (console.warn as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call.join(' ')).toContain('[REDACTED]')
    expect(call.join(' ')).not.toContain('Bearer eyJ')
  })

  it('redacts base64 blobs longer than 30 chars (ADO PATs)', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { safeLog } = await import('../../src/utils/safe-log')
    const pat = 'dXNlcjpBQkNERUZHSElKS0xNTk9QUVJTVFVWV1hZWg=='
    safeLog.debug('pat:', pat)
    const call = (console.debug as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call.join(' ')).toContain('[REDACTED]')
  })

  it('does not redact short strings', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { safeLog } = await import('../../src/utils/safe-log')
    safeLog.info('short value: abc123')
    const call = (console.info as ReturnType<typeof vi.fn>).mock.calls[0]
    expect(call.join(' ')).toContain('abc123')
    expect(call.join(' ')).not.toContain('[REDACTED]')
  })

  it('redacts within nested objects', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { safeLog } = await import('../../src/utils/safe-log')
    safeLog.error({ token: 'sk-ant-api03-ABCDEFGHIJ1234567890', user: 'alice' })
    const call = (console.error as ReturnType<typeof vi.fn>).mock.calls[0]
    const serialized = JSON.stringify(call)
    expect(serialized).toContain('[REDACTED]')
    expect(serialized).not.toContain('sk-ant-')
    expect(serialized).toContain('alice')
  })

  it('all log levels are available', async () => {
    vi.stubEnv('NODE_ENV', 'development')
    const { safeLog } = await import('../../src/utils/safe-log')
    expect(typeof safeLog.info).toBe('function')
    expect(typeof safeLog.warn).toBe('function')
    expect(typeof safeLog.error).toBe('function')
    expect(typeof safeLog.debug).toBe('function')
  })
})
