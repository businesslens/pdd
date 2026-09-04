# The `.businesslens/` Format

> **This is engineering documentation, not a docs-site page.** It is the
> contract the parser, the linter, and the catalog server must agree on, and
> it changes *before* their behavior does.
>
> The user-facing explanation of the same resource types lives in the Product
> model group under `docs/` — one page per resource type, each carrying its file
> shape and the `lint` findings that constrain it. Keep the two consistent.
>
> This document defines the **authored folder**. The wire contract that
> serializes it — the Product Report, its portable projection, and expansion —
> is [`report.md`](./report.md). Shapes considered for either and chosen against
> are in [`rejected.md`](./rejected.md).

This document is the contract for the BusinessLens PDD folder: the git-tracked
product model that lives inside a repository. Everything the public CLI lints is
defined here. `businesslens lint` checks whether this folder is structurally
sound; it does not claim that the model and implementation agree.

Planning uses the same files: approved intended behavior is written into the
model before implementation. `businesslens-verify` performs the separate,
semantic comparison with the implementation and owns any resolution loop. Git
may narrow that inspection to a branch, but a diff never decides which side is
authoritative. The technical *how* of a change (specs, designs, task lists)
still belongs to your SDD tool of choice and may be attached through
`references`.

## Terms

| Term | Meaning |
| --- | --- |
| **Product Model** | `.businesslens/` — the git-tracked folder this document defines. May cite the repository's code. |
| **Resource** | one authored file in a Product Model — `capabilities/lint-product-model/capability.md` is one. |
| **Resource type** | what a resource is one of. This document defines eleven: Product, Interface, Experience, Screen, Domain, Entity, Capability, Capability Scenario, Journey, Journey Scenario, and Business Rule. |
| **Actor** | the role an Entity plays where it acts — a Step's `actor`, an Interface's, Experience's or Journey's `actors`, a Business Rule grant's `actors`. Not a resource type: an Entity that `acts` is an Actor in that position. |
| **Product Report** | the portable serialization of a Product Model. One format, two profiles. |
| — *workspace* | `referenceProfile: workspace`. Repository-relative references and entry points intact, as optional navigation. For a full product instance inside the boundary that owns the code. |
| — *portable* | `referenceProfile: portable`. No `kind: code`, no repository-relative targets or entry points. Required whenever a report crosses an ownership boundary. |
| **Blueprint** | a Product Report curated into the public catalog under a slug. Always the portable profile, because that is what the catalog accepts. |

**Redaction is a property a report has, never a category it belongs to.** A
report carrying repository navigation is still a Product Report; it is simply
not a Blueprint. Nothing about where a file is stored may be decided by whether
it would survive publication — the profile filters at serialization time, and
that is the only place the distinction lives.

**A resource never states its own type in frontmatter; its path does.**
`capabilities/checkout.md` is a Capability because of where it sits, and
`capabilities/checkout/capability.md` says it a second time in the type
filename — both are the path. No file carries a `kind: capability` header, and a
model is read from its folders.

That leaves `kind` free to mean something narrower, and it does: five unrelated
closed sets, each local to where it appears, none of them naming a resource
type.

| `kind` on | Values |
| --- | --- |
| a `references` item | `code`, `prd`, `spec`, `proposal`, `doc`, `adr`, `visual`, `research` |
| an Entity that `acts` | `person`, `system` |
| a Capability Scenario | one `scenarioKinds` id from `taxonomies.yaml` |
| a Journey Scenario | one `scenarioKinds` id from `taxonomies.yaml` |
| a Scenario Step | `actor`, `product`, `condition` |

Each is required wherever it appears. At the top level of a file only the two
Scenario types require one, and an Entity carries one exactly when it `acts`.
**Every other resource type has no `kind` at all** — Product, Interface,
Experience, Screen, Domain, Capability, Journey, and Business Rule never carry
one. An Interface's `type` is a different field with a different job.

This document therefore never writes *kind* to mean a resource type, and neither
should `docs/`. The code does — `ReportResourceKind` is the discriminator a
report consumer switches on — and that is the only register where the word
carries that meaning.

## Folder layout

A resource uses the smallest shape that can hold it:

- **compact** — `<id>.md` when the resource has no assets or child resources;
- **expanded** — `<id>/<type>.md` when it owns assets or a typed child
  collection.

The two shapes represent the same resource and derive the same id. Adding the
first asset or child promotes the Markdown file with `git mv`; removing the last
one compacts it again. Both shapes must never exist for the same id. This keeps
leaf-heavy collections readable without giving up co-location or path-owned
parent relations.

Every resource follows that rule; only its type filename and permitted child
collection differ:

| Resource type | Compact | Expanded | Typed children |
| --- | --- | --- | --- |
| Product | `product.md` | `product/product.md` beside `logo.svg` | — |
| Interface | `interfaces/<id>.md` | `interfaces/<id>/interface.md` | `screens/`, `experiences/`, or both |
| Experience | `interfaces/<interface-id>/experiences/<id>.md` | `interfaces/<interface-id>/experiences/<id>/experience.md` | `screens/` |
| Screen | `<screen-parent>/screens/<id>.md` | `<screen-parent>/screens/<id>/screen.md` | — |
| Domain | `domains/<id>.md` | `domains/<id>/domain.md` | — |
| Entity | `entities/<id>.md` | `entities/<id>/entity.md` | — |
| Capability | `capabilities/<id>.md` | `capabilities/<id>/capability.md` | `scenarios/` |
| Capability Scenario | `capabilities/<capability-id>/scenarios/<id>.md` | `capabilities/<capability-id>/scenarios/<id>/capability-scenario.md` | — |
| Journey | `journeys/<id>.md` | `journeys/<id>/journey.md` | `scenarios/` |
| Journey Scenario | `journeys/<journey-id>/scenarios/<id>.md` | `journeys/<journey-id>/scenarios/<id>/journey-scenario.md` | — |
| Business Rule | `business-rules/<id>.md` | `business-rules/<id>/business-rule.md` | — |

Here `<screen-parent>` is the Interface or Experience folder that contains the
Screen. A representative model can therefore look like this:

```
.businesslens/
├── config.yaml              # tool config (committed)
├── taxonomies.yaml          # scenario kinds (committed)
├── coverage.md              # coverage assessment (committed)
├── product.md               # compact Product when it has no logo
├── product/                 # expanded Product alternative
│   ├── product.md
│   └── logo.svg             # optional locally; required for a public Blueprint
│
│   ── Interface → Experience → Screen: where Actors meet the Product ──
├── interfaces/<interface-id>/
│   ├── interface.md
│   ├── screens/<screen-id>.md                    # compact Screen
│   └── experiences/<experience-id>/
│       ├── experience.md
│       └── screens/
│           ├── <screen-id>.md                    # compact Screen
│           └── <illustrated-screen-id>/          # expanded Screen
│               ├── screen.md
│               └── mockup.svg
│
│   ── subject axis: what it is about ──
├── domains/<domain-id>.md                       # optional
├── entities/<entity-id>.md                       # the Entities that act are named by every Interface
│
│   ── behavior tree: what the Product does ──
├── capabilities/<capability-id>/
│   ├── capability.md
│   └── scenarios/<scenario-id>.md
├── journeys/<journey-id>/                       # optional
│   ├── journey.md
│   └── scenarios/<scenario-id>.md
│
├── business-rules/<rule-id>.md                  # optional
├── README.md                # canonical agent orientation
├── .gitignore               # generated paths only
├── build/                   # generated Product Report — never committed
└── cache/                   # generated artifacts — never committed
```

The model has **two hierarchies and two axes**. The Interface → Experience →
Screen hierarchy says where Actors meet the Product; the Capability → Scenario
and Journey → Scenario hierarchy says what the Product does. `availability` is
the join between them. Domain classifies members of both by subject. Entity
names what the Product keeps or reasons about — the people and systems that act
on it included — and Steps say what happens to each. Business Rules attach
across everything, and are the only place a permission claim appears.

## Contexts and places

A **Context** states where behavior is available, occurs, or is constrained. It
is a strict object whose required `place` names one Interface, Experience, or
Screen:

```yaml
- place: customer-web::storefront
```

The use of the Context determines how specific its place must be. A Capability
availability Context names an undivided Interface or an Experience. A Scenario
Context is a concrete occurrence and names the most-specific available place:
a Screen when one exists, otherwise the leaf Experience or Interface. A
Business Rule Context is a selector and may name any of the three; an Interface
or Experience selector includes its descendant places.

Filesystem paths supply containment. For example,
`customer-web::storefront::checkout` is contained by
`customer-web::storefront`, so a Step there is inside that Capability
availability Context. Authors never repeat the containing Interface or
Experience in another field.

A Capability that is available through an Interface divided into Experiences
names the intended Experiences explicitly; an undivided Interface names itself.

**Whether an Interface is divided is derived, never judged.** An Interface must
hold Experiences when either of the following is true of it, and must not when
neither is:

- it serves more than one `access` value; or
- it serves two or more Actor sets whose Capability coverage is disjoint — no
  Capability available there lists Actors from both sets.

Both inputs are already authored: `actors` on the Interface, `access` on the
Experience, and `availability` on each Capability. `lint` therefore decides the
question, and an author never applies a prose test to it. An Interface serving
one audience through one access mode is one coherent context and takes direct
Interface availability.

"Disjoint" is read over the whole Interface, not Capability by Capability: the
Actors split into groups when no Capability available there lists Actors from
two of them — more than one connected component in the graph of Actors and
Capabilities, an edge wherever a Capability's Scenario Steps name the Actor.
An admin-only Capability beside a shopper-only one does not divide an Interface
that also offers a Capability both use.

**Counterparts are the one exception.** An Experience whose name also exists
under another Interface is the same context on another platform —
`customer-web::storefront` and `customer-mobile::storefront` — and keeps its
Experience even where the derivation alone would flatten it, because two views
of one context must not look unrelated. Both findings are `lint` errors: an
Interface that must divide and does not, and one that holds Experiences it
must not, with no counterpart.

