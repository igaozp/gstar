export interface GithubRepo {
  id: number
  full_name: string
  owner: { login: string }
  name: string
  description: string | null
  homepage: string | null
  language: string | null
  topics: string[]
  stargazers_count: number
  forks_count: number
  archived: boolean
  fork: boolean
  html_url: string
}

export interface StarredRepo {
  repo: GithubRepo
  starred_at: string
}
