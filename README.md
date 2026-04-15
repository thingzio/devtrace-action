# DevTrace GitHub Action

Score PR contributor trustworthiness using [DevTrace](https://devtrace.thingz.io). Posts a trust score comment on pull requests and optionally enforces a minimum score threshold.

## Quick Start

```yaml
name: DevTrace PR Check
on:
  pull_request:
    types: [opened, synchronize]

permissions:
  pull-requests: write

jobs:
  score:
    runs-on: ubuntu-latest
    steps:
      - uses: thingzio/devtrace-action@v1
        with:
          token: ${{ secrets.DEVTRACE_TOKEN }}
```

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `token` | Yes | — | DevTrace API token (`dt_` prefix). Get one at [devtrace.thingz.io](https://devtrace.thingz.io). |
| `min-score` | No | — | Minimum score (0.0-1.0). Enables a GitHub Check Run that fails if any contributor scores below threshold. |
| `repo` | No | Current repo | Repository context for scoring (`owner/repo`). |
| `trusted-orgs` | No | — | Comma-separated GitHub org slugs to mark as trusted. |
| `api-url` | No | `https://devtrace.thingz.io` | DevTrace API base URL. |
| `github-token` | No | `${{ github.token }}` | GitHub token for PR comments and check runs. |

## Outputs

| Output | Description |
|--------|-------------|
| `score` | Numeric score (0.0-1.0) |
| `grade` | Letter grade (A+ through F) |
| `risk-summary` | Risk summary text |

## Examples

### Enforce minimum score

```yaml
- uses: thingzio/devtrace-action@v1
  with:
    token: ${{ secrets.DEVTRACE_TOKEN }}
    min-score: '0.5'
```

Add `DevTrace Score` as a required check in your branch protection settings to block merges from low-trust contributors.

### With trusted organizations

```yaml
- uses: thingzio/devtrace-action@v1
  with:
    token: ${{ secrets.DEVTRACE_TOKEN }}
    trusted-orgs: 'my-org,partner-org'
    min-score: '0.4'
```

### Use outputs in downstream steps

```yaml
- uses: thingzio/devtrace-action@v1
  id: devtrace
  env:
    GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
  with:
    token: ${{ secrets.DEVTRACE_TOKEN }}
- if: steps.devtrace.outputs.grade == 'F'
  run: echo "::warning::Low trust contributor"
```

## How It Works

1. Extracts the PR opener and all commit authors from the pull request
2. Scores each author via the [DevTrace API](https://devtrace.thingz.io)
3. Posts (or updates) a single PR comment with scores and risk summaries
4. If `min-score` is set, creates a GitHub Check Run with pass/fail status

Bot authors (score 0, grade F) are automatically excluded from threshold checks.

## Permissions

| Permission | When |
|-----------|------|
| `pull-requests: write` | Always (to post comments) |
| `checks: write` | When `min-score` is set (to create check runs) |

The `github-token` input defaults to `${{ github.token }}` — no manual configuration needed. Your DevTrace `token` is used for scoring API calls.

## License

Apache-2.0