An Interface holds `experiences/`, or `screens/`, or **both** — the last when a
Screen is genuinely shared across its Experiences rather than belonging to one.
A Screen beside `experiences/` is reachable from every Experience of that
Interface, and two Screens with the same name below different Experiences of one
Interface are counterparts exactly as they are across Interfaces.

**A shared Screen is inside every Experience of its Interface.** Its id is
`interface::screen`, and its Interface is never an availability place, so
containment reads the Interface as the set of its Experiences: a Capability the
Screen exposes must be available in each of them, a Step that occurs on it is
inside a Capability's availability only when every Experience is, and that
Step counts as Scenario coverage for each. `lint` names the Experiences a
Capability is missing from. A view whose Capabilities differ by Experience is
not shared: it is two Screens, one under each Experience, which are
counterparts.
Contexts are closed to unknown keys. Additional dimensions may be added by a
future format revision, but Context is not an arbitrary metadata bag.

## Universal conventions

- **The committed shell is complete.** `README.md` and `.gitignore` are
  required alongside the semantic files. `.gitignore` must ignore `build/`
  and `cache/`; those generated directories are never part of the committed
  model.

- **Compact and expanded are exclusive.** `<id>.md` and `<id>/<type>.md` may
  not coexist. An expanded resource must own at least one asset or child
  resource; otherwise it is needless structure and must be compacted. A compact
  resource has no asset or child namespace.

  Coexisting shapes, and an expanded folder missing its `<type>.md`, are `lint`
  errors: both are states no correct model passes through. An expanded folder
  that owns nothing yet is a `lint` warning instead. The rule still holds — a
  Product Report cannot carry that state, because expansion derives each
  resource's shape from the children it actually owns, so the round trip
  normalizes the folder back to the compact form. But an author reaches the
  expanded shape in two steps, and the intermediate step is not a defect.

- **ID = the logical path from the collection root.** Behavior-hierarchy ids
  (Capability, Journey, both Scenario types) and cross-cutting ids (Entity,
  Domain, Business Rule) are the bare file or folder name and are globally
  unique within their collection. Qualified ids for Interfaces, Experiences, and Screens carry the
  path that distinguishes them, joined by `::`:

  ```
  reader-web
  reader-web::personal-library
  reader-web::personal-library::unread-library
  ```

  Each segment is lowercase kebab-case, `^[a-z0-9]+(?:-[a-z0-9]+)*$`. Never
  write `id:` in frontmatter — the filesystem is the id authority.

  **Behavioral ids are verb-noun; cross-cutting ids are the bare noun.** A
  Capability, Capability Scenario, Journey, and Journey Scenario name something
  the Product or an Actor *does*, so their ids begin with a verb:
  `browse-catalog`, not `catalog-browsing`; `manage-orders`, not
  `order-management`. A Domain, Entity, Interface, Experience, and Screen name
  something that *is*, so their ids are noun phrases: `shopper`, `ordering`,
  `listing`, `customer-web`.

  `lint` checks this heuristically, as warnings, on the two shapes it can
  recognise without conjugating English: a behavioural id whose last segment
  is a nominalisation (`-ing`, `-ment`, `-tion`, …) while no segment is a
  product verb, and a cross-cutting id whose first segment is a product verb.
  A segment that names a thing this model declares is read as that thing, not
  as a verb — `order-line` is a fine Entity id beside an Entity `order`, and
  `order-management` carries no verb for the same reason.

  This is a rule, not a style. Ids are the format's whole identity mechanism, so
  two models of one product that name the same behavior differently cannot be
  diffed, merged, or compared — which is what a catalog of Blueprints requires.
  `lint` warns on a behavioral id whose first segment is not a verb.

  Two independent mappings of one repository agreed on 95% of the Capabilities
  they found and shared 29% of the ids: one wrote `install-skills` where the
  other wrote `install-agent-skills`, one `lint-model` where the other wrote
  `lint-product-model`. The concepts matched and the nouns did not, so two
  further rules bind ids to vocabulary the model already declares.

  **A behavioral id's noun half names something the model declares.** When the
  noun half is the suffix of an Entity, Domain, Interface, Experience, or
  Screen id in the same model, use the declared name — `install-agent-skills`,
  not `install-skills`. `lint` warns otherwise. It only fires where the author
  has declared the fuller term, so it never invents vocabulary.

  **A cross-cutting id never opens with a verb.** Entity, Domain, and Business
  Rule ids name what something *is* or what must remain true, so they read as
  nouns and assertions rather than commands: `refunds-apply-only-to-existing-orders`,
  not `refund-existing-orders`. A single-segment id such as `order` is a noun by
  construction and is never flagged.
 The one
  exception is `product.md`, whose `id:` names the Product Model (it may differ
  from the repo name) and is limited to 64 characters. Compacting or expanding
  a resource never changes this logical path or id.

  Experience and Screen names repeat across Interfaces on purpose:
  `personal-library` on web and on mobile pursue the same goal and are different
  resources. Two resources of the same type sharing a path suffix below their
  Interface are **counterparts**
  — the same thing on two Interfaces. Nothing has to declare that; the path
  already says it.

- **The path owns every parent relation.** An Experience never writes
  `interfaces:`, a Capability Scenario never writes `capability:`, a Journey
  Scenario never writes `journey:`, and a Screen never writes `availability:`.
  One authority instead of two that can disagree, and reparenting becomes a
  `git mv` that reads correctly in a pull request.
- **Assets expand a resource.** Authored assets sit beside `<type>.md` in the
  expanded resource folder. Files under its reserved `implementation/`
  subdirectory describe this repository's realization instead. Typed child
  directories (`experiences/`, `screens/`, and `scenarios/`) are structural,
  not assets; any other nested directory is invalid. Plain asset files need no
  declaration. Optional `assets:` frontmatter annotates files already present:

  ```yaml
  assets:
    - file: mockup.svg
      title: Approved empty state
      state: Empty                 # Screens only; resolves to an H3 View state
  ```

  `file` is relative to the expanded resource folder and cannot escape it.
  Metadata entries are unique and must name an existing asset. `title` is
  optional. `state` is valid only on a Screen and must name one of that Screen's
  `## View states`. Unlisted assets remain valid so external tools can write
  captures without editing BusinessLens frontmatter.
- **H1 = title/name.** The first `# Heading` in the body is the resource's
  title (domains call it `name`) and is the file's only H1. Lead and
  section-body Markdown fragments cannot contain another H1 or H2; an H2 begins
  a new section instead.
- **Lead paragraph = description.** Prose between the H1 and the first `##`
  heading is the description for entities, domains, experiences, and the product.
  Journeys and both Scenario types instead use the required structured sections
  specified below and must not carry lead prose.
- **Frontmatter = relations and navigation, with one relational-prose
  exception.** Both Scenario types keep their structured `steps` in
  frontmatter so each single-line statement stays beside its kind, responsible
  Actor, Capability qualification, the Entities it touches, and route-specific
  Contexts. Other prose remains in the Markdown body.
- **Intent and Goal = recognized prose sections.** `## Intent` explains why the
  product or resource exists and which outcome it protects. `## Goal` states the
  stable Actor intent of a Journey. Both are structured prose, not separate
  resources.
- **Structured sections are unambiguous.** A recognized H2 may appear only once.
  Journey-only sections (`## Goal`, `## Success criterion`) are invalid on both
  Scenario types, and Scenario-only sections (`## Trigger`, `## Steps`,
  `## Decision points`, `## Outcome`, `## Edge cases`) are invalid on Journeys.
  `## Steps` is invalid on both Scenario types, whose one ordered path is the
  frontmatter `steps` list.
  Unrecognized H2 sections are supporting content and retain their heading and
  body through report export and expansion.
- **Structured list items are single-line.** Every item in `## Edge cases`,
  `## Information presented`, and `## Available actions` must
  occupy one physical line. Prose and continuation lines are invalid because
  they cannot be represented as report list items.
- **Set-valued lists are unique.** Product `tags` and every frontmatter relation
  list contain no duplicate value. Ordered content lists such as Scenario
  `steps` and Coverage prose are not relation
  sets and may repeat when the meaning calls for it.
- Scenario IDs are globally unique across every `scenarios/` folder.

## References

`references` is an optional extension on every semantic resource: Product,
Interface, Experience, Screen, Domain, Entity, Capability, Journey, Capability
Scenario, Journey Scenario, and Business Rule. It is not accepted in
`config.yaml`, `coverage.md`, or `taxonomies.yaml`.

```yaml
references:
  - kind: prd
    role: intent
    target: docs/prds/checkout.md
    title: Checkout PRD
  - kind: visual
    role: intent
    target: https://design.example.com/checkout
    title: Approved checkout direction
  - kind: code
    role: implementation
    target: src/checkout/handler.ts#CheckoutHandler.submit
```

Every item requires exactly `kind`, `role`, and `target`; `title` is optional.
Unknown keys are invalid.

- `kind` is `code`, `prd`, `spec`, `proposal`, `doc`, `adr`, `visual`, or `research`.
  It identifies the artifact, not what the model concludes from it.
- `role` is `intent`, `implementation`, or `context`. It explains why the
  artifact is attached to this resource. It is not a verification result or a
  freshness claim.
- `target` is the artifact address. Duplicate targets on one resource are
  invalid, even when their kinds or roles differ.
- `title` is an optional non-empty display label.
- `state` is optional and **valid only on a Screen**. It names one of that
  Screen's `## View states` H3 titles, case-insensitively, and says which
  state the artefact depicts. Nowhere else has a state set to resolve against.

