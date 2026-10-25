import { setupMessageRouter } from './message-router'
import { safeLog } from '~/utils/safe-log'

setupMessageRouter()

safeLog.info('SpecForge background worker started')
