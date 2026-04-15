import { evaluateThreshold, CheckResult } from '../src/check'
import { AuthorResult } from '../src/comment'

function makeResult(
  username: string,
  grade: string,
  value: number,
): AuthorResult {
  return {
    username,
    response: {
      version: 'v0.6.3',
      username,
      provider: 'github',
      score: { grade, value },
      scored_at: '2026-04-15T10:00:00Z',
    },
  }
}

describe('evaluateThreshold', () => {
  test('all authors above threshold → success', () => {
    const results = [makeResult('octocat', 'B+', 0.78)]
    const check = evaluateThreshold(results, 0.5)

    expect(check.conclusion).toBe('success')
    expect(check.title).toContain('All contributors meet')
  })

  test('one author below threshold → failure', () => {
    const results = [
      makeResult('octocat', 'B+', 0.78),
      makeResult('newdev', 'D', 0.32),
    ]
    const check = evaluateThreshold(results, 0.5)

    expect(check.conclusion).toBe('failure')
    expect(check.title).toContain('1 contributor below')
    expect(check.summary).toContain('newdev')
  })

  test('bot authors (score 0) excluded from threshold', () => {
    const results = [
      makeResult('octocat', 'B+', 0.78),
      makeResult('dependabot[bot]', 'F', 0.0),
    ]
    const check = evaluateThreshold(results, 0.5)

    expect(check.conclusion).toBe('success')
    expect(check.summary).toContain('bot')
  })

  test('all bots → neutral', () => {
    const results = [makeResult('dependabot[bot]', 'F', 0.0)]
    const check = evaluateThreshold(results, 0.5)

    expect(check.conclusion).toBe('neutral')
  })

  test('authors with errors excluded from threshold', () => {
    const results = [
      makeResult('octocat', 'B+', 0.78),
      { username: 'unknown', error: 'No score available' },
    ]
    const check = evaluateThreshold(results, 0.5)

    expect(check.conclusion).toBe('success')
    expect(check.summary).toContain('unknown')
  })
})
