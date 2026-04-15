import { formatComment, COMMENT_MARKER } from '../src/comment'
import { ScoreResponse } from '../src/api'

function makeScore(overrides: Partial<ScoreResponse> = {}): ScoreResponse {
  return {
    version: 'v0.6.3',
    username: 'octocat',
    provider: 'github',
    score: {
      grade: 'B+',
      value: 0.78,
      categories: {
        code_provenance: 0.15,
        identity: 0.19,
        engagement: 0.09,
        community: 0.15,
        behavioral: 0.20,
      },
    },
    risk_summary: 'Established contributor with consistent activity history.',
    scored_at: '2026-04-15T10:00:00Z',
    ...overrides,
  }
}

describe('formatComment', () => {
  test('single author renders inline header', () => {
    const result = formatComment(
      [{ username: 'octocat', response: makeScore() }],
      'https://devtrace.thingz.io',
    )

    expect(result).toContain(COMMENT_MARKER)
    expect(result).toContain('### DevTrace: octocat — B+ (0.78)')
    expect(result).toContain('Established contributor')
    expect(result).toContain('<details>')
    expect(result).toContain('| Identity | 0.19 |')
    expect(result).toContain('https://devtrace.thingz.io/score/octocat')
  })

  test('multiple authors render summary table', () => {
    const results = [
      { username: 'octocat', response: makeScore() },
      {
        username: 'newdev',
        response: makeScore({
          username: 'newdev',
          score: { grade: 'D', value: 0.32, categories: { identity: 0.05 } },
          risk_summary: 'Limited history.',
        }),
      },
    ]

    const result = formatComment(results, 'https://devtrace.thingz.io')

    expect(result).toContain(COMMENT_MARKER)
    expect(result).toContain('### DevTrace PR Check')
    expect(result).toContain('| [octocat]')
    expect(result).toContain('| [newdev]')
    expect(result).toContain('<details><summary>Details: octocat</summary>')
    expect(result).toContain('<details><summary>Details: newdev</summary>')
  })

  test('author with no categories omits details section', () => {
    const score = makeScore()
    score.score.categories = undefined

    const result = formatComment(
      [{ username: 'octocat', response: score }],
      'https://devtrace.thingz.io',
    )

    expect(result).not.toContain('<details>')
  })

  test('failed author renders error row', () => {
    const results = [
      { username: 'octocat', response: makeScore() },
      { username: 'unknown', error: 'No score available' },
    ]

    const result = formatComment(results, 'https://devtrace.thingz.io')

    expect(result).toContain('unknown')
    expect(result).toContain('No score available')
  })
})
