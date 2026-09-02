export default defineOAuthGitHubEventHandler({
  async onSuccess(event, { user }) {
    await setUserSession(event, {
      user: {
        githubId: user.id,
        login: user.login,
        name: user.name,
        avatar: user.avatar_url,
      },
    })

    return sendRedirect(event, '/shares')
  },
  onError(event, error) {
    console.error('GitHub OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
