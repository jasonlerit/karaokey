import { loadEnvConfig } from '@next/env'
import { z } from 'zod'

loadEnvConfig(process.cwd())

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  APP_URL: z.url().default('http://localhost:3000'),
  DATABASE_URL: z
    .string()
    .url()
    .refine(
      (value) => ['postgres:', 'postgresql:'].includes(new URL(value).protocol),
      'DATABASE_URL must be a PostgreSQL connection URL',
    ),
  DATABASE_LOGGER: z
    .enum(['true', 'false'])
    .default('false')
    .transform((value) => value === 'true'),
})

const result = envSchema.safeParse(process.env)

if (!result.success) {
  console.error('❌ Invalid environment variables:')
  console.error(z.prettifyError(result.error))

  throw new Error('Invalid environment configuration')
}

export const env = result.data
export type Env = z.infer<typeof envSchema>
