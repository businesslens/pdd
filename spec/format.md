# The `.businesslens/` Format

> **This is engineering documentation, not a docs-site page.** It is the
> contract the parser, the linter, and the catalog server must agree on, and
> it changes *before* their behavior does.
>
> The user-facing explanation of the same elements lives in the Product model
> group under `docs/` — one page per element, each carrying its file shape and
> the `lint` findings that constrain it. Keep the two consistent.
>
> This document defines the **authored folder**. The wire contract that
> serializes it — the Product Report, its portable projection, and expansion —
> is [`report.md`](./report.md).

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
| **Product Report** | the portable serialization of a Product Model. One format, two profiles. |
| — *workspace* | `referenceProfile: workspace`. Repository-relative references and entry points intact, as optional navigation. For a full product instance inside the boundary that owns the code. |
| — *portable* | `referenceProfile: portable`. No `kind: code`, no repository-relative targets or entry points. Required whenever a report crosses an ownership boundary. |
| **Blueprint** | a Product Report curated into the public catalog under a slug. Always the portable profile, because that is what the catalog accepts. |

**Redaction is a property a report has, never a category it belongs to.** A
report carrying repository navigation is still a Product Report; it is simply
not a Blueprint. Nothing about where a file is stored may be decided by whether
it would survive publication — the profile filters at serialization time, and
that is the only place the distinction lives.

## Folder layout

An element uses the smallest shape that can hold it:

- **compact** — `<id>.md` when the element has no assets or child elements;
- **expanded** — `<id>/<type>.md` when it owns assets or a typed child
  collection.

The two shapes represent the same element and derive the same id. Adding the
first asset or child promotes the Markdown file with `git mv`; removing the last
one compacts it again. Both shapes must never exist for the same id. This keeps
leaf-heavy collections readable without giving up co-location or path-owned
parent relations.

Every element follows that rule; only its type filename and permitted child
collection differ:

| Element | Compact | Expanded | Typed children |
| --- | --- | --- | --- |
| Product | `product.md` | `product/product.md` beside `logo.svg` | — |
| Actor | `actors/<id>.md` | `actors/<id>/actor.md` | — |
| Interface | `interfaces/<id>.md` | `interfaces/<id>/interface.md` | `screens/`, `experiences/`, or both |
| Experience | `interfaces/<interface-id>/experiences/<id>.md` | `interfaces/<interface-id>/experiences/<id>/experience.md` | `screens/` |
| Screen | `<screen-parent>/screens/<id>.md` | `<screen-parent>/screens/<id>/screen.md` | — |
| Domain | `domains/<id>.md` | `domains/<id>/domain.md` | — |
| Capability | `capabilities/<id>.md` | `capabilities/<id>/capability.md` | `scenarios/` |
| Capability Scenario | `capabilities/<capability-id>/scenarios/<id>.md` | `capabilities/<capability-id>/scenarios/<id>/capability-scenario.md` | — |
| Journey | `journeys/<id>.md` | `journeys/<id>/journey.md` | `scenarios/` |
| Journey Scenario | `journeys/<journey-id>/scenarios/<id>.md` | `journeys/<journey-id>/scenarios/<id>/journey-scenario.md` | — |
| Business Rule | `business-rules/<id>.md` | `business-rules/<id>/business-rule.md` | — |
| Entity | `entities/<id>.md` | `entities/<id>/entity.md` | — |

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
├── actors/<actor-id>.md
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
├── entities/<entity-id>.md                       # optional
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
names what the Product keeps and whose state Actors can observe, and is the
thing Capabilities change. Actors and Business Rules attach across everything.

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

An Interface holds `experiences/`, or `screens/`, or **both** — the last when a
Screen is genuinely shared across its Experiences rather than belonging to one.
A Screen beside `experiences/` is reachable from every Experience of that
Interface, and two Screens with the same name below different Experiences of one
Interface are counterparts exactly as they are across Interfaces.
Contexts are closed to unknown keys. Additional dimensions may be added by a
future format revision, but Context is not an arbitrary metadata bag.

## Universal conventions

