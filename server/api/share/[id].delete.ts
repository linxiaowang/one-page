import { assertShareId, deleteShare } from '../../utils/share'

export default defineEventHandler(async (event) => {
  const session = await requireUserSession(event)
  const id = assertShareId(getRouterParam(event, 'id'))
  await deleteShare(id, session.user.githubId)
  return { ok: true }
})
