import { assertShareContent, saveShare } from '../../utils/share'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const content = assertShareContent(body?.content)
  const id = await saveShare(content)
  return { id }
})
