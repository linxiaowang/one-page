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

async function readUserShares(userId: number) {
  const redis = getRedis()

  if (redis) {
    const raw = await redis.get(userSharesKey(userId))
    return normalizeUserShares(typeof raw === 'string' ? JSON.parse(raw) : raw)
  }

  if (isVercel())
    storageUnavailable()

  const storage = useStorage('user-shares')
  return normalizeUserShares(await storage.getItem(`${userId}.json`))
}

async function writeUserShares(userId: number, entries: UserShareEntry[]) {
  const redis = getRedis()

  if (redis) {
    await redis.set(userSharesKey(userId), JSON.stringify(entries))
    return
  }

  if (isVercel())
    storageUnavailable()

  const storage = useStorage('user-shares')
  await storage.setItem(`${userId}.json`, entries)
}

export async function indexUserShare(userId: number, entry: UserShareEntry) {
  const current = await readUserShares(userId)
  const next = pruneUserShares([
    entry,
    ...current.filter(item => item.id !== entry.id),
  ])
  await writeUserShares(userId, next)
}

export async function getUserShares(userId: number) {
  return pruneUserShares(await readUserShares(userId))
}

export async function removeUserShare(userId: number, shareId: string) {
  const current = await readUserShares(userId)
  const next = current.filter(item => item.id !== shareId)
  if (next.length === current.length)
    return false

  await writeUserShares(userId, next)
  return true
}
