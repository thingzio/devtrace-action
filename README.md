# DevTrace GitHub Action

[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-DevTrace-blue.svg)](https://github.com/marketplace/actions/devtrace)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Automatically score pull request contributors for supply-chain risk using [DevTrace](https://devtrace.thingz.io).** Posts a trust score comment on every PR and optionally blocks merges from low-trust contributors.

## Why?

Supply-chain attacks exploit contributor trust. DevTrace evaluates PR authors against 22+ signals across identity, engagement, community, and behavioral patterns — giving maintainers actionable context before code is merged.

## Quick Start

```yaml
name: DevTrace PR Check
on:
  pull_request:
    types: [opened, synchronize]

permissions:
  pull-requests: write
  checks: write        # required when using min-score

jobs:
  score:
    runs-on: ubuntu-latest
    steps:
      - uses: thingzio/devtrace-action@v1
        with:
          token: ${{ secrets.DEVTRACE_TOKEN }}
```

Get your `DEVTRACE_TOKEN` at [devtrace.thingz.io/settings](https://devtrace.thingz.io/settings) (create an API token with the `dt_` prefix), then add it as a repository secret.

## Inputs

| Input | Required | Default | Description |
|-------|----------|---------|-------------|
| `token` | Yes | — | DevTrace API token (`dt_` prefix). |
| `min-score` | No | — | Minimum score (0.0–1.0). Creates a GitHub Check Run that fails if any contributor scores below this threshold. |
| `repo` | No | Current repo | Repository context for scoring (`owner/repo`). |
| `trusted-orgs` | No | — | Comma-separated GitHub org slugs whose members receive a trust boost. |
| `api-url` | No | `https://devtrace.thingz.io` | DevTrace API base URL. |
| `github-token` | No | `${{ github.token }}` | GitHub token for posting PR comments and creating check runs. |

## Outputs

| Output | Description |
|--------|-------------|
| `score` | Numeric score (0.0–1.0) |
| `grade` | Letter grade (A+ through F) |
| `risk-summary` | One-line risk assessment |

## Examples

### Enforce a minimum score

```yaml
- uses: thingzio/devtrace-action@v1
  with:
    token: ${{ secrets.DEVTRACE_TOKEN }}
    min-score: '0.5'
```

Add **DevTrace Score** as a required status check in your branch protection rules to block merges from low-trust contributors.

### Boost scores for trusted org members

```yaml
- uses: thingzio/devtrace-action@v1
  with:
    token: ${{ secrets.DEVTRACE_TOKEN }}
    trusted-orgs: 'my-org,partner-org'
    min-score: '0.4'
```

### Use outputs in a downstream step

```yaml
- uses: thingzio/devtrace-action@v1
  id: devtrace
  with:
    token: ${{ secrets.DEVTRACE_TOKEN }}
- if: steps.devtrace.outputs.grade == 'F'
  run: echo "::warning::Low trust contributor detected"
```

## How It Works

1. Extracts the PR author and all commit authors (deduplicated)
2. Scores each contributor via the [DevTrace API](https://devtrace.thingz.io/help#api)
3. Posts (or updates) a single PR comment with scores, grades, and risk summaries
4. If `min-score` is set, creates a GitHub Check Run with pass/fail status

Bot accounts (score 0, grade F) are automatically excluded from threshold checks.

## Permissions

| Permission | When needed |
|-----------|-------------|
| `pull-requests: write` | Always — to post and update PR comments |
| `checks: write` | When `min-score` is set — to create check runs |

The `github-token` input defaults to `${{ github.token }}`, so no manual configuration is needed. Your DevTrace `token` is only used for scoring API calls.

## License

MIT
