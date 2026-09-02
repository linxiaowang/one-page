import { Redis } from '@upstash/redis'

function readEnv(key: string) {
  return process.env[key]
}

export function getRedisConfig() {
  const config = useRuntimeConfig()

  const url = config.kvRestApiUrl
    || readEnv('KV_REST_API_URL')
    || readEnv('UPSTASH_REDIS_REST_URL')

  const token = config.kvRestApiToken
    || readEnv('KV_REST_API_TOKEN')
    || readEnv('UPSTASH_REDIS_REST_TOKEN')

  return { url, token }
}

export function getRedis() {
  const { url, token } = getRedisConfig()

  if (!url || !token)
    return null

  return new Redis({ url, token })
}

export function isVercel() {
  return Boolean(process.env.VERCEL)
}

export function storageUnavailable() {
  throw createError({
    statusCode: 503,
    statusMessage: '分享存储未就绪，请在 Vercel 连接 Upstash Redis 后重新部署',
  })
}
