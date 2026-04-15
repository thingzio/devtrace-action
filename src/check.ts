import { AuthorResult } from './comment'

export interface CheckResult {
  conclusion: 'success' | 'failure' | 'neutral'
  title: string
  summary: string
}

export function evaluateThreshold(
  results: AuthorResult[],
  minScore: number,
): CheckResult {
  const lines: string[] = []
  const failing: string[] = []
  let hasNonBot = false

  for (const r of results) {
    if (r.error) {
      lines.push(`⚠️ ${r.username}: ${r.error} (skipped)`)
      continue
    }

    const s = r.response!
    const isBot = s.score.value === 0 && s.score.grade === 'F'

    if (isBot) {
      lines.push(`⊘ ${s.username}: bot (skipped)`)
      continue
    }

    hasNonBot = true

    if (s.score.value >= minScore) {
      lines.push(`✅ ${s.username}: ${s.score.grade} (${s.score.value.toFixed(2)})`)
    } else {
      lines.push(
        `❌ ${s.username}: ${s.score.grade} (${s.score.value.toFixed(2)}) — below threshold ${minScore.toFixed(2)}`,
      )
      failing.push(s.username)
    }
  }

  const summary = lines.join('\n')

  if (!hasNonBot) {
    return {
      conclusion: 'neutral',
      title: 'All PR authors are bots — threshold check skipped',
      summary,
    }
  }

  if (failing.length > 0) {
    return {
      conclusion: 'failure',
      title: `${failing.length} contributor${failing.length > 1 ? 's' : ''} below minimum score (${minScore.toFixed(2)})`,
      summary,
    }
  }

  return {
    conclusion: 'success',
    title: `All contributors meet minimum score (${minScore.toFixed(2)})`,
    summary,
  }
}
