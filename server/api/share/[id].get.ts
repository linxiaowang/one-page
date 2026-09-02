import { getShare } from '../../utils/share'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || !/^[a-z0-9]{12}$/i.test(id))
    throw createError({ statusCode: 400, statusMessage: 'Invalid share id' })

  const data = await getShare(id)

  if (!data)
    throw createError({ statusCode: 404, statusMessage: 'Share not found' })

  const { userId: _userId, ...publicData } = data
  return publicData
})
