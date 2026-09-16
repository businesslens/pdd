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

## History

**History** compares two selected states: the working model, Git commits,
branches or tags, and local [checkpoints](./cli-checkpoint.md). Both selections are kept
in the URL. Browse or search local history, paste a commit SHA, or swap the
comparison direction. Git states are read without changing your checkout;
unavailable revisions and models that cannot compile explain why.

The initial base is the repository's known default branch, or the last commit
when working on that branch. If the default branch cannot be identified, the
last commit is used. When no model is saved at those revisions, the newest
checkpoint is used instead. Your explicit selections take precedence. If no
earlier model has been saved, create a checkpoint or commit the model before
comparing later changes.

The comparison includes resource and field changes, plus changes to local
Reference files. Opening either side of a resource reads that state's model
and files, including resources since removed. Branches and tags resolve to exact commits
for each comparison. A historical file never silently opens its current copy.
HTTP(S) References remain external links.

**Create a checkpoint** saves the current valid working model and its local
References, even while comparing historical states. The newest fifty are kept
locally. Checkpoints preserve supported file contents, including images, up to
25 MiB per file and 100 MiB per checkpoint. Identical files share storage.
Older checkpoints may preserve only text or fingerprints; missing contents
are explicitly unavailable. Text comparisons show up to 256 KiB per file.

Model and Reference edits are detected independently of checkpoint creation.
A changed file does not establish whether the model and implementation agree.
Only regular files within the repository or standalone model root are captured;
symbolic links and generated BusinessLens history are excluded.

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
