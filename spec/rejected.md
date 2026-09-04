# Rejected and Deferred

> **This is engineering documentation, not a docs-site page, and not a
> contract.** [`format.md`](./format.md) and [`report.md`](./report.md) say what
> must be true. This file says what was considered and chosen against, so the
> next reader does not spend the same argument twice.

**What belongs here:** a shape that was designed far enough to be costed, and
then rejected or deferred, with the reason it lost. Nothing else. No plans, no
status, no work item, no file or line reference — those go stale, and a stale
record is worse than no record.

**How it changes:** append only. Reopening a decision means adding an entry that
supersedes the old one and says why the reason no longer holds; it never means
editing the old entry into agreement. Consult it before proposing a change to
either contract.

## The model as a whole

**Tags, labels, or free-form key/value metadata.** Nothing could consume it — a
facet is only ever an id array the projection already holds, so filtering on a
key/value pair would need a second, non-relational facet path built first.
`lint` could only ever say "unknown key". And unvalidated per-model vocabulary
defeats a catalog whose whole value is that models are comparable. Grouping that
is not subject matter — team ownership, compliance scope, maturity — stays in
whatever system already tracks it. If real pressure appears, the answer is a
modelled field a checker can speak about, not a generic bag.

**A glossary resource type.** Vocabulary a model uses and never defines is
modelling debt. A glossary would compete with the resource type that should own
the term: `cart` appeared fifteen times in the fixture and was nothing, so it
became an Entity.

**A reference kind for a schema.** An ERD is `kind: visual`, a schema document
`kind: spec`, a migration `kind: code` — each with `role: implementation`, which
already says *realization, not meaning*. A dedicated kind would invite treating
the schema as the authority for what the Product keeps.

**A `lint` warning on undefined vocabulary** — words a model's prose keeps using
that match no Entity id. Built, measured, abandoned for noise: narrowed to
Screen `## Information presented` bullets and Scenario Step text, the top hits
were still verbs and generics. A warning authors learn to ignore is worse than
no warning. What shipped instead is the narrow form — a Step whose text names a
known Entity **title** it does not declare — and the check itself carries the
reasoning.

## Entities and their lifecycle

**Two collections, `actors/` beside `entities/`.** Fails on one question: what
happens when a thing starts acting? A payroll Employee who gains a login would
change file, id namespace, and every reference — the wrong cost for one product
fact. The objection that a payment gateway would then be an Entity with nothing
kept about it was against a definition the format does not have: an Entity is
what the Product keeps *or reasons about*.

**`kind` optional under `acts`.** An Entity that acts without saying whether it
is a person or a system is a regression from the Actor it replaced, and the
report's facet would have nothing to group it by.

**An `operations` table on the Entity**, enumerating every Capability that may
create, change, remove, or read it, deny by default. It is the deleted
Capability `entities` list moved to the other side and enriched: it restates
what Steps already say, and its gate catches only internal inconsistency. A Step
claiming a false `creates` is a *truth* error, which is `verify`'s domain
against source, not `lint`'s against the model.

**`transitions` declared on the Entity.** It stated a second time what a Step
states, and a per-Entity list cannot express a combined lifecycle — *settling a
payment confirms an Order and creates a Shipment* is one act on two things,
which only a Step can say.

**Deriving an arc's origin from Step order**, and **a wildcard `from`** for
*archive from any state*. Both are inference from a neighbour, which is exactly
the implicit reading explicit state keys exist to remove, and the composition
findings would have nothing to check the arc against.

**A bare mention after an alias**, letting `collection` beside
`collection (source)` mean a third, unnamed instance. It is the silent reading
aliases exist to remove, and the explicit spelling costs one word.

**Making an unreached state an error for a `complete` model.** Proposed to pull
two independent authors back together on coverage. Surfacing what the composed
machine is missing is the honest version; coercing coverage is not.

## Business Rules and permission

**`permits: []` as an error**, on the ground that a lifecycle without the
operation already says nobody may. Reversed once the lifecycle became composed
from Steps: an absent arc is silence, and silence must not read as prohibition.

**OR across Rules.** Adding a Rule could then only widen, and a broad Rule would
silently loosen a narrow one. Under AND, adding a Rule can only restrict, and
the split-grant trap that creates is caught by the identical-selector warning.

**Forbidding overlap between permission Rules**, one place per operation. A
broad Rule and a narrow one composing is the ordinary case, not the mistake.

**Verb-only `related` paths.** `related: [owns]` reads well and fails where a
Workspace and a Folder both *contain* Documents. Resolving that by renaming a
verb serves `lint` at the expense of the product's own words.

**Implicit AND/OR** — `actors` and `related` OR-ing while `when` AND-ed, with
the rule stated only in prose. Unknowable from the file.

**A `when`-only grant**, meaning *anyone, when*. *Anyone* already has an
encoding, and a grant with no who is indistinguishable from a forgotten one.

**A single-mapping `when`**, one condition per grant. The list is one shape for
every count, and it matches *keys within a grant are AND*.

**`over`/`under` as the only operators.** The off-by-one argument holds for
integers; facts are untyped, and `over: 99.99` is the wrong rule for money and
for time.

**`permits` on a Capability target.** An operation is an Entity effect,
Interface `actors` already records who uses a surface, and the Step check would
duplicate the Entity one.

**Current state only in `when.state`, with no `from` on the target.** Could not
say *a Refunded order is never cancelled*: a prohibition has no grant to carry a
`when`, so the only spelling enumerated every other state and every actor that
stays allowed, turning one narrow claim into a policy for the whole operation.

**`when.state` on `reads` targets only.** Could not say *edit delivery details
only while Pending*: an information change is `changes` with neither `from` nor
`to`, so it carries no state to select by, exactly like a read.

**`from` alone on an information-change Step.** It pushes the claim onto every
such Step, and a Step that omits it silently escapes the Rule.

**Typed facts.** The operator carries the comparison, so thresholds stay
checkable without the Entity becoming a schema.

**Rule-level `when`, `asserts`, and `derives` — deferred, not rejected.** A
structured derivation needs defined behaviour for types, units, money, rounding,
collections, missing values, and time, and that is not added casually. If it
comes, `appliesTo.facts` identifies the result and the derivation names its
inputs without repeating the target.

## The Product Report

**A provenance field.** `derivedFrom: implementation | intent | mixed`, carried
through the portable projection so a catalog reader could tell a Blueprint
mapped from a working product from one authored as intent. Neutrality is the
product decision, not an omission: such a field becomes a ranking signal —
"battle-tested" against "merely designed" — and a design mapped from a mediocre
shipped product is not better than a well-reasoned one nobody has built.
Stripping every `kind: code` reference and every repository-relative target is
therefore the point rather than a lossy compromise.