- **The committed shell is complete.** `README.md` and `.gitignore` are
  required alongside the semantic files. `.gitignore` must ignore `build/`
  and `cache/`; those generated directories are never part of the committed
  model.

- **Compact and expanded are exclusive.** `<id>.md` and `<id>/<type>.md` may
  not coexist. An expanded element must own at least one asset or child element;
  otherwise it is needless structure and must be compacted. A compact element
  has no asset or child namespace.

  Coexisting shapes, and an expanded folder missing its `<type>.md`, are `lint`
  errors: both are states no correct model passes through. An expanded folder
  that owns nothing yet is a `lint` warning instead. The rule still holds — a
  Product Report cannot carry that state, because expansion derives each
  element's shape from the children it actually owns, so the round trip
  normalizes the folder back to the compact form. But an author reaches the
  expanded shape in two steps, and the intermediate step is not a defect.

- **ID = the logical path from the collection root.** Behavior-hierarchy ids
  (Capability, Journey, both Scenario types) and cross-cutting ids (Actor, Domain, Business
  Rule) are the bare file or folder name and are globally unique within their
  collection. Qualified ids for Interfaces, Experiences, and Screens carry the
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
  `order-management`. An Actor, Domain, Entity, Interface, Experience, and
  Screen name something that *is*, so their ids are noun phrases: `shopper`,
  `ordering`, `listing`, `customer-web`.

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
  an element never changes this logical path or id.

  Experience and Screen names repeat across Interfaces on purpose:
  `personal-library` on web and on mobile pursue the same goal and are different elements. Two elements of
  the same kind sharing a path suffix below their Interface are **counterparts**
  — the same thing on two Interfaces. Nothing has to declare that; the path
  already says it.

- **The path owns every parent relation.** An Experience never writes
  `interfaces:`, a Capability Scenario never writes `capability:`, a Journey
  Scenario never writes `journey:`, and a Screen never writes `availability:`.
  One authority instead of two that can disagree, and reparenting becomes a
  `git mv` that reads correctly in a pull request.
- **Assets expand an element.** Authored assets sit beside `<type>.md` in the
  expanded element folder. Files under its reserved `implementation/`
  subdirectory describe this repository's realization instead. Typed child
  directories (`experiences/`, `screens/`, and `scenarios/`) are structural,
  not assets; any other nested directory is invalid. Plain asset files need no
  declaration. Optional `assets:` frontmatter annotates files already present:

  ```yaml
  assets:
    - file: mockup.svg
      title: Approved empty state
      state: Empty                 # Screens only; resolves to an H3 Product state
  ```

  `file` is relative to the expanded element folder and cannot escape it.
  Metadata entries are unique and must name an existing asset. `title` is
  optional. `state` is valid only on a Screen and must name one of that Screen's
  `## View states`. Unlisted assets remain valid so external tools can write
  captures without editing BusinessLens frontmatter.
- **H1 = title/name.** The first `# Heading` in the body is the element's
  title (actors and domains call it `name`) and is the file's only H1. Lead and
  section-body Markdown fragments cannot contain another H1 or H2; an H2 begins
  a new section instead.
- **Lead paragraph = description.** Prose between the H1 and the first `##`
  heading is the description for actors, domains, experiences, and the product.
  Journeys and both Scenario types instead use the required structured sections
  specified below and must not carry lead prose.
- **Frontmatter = relations and navigation, with one relational-prose
  exception.** Both Scenario types keep their structured `steps` in
  frontmatter so each single-line statement stays beside its kind, responsible
  Actor, Capability qualification, and route-specific Contexts. Other
  prose remains in the Markdown body.
- **Intent and Goal = recognized prose sections.** `## Intent` explains why the
  product or element exists and which outcome it protects. `## Goal` states the
  stable Actor intent of a Journey. Both are structured prose, not separate
  elements.
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

`references` is an optional extension on every semantic element: Product,
Actor, Interface, Experience, Screen, Domain, Entity, Capability, Journey,
Capability Scenario, Journey Scenario, and Business Rule. It is not accepted in
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
  artifact is attached to this element. It is not a verification result or a
  freshness claim.
