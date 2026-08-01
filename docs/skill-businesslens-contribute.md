---
title: contribute
description: Propose your Product Model as a Blueprint in the public catalog, by pull request.
section: open-source
group: Skills
order: 21
---

# `businesslens-contribute`

Opens a **public pull request** adding your Product Model to the Blueprint
catalog at [businesslens.io/blueprints](https://businesslens.io/blueprints).

It is optional — the model is fully useful in your repository without it — and
it is the only BusinessLens skill that publishes anything.

## Authentication

Your own GitHub identity, through the [GitHub CLI](https://cli.github.com):

```bash
gh auth login
```

There is no BusinessLens account and **no API key anywhere in this flow**. The
skill preflights `gh --version` and `gh auth status` and stops before doing
anything if either fails.

## Invoking it

```text
/businesslens-contribute
```

## What it does

1. Confirms you actually asked to contribute. It never runs as a side effect.
2. Preflights `.businesslens/`, `gh`, and `businesslens validate`. Draft
   warnings are expected and fine — a Blueprint is an unimplemented model.
3. **Judges the model against the catalog's bar** and tells you plainly what it
   thinks is not ready: small enough to build end to end, complete enough that
   nothing is missing, generic rather than a named third-party product, and
   written at product altitude.
4. Agrees a slug with you.
5. Runs [`businesslens blueprint contribute`](./cli-contribute.md), which regenerates the
   model from a redacted Product Report and opens the pull request.
6. Reports the URL and what happens next.

## Why the model is regenerated

`codeRefs` live in the frontmatter of the files you authored, and redaction
operates on a built report. Copying your authored files into a pull request
would publish your source paths.

The skill will not work around a CLI failure by copying files by hand.

## Guardrails

- Never contributes without explicit, in-conversation confirmation.
- Never passes `--yes` on your behalf.
- Never edits the model to make it pass validation.
- Blueprint content is MIT, the same as the code.

## After the pull request

`blueprints:check` runs on it and independently rejects any source evidence.
A maintainer reviews against the acceptance test. Merging is approval; a
separate publish run puts it in the catalog, **unlisted** until an administrator
lists it.
