---
title: Validate in CI
description: Run the deterministic validator on every pull request and publish snapshots on merge.
section: open-source
group: Reference
order: 23
---

# Validate the map in CI

Run the deterministic validator on every pull request. Green means the map
and the code agree — a branch that plans behavior in the map merges only
after `businesslens-verify` attached the evidence:

```yaml
# .github/workflows/businesslens-validate.yml
name: Validate BusinessLens map
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

To keep the platform snapshot current, publish from the default branch with
the workspace API key stored as a repository secret:

```yaml
# .github/workflows/businesslens-publish.yml
name: Publish BusinessLens map
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

`publish --yes` is required because CI is non-interactive. Each merge commit
replaces its own snapshot if re-run and creates a new snapshot otherwise. The
CLI is installed from an empty temporary directory so target-local npm
configuration and binaries never receive the API key.
