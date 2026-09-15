---
title: view
description: Open the current Product Model as a private local report that stays updated while you edit.
section: open-source
group: CLI
order: 29
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

## What changed

The report can compare the model as it stands against an earlier state. The
**What changed** row in the rail opens the comparison: every resource added,
removed, or changed since the baseline, grouped by collection, each opening its
page, with the fields that differ under it. A changed or added resource also
wears its mark on its row and beside its name on its page, so the difference is
visible while reading, not only on the comparison.

The baseline is one of:

- **Last commit** — the model as the last commit has it. This shows everything
  not yet committed, including new resource files. It is absent when the model
  is not in a Git repository or has never been committed.
- **A checkpoint** — a round of work marked by
  [`checkpoint`](./cli-checkpoint.md), or by **Pin this state** in the
  comparison itself. The agent skills mark each approved delta they write, so
  a session leaves one named checkpoint per round, whichever harness runs the
  skill.

Checkpoints live in `.businesslens/cache/checkpoints/`, which is generated and
never committed. The viewer reads whatever is there, so it can be opened before,
during, or after the work and show the same comparison. The newest checkpoint is
the default baseline; the choice is remembered in a cookie.

Changes to local Reference files also appear under the resources that reference
them, even when no model file changed. Text files show their contents before and
after; binary files show that their contents changed. This includes source code,
documents and co-located assets, including files outside `.businesslens/`.
Code symbols and line ranges still compare the whole referenced file.

**Last commit** uses the files at that commit. Checkpoints and pins capture their
local contents when saved. Older checkpoints without file snapshots compare
model fields only and say so. HTTP(S) References are never fetched, and a changed
file does not establish whether the model and implementation agree.

Only regular files inside the repository or standalone model root are captured;
symbolic links are excluded. Files up to 25 MiB are compared, with text previews
up to 256 KiB. Unreadable or larger files are named as unavailable.

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
