---
title: Contributing
description: How to propose a Product Model for the public Blueprint catalog.
section: open-source
group: Reference
order: 26
---

# Contributing a Blueprint

The catalog at [businesslens.io/blueprints](https://businesslens.io/blueprints)
is curated from `blueprints/` in
[`businesslens/pdd`](https://github.com/businesslens/pdd). Anyone can propose an
addition by pull request.

## The bar

A Blueprint is an **executable brief**:

- **Small enough to build end to end.** Not a platform, not a suite. One product
  a competent agent can finish.
- **Complete enough that nothing is missing.** Every actor, journey, and rule the
  product needs, with scenarios covering the paths that matter — success,
  permission, validation, conflict, and external failure.
- **Generic.** Archetypes, not models of named third-party products.

The acceptance test:

> Pull the Blueprint into an empty directory. Hand it to a coding agent that has
> never seen it, with no prompt beyond "build this." If what comes out is a
> working product that someone who knows the domain recognises — and you did not
> have to explain anything — it passes.

Anything you had to explain is a gap in the Blueprint, not in the agent.

## Authoring

Use the [`businesslens-ideate`](./skill-businesslens-ideate.md) skill's greenfield
interview in a scratch repository. This is curation, not hand-authoring
Markdown.

Keep prose at product altitude — what a user observes, not how the system
achieves it. A Blueprint prescribes no framework, database, architecture, or
interface, and naming one narrows the Blueprint's usefulness without making it
more complete.

## Proposing it

```bash
gh auth login
npx businesslens@latest blueprint contribute --slug my-blueprint
```

See [`businesslens blueprint contribute`](./cli-contribute.md) for what that does.

## What review looks at

- **The acceptance test.** A maintainer will run it.
- **Scenario quality.** Each scenario must be checkable against an
  implementation without running it. "Cart validation works" is too vague;
  "submitting an empty cart shows an error and keeps the cart" is not.
- **No source evidence.** `blueprints:check` fails the pull request on any
  `codeRef`, coverage source area, repository link, or repository entry point.
  This is automated and not negotiable.
- **The manifest.** `category`, `icon`, `accent`, and `authors` are placeholders
  out of `contribute`; set them properly.
- **Vocabulary.** Use the terms in [Terminology](./terminology.md).

## Licensing

Blueprint content is MIT, the same as the code, stated in `blueprints/LICENSE`
and on each manifest. By opening a pull request you agree to contribute your
Blueprint under that license.

## After the merge

Merging is approval, not publication. A maintainer runs the publish script,
which pushes built Blueprints to the catalog. A new Blueprint arrives
**unlisted**; an administrator lists it. That is deliberate — it keeps listing a
human decision that a publish run can never overwrite.
