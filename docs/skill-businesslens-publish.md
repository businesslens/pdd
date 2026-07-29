---
title: publish
description: Report the model to the Platform as an immutable Product Model Version — only ever on explicit request.
section: open-source
group: Skills
order: 20
---

# businesslens-publish

Compiles `.businesslens/` into a source-free Product Report, pairs it with
separate current-commit provenance, and submits it as an immutable Product
Model Version. It is the only skill
that contacts the platform, and it never runs without explicit intent — the
model is fully useful in the repository without publishing.

## When to use it

- You explicitly want the model on the platform for topology, release
  changes, and version comparison (see the Platform docs section).
- For automatic publishing on merge, use the CI recipe in
  [Validate in CI](./ci.md) instead of running this by hand.

## Invocation

```text
/businesslens-publish
```

Requires a workspace API key exported as `BUSINESSLENS_API_KEY` (created on
the platform under Workspace Settings → API keys). The skill checks only
that the key is *present* — it never asks for, prints, or logs its value.

## How it works

A strict preflight runs first: the model exists and validates green, the
tracked worktree is clean, `.businesslens/` is fully committed, and `origin`
normalizes to a credential-free HTTPS URL. Branch and PR publishing require a
named source branch; tag publishing also accepts a detached checkout when the
named tag points at `HEAD`.
Publishing then runs through a bundled isolated runner that installs the
CLI in a temporary directory — so a target-local binary or `.npmrc` can
never intercept the key — and reports the returned version URL. Ordinary
publishes target the current branch Track. `--tag` targets an exact tag at
HEAD, while `--pull-request` plus `--base-branch` targets a PR Track. Every
publish reports a new immutable Version into the selected Track; a failed
publish is safe to simply re-run.

Draft models may be reported as private planned Product Model Versions.
Blueprint creation and public Hub visibility are separate Platform actions,
not side effects of this skill.

## Guardrails

- Never prints, echoes, logs, or writes `BUSINESSLENS_API_KEY` anywhere.
- Never publishes as a side effect of another workflow, and never edits model
  files to force validation green.
- The only writes in the target repository are the CLI's own gitignored
  `build/` and `cache/` outputs.
- Never executes target code.
