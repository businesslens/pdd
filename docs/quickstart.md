---
title: Quickstart
description: Install the skills, build the map in your AI harness, review, and commit.
order: 2
---

# Quickstart

Requires Node.js 20.12 or newer.

## 1. Install the skills

Run this in the repository you want to map:

```bash
npx businesslens@latest install
```

The installer detects supported AI harnesses (Claude Code, Codex, Cursor,
Gemini CLI, GitHub Copilot), lets you customize the selection, asks for
project or global scope, and installs only the BusinessLens skills.

Non-interactive setup:

```bash
npx businesslens@latest install \
  --providers claude,codex \
  --scope project \
  --yes
```

## 2. Build the map

Invoke the initialization skill in your AI harness:

```text
/businesslens-init
```

Codex users invoke the same skill as `$businesslens-init`. The skill inspects
the repository without executing its code, authors the full map, installs the
managed `AGENTS.md` guidance, and validates the result.

## 3. Review and commit

```bash
npx businesslens@latest validate
git add .businesslens AGENTS.md
git commit -m "docs: add BusinessLens product map"
```

Review the map like any other change: the entities are Markdown, and every
claim carries `codeRefs` your reviewers can open.

## 4. Keep it current

After behavior changes, invoke `businesslens-sync` in your harness, then
validate. Add the deterministic validator to every pull request —
see [Validate in CI](./ci.md).

## Optional: publish to the platform

```text
/businesslens-publish
```

Publishing submits a snapshot pinned to the current commit for topology,
release changes, and snapshot comparison. The map is fully useful without it —
see the [CLI reference](./cli.md) for `build` and `publish` details. The skill
checks for `BUSINESSLENS_API_KEY` and runs the CLI outside the target
repository so local npm configuration and binaries cannot receive the key.
