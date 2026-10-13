---
domain: blueprint-portability
availability: [{ place: pdd-kit-cli }]
references:
  - kind: code
    role: implementation
    target: src/commands/contribute.ts#runContribute
    title: Contribution flow
  - kind: doc
    role: context
    target: docs/cli-contribute.md
---

# Contribute a Blueprint

Proposes the current Product Model as a Blueprint by opening a pull request
that adds it to the `blueprints/` folder of the repository Blueprints are
published from — pdd-kit's own, unless the Developer names a fork. The model is
checked, exported, regenerated from the portable report, and submitted under the
Product's own identifier as its Blueprint name. Everything is prepared in a
temporary directory: the Developer's repository gains no branch, remote, commit,
or Blueprint file, only the ignored export.

## Intent

This is the only thing pdd-kit does that sends a model anywhere, so it is
explicit, confirmed, and deliberately deterministic rather than a skill. What is
submitted is regenerated from the portable report rather than copied, so it is
byte-identical to what pulling the Blueprint would produce.

## Proposing through a code host

Opening the pull request goes through the Developer's own GitHub identity using
the GitHub CLI. That is a system this Product calls out to; the Product holds no
account of its own and stores no credential. Merging the pull request is what
publishes the Blueprint: the repository rebuilds its release, and within minutes
the Blueprint is listed and can be pulled by name. Merging stays with that
repository's maintainers.
