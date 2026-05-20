import { browserAPI } from '~/utils/browser-api'

export interface UserPreferences {
  defaultPriority: 'Low' | 'Medium' | 'High'
  autoSelectAll: boolean
  showAdvancedOptions: boolean
}

const DEFAULT_PREFERENCES: UserPreferences = {
  defaultPriority: 'Medium',
  autoSelectAll: true,
  showAdvancedOptions: false,
}

type StorageKey = 'claudeApiKey' | 'adoPat' | 'userPreferences'

function get<T>(key: StorageKey): Promise<T | null> {
  return new Promise(resolve => {
    browserAPI.storage.local.get(key, result => {
      resolve(key in result ? (result[key] as T) : null)
    })
  })
}

function set(key: StorageKey, value: unknown): Promise<void> {
  return new Promise(resolve => {
    browserAPI.storage.local.set({ [key]: value }, resolve)
  })
}

export function getClaudeApiKey(): Promise<string | null> {
  return get<string>('claudeApiKey')
}

export function setClaudeApiKey(key: string): Promise<void> {
  return set('claudeApiKey', key)
}

export function getAdoPat(): Promise<string | null> {
  return get<string>('adoPat')
}

export function setAdoPat(pat: string): Promise<void> {
  return set('adoPat', pat)
}

export function clearAllCredentials(): Promise<void> {
  return new Promise(resolve => {
    browserAPI.storage.local.remove(['claudeApiKey', 'adoPat'], resolve)
  })
}

export async function getUserPreferences(): Promise<UserPreferences> {
  const stored = await get<Partial<UserPreferences>>('userPreferences')
  return { ...DEFAULT_PREFERENCES, ...(stored ?? {}) }
}

export function setUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  return getUserPreferences().then(current =>
    set('userPreferences', { ...current, ...prefs })
  )
}
