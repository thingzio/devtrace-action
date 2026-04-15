import { fetchScore, ScoreResponse, APIError } from '../src/api'

const mockFetch = jest.fn()
global.fetch = mockFetch

beforeEach(() => {
  mockFetch.mockReset()
})

const baseOpts = {
  apiUrl: 'https://devtrace.thingz.io',
  token: 'dt_abc123',
  repo: 'owner/repo',
  trustedOrgs: '',
}

function mockResponse(status: number, body: object): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    json: async () => body,
  } as Response
}

describe('fetchScore', () => {
  test('returns score response on 200', async () => {
    const body: ScoreResponse = {
      version: 'v0.6.3',
      username: 'octocat',
      provider: 'github',
      score: { grade: 'B+', value: 0.78, categories: { identity: 0.19 } },
      risk_summary: 'Established contributor.',
      scored_at: '2026-04-15T10:00:00Z',
    }
    mockFetch.mockResolvedValueOnce(mockResponse(200, body))

    const result = await fetchScore('octocat', baseOpts)
    expect(result.score.grade).toBe('B+')
    expect(result.score.value).toBe(0.78)
    expect(result.risk_summary).toBe('Established contributor.')

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toBe(
      'https://devtrace.thingz.io/api/v1/score/octocat?repo=owner%2Frepo'
    )
    const headers = mockFetch.mock.calls[0][1].headers
    expect(headers['Authorization']).toBe('Bearer dt_abc123')
  })

  test('appends trusted_orgs to query string', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(200, {
        version: 'v0.6.3',
        username: 'octocat',
        provider: 'github',
        score: { grade: 'B+', value: 0.78 },
        scored_at: '2026-04-15T10:00:00Z',
      })
    )

    await fetchScore('octocat', { ...baseOpts, trustedOrgs: 'org1,org2' })

    const url = mockFetch.mock.calls[0][0] as string
    expect(url).toContain('trusted_orgs=org1')
    expect(url).toContain('trusted_orgs=org2')
  })

  test('throws APIError on 401', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(401, { error: 'invalid api token' })
    )

    await expect(fetchScore('octocat', baseOpts)).rejects.toThrow(APIError)
  })

  test('throws APIError on 429', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(429, { error: 'rate limited' })
    )

    try {
      await fetchScore('octocat', baseOpts)
      fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(APIError)
      expect((e as APIError).status).toBe(429)
    }
  })

  test('throws APIError on 500', async () => {
    mockFetch.mockResolvedValueOnce(
      mockResponse(500, { error: 'internal' })
    )

    try {
      await fetchScore('octocat', baseOpts)
      fail('should have thrown')
    } catch (e) {
      expect(e).toBeInstanceOf(APIError)
      expect((e as APIError).status).toBe(500)
    }
  })

  test('throws on network timeout', async () => {
    mockFetch.mockRejectedValueOnce(new Error('network timeout'))

    await expect(fetchScore('octocat', baseOpts)).rejects.toThrow(
      'network timeout'
    )
  })
})
