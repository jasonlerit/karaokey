export type YouTubePlayerAction = 'playing' | 'paused' | 'completed'

export const getYouTubePlayerAction = (state: number): YouTubePlayerAction | undefined => {
  if (state === 0) return 'completed'
  if (state === 1) return 'playing'
  if (state === 2) return 'paused'
}
