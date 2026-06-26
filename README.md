# DevTrace GitHub Action

[![DevTrace](https://github.com/thingzio/devtrace-action/actions/workflows/devtrace.yml/badge.svg)](https://github.com/thingzio/devtrace-action/actions/workflows/devtrace.yml)
[![GitHub Marketplace](https://img.shields.io/badge/Marketplace-DevTrace_PR_Check-blue.svg)](https://github.com/marketplace/actions/devtrace-pr-check)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**Automatically score pull request contributors for supply-chain risk using [DevTrace](https://devtrace.thingz.io).** Posts a trust score comment on every PR and optionally blocks merges from low-trust contributors.

## Why?

Supply-chain attacks exploit contributor trust. DevTrace evaluates PR authors against 22+ signals across identity, engagement, community, and behavioral patterns — giving maintainers actionable context before code is merged.

## Safe by Design

**This action never checks out or runs your pull request's code.** It only reads PR metadata — the author and commit logins — and scores those usernames against the DevTrace API. There's no `actions/checkout`, no build step, and nothing from the PR diff ever runs.

That keeps the action's footprint small: it needs only `pull-requests: write` to post a comment, and your `DEVTRACE_TOKEN` is a read-only scoring token. It's also safe to use with `pull_request_target` to score [fork PRs](#score-pull-requests-from-forks), since the usual risk there comes from running untrusted code — which this action never does.

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

### Score pull requests from forks

Repository secrets — including `DEVTRACE_TOKEN` — are not available to `pull_request`-triggered runs on fork PRs, so external contributors would never get scored. Use `pull_request_target` to score them. This is safe here because the action never checks out or runs PR code (see [Safe by Design](#safe-by-design)):

```yaml
on:
  pull_request_target:
    types: [opened, synchronize]

permissions:
  contents: read
  pull-requests: write

jobs:
  score:
    runs-on: ubuntu-latest
    steps:
      - uses: thingzio/devtrace-action@v1
        with:
          token: ${{ secrets.DEVTRACE_TOKEN }}
```

> Do **not** add an `actions/checkout` step (especially not one with `ref: ${{ github.event.pull_request.head.* }}`) alongside `pull_request_target` — that is what reintroduces the pwn-request risk this action otherwise avoids.

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

For supply-chain hardening, pin the action to a full-length commit SHA (e.g. `thingzio/devtrace-action@<sha>`) rather than a tag, and let Dependabot's `github-actions` ecosystem propose updates. DevTrace PR Check is published on the GitHub Marketplace by a verified creator, so it satisfies org allowlists that require Marketplace-verified actions.

## License

MIT
