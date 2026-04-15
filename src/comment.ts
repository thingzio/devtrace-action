import { ScoreResponse } from './api'

export const COMMENT_MARKER = '<!-- devtrace-score -->'

export interface AuthorResult {
  username: string
  response?: ScoreResponse
  error?: string
}

const CATEGORY_LABELS: Record<string, string> = {
  code_provenance: 'Code Provenance',
  identity: 'Identity',
  engagement: 'Engagement',
  community: 'Community',
  behavioral: 'Behavioral',
}

export function formatComment(
  results: AuthorResult[],
  apiUrl: string,
): string {
  if (results.length === 1 && results[0].response && !results[0].error) {
    return formatSingle(results[0], apiUrl)
  }
  return formatMultiple(results, apiUrl)
}

function formatSingle(result: AuthorResult, apiUrl: string): string {
  const r = result.response!
  const lines: string[] = [
    COMMENT_MARKER,
    `### DevTrace: ${r.username} — ${r.score.grade} (${r.score.value.toFixed(2)})`,
  ]

  if (r.risk_summary) {
    lines.push(`> ${r.risk_summary}`)
  }

  const details = categoryTable(r)
  if (details) {
    lines.push('', '<details><summary>Score breakdown</summary>', '', details, '', '</details>')
  }

  lines.push(
    '',
    `<sub>Scored by [DevTrace](${apiUrl}) · [view full scorecard](${apiUrl}/score/${r.username})</sub>`,
  )

  return lines.join('\n')
}

function formatMultiple(results: AuthorResult[], apiUrl: string): string {
  const lines: string[] = [
    COMMENT_MARKER,
    '### DevTrace PR Check',
    '',
    '| Contributor | Grade | Score | Risk Summary |',
    '|------------|-------|-------|--------------|',
  ]

  for (const r of results) {
    if (r.error) {
      lines.push(`| ${r.username} | — | — | ${r.error} |`)
    } else {
      const s = r.response!
      const link = `[${s.username}](${apiUrl}/score/${s.username})`
      const summary = truncate(s.risk_summary ?? '', 60)
      lines.push(`| ${link} | ${s.score.grade} | ${s.score.value.toFixed(2)} | ${summary} |`)
    }
  }

  for (const r of results) {
    if (r.response?.score.categories) {
      const details = categoryTable(r.response)
      if (details) {
        lines.push('', `<details><summary>Details: ${r.response.username}</summary>`, '', details, '', '</details>')
      }
    }
  }

  lines.push('', `<sub>Scored by [DevTrace](${apiUrl})</sub>`)

  return lines.join('\n')
}

function categoryTable(r: ScoreResponse): string | null {
  const cats = r.score.categories
  if (!cats || Object.keys(cats).length === 0) return null

  const rows = Object.entries(cats).map(([key, val]) => {
    const label = CATEGORY_LABELS[key] ?? key
    return `| ${label} | ${val.toFixed(2)} |`
  })

  return ['| Category | Score |', '|----------|-------|', ...rows].join('\n')
}

function truncate(s: string, max: number): string {
  if (s.length <= max) return s
  return s.slice(0, max - 3) + '...'
}
