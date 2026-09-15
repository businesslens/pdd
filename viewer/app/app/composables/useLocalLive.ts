/**
 * The live state of the local report: whether the stream is connected, which
 * revision is on screen, and when it arrived. The page writes it as events
 * come in; the header draws it as the pulse.
 */
export interface LocalLiveState {
  connected: boolean
  revision: number
  updatedAt: number | null
}

export function useLocalLive() {
  return useState<LocalLiveState>('businesslens-local-live', () => ({ connected: false, revision: 0, updatedAt: null }))
}
