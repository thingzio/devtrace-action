import * as core from '@actions/core'
import * as github from '@actions/github'
import { fetchScore, APIError } from './api'
import { formatComment, AuthorResult, COMMENT_MARKER } from './comment'
import { evaluateThreshold } from './check'

async function run(): Promise<void> {
  try {
    const token = core.getInput('token', { required: true })
    const apiUrl = core.getInput('api-url')
    const repo = core.getInput('repo')
    const trustedOrgs = core.getInput('trusted-orgs')
    const minScoreRaw = core.getInput('min-score')

    // Validate min-score if provided
    let minScore: number | undefined
    if (minScoreRaw) {
      minScore = parseFloat(minScoreRaw)
      if (isNaN(minScore) || minScore < 0 || minScore > 1) {
        core.setFailed('min-score must be between 0.0 and 1.0')
        return
      }
    }

    const context = github.context
    if (!context.payload.pull_request) {
      core.setFailed('This action only runs on pull_request events')
      return
    }

    const prNumber = context.payload.pull_request.number
    const ghToken = process.env.GITHUB_TOKEN ?? ''
    const octokit = github.getOctokit(ghToken)

    // Get unique commit authors for this PR
    const authors = await getAuthors(octokit, context, prNumber)
    if (authors.length === 0) {
      core.warning('No commit authors found on this PR')
      return
    }

    core.info(`Scoring ${authors.length} author(s): ${authors.join(', ')}`)

    // Score each author
    const results: AuthorResult[] = []
    const opts = { apiUrl, token, repo, trustedOrgs }

    for (const username of authors) {
      try {
        const response = await fetchScore(username, opts)
        results.push({ username, response })
      } catch (err) {
        if (err instanceof APIError && err.status === 401) {
          core.setFailed('Invalid DevTrace token')
          return
        }
        const msg =
          err instanceof APIError
            ? `API error ${err.status}`
            : 'No score available'
        core.warning(`Failed to score ${username}: ${msg}`)
        results.push({ username, error: msg })
      }
    }

    // Set outputs from first successful result
    const first = results.find((r) => r.response)
    if (first?.response) {
      core.setOutput('score', first.response.score.value.toString())
      core.setOutput('grade', first.response.score.grade)
      core.setOutput('risk-summary', first.response.risk_summary ?? '')
    }

    // Post or update PR comment
    const body = formatComment(results, apiUrl)
    await upsertComment(octokit, context, prNumber, body)

    // Create check run if min-score is set
    if (minScore !== undefined) {
      const check = evaluateThreshold(results, minScore)
      await createCheckRun(octokit, context, check)

      if (check.conclusion === 'failure') {
        core.setFailed(check.title)
      }
    }
  } catch (err) {
    core.setFailed(err instanceof Error ? err.message : String(err))
  }
}

async function getAuthors(
  octokit: ReturnType<typeof github.getOctokit>,
  context: typeof github.context,
  prNumber: number,
): Promise<string[]> {
  const commits = await octokit.rest.pulls.listCommits({
    owner: context.repo.owner,
    repo: context.repo.repo,
    pull_number: prNumber,
    per_page: 100,
  })

  const authors = new Set<string>()
  for (const commit of commits.data) {
    const login = commit.author?.login
    if (login) {
      authors.add(login)
    }
  }
  return [...authors]
}

async function upsertComment(
  octokit: ReturnType<typeof github.getOctokit>,
  context: typeof github.context,
  prNumber: number,
  body: string,
): Promise<void> {
  const { owner, repo } = context.repo

  // Find existing comment
  const comments = await octokit.rest.issues.listComments({
    owner,
    repo,
    issue_number: prNumber,
    per_page: 100,
  })

  const existing = comments.data.find((c) =>
    c.body?.includes(COMMENT_MARKER),
  )

  if (existing) {
    await octokit.rest.issues.updateComment({
      owner,
      repo,
      comment_id: existing.id,
      body,
    })
    core.info(`Updated existing comment #${existing.id}`)
  } else {
    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    })
    core.info('Created new PR comment')
  }
}

async function createCheckRun(
  octokit: ReturnType<typeof github.getOctokit>,
  context: typeof github.context,
  check: { conclusion: string; title: string; summary: string },
): Promise<void> {
  await octokit.rest.checks.create({
    owner: context.repo.owner,
    repo: context.repo.repo,
    name: 'DevTrace Score',
    head_sha: context.sha,
    status: 'completed',
    conclusion: check.conclusion as 'success' | 'failure' | 'neutral',
    output: {
      title: check.title,
      summary: check.summary,
    },
  })
  core.info(`Created check run: ${check.conclusion} — ${check.title}`)
}

run()
