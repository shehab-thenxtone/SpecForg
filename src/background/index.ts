import { setupMessageRouter } from './message-router'
import { safeLog } from '~/utils/safe-log'

setupMessageRouter()

safeLog.info('SpecForge background worker started')

chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'local') return
  if ('claudeApiKey' in changes) {
    safeLog.info('Claude API key updated in storage')
  }
  if ('adoPat' in changes) {
    safeLog.info('ADO PAT updated in storage')
  }
})
