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

## 2. Get a Product Model

**Existing product** — build it from the code:

```text
/businesslens-init
```

(Codex users invoke skills as `$businesslens-init`.)

**Blank repository** — plan the product first:

```text
/businesslens-plan
```

The skill interviews you and authors the whole product as a draft model — no
code, no evidence yet, validation green with warnings.

Either way, review the diff like any pull request, then:

```bash
npx businesslens@latest validate
git add .businesslens AGENTS.md
git commit -m "docs: add BusinessLens product model"
```

## 3. The loop for every feature

```text
/businesslens-plan add guest checkout     # model describes intended behavior
… implement with your coding agent …
/businesslens-verify                      # evidence attached, gaps reported
npx businesslens@latest validate          # green = done
```

`validate` failing in between is not a problem: its missing-evidence errors
identify new journeys and scenarios that still need proof. The verifier also
checks changed and deleted work from the complete model diff.

## 4. Keep it honest

- Gate every pull request with the validator — see [Validate in CI](./ci.md).
- If code changed without a plan, repair the model with `/businesslens-sync` —
  see [Recover from drift](./tutorial-recover-from-drift.md).

## Optional: the platform

The model is fully useful on its own. When you want hosted evolution,
topology, and comparison across your workspace, report immutable Product Model
Versions with `/businesslens-publish`. Blueprint creation and public
publication are separate Platform actions. To start from a Hub Blueprint, run
`npx businesslens@latest login`, then
`npx businesslens@latest pull <blueprint-name>`; add `--version N` only when
an exact immutable version is required. The CLI retrieves and expands the
Product Report without asking the user to download it. The `build`, `open`,
`pull`, and `publish` commands are in the
[CLI reference](./cli.md).