For `kind: code`, `target` uses the compact
`path[#symbol][:start[-end]]` grammar. The line suffix is the last `:` whose
remainder matches `^\d+(-\d+)?$`; the symbol is everything after the first `#`
of what remains. The path must be repository-relative and tracked according to
`git ls-files`. Code references may use any role, including `intent`, but they
remain navigation rather than proof and never replace the resource's prose.

All other kinds accept either an HTTP(S) URL or a repository-relative path.
`lint` ignores a local target's query and fragment when checking the tracked
file set and warns when the path is missing. HTTP(S) targets are syntax-checked
but never fetched. Absolute filesystem paths, `file:` URLs, other URL schemes,
and backslash paths are invalid.

One Screen commonly collects several captures of the same view — one per
View state, sometimes doubled for light and dark. Without `state` they arrive
as a flat list distinguishable only by free-text title; with it, each capture is
placed beside the state it shows. Themes are deliberately not View states, so
a light and a dark capture of one state are two references sharing one `state`.

References connect the self-contained Product Model to material maintained
outside it. A model may contain no references at any Coverage status.
The deterministic CLI does not copy, download, generate, execute, or assess
referenced content. BusinessLens skills may follow curated References as leads,
but the artifact remains evidence to assess rather than proof to trust.

## Resource files

> **Illustrative examples.** The resource snippets below are non-normative
> fragments from one fictional Acme Shop model. Their names and product story
> are not required; they exist only to make the required Markdown, frontmatter,
> and cross-resource identifiers concrete.

### `config.yaml`

```yaml
schema: 8                          # folder-format version
sdd:
  paths: [openspec/]               # detected/declared SDD roots; empty if none
```

`config.yaml` has no other keys. Schema 8 is the only supported folder format.

### `product.md` or `product/product.md`

```markdown
---
id: acme-shop
summary: Discover products and complete purchases with confidence.
category: commerce
tags: [commerce]
authors:
  - name: Acme
    url: https://example.com
license: MIT
limitations: []
---

# Acme Shop

One-paragraph description of the product.

## Intent

Why this product should exist and the outcome it protects.

## Anything else

Kept in the repo as supporting context.
```

`## Intent` is compiled into the report's product intent. Other unrecognized
sections are preserved as ordered `{ heading, content }` supporting sections so
a report can be expanded without silently losing authored context.

The Product frontmatter may also carry portable identity and attribution used
by every report host. `summary` is a single-line short description (400
characters maximum), `category` is a lowercase kebab-case classification,
`authors` is a list of `{ name, url? }` records, and `license` is an SPDX
license identifier. The H1 remains the Product title and the lead prose remains
its full description.

The compact form is `.businesslens/product.md`. Adding a Product logo expands
it to `.businesslens/product/product.md`, with the identity asset at
`.businesslens/product/logo.svg`.

The Product may have one visual identity asset, `logo.svg`.
It is a self-contained, UTF-8 SVG with a `viewBox`, at most 256 KiB, and cannot
contain active content, event handlers, embedded documents, imports, or network
references. It is rendered only as an image and is not embedded in the Product
Report. Public Blueprints require it; general local Product Models may omit it.

General Product Models may omit this metadata. A Product Report always carries
the fields, using the full description as the summary fallback and `null` or an
empty list for omitted optional values. The public Blueprint publication
profile additionally requires a category, at least one tag, at least one
author, a license, and `logo.svg`. There is no separate Blueprint manifest.

### `taxonomies.yaml`

```yaml
scenarioKinds:
  - id: primary
    name: Primary
    description: Expected observable behavior path.
    colorSlot: 1
  - id: edge
    name: Edge case
    description: Alternative or failure path.
    colorSlot: 6
```

### `interfaces/<id>.md` or `interfaces/<id>/interface.md`

An Interface is a supported interaction form through which Actors access the
Product and for which product behavior can be independently required and
verified. A customer web application, mobile application, operator CLI, partner
API, and inbound webhook endpoint are Interfaces. Frameworks, internal adapters,
and private component APIs are not.

An Interface is **inbound**: something arrives at the Product through it. An
outbound connection the Product opens to a third party is not an Interface,
even when the integration is stable, versioned, and vendor-supported.

```markdown
---
type: web
actors: [shopper, guest]
entryPoints:
  - web: /
---

# Customer web application

The browser interface through which shoppers use the store.

## Capability boundary

Supports customer-facing behavior. It does not expose store operations.
```

`type` is required and is one of `web`, `mobile-app`, `desktop-app`, `cli`,
`api`, `webhook`, `messaging`, `voice`, `device`, or `agent`. It states the
supported interaction contract, never its implementation technology: `web` is
valid; `react` is not. `agent` is the surface an AI coding harness reaches
through installed skills or tools — a contract with its own Actors, boundary,
and independently verifiable behavior, not the harness's own interface. An Interface has exactly one type; independently supported
types are separate Interfaces. `actors` names at least one Entity that `acts`:
**who uses** the Interface. The list is descriptive — a permission claim lives
only in a Business Rule — and `lint` holds every Step to it as consistency
between the Steps and the surface they happen on. `entryPoints` is optional and
contains product-facing root addresses. On an
Interface a key is one of two things: **that Interface's own `type`**, for an
address in its own vocabulary, or **the id of another Interface**, for a surface
a reader arrives from. A local web report opened by an operator command declares
`operator-cli: shop report` beside its own `web: /` — where you reach it from is
a fact about the surface reached, and it has nowhere else to live. Its own id is
not a key: that is what `type` already says. On an Experience or a Screen the key
names the containing Interface's id, unchanged. One field,
one rule per resource type, both checked by `lint`. H1, lead
description, and `## Capability boundary` are required. An Interface has no
access mode or exit contract.

### Outbound dependencies

An external system the Product calls — a syndicated feed it polls, a payment
processor it charges, a mail provider it sends through, a model API it queries —
does not act and gets no Interface. It may still be an Entity, when the Product
keeps or reasons about instances of it.

Model it where its result is observed:

- the Capability that makes the call names the external system in its prose and
  states what triggers the call;
- its `availability` names the Interfaces where an Actor observes the outcome,
  never a synthetic Interface;
- product-significant failure behavior — what the Actor sees when the external
  system is unavailable, slow, or wrong — is a Capability Scenario;
- the provider's published contract attaches as a `references` entry with
  `kind: spec` or `kind: doc` and `role: context`.

Direction decides. When the same third party also calls the Product — a webhook,
callback, or push subscription — that inbound interaction is through an Interface
and the third party is an Entity that `acts`. A feed provider the Product polls
is a dependency; a feed provider that pushes updates to the Product acts.

There is no external-system resource type. An outbound dependency shared by several
Capabilities is described by each Capability that depends on it.

### `interfaces/<interface-id>/experiences/<id>.md` or `<id>/experience.md`

An Experience is a coherent context of Product use with a stable audience,
access boundary, and capability boundary. **It belongs to exactly one
Interface** — the one whose folder holds it. Experiences are optional: create
them only when named contexts distinguish meaningful Product behavior inside an
Interface.

The same context on two Interfaces is two Experiences, not one shared resource.
They differ in screens, reach and affordances even when they pursue the same
goal, and one file cannot describe both without hiding where they diverge.
Give them the same file or folder name and they are counterparts by
construction.

```markdown
---
actors: [store-admin]
access: restricted              # public | authenticated | restricted
entryPoints:
  - admin-web: /admin
---

# Administration

Where authorized operators manage the store and its orders.

## Capability boundary

Supports store operations. It does not expose a shopper's private account.
```

`actors` is a non-empty list of Entities that `acts` — who uses the Experience —
and every one must be supported by the owning Interface. `access` is required. Optional `entryPoints` key the
owning Interface only. H1, lead description, and `## Capability boundary` are
required. There is no `exit` field and no `interfaces` field — the path names
the Interface. An Interface with one undivided usage context does not need a
ceremonial Experience.

Experiences form an exhaustive, potentially overlapping cover of the Interface
that holds them. The union of their Actors must equal that Interface's Actor
list, so no Interface Actor becomes unreachable when Screens move under
Experiences.

An optional ordered `screens:` list names this Experience's own Screen ids
and declares **reading order only** — reachability stays with the tree. Entries
must resolve to children and be unique; unlisted children sort after,
alphabetically. The same field is available on `interface.md` for an Interface
that holds Screens directly.

### Availability

Capabilities declare `availability`: a unique, non-empty list of Contexts.

```yaml
availability:
  - place: operator-cli
  - place: customer-web::storefront
  - place: customer-mobile::storefront
```

Availability states intended Product meaning, never implementation status.

A **Screen does not declare availability** — its path is its placement.
Scenarios and Journeys do not declare availability either. A Scenario Step
names one concrete Context per route, and the Context's `place` is its resolved
Interface, Experience, or Screen. Business Rules use the same Context object as
a selector.

### `domains/<id>.md` or `domains/<id>/domain.md`

A Domain is a coherent region of the Product's subject matter — its own
vocabulary and its own invariants. It is not code architecture, not Journey
ownership, and not a folder for Capabilities that had nowhere else to go.

```markdown
---
colorSlot: 3
---

# Ordering

Everything between a full cart and a fulfilled order.

## Boundary

Owns cart contents, order state, and the transition between them. It does not
own catalog information, payment instruments, or fulfilment logistics.
```

Optional `colorSlot` and `references` frontmatter. H1 = name, lead paragraph =
description. `## Boundary` is required and must state both what the region
covers **and** something it explicitly does not own; a Boundary that only
asserts inclusion is a label, not a region, and is a `lint` error. A Domain
naming fewer than two Capabilities is a `lint` warning — one Capability is not a
region, and a Domain that exists to re-gather Capabilities you have just split
is a folder. The entire Domain collection is optional.

**Domain is an axis, not a level.** It classifies members of both the Interface →
Experience → Screen hierarchy and the behavior hierarchy, so it neither contains
nor is contained by anything.
`domain` on a Capability and on an Entity are the only *authored* Domain edges
in the model; every other Domain relation is derived. A Screen, Experience or
Journey is about the Domains its Capabilities are about, and computing that is
more reliable than asking an author to restate it — a second authority can
disagree with the first. Only Capabilities count toward the two-Capability
threshold: an Entity's `domain` classifies the thing, it does not make a
region.

