import { getUserShares } from '../../utils/userShares'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const shares = await getUserShares(session.user.githubId)

  return {
    shares: shares.map(share => ({
      id: share.id,
      title: share.title,
      createdAt: share.createdAt,
      expiresAt: share.expiresAt,
    })),
  }
})