- `target` is the artifact address. Duplicate targets on one element are
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
remain navigation rather than proof and never replace the element's prose.

All other kinds accept either an HTTP(S) URL or a repository-relative path.
`lint` ignores a local target's query and fragment when checking the tracked
file set and warns when the path is missing. HTTP(S) targets are syntax-checked
but never fetched. Absolute filesystem paths, `file:` URLs, other URL schemes,
and backslash paths are invalid.

One Screen commonly collects several captures of the same view — one per
Product state, sometimes doubled for light and dark. Without `state` they arrive
as a flat list distinguishable only by free-text title; with it, each capture is
placed beside the state it shows. Themes are deliberately not View states, so
a light and a dark capture of one state are two references sharing one `state`.

References connect the self-contained Product Model to material maintained
outside it. A model may contain no references at any Coverage status.
The deterministic CLI does not copy, download, generate, execute, or assess
referenced content. BusinessLens skills may follow curated References as leads,
but the artifact remains evidence to assess rather than proof to trust.

## Element files

> **Illustrative examples.** The element snippets below are non-normative
> fragments from one fictional Acme Shop model. Their names and product story
> are not required; they exist only to make the required Markdown, frontmatter,
> and cross-element identifiers concrete.

### `config.yaml`

```yaml
schema: 7                          # folder-format version
sdd:
  paths: [openspec/]               # detected/declared SDD roots; empty if none
```

`config.yaml` has no other keys. Schema 7 is the only supported folder format.

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

### `actors/<id>.md` or `actors/<id>/actor.md`

```markdown
---
kind: person                 # person | system
relationship: external      # external | internal
---

# Shopper

An external person who browses the catalog and buys products.
```

An Actor may carry `## Information kept`, a bullet list of single-line facts the
Product keeps about this Actor — a Reader's reading position, a Shopper's saved
addresses. It follows the same rule as an Entity's: what the Product keeps, never
how it is stored. An Actor is *who acts* and an Entity is *what is acted upon*,
so the two never model the same participant; this section is why a Reader needs
no Entity of their own.

Both classifications are required. `relationship` is relative to the Product
boundary. An implementation component is not an Actor merely because it calls
another component; an internal system is an Actor only when its responsibility,
privilege, trigger, or outcome is product-significant. H1 = name and the lead
paragraph = description.

**An AI agent harness is an Actor**, with the id `ai-agent`, `kind: system` and
`relationship: external`. It initiates, it holds a privilege nobody else has —
it reads and writes on the Actor's behalf — and what it does is not fully
determined by the person who invoked it: it chooses what to inspect, what to
propose, and when to stop. A browser makes no such choices, which is why a
harness is not merely the runtime an `agent` Interface is delivered through.
Name it `ai-agent` rather than after one use of it, since the same participant
appears in products that have nothing to do with code.

This promotes nothing else by analogy. A CI runner executing a fixed command has
no latitude of its own, and the direction rule below still answers it.

