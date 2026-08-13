export const PLAYER_START_TIMEOUT_MS = 15_000
export const PLAYER_API_TIMEOUT_MS = 15_000
export const MAX_PLAYER_RECOVERY_RETRIES = 1

export type PlayerRecoveryAction = 'retry' | 'fail'

export const getPlayerRecoveryAction = (retryCount: number): PlayerRecoveryAction =>
  retryCount < MAX_PLAYER_RECOVERY_RETRIES ? 'retry' : 'fail'