`domain` is optional and single. A Capability about two subject regions means
either a `## Boundary` is wrong or the Capability should split.

### `entities/<id>.md` or `entities/<id>/entity.md`

An Entity is a thing the Product keeps or reasons about, which an Actor can
point at and the Product can tell apart from another one — an order, a listing,
a saved item, and the Reader who saved it. Capabilities name the Product's
verbs; Entities name its nouns, the people and systems that act on it included.

**The test is identity, not storage.** A draft recommendation the Product never
persists is still an Entity when a reader points at it and the Product
distinguishes it from another. A database row no Actor can name is not.

**The unit is the naming test**: a thing an Actor would call *"this one"*. A
shopper says *"this order"*, never *"this order line"* — that is "The items
ordered" inside Order. A reader says *"this item"* and *"this collection"*, but
"library" is simply all of them. Containers and parts are not Entities.

Three more things are not Entities, and each is something the Product genuinely
handles, which is why the naming test alone lets them through.

**Not a representation of another Entity.** A serialization, export or rendering
is that thing in another shape, not a second thing beside it. If you can
regenerate it from an Entity, it belongs in that Entity's information and in the
Capability that produces it.

**Not a receipt the Product keeps for itself.** A marker file, a lock, an index
the Product needs in order to work safely — ask who the record is *for*. An
Actor never points at these; the Product does.

**Not the Product itself.** Its surfaces, its shipped content, and its closed
vocabularies are what the Product *is*, not what it keeps. A Product keeps
information about *instances* of an Entity; where there are no instances, only
members of a fixed list, that is a vocabulary.

Apply this to the thing you would name, never to the classification above it. A
closed list of kinds is a vocabulary; the things those kinds classify are not,
and a Product holding a folder full of them is holding instances. "Payment
method" may be a fixed list of four while every payment is its own thing.

The third is the one that traps a modelling tool, and the discriminator is
worth stating: **does the Product keep information about instances of this, or
is this the Product itself?** A tool whose subject is product models keeps
`capabilities/` full of them, so Capability is an Entity for it. The same tool
ships its own skills rather than keeping records about them, so a skill is not.

**How many: write `## Information kept` before you decide.** Candidates that
share a family name — document types, event kinds, payment methods — are one
Entity when a single list of kept facts is true of all of them, and several when
it is not. Write the list first. If it needs *"depending on the kind"*, or
carries facts that hold for some members and not others, the shared name is a
category and its members are the Entities.

Being stored, parsed and rendered the same way does not make them one. That is
how the Product *handles* them; this asks what it *keeps* about them.

**When the call is close, split.** Anyone can merge two Entities later. A
collapse deletes the difference and leaves nothing in the model saying it was
ever there, so a reader cannot tell there was a question. An author with nobody
to ask splits, and records the choice.

**When one list is contained in another, the intersection is not the answer.** A
shared list can always be produced by discarding whatever differs, so the
procedure above says nothing useful about a candidate whose kept information is
a subset of another's. Ask a different question: **does the smaller one have an
address of its own?**

Being kept inside the larger thing is not the test. That is storage, and storage
is never the test here. Ask what can name it on its own — a file, a route, a
scope a command accepts, an id another resource cites. "The items ordered" has
none of those and lives inside Order. Something with any of them is its own
Entity, however much its information overlaps and however firmly the larger
thing contains it.

```markdown
---
domain: ordering                 # optional
relations:
  - entity: catalog-product
    verb: was placed for
    cardinality: many-to-many
---

# Order

A shopper's confirmed intent to buy.

## Information kept

- **Items ordered** — the items and their quantities
- **Total charged** — the amount taken from the shopper
- **When placed** — when the shopper submitted it

## States

### Pending

Submitted and awaiting payment settlement.

### Confirmed

Paid and accepted; stock is committed.

### Refunded

Reversed after confirmation.
```

```markdown
---
kind: person
acts: external
relations:
  - entity: order
    verb: owns
    cardinality: one-to-many
---

# Shopper

A person who browses the catalog and buys products.

## Information kept

- **Delivery address** — where their orders are sent
```

```markdown
---
kind: system
acts: external
---

# Payment gateway

The processor that posts settlement results back to the Product.
```

**At least one of `## Information kept`, `## States`, and `acts` must be
present.** A thing may have information and no lifecycle worth naming, a
lifecycle with almost nothing kept about it, or — a payment gateway — nothing
kept at all and a reason to exist because it acts. Requiring both of the first
two is what produced an earlier arbitrary two-state threshold.

**An Entity that acts.** `acts` is optional and, when present, is `external` or
`internal`, relative to the Product boundary: whether the thing acts
independently outside the Product owner's boundary, or on the Product owner's
behalf. A staff operator is usually internal even when working remotely; a
partner system is usually external even when connected over a private network.
`kind` is `person` or `system`, is **required when `acts` is set**, and is
invalid otherwise: an Order says nothing, because *it's a thing* is the
default, and an Entity that acts always says which of the two it is.

Two independent questions decide, neither ranking the other. *Does the Product
keep or reason about instances of it?* — everything modelled does; that is why
everything is an Entity. *Does it initiate, with a goal or privilege of its own,
and must the Product keep a stable inbound contract for it?* — then it `acts`.

| | keeps / reasons about | initiates under a contract | |
| --- | --- | --- | --- |
| Reader | yes | yes | Entity + `acts` |
| Store admin | yes | yes | Entity + `acts` |
| Payment gateway | reasons about | yes — posts webhooks | Entity + `acts` |
| AI agent harness | reasons about | yes | Entity + `acts` |
| Order | yes | no | Entity |
| Employee (payroll) | yes | no — never signs in | Entity |
| Feed source the Product polls | yes | no | Entity |
| An internal service with its own credentials | no | no — the Product keeps no contract with its own component | not modelled |
| The Product's own scheduler | no | no — that is `unattended` | not modelled |

The third clause is what bounds *privilege*. **A privilege that exists only in
code is authorization, not product meaning**, so *service X may cancel orders,
service Y may not* is deliberately unsayable. If two roles have the same goals
and permissions, they are one Entity. A thing that starts acting gains one
field; there is no file move, no id change, and no migration.

