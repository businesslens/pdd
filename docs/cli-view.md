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

**Review** opens on uncommitted Product Model changes since the last commit,
including staged, unstaged and nonignored new files. Before the first commit,
model files appear as additions. An empty result does not switch baselines.

Choose **Compare versions…** to compare local commits, branches, tags or the
working state. Explicit selections stay in the URL. Historical models must use
the current format; earlier formats are not converted. Saved versions resolve to
exact commits and never fall back to current contents.

The active model's authored files can be inspected even when the model does not
compile. Other repository changes can appear in the same tree as path-only
context. Browsing comparisons
never changes the checkout or establishes agreement between model and code.

Overview’s **Coverage** presents Model scope, with a
short authoring note and any model-wide limitations. Covered, Exclusions and
Unmapped describe behavior with optional repository paths. Their cards filter a
shared source tree; selecting a path opens descriptions, local limitations and
related References. Entries without paths remain readable below the tree.
Folder counts summarize authored entries, not completeness. Review compares selected Git or working states; neither
reading establishes whether model and code agree.

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
