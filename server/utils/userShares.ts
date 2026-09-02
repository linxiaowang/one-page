import { getRedis, isVercel, storageUnavailable } from './kv'

export interface UserShareEntry {
  id: string
  title: string
  createdAt: number
  expiresAt: number
}

const MAX_USER_SHARES = 100

function userSharesKey(userId: number) {
  return `user-shares:${userId}`
}

function normalizeUserShares(raw: unknown): UserShareEntry[] {
  if (!Array.isArray(raw))
    return []

  return raw.filter((item): item is UserShareEntry => {
    return typeof item === 'object'
      && item !== null
      && typeof item.id === 'string'
      && typeof item.title === 'string'
      && typeof item.createdAt === 'number'
      && typeof item.expiresAt === 'number'
  })
}

function pruneUserShares(entries: UserShareEntry[]) {
  const now = Date.now()
  return entries
    .filter(entry => entry.expiresAt > now)
    .sort((left, right) => right.createdAt - left.createdAt)
    .slice(0, MAX_USER_SHARES)
}

export async function indexUserShare(userId: number, entry: UserShareEntry) {
  const redis = getRedis()

  if (redis) {
    const raw = await redis.get(userSharesKey(userId))
    const current = normalizeUserShares(typeof raw === 'string' ? JSON.parse(raw) : raw)
    const next = pruneUserShares([
      entry,
      ...current.filter(item => item.id !== entry.id),
    ])
    await redis.set(userSharesKey(userId), JSON.stringify(next))
    return
  }

  if (isVercel())
    storageUnavailable()

  const storage = useStorage('user-shares')
  const current = normalizeUserShares(await storage.getItem(`${userId}.json`))
  const next = pruneUserShares([
    entry,
    ...current.filter(item => item.id !== entry.id),
  ])
  await storage.setItem(`${userId}.json`, next)
}

export async function getUserShares(userId: number) {
  const redis = getRedis()

  if (redis) {
    const raw = await redis.get(userSharesKey(userId))
    return pruneUserShares(normalizeUserShares(typeof raw === 'string' ? JSON.parse(raw) : raw))
  }

  if (isVercel())
    storageUnavailable()

  const storage = useStorage('user-shares')
  return pruneUserShares(normalizeUserShares(await storage.getItem(`${userId}.json`)))
}
