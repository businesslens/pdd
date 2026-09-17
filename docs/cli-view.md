---
title: view
description: Open the current Product Model as a private local report that stays updated while you edit.
section: open-source
group: CLI
order: 28
---

# `businesslens view`

```bash
npx businesslens view
```

`view` opens the current Product Model as a read-only report on localhost. It
does not alter the model, write `.businesslens/build/report.json`, or send
report data to BusinessLens.

The viewer starts in whatever state the model is in, because the report is a
place to watch a model being built. With no `.businesslens/` yet, the page says
it is waiting and the report appears the moment the directory is created, at
the current directory or the repository root. With a model that does not lint,
the page shows the errors and the report appears on the first clean save.
While it remains open, valid changes appear automatically; if an edit
introduces a lint error, the browser keeps the last valid report visible and
recovers after the error is fixed. A pulse in the header says the viewer is
connected and when the model last changed on screen.

## Review

**Review** compares the Product Model and repository between two selected Git
states, including the working state. Commits, branches and tags resolve locally;
both selections stay in the URL. Historical models must use the current model
format; earlier formats are not converted. Reports and file trees are read from
Git on demand, without a separate history cache. Browse or search history, enter a commit SHA,
or swap the comparison direction without changing the checkout.

The default base is the repository's known default branch on a feature branch,
otherwise the last commit. Explicit selections take precedence. A revision with
no readable model explains the unavailable model comparison while its repository
files remain comparable. With no commits, there is no saved comparison state.

Model changes name resources and fields, independently of file references.
Repository changes include tracked and nonignored untracked files, staged and
unstaged edits, additions, deletions and executable-mode changes. Select a file
for its before/after contents, or a resource for that state's complete reading.
Historical contents never fall back to current files. Text previews are bounded;
binary, oversized, unreadable and submodule contents are identified explicitly.

Overview retains **Coverage** for current model scope, exclusions, gaps and
recorded inspection. Coverage and Review share the repository tree. Coverage's
changes since inspection have their own baseline; Review compares only its two
selected states. A changed file does not establish whether model and code agree.

The report is read-only. Selecting, filtering, inspecting and refreshing never
record a review, approve changes, save a snapshot or alter the repository.

## Options

| Option | Effect |
| --- | --- |
| `--no-open` | Print the URL without launching the default browser |
| `--port <port>` | Listen on a specific port from 1 through 65535 |
| `-c, --cwd <path>` | Start model lookup from another directory |

By default, `view` starts from the current directory. If that directory directly
contains `.businesslens/`, that model is used; otherwise BusinessLens checks the
Git repository root. See
[Choosing the Product Model](./cli.md#choosing-the-product-model) to select a
nested Blueprint, another repository, or a standalone model with `--cwd`.

The server listens only on `127.0.0.1` and stops when the command exits.

Use [`blueprint export`](./cli-export.md) when you need to write a source-free,
portable Product Report.
