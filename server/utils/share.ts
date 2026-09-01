import { Redis } from '@upstash/redis'
import { DEFAULT_READING_FONT, normalizeReadingFont, type ReadingFont } from '../../app/constants/reading'

const SHARE_TTL_SECONDS = 60 * 60 * 24 * 90
const MAX_CONTENT_LENGTH = 500_000

export interface SharePayload {
  content: string
  font: ReadingFont
}

function readEnv(key: string) {
  return process.env[key]
}

function getRedisConfig() {
  const config = useRuntimeConfig()

  const url = config.kvRestApiUrl
    || readEnv('KV_REST_API_URL')
    || readEnv('UPSTASH_REDIS_REST_URL')

  const token = config.kvRestApiToken
    || readEnv('KV_REST_API_TOKEN')
    || readEnv('UPSTASH_REDIS_REST_TOKEN')

  return { url, token }
}

function getRedis() {
  const { url, token } = getRedisConfig()

  if (!url || !token)
    return null

  return new Redis({ url, token })
}

function isVercel() {
  return Boolean(process.env.VERCEL)
}

function createShareId() {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 12)
}

export function assertShareContent(content: unknown): string {
  if (typeof content !== 'string' || !content.trim())
    throw createError({ statusCode: 400, statusMessage: 'Content is required' })

  if (content.length > MAX_CONTENT_LENGTH)
    throw createError({ statusCode: 413, statusMessage: 'Content too large' })

  return content
}

export function assertShareFont(font: unknown): ReadingFont {
  return normalizeReadingFont(font)
}

function normalizeSharePayload(raw: unknown): SharePayload | null {
  if (raw == null)
    return null

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as { content?: unknown, font?: unknown }
      if (typeof parsed.content === 'string') {
        return {
          content: parsed.content,
          font: assertShareFont(parsed.font),
        }
      }
    }
    catch {
      // Legacy plain-text shares.
    }

    if (!raw.trim())
      return null

    return {
      content: raw,
      font: DEFAULT_READING_FONT,
    }
  }

  if (typeof raw === 'object' && raw !== null && 'content' in raw) {
    const data = raw as { content?: unknown, font?: unknown }
    if (typeof data.content !== 'string' || !data.content.trim())
      return null

    return {
      content: data.content,
      font: assertShareFont(data.font),
    }
  }

  return null
}

function storageUnavailable() {
  throw createError({
    statusCode: 503,
    statusMessage: '分享存储未就绪，请在 Vercel 连接 Upstash Redis 后重新部署',
  })
}

export async function saveShare(content: string, font: ReadingFont = DEFAULT_READING_FONT) {
  const id = createShareId()
  const payload: SharePayload = { content, font }
  const redis = getRedis()

  if (redis) {
    await redis.set(`share:${id}`, JSON.stringify(payload), { ex: SHARE_TTL_SECONDS })
    return id
  }

  if (isVercel())
    storageUnavailable()

  const storage = useStorage('shares')
  await storage.setItem(`${id}.json`, { ...payload, createdAt: Date.now() })
  return id
}

export async function getShare(id: string) {
  const redis = getRedis()

  if (redis) {
    const raw = await redis.get(`share:${id}`)
    return normalizeSharePayload(raw)
  }

  if (isVercel())
    storageUnavailable()

  const storage = useStorage('shares')
  const data = await storage.getItem<SharePayload & { createdAt?: number }>(`${id}.json`)
  return normalizeSharePayload(data)
}
