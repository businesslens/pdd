---
entities:
  - product-model
  - element
domain: blueprint-portability
availability: [{ place: businesslens-cli }]
references:
  - kind: code
    role: implementation
    target: src/commands/contribute.ts#runContribute
    title: Contribution flow
  - kind: doc
    role: context
    target: https://github.com/businesslens/pdd/blob/main/docs/cli-contribute.md
    title: What makes a good Blueprint
---

# Contribute a Blueprint

Proposes the current Product Model for a public Blueprint catalog by opening a
pull request against the catalog's source repository. The model is checked,
exported, regenerated from the portable report, and submitted under the
Product's own identifier as its catalog name. Everything is prepared in a
temporary directory: the Developer's repository gains no branch, remote, commit,
or catalog file.

## Intent

This is the only thing BusinessLens does that sends a model anywhere, so it is
explicit, confirmed, and deliberately deterministic rather than a skill. What is
submitted is regenerated from the portable report rather than copied, so it is
byte-identical to what pulling the Blueprint would produce.

## Proposing through a code host

Opening the pull request goes through the Developer's own GitHub identity using
the GitHub CLI. That is a system this Product calls out to; the Product holds no
account of its own and stores no credential. Merging approves a Blueprint;
publishing and listing it stay with the catalog's maintainers.
