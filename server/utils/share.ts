import { Redis } from '@upstash/redis'

const SHARE_TTL_SECONDS = 60 * 60 * 24 * 90
const MAX_CONTENT_LENGTH = 500_000

function getRedis() {
  const url = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL
  const token = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN

  if (!url || !token)
    return null

  return new Redis({ url, token })
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

export async function saveShare(content: string) {
  const id = createShareId()
  const redis = getRedis()

  if (redis) {
    await redis.set(`share:${id}`, content, { ex: SHARE_TTL_SECONDS })
    return id
  }

  const storage = useStorage('shares')
  await storage.setItem(`${id}.json`, { content, createdAt: Date.now() })
  return id
}

export async function getShare(id: string) {
  const redis = getRedis()

  if (redis)
    return await redis.get<string>(`share:${id}`)

  const storage = useStorage('shares')
  const data = await storage.getItem<{ content: string }>(`${id}.json`)
  return data?.content ?? null
}
