# pdd-kit

pdd-kit publishes an open format for describing what a product does, a CLI and skills for
authoring software from it, and a public catalog of curated examples at `pdd-kit.dev`.

The project was called **BusinessLens** until 2026-10; that name, its `.businesslens/`
directory and its separate landing repository are history. The site lives in `site/` of
`itai-gendler/pdd-kit` (see [ADR-0022](./docs/adr/0022-a-static-site-in-the-pdd-kit-repository.md)).

The public-facing resource type language lives in the Product model group under the
repository's `docs/`. This file is the internal vocabulary; the two must agree.

## Language

**Product-Driven Development (PDD)**:
The practice this project names: decide behavior in a Product Model, implement it, and verify the
current implementation against it. PDD is the practice; **pdd-kit** is the open-source
implementation of it — the format, the CLI, and the skills; a **Product Model** is what it
produces. Public copy
names PDD before it names pdd-kit. See
[ADR-0007](./docs/adr/0007-pdd-names-the-practice.md).
_Avoid_: Product-Driven Design, the pdd-kit methodology, PDD as the name of the format

**Product Model**:
The `product-model/` artifact describing a product's resources and their relationships. Authored
locally and owned by whoever wrote it.
_Avoid_: model, spec, blueprint

**Product Report**:
The generated, source-free representation of a Product Model. A transport artifact, not a
second model layer.
_Avoid_: report.json, snapshot

**Blueprint**:
A Product Model curated into the public catalog: a `blueprints/<slug>/` directory in
`itai-gendler/pdd-kit`. Its identity is its slug — its directory, its page, its feed item and its
pull name. The site and the CLI read the same built Product Report.
_Avoid_: Blueprint Revision, Product Model Version

**Catalog**:
The public collection of Blueprints, shown at `pdd-kit.dev/blueprints` and published as the
`blueprints-v<major>` GitHub Release. Both are built from the repository's `blueprints/` with one
release script, so they always show the same set.
_Avoid_: Hub, Platform, Explore

## Working with a model

**Ideate**:
Deciding what the product should do, and writing that decision into the model. One conversation
that converges: it proposes candidate directions, a person chooses, and it writes only what was
approved. It **absorbed the separate plan step** — there is no longer a verb between deciding and
writing.
_Avoid_: brainstorm, explore, plan

**Implement**:
Building the software a model describes, with its scenarios as the acceptance contract. The middle
phase of the loop — **Ideate → Implement ⇄ Verify** — and the only one pdd-kit does not run:
the reader asks their own agent to implement the model, and it does so in phases, the reader's way:
plan mode, an SDD tool, or freestyle. Verify plans the phases and checks each before the next; the
reader may ask for one part at a time or everything in one go instead. There is no implement
skill. Nothing about how you implement changes; the model is the source of truth you point at. The
reader's agent, not pdd-kit, writes the code under its own permissions.
_Avoid_: build, generate, scaffold

**Map**:
Reading established behavior without executing the repository, proposing the corresponding model,
and writing it only after approval. Use it for adoption, an explicitly untrusted area, or expanding
coverage — not as a daily check.
_Avoid_: init, import, reverse engineer

**Verify**:
Comparing a full or named slice of the current implementation with approved scenarios. Asking
to implement starts it too: it plans the work in phases, the reader's own agent implements each
one, and verify checks it before the next. One invocation owns the resolution loop: it asks only
when authority is ambiguous, routes an approved model change through ideation, routes missing
established behavior through scoped mapping, then verifies again. It stops aligned or blocked;
report-only mode never writes or delegates.
_Avoid_: sync, structural validation, evidence collection

**Lint**:
Checking only the Product Model's structure and references. It does not inspect implementation
semantics or prove that behavior is aligned.
_Avoid_: validate, verify

**Export**:
Compiling a Product Model into a Product Report.
_Avoid_: build, compile

## Entry paths

Three doors, named below in prose everywhere — `/faq`, the docs, this file — because a visitor who
meets a door twice under two names counts it as two products. The home page renders them as verbs
(*Map existing repo*, *Start from an idea*, *Start from a Blueprint*) because there they are buttons;
that is the only sanctioned variation. See
[ADR-0008](./docs/adr/0008-two-home-page-doors-leave-the-site.md).

**From your repo**:
You have code and no shared model. `pdd-map` reads established behavior without running
the repository and proposes a Product Model for approval. Continues off-site, in the docs.
_Avoid_: onboarding, adopt, migrate

**From an idea**:
You have a domain, not a product. `pdd-ideate` proposes candidate shapes to choose from.
Continues off-site, in the docs.
_Avoid_: brainstorm, greenfield, zero to one

**From a Blueprint**:
You want a reviewed starting point. `pdd-kit blueprint pull` expands a Blueprint into
`product-model/`. The only door that stays on `pdd-kit.dev`.
_Avoid_: template, starter, clone

## Catalog

**Contribute**:
A contributor proposing that their Product Model become a Blueprint, by opening a pull request
against `itai-gendler/pdd-kit` with `pdd-kit blueprint contribute`.
_Avoid_: publish, submit

**Publish**:
The maintainer merging a contribution pull request. CI then rebuilds the Blueprint release and the
site; there is no other approval step, listing flag or catalog server.
_Avoid_: sync, reconcile, push, list

**Pull**:
Anyone anonymously downloading a Blueprint's Product Report from the GitHub Release with
`pdd-kit blueprint pull` and expanding it into a local `product-model/`.
