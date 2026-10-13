---
domain: blueprint-portability
availability: [{ place: pdd-kit-cli }]
references:
  - kind: code
    role: implementation
    target: src/commands/pull.ts#runPull
    title: Blueprint pull
  - kind: code
    role: implementation
    target: src/core/blueprint-release.ts#fetchReleaseAsset
    title: Blueprint release download rules
  - kind: doc
    role: context
    target: docs/cli-pull.md
---

# Pull a Blueprint

Fetches a published Blueprint by its name and expands it into a Product Model in
the chosen directory, together with the Product's logo and cover when it has
them. Published Blueprints are read from the release of the repository they are
published from — pdd-kit's own, unless the Developer names a fork — which every
merge rebuilds, so a newly merged Blueprint can be pulled within minutes and
without a CLI update. Pulling is anonymous: no account, sign-in, or credential is
involved.

## Intent

Starting from someone else's reviewed model should be one command and should not
require trusting whatever came back. The download is checked before a single
file is written: HTTPS only, a plausible size, the report version this Product
reads, the right Blueprint, and a report that matches the digest the release's
index records for it.

## Fetching a Blueprint

The Blueprint release is a system this Product calls out to; it is not part of
the Product. A release that is missing, still being rebuilt, unreachable, or
answering about the wrong Blueprint produces a message the Developer can act on
and no Product Model at all.
