import type { ReadingFont } from '../../app/constants/reading'
import { DEFAULT_READING_FONT, normalizeReadingFont } from '../../app/constants/reading'
import { resolvePageTitleFromMarkdown } from '../../app/utils/markdownTitle'
import { getRedis, isVercel, storageUnavailable } from './kv'
import { indexUserShare, removeUserShare } from './userShares'

const SHARE_ID_PATTERN = /^[a-z0-9]{12}$/i

const SHARE_TTL_SECONDS = 60 * 60 * 24 * 90
const MAX_CONTENT_LENGTH = 500_000

export interface SharePayload {
  content: string
  font: ReadingFont
  expiresAt?: number
  createdAt?: number
  userId?: number
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

export function assertShareId(id: unknown): string {
  if (typeof id !== 'string' || !SHARE_ID_PATTERN.test(id))
    throw createError({ statusCode: 400, statusMessage: 'Invalid share id' })

  return id
}

function normalizeSharePayload(raw: unknown): SharePayload | null {
  if (raw == null)
    return null

  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as {
        content?: unknown
        font?: unknown
        expiresAt?: unknown
        createdAt?: unknown
        userId?: unknown
      }
      if (typeof parsed.content === 'string') {
        const expiresAt = resolveExpiresAt(parsed)
        return {
          content: parsed.content,
          font: assertShareFont(parsed.font),
          ...(typeof parsed.createdAt === 'number' && { createdAt: parsed.createdAt }),
          ...(typeof parsed.userId === 'number' && { userId: parsed.userId }),
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
    const data = raw as {
      content?: unknown
      font?: unknown
      expiresAt?: unknown
      createdAt?: unknown
      userId?: unknown
    }
    if (typeof data.content !== 'string' || !data.content.trim())
      return null

    const expiresAt = resolveExpiresAt(data)
    return {
      content: data.content,
      font: assertShareFont(data.font),
      ...(typeof data.createdAt === 'number' && { createdAt: data.createdAt }),
      ...(typeof data.userId === 'number' && { userId: data.userId }),
      ...(expiresAt !== undefined && { expiresAt }),
    }
  }

  return null
}

export async function saveShare(
  content: string,
  font: ReadingFont = DEFAULT_READING_FONT,
  userId?: number,
) {
  const id = createShareId()
  const createdAt = Date.now()
  const expiresAt = createdAt + SHARE_TTL_SECONDS * 1000
  const payload: SharePayload = {
    content,
    font,
    expiresAt,
    createdAt,
    ...(userId !== undefined && { userId }),
  }
  const redis = getRedis()

  if (redis) {
    await redis.set(`share:${id}`, JSON.stringify(payload), { ex: SHARE_TTL_SECONDS })
  }
  else if (isVercel()) {
    storageUnavailable()
  }
  else {
    const storage = useStorage('shares')
    await storage.setItem(`${id}.json`, payload)
  }

  if (userId !== undefined) {
    await indexUserShare(userId, {
      id,
      title: resolvePageTitleFromMarkdown(content),
      createdAt,
      expiresAt,
    })
  }

  return id
}

async function loadSharePayload(id: string) {
  const redis = getRedis()

  if (redis) {
    const raw = await redis.get(`share:${id}`)
    return normalizeSharePayload(raw)
  }

  if (isVercel())
    storageUnavailable()

  const storage = useStorage('shares')
  const data = await storage.getItem<SharePayload>(`${id}.json`)
  return normalizeSharePayload(data)
}

async function deleteSharePayload(id: string) {
  const redis = getRedis()

  if (redis) {
    await redis.del(`share:${id}`)
    return
  }

  if (isVercel())
    storageUnavailable()

  const storage = useStorage('shares')
  await storage.removeItem(`${id}.json`)
}

export async function getShare(id: string) {
  const payload = await loadSharePayload(id)
  if (!payload || isShareExpired(payload))
    return null
  return payload
}

export async function deleteShare(id: string, userId: number) {
  const payload = await loadSharePayload(id)

  if (!payload)
    throw createError({ statusCode: 404, statusMessage: 'Share not found' })

  if (payload.userId !== userId)
    throw createError({ statusCode: 403, statusMessage: 'Forbidden' })

  await deleteSharePayload(id)
  await removeUserShare(userId, id)
}
