---
title: Validate in CI
description: Run the deterministic validator on every pull request and publish snapshots on merge.
order: 6
---

# Validate the map in CI

Run the deterministic validator on every pull request:

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
      - run: npx businesslens@latest validate
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
      - run: npx businesslens@latest publish --yes
        env:
          BUSINESSLENS_API_KEY: ${{ secrets.BUSINESSLENS_API_KEY }}
```

`publish --yes` is required because CI is non-interactive. Each merge commit
replaces its own snapshot if re-run and creates a new snapshot otherwise.
