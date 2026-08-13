import { z } from 'zod'

export const DISPLAY_NAME_MAX_VISIBLE_CHARACTERS = 24

const segmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })
const disallowedCharacters = /[\p{Cc}\p{Cf}\p{Cs}\p{Zl}\p{Zp}]/u

export const normalizeDisplayName = (value: string) =>
  value.normalize('NFC').replace(/\s+/gu, ' ').trim()

export const displayNameSchema = z
  .string({ error: 'Enter a display name.' })
  .transform(normalizeDisplayName)
  .pipe(
    z
      .string()
      .min(1, 'Enter a display name.')
      .refine(
        (value) => !disallowedCharacters.test(value),
        'Display names cannot contain control or hidden formatting characters.',
      )
      .refine(
        (value) =>
          Array.from(segmenter.segment(value)).length <= DISPLAY_NAME_MAX_VISIBLE_CHARACTERS,
        `Use ${DISPLAY_NAME_MAX_VISIBLE_CHARACTERS} visible characters or fewer.`,
      ),
  )
