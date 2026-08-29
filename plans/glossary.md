# Glossary

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
| **Actor** | A person or system with a Product-significant goal, trigger, responsibility, or privilege. An external system is an Actor only when it **initiates**. | No — converged across independent authors |
| **Interface** | A supported **inbound** interaction contract, with exactly one `type` from a closed nine-value enum. | Yes — the enum has no value for an agent-skill surface (F3) |
| **Experience** | An optional coherent context of use inside exactly one Interface. | Yes — the Interface/Experience boundary admits two lint-clean encodings (F2) |
| **Screen** | An optional stable user-visible view. Owns `## Product states`. | Yes — states of the *view*, with no home for a product object's lifecycle (F9) |
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
single-line `text` and a `kind` of `actor`, `product`, or `condition`. Each
Scenario requires at least one `actor` Step — which is why unattended behavior
has no Scenario (F5).

**Counterpart** — two resources of the same type sharing a path suffix below
their Interface: the same thing on two **Interfaces**. Nothing declares it; the
path does. Does not cover the same thing on two Experiences of one Interface.

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

**Expansion** — `blueprint open`, the inverse of export. Verified to discard
authored coverage prose the spec promises is never rewritten (F7).

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

**One-page test** — whether the twelve resource types, their containment, and
their relations can be stated completely on one page such that a reader who has
seen
only that page places new things correctly.

**Convergence** — whether a product modeled in the generative direction and the
same product modeled in the descriptive direction produce the same model. Where
they do not, the format means different things in its two directions
([ADR-0003](./adr/0003-descriptive-and-generative-are-equal.md)).

**Skeleton and body** — the review's summary finding. The *skeleton* is what
converged across independent authors: Product, Actor, Interface, the
inbound/outbound direction rule, path-owned containment, compact/expanded. The
*body* is what did not: granularity, Rule-vs-Scenario, Interface-vs-Experience,
Domain cuts, Journey warrant.
