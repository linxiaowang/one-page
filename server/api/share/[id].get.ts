import { assertShareId, getShare } from '../../utils/share'

export default defineEventHandler(async (event) => {
  const id = assertShareId(getRouterParam(event, 'id'))

  const data = await getShare(id)

  if (!data)
    throw createError({ statusCode: 404, statusMessage: 'Share not found' })

  const { userId: _userId, ...publicData } = data
  return publicData
})
