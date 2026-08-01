---
title: Validate in CI
description: Run the deterministic validator on every pull request.
section: open-source
group: Reference
order: 34
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
        with:
          # Optional. `validate` also reports which files moved on this branch
          # against the default one, and needs history to work that out.
          # Without it the check still runs and gates exactly the same; you
          # just lose that part of the output.
          fetch-depth: 0
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

# Contributing a Blueprint

There is nothing to publish from CI. A Product Model is useful in its own
repository, and the public catalog is curated by pull request rather than
pushed to.

To propose your model as a catalog Blueprint, run it from a workstation where
the [GitHub CLI](https://cli.github.com) is authenticated as you:

```bash
gh auth login
npx businesslens@latest blueprint contribute --slug my-blueprint
```

See [Contributing a Blueprint](./contributing-blueprints.md).

This is deliberately a human action. The pull request is public, carries your
product model, and is opened under your GitHub identity — none of which should
happen automatically on a push.

