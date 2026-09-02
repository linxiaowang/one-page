declare module '#auth-utils' {
  interface User {
    githubId: number
    login: string
    name?: string | null
    avatar?: string
  }
}

export {}
