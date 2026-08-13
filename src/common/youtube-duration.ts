const youtubeDurationPattern = /^P(?:(\d+)D)?T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/

export const parseYouTubeDuration = (value: string | undefined): number | undefined => {
  if (!value) return undefined
  const match = youtubeDurationPattern.exec(value)
  if (!match) return undefined

  const [, days = '0', hours = '0', minutes = '0', seconds = '0'] = match
  return Number(days) * 86_400 + Number(hours) * 3_600 + Number(minutes) * 60 + Number(seconds)
}

export const formatVideoDuration = (durationSeconds: number | undefined) => {
  if (durationSeconds === undefined) return undefined
  const hours = Math.floor(durationSeconds / 3_600)
  const minutes = Math.floor((durationSeconds % 3_600) / 60)
  const seconds = durationSeconds % 60

  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`
}
