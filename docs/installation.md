---
title: Installation
description: Install the BusinessLens skills into a supported AI harness at project or global scope.
section: open-source
group: Get started
order: 2
---

# Installation

BusinessLens is installed once per repository (or once per machine) with the
`businesslens` CLI. It requires Node.js 20.12 or newer.

```bash
npx businesslens install
```

The installer detects supported AI harnesses, lets you customize the
selection, asks for project or global scope, and installs only the
BusinessLens skills. Building the Product Model happens later through those
skills.

## Supported harnesses

| Provider | Project skills directory |
| --- | --- |
| Claude Code | `.claude/skills/` |
| Codex | `.agents/skills/` |
| Cursor | `.cursor/skills/` |
| Gemini CLI | `.gemini/skills/` |
| GitHub Copilot | `.github/skills/` |

Global installs respect `CLAUDE_CONFIG_DIR` and `CODEX_HOME`; other
providers use their standard user directories.

## Project or global

- **Project** installs into the repository, so the skills travel with it and
  teammates get them on checkout.
- **Global** installs into your user directory, making the skills available
  in every repository you open.

For non-interactive installation, provider flags, and collision safety, see
[`businesslens install`](./cli-install.md). To refresh an installation, see
[`businesslens update`](./cli-update.md).

## Claude Code plugin

Claude Code users can install the same three skills as a plugin instead, by
adding this repository as a marketplace:

```text
/plugin marketplace add businesslens/pdd
/plugin install businesslens@businesslens
```

The plugin and the CLI installer deliver the same skills; use one or the other,
not both.

Next, pick your door: [From your repo](./from-your-repo.md),
[From a Blueprint](./from-a-blueprint.md), or [From an idea](./from-an-idea.md).
