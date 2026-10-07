---
title: Installation
description: Install the BusinessLens skills into your coding agent at project or global scope.
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

The installer detects the coding agents you use (Claude Code, Codex, Cursor and
others), lets you customize the
selection, asks for project or global scope, and installs only the
BusinessLens skills. It never creates `.businesslens/`; the skills do that.

| Skill | What it does |
| --- | --- |
| [`businesslens-map`](./skill-businesslens-map.md) | Reads an existing repository and drafts its Product Model |
| [`businesslens-ideate`](./skill-businesslens-ideate.md) | Turns an idea or a change into an approved model change |
| [`businesslens-verify`](./skill-businesslens-verify.md) | Implements the model in phases, checks the code against it, and resolves what disagrees |

They run inside your coding agent, not in the terminal. Usually you just ask
("add guest checkout to the product", "implement it") and your agent picks the
skill. To run one by name, use
`/businesslens-map` in Claude Code and most agents, `$businesslens-map` in
Codex. These pages show the `/` form.

Check it worked: in your agent type `/businesslens-` and the three skills
appear (Codex: `$businesslens-`).

## Supported agents

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
[`businesslens update`](./cli-update.md). With the CLI installed globally,
[`businesslens completion`](./cli-completion.md) adds Tab completion to your
shell.

## Claude Code plugin

Claude Code users can install the same three skills as a plugin instead, by
adding this repository as a marketplace:

```text
/plugin marketplace add businesslens/pdd
/plugin install businesslens@businesslens
```

The plugin and the CLI installer deliver the same skills; use one or the other,
not both.

Next:

- Have code already? → [From your repo](./from-your-repo.md)
- Starting fresh? → [From an idea](./from-an-idea.md)
- Want a known product shape? → [From a Blueprint](./from-a-blueprint.md)
