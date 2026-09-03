# Glossary

> This is the model review's working vocabulary **at folder schema 7**. The
> current vocabulary is the **Terms** table in `spec/format.md`; where the two
> disagree, the spec is right. Entries below that the later rounds
> ([ADR-0013](./adr/0013-relationships-are-product-meaning.md) to
> [ADR-0018](./adr/0018-steps-are-the-single-source-of-truth.md)) overturned
> are corrected in place and say so.

Working vocabulary for format and model-quality work. Terms the user-facing
docs already own are listed with a pointer rather than redefined; terms coined
during the model review are defined here because nowhere else owns them.

Where a term is contested — where the review found two readings in the wild —
that is stated, because the ambiguity is the point.

## Resource types

Owned by `docs/` (one page per resource type) and `spec/format.md`. Listed here
only to fix the vocabulary this repository's planning documents use.

| Term | Meaning | Contested? |
| --- | --- | --- |
| **Product** | The one coherent value promise a model describes. Exactly one per model. | No |
| **Actor** | A role, not a resource type: an Entity with `kind: person\|system` and `acts: external\|internal`, in the position where it acts — a Step's `actor`, an Interface's, Experience's or Journey's `actors`, a Business Rule grant's `actors`. An external system acts only when it **initiates**. | No — converged across independent authors; the resource type was folded into Entity by [ADR-0016](./adr/0016-one-resource-type-actor-is-the-subset-that-acts.md) |
| **Interface** | A supported **inbound** interaction contract, with exactly one `type` from a closed ten-value enum: `web`, `mobile-app`, `desktop-app`, `cli`, `api`, `webhook`, `messaging`, `voice`, `device`, `agent`. | Resolved — `agent` was added for the agent-skill surface (F3) |
| **Experience** | An optional coherent context of use inside exactly one Interface. | Yes — the Interface/Experience boundary admits two lint-clean encodings (F2) |
| **Screen** | An optional stable user-visible view. Owns `## View states`, the states of the *view*; a thing's lifecycle lives on its Entity. | Resolved — [ADR-0011](./adr/0011-a-things-states-belong-to-the-thing.md) moved the thing's states to the Entity (F9) |
| **Domain** | An optional axis classifying subject matter. Classifies; never contains. | Yes — two authors produced 3 and 5 with one id in common (F13) |
| **Entity** | A thing the Product keeps or reasons about, which an Actor can point at and the Product can tell apart. The test is identity, not storage. | No — added after the review ([ADR-0010](./adr/0010-a-thing-the-product-keeps.md)) |
| **Capability** | The smallest durable Product ability that remains independently meaningful. | Yes — granularity diverged 4× on identical behavior (F1) |
| **Capability Scenario** | One concrete observable acceptance case for exactly one Capability. | Yes — its boundary with Business Rule inverted between authors (F4) |
| **Journey** | An optional coherent Actor Goal requiring deliberate composition of multiple Capabilities. | Yes — least determined kind; 3 of ~6 appeared in only one model (F1) |
| **Journey Scenario** | One end-to-end variation of exactly one Journey, with a `result`. | No |
| **Business Rule** | A durable constraint applying across behavior. | Yes — see Capability Scenario (F4) |

## Structural vocabulary

**Context** — a strict object whose required `place` names one Interface,
Experience, or Screen. The format's single location concept since schema 6.

**Place** — the Interface, Experience, or Screen a Context names. Specificity is
mandated: a Scenario Step must name *"a Screen when one exists, otherwise the
leaf Experience or Interface"*, which couples Step Contexts to whether Screens
happen to be authored (F10).

**Route** — one named supported traversal of Contexts through an **unchanged**
Scenario. If the Steps differ, it is a different Scenario, not a route.

**Step** — one mapping in a Scenario's ordered `steps` list, with required
single-line `text`, a `kind` of `actor`, `product`, or `condition`, and an
`entities` list of effects. Each Scenario needs at least one `actor` Step **or**
an unattended trigger: a first `condition` Step carrying `unattended: true` is a
valid trigger, which is how unattended behavior gets a Scenario (F5, resolved).

**Counterpart** — two resources of the same type sharing a path suffix below
their Interface: the same thing on two **Interfaces**. Nothing declares it; the
path does. Since schema 8 two Screens with the same name below different
Experiences of one Interface are counterparts too, and a Screen genuinely
shared by every Experience sits beside `experiences/` instead (F10b).

**Compact / expanded** — a resource is `<id>.md` until it owns an asset or a
typed child, then `<id>/<type>.md`. The two never coexist and derive the same
id. Expansion derives the shape from content, so the round trip normalizes.

**Availability** — a Capability's required list of Contexts. Names an undivided
Interface or an Experience, never a Screen.

**Two hierarchies and two axes** — the model's organizing claim. Interface →
Experience → Screen says *where Actors meet the Product*; Capability → Scenario
and Journey → Scenario say *what the Product does*; Domain classifies members of
both, and Entity names what the Product keeps. `docs/product-model.md` states
this in prose and now carries a diagram.

## Terms the spec owns

