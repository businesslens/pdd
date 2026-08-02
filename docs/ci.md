---
title: Validate in CI
description: Run the deterministic validator on every pull request, so a branch that plans behavior merges only once the evidence is attached.
section: open-source
group: Integration
order: 19
---

# Validate the model in CI

`validate` is deterministic and needs no agent, which makes it the one part of
BusinessLens that belongs in CI. Green means the model and the code agree — a
branch that plans behavior in the model merges only after
`businesslens-sync` attached the evidence.

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

The CLI is installed **outside** the repository under test so it never appears
in the tree it is validating.

## What gates the build

Only errors. Exit codes are `0` when there are no errors (warnings may remain),
`1` for validation failure, and `2` for invalid usage. `--json` output is
stable, so anything downstream can parse it.

The warning that stays green on purpose is the draft rule: a planned greenfield
model reports missing evidence as warnings rather than errors. See
[Evidence & coverage](./evidence.md#the-draft-rule).

## What CI cannot catch

**A model can be perfectly valid while the code has moved out from under it.**
Validation checks the model against the format contract and checks that every
`codeRef` points at a tracked file. It cannot tell whether a scenario still
describes what the code actually does — that drift is semantic, and no rule can
see it.

That is what `/businesslens-sync` is for, and why it runs on a workstation
rather than in CI.

## There is nothing to publish from CI

A Product Model is useful in its own repository, and the public catalog is
curated by pull request rather than pushed to.

To propose your model as a catalog Blueprint, run it from a workstation where
the [GitHub CLI](https://cli.github.com) is authenticated as you:

```bash
gh auth login
npx businesslens@latest blueprint contribute --slug my-blueprint
```

This is deliberately a human action. The pull request is public, carries your
product model, and is opened under your GitHub identity — none of which should
happen automatically on a push. See
[`blueprint contribute`](./cli-contribute.md).
