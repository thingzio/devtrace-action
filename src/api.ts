export interface ScoreResponse {
  version: string
  username: string
  provider: string
  score: {
    grade: string
    value: number
    categories?: Record<string, number>
  }
  signals?: Record<string, unknown>
  risk_summary?: string
  repo_context?: {
    repo: string
    commits: number
    total_commits: number
    total_contributors: number
    last_commit_days?: number
    org_member: boolean
    commits_verified: boolean
    author_association?: string
    trusted_org_member?: boolean
  }
  behavior?: Record<string, unknown>
  scored_at: string
  cached_at?: string
  detail?: string
}

export class APIError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(`DevTrace API error ${status}: ${message}`)
    this.name = 'APIError'
  }
}

export interface FetchScoreOpts {
  apiUrl: string
  token: string
  repo: string
  trustedOrgs: string
}

export async function fetchScore(
  username: string,
  opts: FetchScoreOpts,
): Promise<ScoreResponse> {
  const url = buildURL(username, opts)

  const resp = await fetch(url, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${opts.token}`,
      Accept: 'application/json',
    },
    signal: AbortSignal.timeout(30_000),
  })

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}))
    throw new APIError(resp.status, (body as Record<string, string>).error ?? resp.statusText)
  }

  return (await resp.json()) as ScoreResponse
}

function buildURL(username: string, opts: FetchScoreOpts): string {
  const base = `${opts.apiUrl}/api/v1/score/${encodeURIComponent(username)}`
  const params = new URLSearchParams()

  if (opts.repo) {
    params.set('repo', opts.repo)
  }

  if (opts.trustedOrgs) {
    for (const org of opts.trustedOrgs.split(',')) {
      const trimmed = org.trim()
      if (trimmed) {
        params.append('trusted_orgs', trimmed)
      }
    }
  }

  const qs = params.toString()
  return qs ? `${base}?${qs}` : base
}
