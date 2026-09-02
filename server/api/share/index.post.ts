import { assertShareContent, assertShareFont, saveShare } from '../../utils/share'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const content = assertShareContent(body?.content)
  const font = assertShareFont(body?.font)
  const session = await getUserSession(event)
  const userId = session.user?.githubId
  const id = await saveShare(content, font, userId)
  return { id }
})