Defined in `spec/format.md`; listed here so the planning documents use them the
same way.

| Term | Meaning | Where |
| --- | --- | --- |
| **Resource** | One authored file in a Product Model — `capabilities/checkout/capability.md` is one. | spec "Terms" |
| **Resource type** | What a resource is one of. The spec defines eleven: Product, Interface, Experience, Screen, Domain, Entity, Capability, Capability Scenario, Journey, Journey Scenario, Business Rule. Actor is not one. | spec "Terms"; [ADR-0015](./adr/0015-resource-and-resource-type.md) |
| **Effect** | What a Step does to one Entity: an `entities` entry `{ entity, as?, effect, from?, to? }` with `effect` one of `creates`, `changes`, `removes`, `reads`. Required on every Step; `[]` when it touches nothing. | spec, Scenario Steps; [ADR-0018](./adr/0018-steps-are-the-single-source-of-truth.md) |
| **Grant** | One entry of a Business Rule's `permits`: who may perform the selected operation — `actors`, `related`, `self`, `unattended`, `configuredBy` — optionally conditioned by `when`. Grants are OR, keys within a grant AND, Rules on one operation AND. | spec, Business Rule; [ADR-0017](./adr/0017-a-business-rule-states-what-must-remain-true.md) |
| **Lifecycle** | The state machine of an Entity, composed from every Step's effects across the model rather than declared on the Entity. `lint` warns on an unreached state and an unproduced origin. | spec, Entity `## States`; [ADR-0018](./adr/0018-steps-are-the-single-source-of-truth.md) |
| **State** | An H3 under an Entity's `## States`; the first listed is the one a thing starts in. Cited by exact name from a Step's `from`/`to`, a Rule target's `from`/`to`, and a grant's `{ state: X }` condition. Distinct from a Screen's View state. | spec, Entity `## States` |

## Serialization vocabulary

Owned by `spec/report.md`.

**Product Model** — the git-tracked `.businesslens/` folder.

**Product Report** — the portable serialization of a Product Model. One format,
two profiles.

**Workspace profile** — `referenceProfile: workspace`. Repository-relative
references and entry points intact.

**Portable profile** — `referenceProfile: portable`. No `kind: code`, no
repository-relative targets. Required whenever a report crosses an ownership
boundary — which is why a published Blueprint cannot say whether anyone ever
built it (F8).

**Blueprint** — a Product Report curated into the public catalog under a slug.
Always portable. Its purpose is to be *a system a user can achieve building*,
which makes it a build target rather than a description.

**Authored vs derived** — a report record carries both. A Journey's `goal` is
authored; its `capabilityIds`, `domainIds`, and `failureOnlyCapabilityIds` are
computed. They sit flat beside each other with no marker. Expansion correctly
declines to re-author the derived ones.

**Expansion** — `blueprint open`, the inverse of export. It preserves authored
prose — an author's `unmapped`, `limitations`, and coverage rationale survive
verbatim, with the import note appended to `limitations` — and replaces only
`method` (F7, resolved).

## Review vocabulary

Coined for the model review; defined here because nothing else owns them.

**Determinism** — one product yields one model. The property that makes
`verify` meaningful and Blueprints comparable. Ranked first
([ADR-0002](./adr/0002-determinism-outranks-expressiveness.md)).

**Reviewability** — whether a human who has read only `docs/` can tell that a
proposed model is wrong. Distinct from legibility: a model can be readable and
still uncheckable ([ADR-0005](./adr/0005-reviewability-is-a-first-class-axis.md)).

**Distillation loss** — the gap between a rule as argued in `spec/format.md`
(1,112 lines) and as it ships in the installed skill (462 lines). Charged to the
skill, never to the format
([ADR-0001](./adr/0001-shipped-agent-is-the-standard-of-judgment.md)).

**Double-authoring** — the empirical determinism test: one product mapped twice
by independent authors from one rubric with no contact, then diffed
([ADR-0006](./adr/0006-determinism-is-verified-by-independent-double-authoring.md)).

**Encoding probe** — authoring one product two structurally different ways to
test whether a boundary admits both. Used where double-authoring cannot reach a
joint the test product does not exercise.

**Placement test** — a list of real product things, committed before authoring,
each of which must land in exactly one resource type. An item landing in two
types is a determinism defect and a legibility defect at once; an item landing in none
is an expressiveness defect.

**One-page test** — whether the eleven resource types, their containment, and
their relations can be stated completely on one page such that a reader who has
seen only that page places new things correctly.

**Convergence** — whether a product modeled in the generative direction and the
same product modeled in the descriptive direction produce the same model. Where
they do not, the format means different things in its two directions
([ADR-0003](./adr/0003-descriptive-and-generative-are-equal.md)).

**Skeleton and body** — the review's summary finding. The *skeleton* is what
converged across independent authors: Product, Actor, Interface, the
inbound/outbound direction rule, path-owned containment, compact/expanded. The
*body* is what did not: granularity, Rule-vs-Scenario, Interface-vs-Experience,
Domain cuts, Journey warrant.
