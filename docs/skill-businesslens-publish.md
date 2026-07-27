---
title: publish
description: Publish the map to the platform as a commit-pinned snapshot — only ever on explicit request.
section: open-source
group: Skills
order: 19
---

# businesslens-publish

Compiles `.businesslens/` into a portable snapshot pinned to the current
commit and submits it to the BusinessLens platform. It is the only skill
that contacts the platform, and it never runs without explicit intent — the
map is fully useful in the repository without publishing.

## When to use it

- You explicitly want the map on the platform for topology, release
  changes, and snapshot comparison (see the Platform docs section).
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

A strict preflight runs first: the map exists and validates green, the
tracked worktree is clean, `.businesslens/` is fully committed, `HEAD` is on
a named branch, and `origin` normalizes to a credential-free HTTPS URL.
Publishing then runs through a bundled isolated runner that installs the
CLI in a temporary directory — so a target-local binary or `.npmrc` can
never intercept the key — and reports the returned snapshot URL. An
interrupted publish resumes from `.businesslens/cache/analysis.json`;
re-publishing the same commit replaces that commit's snapshot.

Draft maps (`coverage: draft`) refuse to build or publish — an
unimplemented product has no evidence to show.

## Guardrails

- Never prints, echoes, logs, or writes `BUSINESSLENS_API_KEY` anywhere.
- Never publishes as a side effect of another workflow, and never edits map
  files to force validation green.
- The only writes in the target repository are the CLI's own gitignored
  `build/` and `cache/` outputs.
- Never executes target code.
