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

type StorageKey = 'userPreferences' | 'claudeProjectUrl' | 'pendingSkillInvocation' | 'autoStart'

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

export async function getUserPreferences(): Promise<UserPreferences> {
  const stored = await get<Partial<UserPreferences>>('userPreferences')
  return { ...DEFAULT_PREFERENCES, ...(stored ?? {}) }
}

export function setUserPreferences(prefs: Partial<UserPreferences>): Promise<void> {
  return getUserPreferences().then(current =>
    set('userPreferences', { ...current, ...prefs })
  )
}

export function getClaudeProjectUrl(): Promise<string | null> {
  return get<string>('claudeProjectUrl')
}

export function setClaudeProjectUrl(url: string): Promise<void> {
  return set('claudeProjectUrl', url)
}

export function getPendingSkillInvocation(): Promise<string | null> {
  return get<string>('pendingSkillInvocation')
}

export function setPendingSkillInvocation(message: string): Promise<void> {
  return set('pendingSkillInvocation', message)
}

export function clearPendingSkillInvocation(): Promise<void> {
  return new Promise(resolve => {
    browserAPI.storage.local.remove('pendingSkillInvocation', resolve)
  })
}

export function setAutoStart(): Promise<void> {
  return set('autoStart', true)
}

export function getAndClearAutoStart(): Promise<boolean> {
  return new Promise(resolve => {
    browserAPI.storage.local.get('autoStart', result => {
      const flag = result['autoStart'] === true
      if (flag) {
        browserAPI.storage.local.remove('autoStart', () => resolve(true))
      } else {
        resolve(false)
      }
    })
  })
}
