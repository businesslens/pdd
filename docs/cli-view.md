---
title: view
description: Open a Product Model as a private local report, from your checkout or from a GitHub repository.
section: open-source
group: CLI
order: 28
---

# `businesslens view`

```bash
npx businesslens view
npx businesslens view owner/repo --pr 12
```

`view` opens a Product Model as a read-only report on localhost. It does not
alter the model, write `.businesslens/build/report.json`, or send report data
to BusinessLens. A remote model must pass structural lint before the viewer opens.

For a local model, the viewer starts in whatever state it is in, because the report is a
place to watch a model being built. With no `.businesslens/` yet, the page says
it is waiting and the report appears the moment the directory is created, at
the current directory or the repository root. With a model that does not lint,
the page shows the errors and the report appears on the first clean save.
While it remains open, valid changes appear automatically; if an edit
introduces a lint error, the browser keeps the last valid report visible and
recovers after the error is fixed. A pulse in the header says the viewer is
connected and when the model last changed on screen.

The server listens only on `127.0.0.1` and stops when the command exits.

## Options

| Option | Effect |
| --- | --- |
| `[repository]` | View a GitHub repository instead of the working directory |
| `--branch <name>` | Branch or tag of that repository |
| `--pr <number>` | Pull request of that repository |
| `--no-open` | Print the URL without launching the default browser |
| `--port <port>` | Listen on a specific port from 1 through 65535 |
| `-c, --cwd <path>` | Start local model lookup from another directory |

## Your checkout

Without a repository, `view` uses the model in the current directory, or at
the Git repository root. Valid edits appear automatically while the viewer is
open; a lint error keeps the last valid report on screen until it is fixed.
See [Choosing the Product Model](./cli.md#choosing-the-product-model) for
`--cwd`.

## A GitHub repository

Pass a repository as `owner/repo`, a `https://github.com/owner/repo` URL, or
`git@github.com:owner/repo.git` to fetch over SSH. Only GitHub is supported.

```bash
npx businesslens view acme/checkout                      # default branch
npx businesslens view acme/checkout --branch release/2.4
npx businesslens view acme/checkout --pr 12
npx businesslens view https://github.com/acme/checkout/pull/12
```

A `.../tree/<branch>` or `.../pull/<number>` URL selects the revision by
itself; do not combine it with `--branch` or `--pr`.

A pull request shows its head as GitHub holds it, so a pull request opened from
a fork shows the fork's content without naming the fork.

The revision is fetched shallowly into a temporary directory and deleted when
the command exits. Nothing from the repository runs. Private repositories use
your own Git credentials. The report does not refresh; run the command again
for a newer revision. `--cwd` does not apply.

Use [`blueprint export`](./cli-export.md) when you need to write a source-free,
portable Product Report.
