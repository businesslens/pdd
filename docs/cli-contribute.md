---
title: blueprint contribute
description: Open a pull request proposing your Product Model as a catalog Blueprint.
section: open-source
group: CLI
order: 29
---

# `businesslens blueprint contribute`

Propose your Product Model for the public Blueprint catalog:

```bash
npx businesslens@latest blueprint contribute --slug my-blueprint
```

This opens a pull request against
[`businesslens/pdd`](https://github.com/businesslens/pdd). Merging it is
approval; a maintainer then publishes the catalog.

There is no API key and no account with BusinessLens. Authentication is your
own GitHub identity, through the [GitHub CLI](https://cli.github.com):

```bash
gh auth login
```

`contribute` refuses to run without it, rather than failing halfway through.

## Where contributions go

By default, `businesslens/pdd`. Set `BUSINESSLENS_CONTRIBUTE_UPSTREAM` to an
`owner/repo` pair to target another Blueprint repository — anyone running their
own catalog needs their own sources behind it, and the two have to point at the
same deployment.

`contribute` forks when you do not own the upstream and clones it directly when
you do, because GitHub refuses to let one account own both a parent and a fork.

## What it does

1. Resolves and loads the Product Model, and validates it. Errors stop the run;
   draft warnings do not, because a Blueprint is an unimplemented model.
2. Exports a Blueprint — the model with every `codeRef` stripped.
3. **Regenerates the model from that Blueprint.** This is what goes in the
   pull request.
4. Derives the slug from `--slug`, or from the product id.
5. Forks `businesslens/pdd` if you have no fork yet, brings its default branch
   up to date with upstream, and clones it.
6. Writes `blueprints/<slug>/{blueprint.yaml,.businesslens/}` on a
   `blueprint/<slug>` branch.
7. Opens the pull request and prints its URL.

## Your own repository is never touched

Every step above happens in a temporary directory that is deleted when the
command finishes. Your repository is only ever **read** — it never gains a
branch, a remote, a commit, or a copy of anything from the catalog.

Its layout does not matter either. Step 3 rebuilds the model in canonical form
rather than copying your files, so a Product Model contributes the same way
whether it sits at the root of a tiny repository or deep inside a monorepo.

## Contributing more than once

Revising a Blueprint is the same command again.

- The fork's default branch is **synced from upstream** before branching, so a
  fork left from an earlier contribution cannot drag stale history into the
  pull request. If it cannot be synced, the command stops rather than opening a
  pull request full of unrelated changes.
- The `blueprint/<slug>` branch is **force-pushed**. It is owned by this
  command on your own fork, and nothing else is ever pushed to it.
- If a pull request for that branch is already open, the push updates it and
  the command reports that URL rather than failing.

Forking leaves a repository in your GitHub account. GitHub needs it to keep the
pull request open, so leave it there until the Blueprint is merged — after that
it is yours to delete.

## Why the model is regenerated

`codeRefs` live in the frontmatter of the `.businesslens/**/*.md` files you
authored, and redaction operates on a built report. Copying your authored files
into a pull request would publish your source paths.

Regenerating from the redacted report is the only way to be sure nothing
repository-specific travels, and it has a second benefit: the contents are then
byte-identical to what `businesslens blueprint pull <slug>` produces for everyone else.

The gate does not take this on trust. `blueprints:check` runs on every pull
request and independently rejects any Blueprint carrying source evidence,
because anyone can open a pull request by hand.

## The manifest

`contribute` writes a `blueprint.yaml` with what it can infer and placeholders
for what it cannot:

```yaml
slug: content-feed-reader
title: Content & Feed Reader
summary: One sentence on what the product is.
category: Content
tags: [content, reading]
icon: i-lucide-rss
accent: "#b8965c"
authors: [Your Name]
license: MIT
```

Expect to edit `category`, `icon`, `accent`, and `authors` in the pull request.
Blueprint content is MIT, the same as the code.

Git provenance is recorded as an optional `origin` block when your model is in a
repository with an HTTPS remote, and skipped otherwise — a Blueprint author may
have no repository at all.

## What makes a good Blueprint

A Blueprint is an executable brief: small enough to build end to end, complete
enough that a coding agent handed nothing but the pulled model produces a
working product.

The acceptance test is literal. Pull it into an empty directory, hand it to an
agent with no prompt beyond "build this", and see whether what comes out is
recognisable to someone who knows the domain. Anything you had to explain is a
gap in the Blueprint.

See [Contributing a Blueprint](./contributing-blueprints.md) for the full guide.
