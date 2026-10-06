---
title: view
description: Open a Product Model as a private local report, from your checkout or from a GitHub repository.
section: open-source
group: CLI
order: 24
---

# `businesslens view`

Open a Product Model as a read-only report in your browser, while you write it
or to review someone else's branch or pull request.

```bash
npx businesslens view [repository] [--branch <name> | --pr <number>] [--no-open] [--port <port>]
```

## Options

| Option | Meaning |
| --- | --- |
| `[repository]` | A GitHub repository to view instead of your checkout |
| `--branch <name>` | Branch or tag of that repository |
| `--pr <number>` | Pull request of that repository; not with `--branch` |
| `--no-open` | Print the URL without opening the browser |
| `--port <port>` | Port from 1 to 65535; by default a free port the system picks |

## What it does

1. Starts a server on `127.0.0.1` only, and opens the report.
2. Compiles the model in memory. It writes nothing (no
   `.businesslens/build/report.json`) and sends nothing to BusinessLens.
3. Keeps running until you press Ctrl+C.

If the [GitHub CLI](https://cli.github.com) is signed in, the report asks GitHub
through `gh` whether you have starred BusinessLens, and a star beside the GitHub
link stars it when you click it. Without `gh`, only the link shows.

## Your checkout

With no repository, `view` uses your local model. See
[Choosing the Product Model](./cli.md#choosing-the-product-model). The report
follows your edits: each valid save appears, and a save that does not lint shows
why until it does. With no model yet, the page waits for one.

## A GitHub repository

Pass `owner/repo`, a `https://github.com/owner/repo` URL, or
`git@github.com:owner/repo.git` to fetch over SSH. Only GitHub is supported, and
`git` must be installed.

```bash
npx businesslens view acme/checkout                      # default branch
npx businesslens view acme/checkout --branch release/2.4
npx businesslens view acme/checkout --pr 12
npx businesslens view https://github.com/acme/checkout/pull/12
```

A `.../tree/<branch>` or `.../pull/<number>` URL already picks the revision; do
not add `--branch` or `--pr`. A pull request from a fork shows the fork's
content.

The revision is fetched shallowly into a temporary directory, with your own Git
credentials, and deleted when you stop. Nothing from it runs. Its model must
lint before the report opens, and the report does not refresh. Run the command
again for a newer revision. `--cwd` does not apply.

Exits 0 when you stop it, 1 when the port cannot be opened or a repository
cannot be fetched or does not lint, and 2 for conflicting or invalid options.

## Next

- [`lint`](./cli-lint.md) to see every error in the terminal.
- [`blueprint export`](./cli-export.md) to write a portable report file.
