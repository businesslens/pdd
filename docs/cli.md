---
title: Overview
description: Choose a BusinessLens CLI command and learn the options shared by every command.
section: open-source
group: CLI
order: 28
---

# BusinessLens CLI

The `businesslens` CLI installs and updates the agent skills and validates the
local Product Model. Its `blueprint` commands move a model between
repositories: compiling one into a Blueprint, expanding a Blueprint back into a
model, pulling one from the public catalog, and proposing one for it.

It requires Node.js 20.12 or newer. Run the current package without installing
it globally:

```bash
npx businesslens@latest <command> [options]
```

## Commands

| Command | Purpose |
| --- | --- |
| [`install`](./cli-install.md) | Install the six bundled BusinessLens skills into one or more AI harnesses |
| [`update`](./cli-update.md) | Refresh BusinessLens-managed skill installations |
| [`validate`](./cli-validate.md) | Check the structure, relationships, and code evidence in `.businesslens/`, and report where a branch stands. Skills and CI run it for you |
| [`blueprint export`](./cli-export.md) | Compile `.businesslens/` into a Blueprint |
| [`blueprint contribute`](./cli-contribute.md) | Propose this Blueprint for the catalog, by pull request |
| [`blueprint pull`](./cli-pull.md) | Anonymously pull a Blueprint by canonical name |
| [`blueprint open`](./cli-open.md) | Expand a Blueprint into `.businesslens/` |

The CLI changes only what the selected command owns. In particular, `install`
and `update` manage skills but never create or edit `.businesslens/`, while
`validate` is read-only.

## General options

General options can be placed before or after the command:

| Option | Meaning |
| --- | --- |
| `--cwd <path>` | Run against this repository or target directory instead of the current directory |
| `--help` | Print the CLI command and option summary |
| `--version` | Print the installed CLI version |

For example:

```bash
npx businesslens@latest --cwd ../fixture-shop validate
```

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | The command completed successfully |
| `1` | The operation failed or was cancelled |
| `2` | The invocation is invalid or a required non-interactive confirmation was omitted |

Human-readable findings and errors go to the terminal. Use
[`validate --json`](./cli-validate.md#json-output) when another program needs
structured validation output.
