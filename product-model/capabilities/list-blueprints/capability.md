---
domain: blueprint-portability
availability: [{ place: pdd-kit-cli }]
references:
  - kind: code
    role: implementation
    target: src/commands/list.ts#runList
    title: Blueprint listing
  - kind: code
    role: implementation
    target: src/core/blueprint-release.ts#fetchBlueprintIndex
    title: Blueprint release index
  - kind: doc
    role: context
    target: docs/cli-list.md
---

# List Blueprints

Shows every published Blueprint by the name a pull takes, with its title. The
list is read from the same release a pull downloads from — pdd-kit's own
repository, unless the Developer names a fork — so a Blueprint appears in it
within minutes of being merged. Listing is anonymous: no account, sign-in, or
credential is involved.

## Intent

Choosing a Blueprint to start from should not require a browser or guessing a
name. Listing and pulling read one source, so every name listed is one a pull
accepts.

## Reading the release

The Blueprint release is a system this Product calls out to; it is not part of
the Product. A release that is missing, unreachable, or answering with an index
the Product cannot trust produces a message the Developer can act on and no
list at all.
