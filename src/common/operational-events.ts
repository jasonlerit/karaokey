import 'server-only'

import { env } from '@/common/env'
import { serializeOperationalEvent, type OperationalEvent } from '@/common/operational-event-policy'

export const recordOperationalEvent = (event: OperationalEvent) => {
  if (!env.OBSERVABILITY_ENABLED) return
  console.info(JSON.stringify(serializeOperationalEvent(event)))
}