An external system acts only when it **initiates**. A system the Product calls
out to is a dependency of the Capability that calls it: it has no goal inside
the Product, no privilege to grant, and no inbound interaction contract the
Product must keep stable for it. Direction decides, not ownership — the same
third party can be a dependency in one direction and act in the other when it
also calls back. See [Outbound dependencies](#outbound-dependencies).

**An AI agent harness acts**, with the id `ai-agent`, `kind: system` and
`acts: external`. It initiates, it holds a privilege nobody else has — it reads
and writes on the person's behalf — and what it does is not fully determined by
the person who invoked it: it chooses what to inspect, what to propose, and when
to stop. A browser makes no such choices, which is why a harness is not merely
the runtime an `agent` Interface is delivered through. Name it `ai-agent`
rather than after one use of it, since the same participant appears in products
that have nothing to do with code. This promotes nothing else by analogy: a CI
runner executing a fixed command has no latitude of its own.

**The word Actor names a role, not a type.** An Entity that acts is *an Actor*
in the position where it acts — a Step's `actor`, an Interface's, Experience's
or Journey's `actors`, a Business Rule grant's `actors`. Every such reference
must name an Entity that `acts`, and `lint` errors otherwise.

**`## Information kept`** is a bullet list of **named** single-line facts the
Product keeps about the thing. Each is `- **Name** — prose`: the name in bold,
an em dash with a space on each side and nothing else as the separator, and
non-empty prose after it. Names are unique within the Entity and are cited by
exact match — a Business Rule's `facts` target and its `when` condition are the
only places that cite one; Steps and Screens never do. The idiom is the one
`## States` already uses, where an H3 titled `Pending` is cited as
`from: Pending`.

It is **what the Product keeps, never how it is stored**: *When placed*, not
`created_at TIMESTAMP`. No types, no cardinality, no keys, and **no structured
relations between Entities** — *Items ordered* is prose, never `hasMany`. A fact
is addressable, never typed: addressable is what a field-level Rule and a
derivation need; typed is a data model. A cache is out of the model; the data it
holds is in when the Product promises it. The word *kept* means held, not
persisted, and computed information is still a fact.

`relations` is optional and declares edges to other Entities — an Entity that
acts included, which is how ownership is said: the Shopper above `owns` Orders,
and a Business Rule walks that edge back to find who may. Each is
`{ entity, verb, cardinality }`: `verb` is the product's own word for the
relationship, and `cardinality` states **both ends**, reading source to target.

```yaml
relations:
  - entity: item
    verb: publishes
    cardinality: one-to-many       # one Source publishes many Items,
                                   # and an Item comes from exactly one Source
```

**Both ends, because one end is not a relationship.** `many` alone says a Source
publishes many Items and leaves unanswered whether an Item may come from two
feeds — which is a product decision, not a storage detail. *Can I save this
article into two collections* has an answer, and a single end cannot hold it. An
author who needs the second end without a place to put it writes the same
relationship twice, facing itself, which is exactly what the one-sided rule below
exists to prevent.

`cardinality` is `one-to-one`, `one-to-many`, or `many-to-many`.
**`many-to-one` does not exist**: declare that relationship from the other
Entity, where it reads `one-to-many`. Two authors cannot then encode one
`1:N` from opposite sides, and the vocabulary shrinks instead of growing.

**A relation is declared on one side only** — the inverse is derived, so the two
sides cannot disagree. Two Entities that declare relations *at each other* are a
`lint` warning naming both files: with both ends stated that is the same
relationship written twice, and the two can now contradict each other outright.
It stays a warning because two genuinely different relationships between one pair
are legal.

A relation may target this same Entity — a Comment replies to another Comment, a
Task blocks another Task — and only a duplicate edge is invalid. A relation
never satisfies the no-orphans rule below, because a cluster of Entities
referencing each other while no behaviour touches any of them is still
vocabulary nobody uses.

**`## States`** contains H3 state names, each followed by non-empty prose. The
first listed state is the one a thing starts in. **The Entity declares its
states and nothing about the moves between them.** The lifecycle is composed
from Scenario Steps: a Step's `entities` entry says which Entity it creates,
changes or removes, and from and to which state, and the report draws the
machine from every Scenario in the model. There is no `transitions` key — one
that is still authored is a `lint` error naming the Step keys that replaced it —
and `## Transitions` and `## Relations` are invalid sections, exactly as
`## Steps` is invalid on a Scenario: the frontmatter and the Steps are the one
authority, and a section beside them is a second one that can disagree.

A per-Entity list could never express a combined lifecycle — *settling a payment
confirms an Order and creates a Shipment* is one act on two things, which only a
Step can say — and it stated a second time what a Step already states.

`lint` composes every Scenario and reports what the composition is missing:

- **Unreached state** — a warning: a state other than the first that no Step
  ever leaves anything in.
- **Unproduced origin** — a warning: a Step declares `from: Confirmed`, nothing
  produces Confirmed, and it is not the first state.
- **No creation** and **no termination** — notes the report shows on the Entity
  page, never `lint` findings: an Entity with states that no Step creates, or
  that nothing ever removes. A Catalog product no Capability creates is a real
  Entity whose instances pre-exist the model.

`domain` is optional and single. H1 = name and the lead paragraph = description.

Neither an asset nor a `references` entry may carry `state` here; `state` stays
valid only on a Screen. A Screen's View states are what a view *looks like*, and
a capture depicts one of them. An Entity's states are lifecycle, and no artifact
depicts "Confirmed" — it depicts the screen that shows a confirmed thing, which
is where the annotation already belongs.

**No orphans.** An Entity must be changed by a Step, presented by a Screen,
named as an actor — on a Step, an Interface, an Experience, a Journey, or a
Business Rule grant — or read by a Business Rule, as a condition's `entity` or
a `configuredBy`, which is how a settings Entity earns its place. A Step's read
never counts, and neither does a relation. An Entity nothing points at is a
`lint` error: it is either unused vocabulary or a relation somebody forgot to
declare.

An Entity never declares Capabilities, Screens, availability, or who may act on
it. Steps say what changes it, a Screen says what presents it, a Business Rule
says who may; every other Entity relation is derived. Entity states are the
authority for a lifecycle, and a Screen's `## View states` describes what that
**view** looks like — the two are never merged.

### `capabilities/<id>.md` or `capabilities/<id>/capability.md`

A Capability is a stable ability of the Product. It has no necessary beginning
or end and may support several Journeys, Experiences, Screens, and Interfaces.
Capabilities and their observable Capability Scenarios are the behavioral core
of the model; Journey composition is optional.

```markdown
---
domain: ordering                 # optional
availability:
  - place: customer-web::storefront
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Checkout

Turns a valid cart into a confirmed order.

## Intent

Let a shopper complete a purchase without losing cart state on a recoverable
failure.
```

**A Capability declares nothing about Entities.** What it changes is what the
Steps of its Scenarios say it changes, and a report derives the aggregate —
*Order · creates → Pending · changes → Confirmed · 3 Scenarios*. A file still
carrying `entities` is refused with a message naming the replacement, the
`entities` list on each Step. A Capability that only presents or inspects a
thing has Steps that `reads` it, and the Screen that shows it carries
`entities`.

`availability` is required and needs at least one valid
Context. Its place is
an undivided Interface or one Experience of a divided Interface. `domain` is
optional and, when present, names exactly one Domain. Actors are expressed by
Capability Scenario, Journey, Journey Scenario, Actor-bound Interface, and
optional Experience relations. Business Rules own their applicability, so Capability
files do not duplicate Rule IDs. Capability Scenario files own the acceptance
relation, so Capability files do not duplicate Scenario IDs. A Capability
Scenario is the only direct acceptance coverage for a Capability; Journey
Scenario use does not satisfy that coverage rule. Missing coverage is an error
when `coverage.md` is `complete`, a warning when it is `partial` or `draft`, and
always a publication error for a public Blueprint.

A Capability is the smallest durable behavior that remains independently
meaningful, not necessarily the smallest UI action or code operation. Capability
Scenarios vary the conditions, route, or observable result of that one behavior;
they must not act as hidden sub-capabilities. When supposed Scenarios instead
describe independently meaningful verbs with different purposes, outcomes,
permissions, availability, or Business Rules, split them into Capabilities. For
example, `manage-repositories` is too broad when its cases are actually create,
configure, archive, and delete behaviors with distinct contracts. Splitting it
does not create a need for a Domain: those four Capabilities were already about
the Repositories subject region before the split, and a Domain that exists only
to re-gather them is a folder, not a region.

### `business-rules/<id>.md` or `business-rules/<id>/business-rule.md`

A Business Rule states a durable constraint, derivation, or authorization policy
that must hold across the Product. Permission is a kind of Business Rule; not
every Business Rule is a permission. **Permission claims appear only in Business
Rules.**

```markdown
---
appliesTo:
  - type: capability
    id: checkout
    contexts:
      - place: customer-web::storefront
  - type: journey
    id: browse-and-buy
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Stock must be available

An order can be confirmed only while every requested item has sufficient
available stock.

## Intent

Never accept an order the product cannot fulfill.

## Rationale

Inventory may change between browsing and final submission, so checkout must
revalidate it.
```

```markdown
---
appliesTo:
  - type: entity
    id: order
    effect: changes
    to: Refunded
permits:
  - actors: [store-admin]
    when:
      - { fact: Total charged, at-most: 100 }
  - configuredBy: store-settings
    when:
      - { fact: Total charged, over: { configuredBy: store-settings } }
---

# Refunds need an operator

A refund is issued by a store operator, and above the store's approval threshold
only by whoever the store configures.
```

```markdown
---
appliesTo:
  - type: entity
    id: order
    facts: [Total charged]
---

# Total charged

Total charged always equals Subtotal plus Tax minus Discount.
```

The lead paragraph is the rule statement; `## Intent` and `## Rationale` are
optional prose. `appliesTo` is a required non-empty list of typed targets, and
targets are additive: the Rule governs their union. Business Rule owns these
relations; consumers derive every backlink.

**Behavioural and Context targets.** A behavioural target uses `type` =
`capability`, `capability-scenario`, `journey`, or `journey-scenario`, requires
`id`, and may use a non-empty `contexts` list to narrow that target. Without
`contexts`, the Rule applies to all supported Contexts of the target. A direct
Context target uses `type: context` plus one nested `context` object instead of
`id`:

```yaml
- type: context
  context:
    place: operator-cli
```

A Context selector on a behavioural target must match at least one Context
supported by that target. A selector naming an Interface or Experience matches
descendant places; a Screen selector matches that Screen. Duplicate selectors
and a parent selector paired with its redundant descendant are invalid. Do not
target both a Capability and one of its Capability Scenarios, or both a Journey
and one of its Journey Scenarios; the ancestor already governs the child.
Domains remain navigation-only, so Rule Domain backlinks are derived through
targeted behaviour rather than authored.

**A Business Rule governs two or more behaviours, a Context independent of any
single behaviour, or a thing.** Anything true of exactly one Capability is that
Capability's business — a `condition` Step or its Scenario Outcome — not a
Rule. The boundary is checkable and `lint` enforces it: a Rule whose
`appliesTo` resolves to exactly one behavioural resource, with no `contexts`
narrowing it, is a `lint` warning naming the Capability that should own it
instead. A Rule with a `type: context` target is always valid, because a
constraint on an interaction context belongs to no behaviour. **A Rule with an
Entity target is always valid**: a durable invariant or permission on a thing is
a Rule even when it selects a single operation, because the two homes the
warning suggests do not exist for a permission.

**Entity targets.** An Entity target uses `type: entity`, requires `id`, and may
carry `effect`, `from`, `to`, `facts`, and `contexts`:

```yaml
appliesTo:
  - type: entity
    id: order
    effect: changes            # optional — creates | changes | removes | reads
    from: Confirmed            # optional — the state the operation leaves
    to: Refunded               # optional — the state it lands in
    facts: [Margin]            # optional — the facts it governs
    contexts: [{ place: admin-web::order-console::order-detail }]   # optional
```

**A target selects; a grant conditions.** `effect`, `from` and `to` select
Steps by the keys their `entities` entry already carries: `from` is valid with
`changes` and `removes`, `to` with `creates` and `changes`, and neither with
`reads`. Every state named is one the Entity declares. Whether the instance is
in some state *when the operation happens* is a condition and lives in a grant's
`when`. `facts` names facts of this Entity by their exact name; a fact-scoped
Rule governs information — a derivation, or field-level visibility — not an
operation. `contexts` scopes the Rule to places; an Entity has no availability,
so the selector must name a Screen that presents the Entity, or an ancestor of
one.

**A place-scoped Rule is not escaped by omitting `contexts`.** A Step that omits
them is shared by every route, which puts its operations inside the Scenario's
own places — the union of the places its contextualized Steps name — and a
place-scoped Rule selects it there. Reading such a Step as happening nowhere
would let deleting a key sidestep an authorization claim, and a claim a deletion
escapes is not a claim.

**The minimal selector is canonical.** A `from` that every Step landing in `to`
already leaves from is a `lint` warning, as is a `when` state condition every
selected Step already satisfies. Refunds only ever leave Confirmed, so
`{ changes, to: Refunded }` is the Rule and `{ changes, from: Confirmed, to:
Refunded }` is flagged. The minimal form is also the safe one: a refund added
later from Pending is governed by the first and silently open under the second.

**`permits`** is optional and has three states:

| `permits` | Says |
| --- | --- |
| omitted | this Rule makes no authorization claim |
| `[]` | the selected operation is forbidden to everyone |
| a list of grants | the operation is permitted through any one of them |

Silence is not a claim. A lifecycle composed from Steps can be incomplete, so a
Step that never appears cannot be read as *nobody may*. `permits: []` is the one
way to say it, and it is checkable: a Step performing that operation is a
`lint` error naming the Rule, and `verify` confirms the code refuses it.

```yaml
# a Refunded order is never cancelled — and nothing else is claimed
appliesTo: [{ type: entity, id: order, effect: changes, from: Refunded, to: Cancelled }]
permits: []
```

**A Rule with `permits` targets Entities only.** An operation is an Entity
effect on a Step. *Who may perform this Capability* with no Entity in sight is
what Interface `actors` already records as *who uses it*, and checking it over
Steps would duplicate the Entity checks. A Rule carrying `permits` with a
behavioural or Context target is an error.

**The algebra.**

- Targets within one Rule select the union of governed operations.
- Grants within one Rule are **OR**.
- Keys within one grant are **AND**.
- Rules that select the same operation are **AND** — every matching Rule
  constrains it.
- An operation no Rule with `permits` selects is open.

```yaml
# the owner, or an admin
permits:
  - { actors: [store-admin] }
  - { related: [{ verb: owns, entity: shopper }] }

# an admin, and only while the Order is still Confirmed
permits:
  - { actors: [store-admin], when: [{ state: Confirmed }] }

# the owner under 100; at 100 and above, an admin
permits:
  - { related: [{ verb: owns, entity: shopper }], when: [{ fact: Total charged, under: 100 }] }
  - { actors: [store-admin],                      when: [{ fact: Total charged, at-least: 100 }] }
```

AND across Rules is what lets a broad Rule and a narrow one compose: *owner or
admin may change an Order* plus *admin may refund* yields admin-only refunds
without either Rule knowing about the other. Its cost is the split-grant trap:
*the owner may read a Collection* and *a Visitor may read a Published
Collection* written as two Rules AND to owner-only. Grants meant as alternatives
sit in one Rule, and `lint` warns when two permission Rules carry identical
target selectors.

**Every grant names a who.** A grant needs at least one of `actors`, `related`,
`self`, `unattended`, `configuredBy`. An empty grant, or a grant with only
`when`, is an error: *anyone* already has an encoding — list every Entity that
acts — and a second one would be silent. A grant may carry more than one
who-key, but only one of them can do work: `related` and `self` already fix
which Entity the actor is, so an `actors` list beside either restates it when it
names that endpoint and contradicts it when it does not — the second can never
be satisfied and is an error. *An admin who is also the owner* is not a grant
shape; it is an `owns` relation whose endpoint is the admin Entity. AND within a
grant is for a who-key and its `when` conditions.

| Grant key | Says | Value |
| --- | --- | --- |
| `actors` | these may | ids of Entities that `acts` |
| `related` | whoever stands in this relation to the instance may | a path of `{ verb, entity }` segments |
| `self` | the instance itself may | `true` |
| `when` | only while these conditions hold | a list of conditions, AND-ed |
| `unattended` | the Product's own schedule may | `true` — nothing else |
| `configuredBy` | gated, by data the Product does not own | the id of the Entity holding the configuration |

**`related`** is a path from the Rule's one Entity target, walking declared
relations and their derived inverses. Each segment names the verb and the
Entity it arrives at, so a hop is never ambiguous — a Workspace *contains*
Documents and a Folder *contains* Documents, and both keep the product's own
word for it:

```yaml
# document  ←—contains—  workspace  —has member→  user
appliesTo: [{ type: entity, id: document, effect: changes }]
permits:   [{ related: [{ verb: contains, entity: workspace }, { verb: has member, entity: user }] }]
```

`lint` checks that the Rule has exactly one Entity target to start from, that
each segment matches exactly one relation, declared or inverse, from the Entity
the path is currently at, and that the last segment lands on an Entity that
`acts`. A hop through a self-relation — a Comment that replies to a Comment — is
refused: naming the Entity does not give it a direction. `related: []` is an
error. **`lint` never touches an instance.**

**`self: true`** is the zero-hop path: the instance itself may. *Shoppers keep
their own address* targets the Shopper's *Delivery address* fact and permits
`self`; `actors: [shopper]` would have said any Shopper. It requires the
targeted Entity to `acts`.

**`when`** is a list of conditions, AND-ed, so a one-condition grant and a
three-condition grant have one shape. Each condition names a `fact` with exactly
one operator, or a `state`:

```yaml
when:
  - { fact: Total charged, over: 100 }                                  # hard-coded
  - { fact: Total charged, over: { configuredBy: approval-policy } }    # customer-set
  - { entity: workspace-settings, fact: Approval required, is: true }   # feature flag
  - { state: Published }                                                # the instance's state
```

| Operator | Meaning |
| --- | --- |
| `over` | > |
| `under` | < |
| `at-least` | ≥ |
| `at-most` | ≤ |
| `is` | = |
| `is-not` | ≠ |
| `present` | the fact has a value |
| `absent` | it does not |

**The operator implies the comparison; the fact declares no type.** `at-least`
and `at-most` exist because the off-by-one argument holds only for integers and
facts are untyped: `over: 99.99` is the wrong rule for money and for time.
`lint` checks the fact and any named Entity resolve, and nothing more — whether
*Total charged* holds a number is `verify`'s job against code. A threshold is a
scalar or `{ configuredBy: <entity-id> }`.

`fact` defaults to a fact of the targeted Entity and may name another through
`entity`, which is how thresholds and feature flags work: the value is a fact of
a settings Entity and the Rule reads it. `state` says *the instance is in state
X when the operation happens*: it must be a state of the targeted Entity, it is
valid on every target but `creates`, and it cannot be combined with `entity`.
It exists because two kinds of Step carry no state for a target to select by — a
`reads` Step, and an information change, which is `changes` with neither `from`
nor `to`. *Anyone may read a Published collection* and *the shopper edits
delivery details only while Pending* are both `when` state conditions. A
defaulted `fact` or a `state` needs exactly one Entity target to resolve against.

**A modelled product's own RBAC** is product behaviour, not this layer. A fixed,
shipped set of roles is a closed vocabulary: Entities that act, and
`permits.actors` works directly. User-defined roles created at runtime are
instances: an Entity `Role` with its own lifecycle, `assign-role` a Capability,
and this layer constrains who may create one — never one Entity per customer
role. ABAC policies on attributes are likewise an Entity `Policy` and the
Capabilities that define and evaluate it.

**What `lint` checks.** `lint` checks structural eligibility. It cannot prove
runtime ownership, a fact's value, or customer configuration, and never claims a
runtime grant is satisfied. A Step's actor has a **possible grant** in a Rule
when some grant of that Rule could admit it — which reads the grant's keys the
way the algebra above does, **AND**, so every key the grant carries must hold at
once, and a key it omits constrains nothing:

- `actors`, when present, lists the Step's actor;
- `related`, when present, ends on the actor's Entity;
- `self`, when set, requires the actor to be the targeted Entity;
- `unattended` is set exactly when the Scenario is unattended;
- `configuredBy` constrains nothing structurally, because the value is the
  customer's;
- and every `state` condition in that grant equals the Step's `from` when the
  Step has one.

Only one who-key narrows the actor, so a grant reads as that key and its `when`
conditions. `related` ending on Shopper already says the actor is a Shopper, and
an `actors` list beside it that excludes Shopper describes nobody — refused
rather than silently closed. Alternatives are separate grants, which is what OR
within a Rule is for.

Structure — errors unless marked:

- `permits` on a Rule with a behavioural or Context target.
- A grant with none of `actors`, `related`, `self`, `unattended`,
  `configuredBy`; `unattended` or `self` other than `true`; `related: []`.
- `permits.actors`, a `related` endpoint, or a `self` target naming an Entity
  that does not `acts`; `configuredBy` naming a missing Entity.
- `related`, a defaulted `fact`, or a `state` condition on a Rule with other
  than exactly one Entity target.
- A `related` segment matching no relation, declared or inverse, from the
  current Entity; matching more than one; or passing through a self-relation.
- A grant whose `actors` excludes the type its `related` path ends on — it can
  never be satisfied.
- `when` not a list; a condition with no operator or two; an operator outside
  the eight; a `fact` that does not resolve on the targeted Entity or on
  `entity`; a `state` that is not a state of the targeted Entity, on a
  `creates` target, or combined with `entity`.
- An Entity target whose `id`, `from`, `to`, `facts` entry, or `contexts` place
  does not resolve; `from` on a `creates` or `reads` target; `to` on a
  `removes` or `reads` target; a `contexts` place that presents the Entity
  nowhere.
- **Warning:** two permission Rules with identical target selectors.
- **Warning:** a target `from`, or a grant `state` condition, that every Step
  the target selects already satisfies.

Rules against Steps and Screens — errors, ungraded by `coverage.status`:

- A Step performing an operation a Rule closes with `permits: []`, naming the
  Rule.
- A Step performing a governed operation whose actor has no possible grant in
  some Rule selecting it.
- A governed operation on a Step with no `actor` in an attended Scenario.
- An unattended Scenario performing a governed operation that no `unattended`
  grant permits.
- A Screen presenting an Entity whose `reads` are governed, where no Actor using
  the Screen's container has a possible grant.

Fact-scoped Rules are checked by Screen reach only, since a Step cannot cite a
fact; the rest is `verify`'s. A derivation is prose plus `facts`; there is no
machine-readable arithmetic, because one would need defined behaviour for types,
units, money, rounding, collections, missing values and time.

### `.../screens/<id>.md` or `.../screens/<id>/screen.md`

A Screen is a meaningful user-visible view where product information or
capabilities are exposed. It is platform-neutral: it need not be a web page,
have a URL, fill a device display, or correspond to one implementation module.
The whole `screens/` collection is optional so non-visual products remain valid.

```markdown
---
capabilities: [browse-catalog]
entities: [catalog-product]
entryPoints:
  - customer-web: /products/:id
  - customer-mobile: acme-shop://products/:id
references:
  - kind: visual
    role: intent
    target: docs/ui/product-record.png
    title: Current visual reference
---

# Product record

Shows the information a shopper needs to evaluate one product.

## Intent

Help a shopper decide whether to add the product to the cart.

## Information presented

- Product name and description
- Price and availability

## Available actions

- Add the product to the cart
- Return to the catalog

## View states

### Available

The product can be added to the cart.

### Unavailable

The reason it cannot be purchased is explained.

## Capability boundary

The screen does not change product or inventory data.
```

`capabilities` needs at least one item. A Screen has no `availability` field:
its path names its containing Interface or Experience, and every referenced
Capability must declare an availability Context containing the Screen — for a
Screen an Interface shares beside its `experiences/`, one for every Experience
of that Interface.
`entryPoints` is optional; entry-point keys must name the Interface containing
the Screen. Scenario participation is derived from Scenario Step Contexts whose
place names the Screen; a Screen never authors
Capability or Journey Scenario ids. The H1, lead description,
`## Information presented` bullet list, and `## Capability boundary` prose are
required. `## Information presented` is prose about what *this view* shows; it
never cites an Entity fact by name — a Screen names the Entities it presents in
`entities`, and only a Business Rule cites a fact. A Screen has no acceptance
surface, so its `entities` list is authored, where a Capability's is derived. `## Available actions` is optional but, when present, must contain a
bullet list. `## View states` is optional; each state is an H3 name followed
by non-empty prose. States remain embedded in the Screen report resource.

Only product-significant states belong here: a state changes what the user
understands, can do, or achieves. Empty, unavailable, unauthorized,
validation-failure, and completed states commonly qualify. Themes, viewport
variants, hover states, skeletons, component variants, and screenshot baselines
do not. Model-owned visuals expand the Screen and sit beside `screen.md`;
generated captures live under its `implementation/` directory. External or
separately maintained visuals attach as `kind: visual` References, whose role
distinguishes curated intent from implementation or supporting context.

A Screen has one structural parent. The same view on another Interface is
another Screen with the same name — counterparts, distinguished by their path. They may
share purpose, information and actions, and stating each one separately is what
makes a divergence between them visible instead of silent.

Screens do not author a sitemap or transition graph. A screen inventory is a
generated projection grouped by Interface and Experience; observable movement
belongs in Capability Scenarios and Journey Scenarios. XML sitemaps remain
implementation artifacts, and UX sitemaps may be external `doc` or `visual`
references.

### `journeys/<id>.md` or `journeys/<id>/journey.md`

A Journey is an optional, evidence-backed coherent Actor goal that requires
deliberate composition of multiple Capabilities. It owns only its high-level
Goal and Success criterion. Concrete Capability selection, order, branches,
repetition, and failure belong to Journey Scenarios.

```markdown
---
actors: [shopper]
references:
  - kind: doc
    role: context
    target: docs/shopping.md
---

# Browse and buy

## Goal

A shopper wants to purchase a suitable product.

## Success criterion

A confirmed order exists for the selected product.
```

`actors` is a non-empty unique list of the Entities that `acts` and pursue the
goal, not every system that participates in its implementation. A Step in any
of its Scenarios that names an actor, performing or attributed, names one of
them. A Journey has no lead prose;
its first content after the H1 is an H2 section.

`## Goal` states the stable Actor intent. `## Success criterion` states how an
achieved attempt is recognized without prescribing one route. `references` is
optional. Consumers derive Domains and Interface/Experience contexts from
Journey Scenario Capability-bearing steps. A Journey has no `entryPoints`; concrete Product
routes remain on Interfaces, Experiences, and Screens.

A consumer that presents a Journey entry route starts with the first
Capability-bearing step of each achieved Journey Scenario route, then resolves
that exact Interface or Experience entry point. This is derived navigation, not
authored Journey data.

Consumers derive the Journey's primary Capability set from achieved Scenarios
and mark Capabilities observed only in not-achieved Scenarios as failure-only.
These are coverage projections, not authored Journey meaning or proof that
mapping is exhaustive.

A Journey has no `availability`, Trigger, Steps, decisions, concrete Outcome,
authored Capability list, or authored Scenario list. At least one Journey
Scenario must name it with `result: achieved` and exercise at least two distinct
Capabilities. Every Journey Actor must appear in at least one achieved Scenario.
This is Journey acceptance coverage, not the source of its identity.

**A Journey exists when an achieved Journey Scenario carries its Actor through
two or more Capabilities toward one outcome.** That is the whole test, and it
is structural, so it reads the same way for a Journey mapped from code and one
decided before any code exists: a wizard, an orchestration, shared state, or a
cross-Interface hand-off is how a product usually earns one, but none is
required, and a merely plausible sequence of independent Product actions has
no achieved Scenario and is not a Journey. Whether the repository implements
the Journey is `coverage.status`'s claim and `verify`'s finding, never the
Journey's own. The number of Journey Scenario variations does not define it;
one achieved variation provides valid coverage. A goal with no achieved
multi-Capability path belongs to Capability behavior.

### `capabilities/<capability-id>/scenarios/<id>.md` or `<id>/capability-scenario.md`

A Capability Scenario is one concrete observable acceptance case for exactly
one Capability. It describes local ability behavior rather than an end-to-end
Journey goal.

```markdown
---
kind: validation
routes:
  web-shopper: Web shopper
  mobile-shopper: Mobile shopper
steps:
  - text: The shopper submits a cart containing an unavailable product
    kind: actor
    actor: shopper
    entities:
      - { entity: cart, effect: reads }
      - { entity: catalog-product, effect: reads }
    contexts:
      web-shopper:
        place: customer-web::storefront::product-record
      mobile-shopper:
        place: customer-mobile::storefront::product-record
  - text: The Product validates current stock
    kind: product
    entities:
      - { entity: catalog-product, effect: reads }
    contexts:
      web-shopper:
        place: customer-web::storefront::product-record
      mobile-shopper:
        place: customer-mobile::storefront::product-record
  - text: The Product rejects checkout before charging payment
    kind: product
    actor: shopper
    entities: []
    contexts:
      web-shopper:
        place: customer-web::storefront::product-record
      mobile-shopper:
        place: customer-mobile::storefront::product-record
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Reject checkout with unavailable stock

## Trigger

A shopper submits a cart containing an unavailable product.

## Outcome

No order is created, the cart is retained, and the unavailable item is
identified.
```

`kind` must exist in `taxonomies.yaml`. The containing Capability directory
names the Scenario's one parent; no `capability` field is authored. `routes`
and `steps` are non-empty. Capability Scenario availability, Actors, Screens,
Experiences, and Interfaces are derived from its Step Contexts.

A Capability Scenario cannot declare `journey`, `result`, `actors`, or
`availability`. Business Rules own its Rule relations, so it does not duplicate
Rule IDs.

### Scenario sections

Both Scenario types have no lead prose and require non-empty `## Trigger` and
`## Outcome` sections. Both require structured frontmatter `routes` and `steps`
and cannot author a Markdown `## Steps` section. `## Edge cases` is an optional
non-empty bullet list whose items are also single-line.

Each Scenario route is one named supported traversal of Contexts through
an unchanged Scenario. `routes` maps a lowercase kebab-case route id to a
unique, non-empty, human-readable name. A route changes only where the same
Steps occur. If Trigger, ordered Step text, Step kind, responsible Actor,
Capability sequence, Decision behavior, Outcome, or Journey result changes,
author another Scenario instead.

Every Step is a mapping with required single-line `text`, `kind`, and
`entities`. `kind` is `actor`, `product`, or `condition`. Product-side behavior
uses `product`; a fact, state, prerequisite, or seam nobody performs uses
`condition`.

An `actor` Step requires exactly one `actor`, the id of an Entity that `acts`,
who performs it. A `product` or `condition` Step **may** carry `actor`, meaning
*the Actor this Step is attributable to* — the Product did it for them, or the
condition holds for them; `kind` says which. A Product Step with no `actor` is
the Product acting on its own. Every `actor` a Step names, of any kind, joins
the Scenario's derived Actor set and must be supported by the place the Step
occurs in. A Business Rule reads it as *who did*, against a grant's *who may*:
a Step performing an operation a Rule with `permits` selects must have an actor
with a possible grant, and a Step performing one a Rule closes with
`permits: []` is an error. The Business Rule section below defines a possible
grant.

A Scenario needs at least one `actor` Step **or** an unattended trigger: a first
Step of `kind: condition` carrying `unattended: true`. Unattended behavior — a
schedule the Product owns, an expiry, a retry — is real Product behavior with no
Actor to name, and requiring an Actor Step forced it to be modelled as somebody
else's request or left uncovered entirely. An unattended Scenario derives an
empty Actor set, and no Step of it carries `actor`: its permission is a Rule's
`unattended` grant, not a person. `unattended` is valid only on the first Step
and only when its `kind` is `condition`.

Availability for a Capability whose behavior is unattended names the Contexts
where an Actor **observes the outcome**, never a synthetic Interface. A
Capability with only unattended Scenarios is valid; it still requires at least
one availability Context, because behavior nobody can ever observe is not
Product behavior.

Its Actor set is derived from those Steps rather than authored on the Scenario.

**`entities` is required on every Step**, and a Step that touches nothing
writes `entities: []`. Silence is impossible; an omission is a claim that can
be reviewed, linted, and contradicted by code. Each entry is
`{ entity, as, effect, from, to }`:

```yaml
- text: The Reader moves the item from one collection to another
  kind: actor
  actor: reader
  entities:
    - { entity: collection, as: source, effect: changes }
    - { entity: collection, as: target, effect: changes }
    - { entity: item,                   effect: reads   }

- text: The Product refunds the order
  kind: product
  actor: store-admin
  entities:
    - { entity: order,  effect: changes, from: Confirmed, to: Refunded }
    - { entity: refund, effect: creates, to: Requested }
```

`effect` is `creates`, `changes`, `removes`, or `reads`, defaulting to
`changes`. State keys are explicit and never inferred from an adjacent Step:

| effect | keys | required |
| --- | --- | --- |
| `creates` | `to` | when the Entity declares states |
| `changes` | `from` + `to`, or neither | both or neither — never one |
| `removes` | `from` | when the Entity declares states |
| `reads` | — | never carries state |

`changes` with neither key is an information change — the rename case. Every
`from` and `to` names a state the Entity declares. **There is no wildcard
`from`**: *archive from any state* is one Scenario per origin state, because an
origin the author did not write is an inference.

**A Step changes as many Entities as it changes.** One observable act can move
two things at once — a transfer debits one account, and crediting the other is
not a second Step an Actor could watch happen on its own. Splitting one act into
two Steps to fit a singular field would turn an acceptance case into an
implementation trace. An `(entity, as)` pair appears at most once in one Step's
list.

**`as` is a scenario-local instance alias**, optional, lowercase kebab-case, its
id its own label. Entries without one are a single unnamed instance. Once an
Entity is aliased anywhere in a Scenario, every mention of it in that Scenario
is aliased: a bare `collection` beside a `collection (source)` is an error, not
a third instance.

**Steps chain, per instance.** Where a prior Step in the same Scenario left an
`(entity, as)` pair in a state, this Step's `from` for that pair must equal it.
The message names the way out: *if these are different collections, give them
aliases.* Guessing becomes a prompt to be explicit.

**A read is a bare mention.** `reads` carries no state, is never counted as a
change, and never saves an Entity from being an orphan. It exists because the
alternative was a Step whose text says *the Reader chooses a saved item and an
owned collection* while the model says nothing at all, leaving a reader to parse
English to learn what the Step is about.

A Scenario's Entity set is derived from its Steps, exactly as its Actor set is,
and a Capability's Entities are derived from its Scenarios' Steps: a Capability
declares nothing about Entities itself.

**A Step whose `text` names a known Entity title and declares it nowhere** is a
`lint` finding graded by `coverage.status` — an error for a `complete` model, a
warning otherwise. The Step's own `actor` is exempt, and so is the phrase *"the
Product"*, which every Product Step opens with by convention. A title inside a
longer title the Step declares is covered by it: with `product-model` declared,
*Product Model* in the text says nothing about an Entity titled *Product*.

A Step may author `contexts`, mapping every declared route id to exactly one
strict Context object. Its `place` is the most-specific Interface, Experience,
or Screen where that Step occurs. When an Interface or Experience owns Screens,
the place must name a Screen; otherwise it names the leaf Experience or
Interface. A Step on a Screen the Interface shares beside its `experiences/`
names that Screen, `interface::screen`, and is inside a Capability's
availability only when every Experience of the Interface is.
A Step either maps every route or omits `contexts` completely when
it is shared by all routes and has no specific Context. Every route must have a
Context on at least one Step.

Two routes cannot repeat the same place sequence. A place change between
consecutive contextualized Steps is an explicit transition, including
Screen-to-Screen movement inside one Experience. Step Contexts own Scenario
participation; Screens do not duplicate Scenario ids.

`## Decision points` is optional. Each decision uses an H3 title, a non-empty
question paragraph, then at least two bullet branches. Each branch uses
`condition → outcome` with the Unicode arrow or `condition -> outcome` with
ASCII characters. Its branches stay within and converge on that Scenario's one
observable outcome. A branch with a materially different outcome belongs in a
separate Scenario of the same type. Decision points remain embedded rather than
becoming standalone resources.

### `journeys/<journey-id>/scenarios/<id>.md` or `<id>/journey-scenario.md`

A Journey Scenario is one concrete end-to-end variation of exactly one Journey.
It begins with the Journey Actor's Goal and ends with that goal achieved or not
achieved. It verifies Capability composition and Context transitions
rather than replacing local Capability Scenarios.

```markdown
---
kind: primary
result: achieved
routes:
  web-shopper: Web shopper
  mobile-shopper: Mobile shopper
steps:
  - text: The shopper finds an available product in the catalog
    kind: actor
    actor: shopper
    capability: browse-catalog
    entities:
      - { entity: catalog-product, effect: reads }
    contexts:
      web-shopper:
        place: customer-web::storefront::product-record
      mobile-shopper:
        place: customer-mobile::storefront::product-record
  - text: The shopper adds the product to the cart and submits checkout
    kind: actor
    actor: shopper
    capability: checkout
    entities:
      - { entity: cart, effect: changes }
    contexts:
      web-shopper:
        place: customer-web::storefront::product-record
      mobile-shopper:
        place: customer-mobile::storefront::product-record
  - text: The Product validates stock and charges payment
    kind: product
    entities:
      - { entity: catalog-product, effect: reads }
  - text: The Product persists and confirms the order
    kind: product
    actor: shopper
    capability: checkout
    entities:
      - { entity: order, effect: creates, to: Confirmed }
      - { entity: cart, effect: removes }
references:
  - kind: code
    role: implementation
    target: src/services/orders.ts#OrderService.submit
---

# Browse and complete checkout

## Trigger

The shopper wants to find and purchase an available product.

## Decision points

### Fulfillment path

Does the cart contain physical items?

- physical items → collect a delivery address before payment
- digital only → continue to payment without delivery details

## Outcome

Order is stored and a confirmation is shown.

## Edge cases

- Receipt delivery unavailable → order remains confirmed and the receipt is available in the account
```

`kind` must exist in `taxonomies.yaml`. The containing Journey directory names
the Scenario's one parent; no `journey` field is authored. `result` is
`achieved` or `not-achieved`. `kind` classifies the nature
of the variation while `result` records its terminal Journey-goal outcome; they
are orthogonal. `routes` and `steps` are non-empty. At least one Step must name
an Actor from the Journey, performing or attributed. Each route's first
Actor-owned placed Step must name a Journey Actor supported by that Context.
Other Steps may name other Actors — a store admin cancelling inside a shopper's
Journey — because `actors` on a Journey says who pursues the goal, not every
participant.

A Journey Step may name exactly one existing `capability`, independently of its
Step kind. **A Journey Step whose `entities` carries a `creates`, `changes` or
`removes` effect must name one**: a change no Capability owns has nothing to
label its arc with. A Step that only `reads` needs none. A capability-bearing Context must be contained by an availability
Context declared by that Capability; a Screen place must additionally expose
it. A Journey Step without a Capability can still name Contexts when an observable condition or
Product behavior occurs somewhere without claiming another Capability.

The Journey Scenario owns the complete ordered path. Capability-bearing steps
may repeat or stop; unqualified steps make conditions, transitions, and
Product-side behavior first-class without claiming another Capability. An
achieved Journey Scenario must use at least two distinct Capabilities. A
not-achieved Journey Scenario may stop after one Capability, but its Outcome
must state the Journey-level reason the goal was not achieved.

Steps reference Capabilities, never Capability Scenarios. A Capability is
durable while its Scenarios split and merge as local behavior is refined, so a
local refinement never rewrites every Journey path that uses the ability. A
local permission, validation, conflict, or failure contract remains a separate
Capability Scenario when it is independently observable; the Journey Scenario
states its own end-to-end consequence for the Goal.

The path is linear. A Decision point may vary detail while preserving the same
Steps and terminal Outcome. A branch that changes either belongs in another
Journey Scenario. Add a named route when only Context places change. Split
Journey Scenarios when the Step sequence, Actor responsibility, Capability
sequence, observable behavior, or Journey-level Outcome changes. Journey
Scenarios cannot declare `actors` or `availability`. Business Rules own Scenario
applicability, so Journey Scenarios do not duplicate Rule IDs.

### `coverage.md`

```markdown
---
status: partial                    # complete | partial | draft
method: ["Static review of the pinned revision without executing code"]
sourceAreas: [src, server]
unmapped: ["deployment/"]
limitations: ["Background jobs not yet mapped"]
---

# Coverage

Free prose rationale retained with the coverage assessment.
```

The coverage frontmatter (`status`, `method`, `sourceAreas`, `unmapped`,
`limitations`) and the prose rationale are authored from the inspection that
created or expanded the model. Resource totals in a Product Report belong to its
Summary, not Coverage. Coverage has no reference counts and is never inferred
from `references`. The linter checks authored resources and relationships; it
does not compile, publish, or semantically verify the model.

Coverage accepts one H1 and its lead rationale only. It has no H2 sections;
put structured assessment data in the defined frontmatter fields.

`status` describes **model breadth**, never implementation or verification:

- `draft` — the model itself is still being authored or reviewed.
- `partial` — the model is useful and has known unmapped areas.
- `complete` — the intended product breadth is modeled.

A complete model has at least one Capability. Every Capability availability
Context is selected by at least one Capability Scenario, and every
Journey Actor appears in at least one achieved Journey Scenario. Draft and
partial models warn for uncovered Capability Contexts; public Blueprints require
the same complete behavioral coverage regardless of Coverage status.

All three statuses may be exported. A complete model may describe planned,
implemented, or mixed behavior and may contain zero references. Proposing it as a
catalog Blueprint is a separate, explicit action; public listing remains an
administrator decision.

## Serialization

`build/` and `cache/` hold generated artifacts, and the Product Report that
`blueprint export` writes into them is defined by [`report.md`](./report.md) —
including the portable projection, the validation the report schema applies on
top of the rules above, and the `open`/`pull` expansion round trip.
