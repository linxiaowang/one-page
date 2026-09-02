import { Redis } from '@upstash/redis'
import { DEFAULT_READING_FONT, normalizeReadingFont, type ReadingFont } from '../../app/constants/reading'

const SHARE_TTL_SECONDS = 60 * 60 * 24 * 90
const MAX_CONTENT_LENGTH = 500_000

export interface SharePayload {
  content: string
  font: ReadingFont
  expiresAt?: number
}

function resolveExpiresAt(data: { expiresAt?: unknown, createdAt?: unknown }) {
  if (typeof data.expiresAt === 'number')
    return data.expiresAt

  if (typeof data.createdAt === 'number')
    return data.createdAt + SHARE_TTL_SECONDS * 1000

  return undefined
}

function isShareExpired(payload: SharePayload) {
  return typeof payload.expiresAt === 'number' && Date.now() > payload.expiresAt
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
        const expiresAt = resolveExpiresAt(parsed as { expiresAt?: unknown, createdAt?: unknown })
        return {
          content: parsed.content,
          font: assertShareFont(parsed.font),
          ...(expiresAt !== undefined && { expiresAt }),
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
    const data = raw as { content?: unknown, font?: unknown, expiresAt?: unknown, createdAt?: unknown }
    if (typeof data.content !== 'string' || !data.content.trim())
      return null

    const expiresAt = resolveExpiresAt(data)
    return {
      content: data.content,
      font: assertShareFont(data.font),
      ...(expiresAt !== undefined && { expiresAt }),
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
  const expiresAt = Date.now() + SHARE_TTL_SECONDS * 1000
  const payload: SharePayload = { content, font, expiresAt }
  const redis = getRedis()

  if (redis) {
    await redis.set(`share:${id}`, JSON.stringify(payload), { ex: SHARE_TTL_SECONDS })
    return id
  }

  if (isVercel())
    storageUnavailable()

  const storage = useStorage('shares')
  await storage.setItem(`${id}.json`, payload)
  return id
}

export async function getShare(id: string) {
  const redis = getRedis()

  if (redis) {
    const raw = await redis.get(`share:${id}`)
    const payload = normalizeSharePayload(raw)
    if (!payload || isShareExpired(payload))
      return null
    return payload
  }

  if (isVercel())
    storageUnavailable()

  const storage = useStorage('shares')
  const data = await storage.getItem<SharePayload & { createdAt?: number }>(`${id}.json`)
  const payload = normalizeSharePayload(data)
  if (!payload || isShareExpired(payload))
    return null
  return payload
}