An external system is an Actor only when it **initiates** interaction with the
Product. A system the Product calls out to is a dependency of the Capability
that calls it: it has no goal inside the Product, no privilege to grant, and no
inbound interaction contract the Product must keep stable for it. Direction
decides, not ownership — the same third party can be a dependency in one direction and an Actor in the
other when it also calls back. See [Outbound dependencies](#outbound-dependencies).

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
types are separate Interfaces. `actors` contains at least one Actor ID.
`entryPoints` is optional and contains product-facing root addresses. **On an
Interface every entry-point key must equal that Interface's own `type`**; on an
Experience or a Screen it must name the containing Interface's id. One field,
one rule per element, both checked by `lint`. H1, lead
description, and `## Capability boundary` are required. An Interface has no
access mode or exit contract.

### Outbound dependencies

An external system the Product calls — a syndicated feed it polls, a payment
processor it charges, a mail provider it sends through, a model API it queries —
is not an Actor and gets no Interface.

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
and the third party is its Actor. A feed provider the Product polls is a dependency; a
feed provider that pushes updates to the Product is an Actor.

There is no external-system element. An outbound dependency shared by several
Capabilities is described by each Capability that depends on it.

### `interfaces/<interface-id>/experiences/<id>.md` or `<id>/experience.md`

An Experience is a coherent context of Product use with a stable audience,
access boundary, and capability boundary. **It belongs to exactly one
Interface** — the one whose folder holds it. Experiences are optional: create
them only when named contexts distinguish meaningful Product behavior inside an
Interface.

The same context on two Interfaces is two Experiences, not one shared element.
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

`actors` is a non-empty ID list and every Experience Actor must be supported by
the owning Interface. `access` is required. Optional `entryPoints` key the
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
`domain` on a Capability is the only *authored* Domain edge in the model; every
other Domain relation is derived. A Screen, Experience or Journey is about the
Domains its Capabilities are about, and computing that is more reliable than
asking an author to restate it — a second authority can disagree with the first.

`domain` is optional and single. A Capability about two subject regions means
either a `## Boundary` is wrong or the Capability should split.

### `entities/<id>.md` or `entities/<id>/entity.md`

An Entity is a thing the Product keeps or reasons about, which an Actor can
point at and the Product can tell apart from another one — an order, a listing,
a saved item. Capabilities name the Product's verbs; Entities name its nouns.

**The test is identity, not storage.** A draft recommendation the Product never
persists is still an Entity when a reader points at it and the Product
distinguishes it from another. A database row no Actor can name is not.

**The unit is the naming test**: a thing an Actor would call *"this one"*. A
shopper says *"this order"*, never *"this order line"* — that is "The items
ordered" inside Order. A reader says *"this item"* and *"this collection"*, but
"library" is simply all of them. Containers and parts are not Entities.

```markdown
---
domain: ordering                 # optional
relations:
  - entity: catalog-product
    verb: was placed for
    cardinality: many-to-many
transitions:
  - from: Pending
    to: Confirmed
    by: place-order
---

# Order

A shopper's confirmed intent to buy.

## Information kept

- The items ordered and their quantities
- The total charged
- When it was placed

## States

### Pending

Submitted and awaiting payment settlement.

### Confirmed

Paid and accepted; stock is committed.

### Refunded

Reversed after confirmation.

```

**At least one of `## Information kept` and `## States` must be present.** A
thing may have information and no lifecycle worth naming, and a thing's
lifecycle may matter with almost nothing kept about it. Requiring both is what
produced the earlier arbitrary two-state threshold.

`## Information kept` is a bullet list of single-line facts the Product keeps
about the thing. It is **what the Product keeps, never how it is stored**: "When
it was placed", not `created_at TIMESTAMP`. No types, no cardinality, no keys,
and **no structured relations between Entities** — "The items ordered" is prose,
never `hasMany`. A cache is out of the model; the data it holds is in when the
Product promises it. The word *kept* means held, not persisted.

`relations` is optional and declares edges to other Entities. Each is
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

A relation targets an Entity, never an Actor: an Actor is who acts, and ownership
is a fact the Product keeps. It may target this same Entity — an Element relates
to other Elements, a Task blocks another Task — and only a duplicate edge is
invalid. A relation never satisfies the no-orphans rule below, because a cluster
of Entities referencing each other while no behaviour touches any of them is
still vocabulary nobody uses.

`## States` contains H3 state names, each followed by non-empty prose.
`transitions` is required exactly when `## States` is present. Each is
`{ from, to, by }`: both state names must be this Entity's own, and `by` names
the Capability that causes the move — which must exist and must list this Entity
in its `entities`. Relations and transitions are frontmatter rather than
sections because they name other elements by id, and ids are parsed rather than
read out of English. `## Relations` and `## Transitions` are therefore invalid
sections on an Entity, exactly as `## Steps` is invalid on a Scenario: the
frontmatter list is the one authority and a section beside it is a second one
that can disagree. A state no transition reaches, other than the first listed,
is a `lint` warning; a terminal state is valid and needs no outgoing transition.

`domain` is optional and single. H1 = name and the lead paragraph = description.

Neither an asset nor a `references` entry may carry `state` here; `state` stays
valid only on a Screen. A Screen's View states are what a view *looks like*, and
a capture depicts one of them. An Entity's states are lifecycle, and no artifact
depicts "Confirmed" — it depicts the screen that shows a confirmed thing, which
is where the annotation already belongs.

**No orphans.** An Entity must be referenced by a Capability that changes it or
a Screen that presents it. An Entity nothing points at is a `lint` error: it is
either unused vocabulary or a relation somebody forgot to declare.

An Entity never declares Capabilities, Screens, availability, or Actors. The
Capability declares what it changes and the Screen declares what it presents;
every other Entity relation is derived. Entity states are the authority for a
lifecycle, and a Screen's `## View states` describes what that **view** looks
like — the two are never merged.

### `capabilities/<id>.md` or `capabilities/<id>/capability.md`

A Capability is a stable ability of the Product. It has no necessary beginning
or end and may support several Journeys, Experiences, Screens, and Interfaces.
Capabilities and their observable Capability Scenarios are the behavioral core
of the model; Journey composition is optional.

```markdown
---
domain: ordering                 # optional
entities: [order]                # optional
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

`entities` is optional and lists the Entities this Capability **changes**, by
id. It covers changes a transition can never express — renaming a thing alters
its information, not its state — and it is the authority a transition's `by` is
checked against.

**Changes, never reads.** A Capability that only presents or inspects a thing
declares nothing here; the Screen that shows it carries `entities` instead, and
a Capability with no Screen says what it reads in its own prose. The narrower
word is what makes the list worth reading: a structural check that inspects every
kind in the model would otherwise claim to change all of them, and "what can
alter this thing" — the question the list exists to answer — would have no answer
left. `availability` is required and needs at least one valid
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

A Business Rule is a durable constraint or policy that may apply across
multiple behaviors.

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

**A Business Rule governs two or more behaviors, or a Context independent of
any single behavior.** Anything true of exactly one Capability is that
Capability's business — a `condition` Step or its Scenario Outcome — not a Rule.
The boundary is checkable and `lint` enforces it: a Rule whose `appliesTo`
resolves to exactly one behavioral element, with no `contexts` narrowing it, is a
`lint` warning naming the Capability that should own it instead. A Rule with a
`type: context` target is always valid, because a constraint on an interaction
context belongs to no behavior.

The lead paragraph is the rule statement. `appliesTo` is a required non-empty
list of typed targets. An element target uses `type` = `capability`,
`capability-scenario`, `journey`, or `journey-scenario`, requires `id`, and may
use a non-empty `contexts` list to narrow that target. Without `contexts`, the
Rule applies to all supported Contexts of the target. A direct Context target
uses `type: context` plus one nested `context` object instead of `id`:

```yaml
- type: context
  context:
    place: operator-cli
```

Targets are additive: the Rule governs their union. A Context selector on an
element target must match at least one Context supported by that target. A
selector naming an Interface or Experience matches descendant places; a Screen
selector matches that Screen. Duplicate selectors and a parent selector paired
with its redundant descendant are invalid. Do not target both a Capability and one of its
Capability Scenarios, or both a Journey and one of its Journey Scenarios; the
ancestor already governs the child. Domains remain navigation-only, so Rule
Domain backlinks are derived through targeted behavior rather than authored.
Business Rule owns these relations; consumers derive every backlink.

### `.../screens/<id>.md` or `.../screens/<id>/screen.md`

A Screen is a meaningful user-visible view where product information or
capabilities are exposed. It is platform-neutral: it need not be a web page,
have a URL, fill a device display, or correspond to one implementation module.
The whole `screens/` collection is optional so non-visual products remain valid.

```markdown
---
capabilities: [catalog-browsing]
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
Capability must declare an availability Context containing the Screen.
`entryPoints` is optional; entry-point keys must name the Interface containing
the Screen. Scenario participation is derived from Scenario Step Contexts whose
place names the Screen; a Screen never authors
Capability or Journey Scenario ids. The H1, lead description,
`## Information presented` bullet list, and `## Capability boundary` prose are
required. `## Available actions` is optional but, when present, must contain a
bullet list. `## View states` is optional; each state is an H3 name followed
by non-empty prose. States remain embedded in the Screen report element.

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

`actors` is a non-empty unique list of the Actors who pursue the goal, not every
system that participates in its implementation. A Journey has no lead prose;
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

A Journey is established behavior only when repository evidence supports a
deliberate transition, orchestration, shared state, navigation, command, or
cross-Interface transition toward its Actor outcome. A wizard can establish a
Journey but is not required. A merely plausible sequence of independent
Product actions is not a Journey. The number of Journey Scenario variations
does not define it; one achieved variation provides valid coverage. A goal with
no achieved multi-Capability path belongs to Capability behavior or remains
unsupported Journey intent. Planned Journeys may record approved intent before
implementation but must meet the same structural distinctions.

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
    contexts:
      web-shopper:
        place: customer-web::storefront::product-record
      mobile-shopper:
        place: customer-mobile::storefront::product-record
  - text: The Product validates current stock
    kind: product
    contexts:
      web-shopper:
        place: customer-web::storefront::product-record
      mobile-shopper:
        place: customer-mobile::storefront::product-record
  - text: The Product rejects checkout before charging payment
    kind: product
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

Every Step is a mapping with required single-line `text` and `kind`. `kind` is
`actor`, `product`, or `condition`. An `actor` Step requires exactly one
existing `actor`; `product` and `condition` Steps forbid `actor`. Product-side
behavior uses `product`; a fact, state, prerequisite, or seam nobody performs
uses `condition`.

A Scenario needs at least one `actor` Step **or** an unattended trigger: a first
Step of `kind: condition` carrying `unattended: true`. Unattended behavior — a
schedule the Product owns, an expiry, a retry — is real Product behavior with no
Actor to name, and requiring an Actor Step forced it to be modelled as somebody
else's request or left uncovered entirely. An unattended Scenario derives an
empty Actor set. `unattended` is valid only on the first Step and only when its
`kind` is `condition`.

Availability for a Capability whose behavior is unattended names the Contexts
where an Actor **observes the outcome**, never a synthetic Interface. A
Capability with only unattended Scenarios is valid; it still requires at least
one availability Context, because behavior nobody can ever observe is not
Product behavior.

Its Actor set is derived from those Steps rather than authored on the Scenario.

A Step may name the `entity` it changes, and the `state` it leaves that Entity
in. The Entity must be one the Step's Capability declares, the state must be one
that Entity has, and **some transition must reach that state by that
Capability** — so a Scenario claiming an Order becomes Confirmed is checked
against the Order's own lifecycle. A Scenario's Entity set is derived from its
Steps, exactly as its Actor set is.

A Step may author `contexts`, mapping every declared route id to exactly one
strict Context object. Its `place` is the most-specific Interface, Experience,
or Screen where that Step occurs. When an Interface or Experience owns Screens,
the place must name a Screen; otherwise it names the leaf Experience or
Interface. A Step either maps every route or omits `contexts` completely when
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
becoming standalone elements.

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
    capability: catalog-browsing
    contexts:
      web-shopper:
        place: customer-web::storefront::product-record
      mobile-shopper:
        place: customer-mobile::storefront::product-record
  - text: The shopper adds the product to the cart and submits checkout
    kind: actor
    actor: shopper
    capability: checkout
    contexts:
      web-shopper:
        place: customer-web::storefront::product-record
      mobile-shopper:
        place: customer-mobile::storefront::product-record
  - text: The Product validates stock and charges payment
    kind: product
  - text: The Product persists and confirms the order
    kind: product
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
are orthogonal. `routes` and `steps` are non-empty. At least one `actor` Step
must name an Actor from the Journey. Each route's first Actor-owned placed Step
must name a Journey Actor supported by that Context.

A Journey Step may name exactly one existing `capability`, independently of its
Step kind. A capability-bearing Context must be contained by an availability
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
created or expanded the model. Element totals in a Product Report belong to its
Summary, not Coverage. Coverage has no reference counts and is never inferred
from `references`. The linter checks authored elements and relationships; it
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
