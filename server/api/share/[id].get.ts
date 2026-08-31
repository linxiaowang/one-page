import { getShare } from '../../utils/share'

export default defineEventHandler(async (event) => {
  const id = getRouterParam(event, 'id')

  if (!id || !/^[a-z0-9]{12}$/i.test(id))
    throw createError({ statusCode: 400, statusMessage: 'Invalid share id' })

  const content = await getShare(id)

  if (!content)
    throw createError({ statusCode: 404, statusMessage: 'Share not found' })

  return { content }
})
