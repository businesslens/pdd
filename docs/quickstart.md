---
title: Quickstart
description: Install the skills, pick your entry — map existing code or plan a new product — then run the plan → implement → verify loop.
section: open-source
group: Get started
order: 3
---

# Quickstart

## 1. Install the skills

Run this in the repository (Node.js 20.12+):

```bash
npx businesslens@latest install
```

The installer detects your AI harnesses and installs only the BusinessLens
skills — providers, scopes, and non-interactive setup are covered in
[Installation](./installation.md).

## 2. Get a map

**Existing product** — build it from the code:

```text
/businesslens-init
```

(Codex users invoke skills as `$businesslens-init`.)

**Blank repository** — plan the product first:

```text
/businesslens-plan
```

The skill interviews you and authors the whole product as a draft map — no
code, no evidence yet, validation green with warnings.

Either way, review the diff like any pull request, then:

```bash
npx businesslens@latest validate
git add .businesslens AGENTS.md
git commit -m "docs: add BusinessLens product map"
```

## 3. The loop for every feature

```text
/businesslens-plan add guest checkout     # map describes intended behavior
… implement with your coding agent …
/businesslens-verify                      # evidence attached, gaps reported
npx businesslens@latest validate          # green = done
```

`validate` failing in between is not a problem: its missing-evidence errors
identify new journeys and scenarios that still need proof. The verifier also
checks changed and deleted work from the complete map diff.

## 4. Keep it honest

- Gate every pull request with the validator — see [Validate in CI](./ci.md).
- If code changed without a plan, repair the map with `/businesslens-sync` —
  see [Recover from drift](./tutorial-recover-from-drift.md).

## Optional: the platform

The map is fully useful on its own. When you want hosted topology, release
changes, and snapshot comparison across your workspace, publish
commit-pinned snapshots with `/businesslens-publish` — setup, snapshots,
and workspaces are covered in the **Platform** section of the docs. The
`build` and `publish` commands themselves are in the
[CLI reference](./cli.md).
