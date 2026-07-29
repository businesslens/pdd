---
title: Validate in CI
description: Run the deterministic validator on every pull request and report Product Model Versions on merge.
section: open-source
group: Reference
order: 24
---

# Validate the model in CI

Run the deterministic validator on every pull request. Green means the model
and the code agree — a branch that plans behavior in the model merges only
after `businesslens-verify` attached the evidence:

```yaml
# .github/workflows/businesslens-validate.yml
name: Validate BusinessLens Product Model
on:
  pull_request:
jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Install BusinessLens CLI outside the target repository
        run: |
          mkdir -p "$RUNNER_TEMP/businesslens-cli"
          cd "$RUNNER_TEMP/businesslens-cli"
          npm install --ignore-scripts --no-save --package-lock=false businesslens@latest
      - run: |
          node "$RUNNER_TEMP/businesslens-cli/node_modules/businesslens/dist/cli.js" \
            --cwd "$GITHUB_WORKSPACE" validate
```

# Publish on merge

To keep the Platform's living Product Model history current, publish from the default branch with
the workspace API key stored as a repository secret:

```yaml
# .github/workflows/businesslens-publish.yml
name: Publish BusinessLens Product Model
on:
  push:
    branches: [main]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
      - name: Install BusinessLens CLI outside the target repository
        run: |
          mkdir -p "$RUNNER_TEMP/businesslens-cli"
          cd "$RUNNER_TEMP/businesslens-cli"
          npm install --ignore-scripts --no-save --package-lock=false businesslens@latest
      - run: |
          node "$RUNNER_TEMP/businesslens-cli/node_modules/businesslens/dist/cli.js" \
            --cwd "$GITHUB_WORKSPACE" publish --yes
        env:
          BUSINESSLENS_API_KEY: ${{ secrets.BUSINESSLENS_API_KEY }}
```

`publish --yes` is required because CI is non-interactive. Each successful run
reports a new immutable Product Model Version into the branch Track. A release
job may add `--tag "$TAG_NAME"` after checking out that exact tag. A
pull-request reporting job may add `--pull-request "$PR_NUMBER"` and
`--base-branch "$BASE_BRANCH"` plus optional PR title/URL metadata. The CLI is
installed from an empty temporary directory so target-local npm configuration
and binaries never receive the API key.
