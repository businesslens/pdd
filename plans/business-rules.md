# Business Rules: what must remain true, including who may

Status: **designed, not started.** Settled across three grilling rounds on top
of [Actor is not a resource type](./actor-is-an-entity.md) and
[The Entity at the centre](./entity-at-the-center.md), against `main` at
`a657638`, folder schema 7, Product Report v12.

Ships in one release with both. This plan owns the Rule model; the other two
point here wherever a Rule touches an Entity or a Step. Read
[Actor is not a resource type](./actor-is-an-entity.md) first: it decides that
there is one resource type, so every "Entity that acts" below is what used to
be an Actor.

## The sentence

> **Entities say what things are and what facts they have. Steps say what
> happens. Business Rules say what must remain true — including who may act.**

Permission is a kind of Business Rule. Not every Business Rule is a permission.
*Permission claims appear only in Business Rules* is the rule; *Business Rules
only say who may* was the earlier, narrower draft, and it was wrong.

## What a Rule is

A Business Rule states a durable constraint, derivation, or authorization
policy that must hold across the Product.

| Rule | Kind |
| --- | --- |
| Blueprints carry no source navigation | invariant |
| Payment must precede confirmation | invariant |
| Total charged equals Subtotal plus Tax minus Discount | derivation |
| Refund amount cannot exceed captured payment | limit |
| Only an owner may change a Collection | permission |

**Where a thing goes:**

| It is | It lives |
| --- | --- |
| a product-significant value | a fact on the Entity |
| a formula, limit, or invariant over facts | a Business Rule, in prose, targeting the fact it governs |
| a fixed constant | a literal in the Rule |
| a customer-configured value | a fact on a Settings or Policy Entity, read by the Rule |
| specific to one Scenario or case | that Scenario's `condition` Step or Outcome |
| authorization or arithmetic that exists only in code | not modelled; `verify` inspects it |

A constraint true of exactly one behaviour stays in that behaviour. A durable
Entity invariant or permission is still a Rule even when it selects a single
operation, which is why Entity targets are exempt from the single-target
warning: the two homes that warning suggests — a `condition` Step, a Scenario
Outcome — do not exist for a permission.

Computed information is still an Entity fact. *Kept* means held, not stored.

## Facts and derivations

Fact names belong to the Entity. The relationship between facts belongs to a
Rule:

```markdown
# Order
## Information kept
- **Subtotal** — the total before tax and discounts
- **Tax** — the tax charged
- **Discount** — the reduction applied
- **Total charged** — the final amount taken from the shopper
```

```yaml
# business-rules/total-charged.md
appliesTo:
  - { type: entity, id: order, facts: [Total charged] }
---
# Total charged
Total charged always equals Subtotal plus Tax minus Discount.
```

`appliesTo.facts` does not redeclare the fact. It is the machine-readable edge
saying the Rule governs that fact, so `lint` can resolve it, the report can
draw the backlink, and `verify` can find the formula — without parsing English.

**The formula stays prose.** A machine-readable arithmetic language would need
defined behaviour for types, units, money, rounding, collections, missing values
and time, and facts are deliberately untyped. Rule-level `when`, `asserts` and
`derives` keys were sketched and are deferred; see the
[design record](#design-record-what-was-tried-and-rejected).

## Entity targets

`appliesTo` gains an Entity target beside the behavioural and Context targets it
has today:

```yaml
appliesTo:
  - type: entity
    id: order
    effect: changes            # optional — creates | changes | removes | reads
    from: Confirmed            # optional — the state the operation leaves
    to: Refunded               # optional — the state it lands in
    facts: [Margin]            # optional — the facts it governs
    contexts: [{ place: web::workspace::order-detail }]   # optional — place scope
```

- **A target selects; a grant conditions.** `effect`, `from` and `to` select
  Steps by the keys their `entities` entry already carries: `from` is valid
  with `changes` and `removes`, `to` with `creates` and `changes`, and neither
  with `reads`. Whether the instance is in some state *when the operation
  happens* is a condition, and lives in a grant's `when.state`.
- **The minimal selector is canonical.** A `from` that every Step landing in
  `to` already leaves from is a `lint` warning, as is a `when.state` every
  matched Step already satisfies. Refunds only ever leave Confirmed, so
  `{ changes, to: Refunded }` is the Rule and
  `{ changes, from: Confirmed, to: Refunded }` is flagged. The minimal form is
  also the safe one: a refund added later from Pending is governed by the
  first and silently open under the second.
- **`facts`** names facts of this Entity by their exact name. A fact-scoped Rule
  governs information, not an operation: a derivation, or field-level
  visibility.
- **`contexts`** scopes the Rule to places. An Entity has no availability, so
  the selector must name a Screen that presents the Entity, or an ancestor of
  one — a place-scoped Entity Rule is about visibility.
- **Exempt from the single-target warning**, as above.

## `permits`

`permits` is optional and has three states:

| `permits` | Says |
| --- | --- |
| omitted | this Rule makes no authorization claim |
| `[]` | the selected operation is forbidden to everyone |
| a list of grants | the operation is permitted through any one of them |

Silence is not a claim. A lifecycle composed from Steps can be incomplete, so
*no Step ever removes an Order from Fulfilled* cannot be read as *nobody may*.
`permits: []` is the one way to say it, and it is checkable: a Step performing
that operation is a `lint` error naming the Rule, `verify` confirms the code
refuses it, and the Entity page can say so on the state.

```yaml
# a Refunded order is never cancelled — and nothing else is claimed
appliesTo: [{ type: entity, id: order, effect: changes, from: Refunded, to: Cancelled }]
permits: []
```

**A Rule with `permits` targets Entities only.** An operation is an Entity
effect — that is what Steps being the source of truth means. *Who may perform
this Capability* with no Entity in sight is what Interface `actors` already
records as *who uses it*, and checking it over Steps would duplicate the Entity
checks for any Capability that changes something. A Rule carrying `permits`
with a behavioural or Context target is an error.

### The algebra

- **Targets within one Rule select the union** of governed operations.
- **Grants within one Rule are OR.**
- **Keys within one grant are AND.**
- **Rules that select the same operation are AND** — every matching Rule
  constrains it.
- **An operation no Rule with `permits` selects is open.**

```yaml
# the owner, or an admin
permits:
  - { actors: [store-admin] }
  - { related: [{ verb: owns, entity: reader }] }

# an admin who is also the owner
permits:
  - { actors: [store-admin], related: [{ verb: owns, entity: reader }] }

# the owner under 100; above that, an admin
permits:
  - { related: [{ verb: owns, entity: reader }], when: [{ fact: Total charged, under: 100 }] }
  - { actors: [store-admin],                     when: [{ fact: Total charged, at-least: 100 }] }
```

AND across Rules is what lets a broad Rule and a narrow one compose: *owner or
admin may change an Order* plus *admin may refund* yields admin-only refunds
without either Rule knowing about the other. Its cost is the **split-grant
trap**: *the owner may read a Collection* and *a Visitor may read a Published
Collection* written as two Rules AND to owner-only. Grants meant as
alternatives sit in one Rule. `lint` warns when two permission Rules carry
identical target selectors, because that is nearly always the accidental split;
different selectors compose on purpose and stay quiet.

**Every grant names a who.** A grant needs at least one of `actors`, `related`,
`self`, `unattended`, `configuredBy`. An empty `{}` grant, or a grant with only
`when`, is an error: *anyone* already has an encoding — list every Entity that
acts — and a second one would be silent.

### Grant keys

| Key | Says | Value |
| --- | --- | --- |
| `actors` | these may | ids of Entities that act |
| `related` | whoever stands in this relation to the instance may | a path of `{ verb, entity }` segments |
| `self` | the instance itself may | `true` |
| `when` | only while these conditions hold | a list of conditions, AND-ed |
| `unattended` | the Product's own schedule may | `true` — nothing else |
| `configuredBy` | gated, by data the Product does not own | the id of the Entity holding the configuration |

`configuredBy` names an Entity because the Product reasons about the policy even
when the customer fills it in, and an id is something `lint` can resolve.

### `related` is a path of segments

```
collection  ←—owns—  reader (acts)
```
```yaml
appliesTo: [{ type: entity, id: collection, effect: changes, to: Published }]
permits:   [{ related: [{ verb: owns, entity: reader }] }]
```

```
document  ←—contains—  workspace  —has member→  user (acts)
```
```yaml
appliesTo: [{ type: entity, id: document, effect: changes }]
permits:   [{ related: [{ verb: contains, entity: workspace }, { verb: has member, entity: user }] }]
```

A path starts at the Rule's one Entity target and walks declared relations and
their derived inverses. Each segment names the verb and the Entity it arrives
at, so a hop is never ambiguous: a Workspace *contains* Documents and a Folder
*contains* Documents, and both keep the product's own word for it. The
verb-only path that preceded this would have forced one of them to be renamed
to serve a Rule, which is the wrong direction of pressure.

`lint` checks that each segment matches exactly one relation, declared or
inverse, from the Entity the path is currently at; that the last segment lands
on an Entity that acts; and that the Rule has exactly one Entity target to
start from. A hop through a self-relation — a Comment that replies to a Comment
— is refused: naming the Entity does not give it a direction, and the refusal
is documented. **`lint` never touches an instance.**

### `self`

*Shoppers keep their own address* governs the Shopper's own *Delivery address*
fact, and the permitted actor is *that* Shopper. `actors: [shopper]` would say
any Shopper; `related` needs a hop. `self: true` is the zero-hop path, and it
requires the targeted Entity to act. `related: []` is an error, so the identity
path has one spelling.

### `when` is a list of conditions

```yaml
when:
  - { fact: Total charged, over: 100 }                                  # hard-coded
  - { fact: Total charged, over: { configuredBy: approval-policy } }    # customer-set threshold
  - { entity: workspace-settings, fact: Approval required, is: true }   # feature flag
  - { state: Published }                                                # current state
```

A grant's `when` is always a list, AND-ed, so a one-condition grant and a
three-condition grant have one shape. Each condition has exactly one operator:

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

`at-least` and `at-most` were rejected once as `over`/`under` with an
off-by-one argument. That holds only for integers; facts are untyped, and
`over: 99.99` is the wrong rule for money and for time. For a non-integer fact
the two are different rules, not two encodings of one.

**The operator implies the comparison; the fact declares no type.** `lint`
checks the fact and any named Entity resolve, and nothing more — whether
`Total charged` holds a number is `verify`'s job against code.

- **`fact`** defaults to a fact of the targeted Entity and may name another
  through `entity`, which is how thresholds and feature flags work: the value
  is a fact of a settings Entity and the Rule reads it.
- **`state`** says *the instance is in state X when the operation happens*. It
  must be a state of the targeted Entity; it is valid on every target but
  `creates`, where there is no instance yet; and it cannot be combined with
  `entity`, because another Entity's instance has no path from this one. It
  exists because two kinds of Step carry no state for a target to select by: a
  `reads` Step, and an information change — a rename, an edited address — which
  is `changes` with neither `from` nor `to`. *Anyone may read a Published
  collection* and *the shopper edits delivery details only while Pending* are
  both `when.state`. Where a matched Step does carry `from`, `lint` compares
  the two and a mismatch means the grant is not possible for that Step; where
  it does not, the condition is `verify`'s.
- A defaulted `fact` or a `state` needs exactly one Entity target to resolve
  against. A Rule with two, or none, is an error unless `entity` is explicit.

### What the common shapes look like

| Shape | Expressed |
| --- | --- |
| Role | `- { actors: [store-admin] }` |
| Ownership | `- { related: [{ verb: owns, entity: reader }] }` |
| Workspace membership | `- { related: [{ verb: contains, entity: workspace }, { verb: has member, entity: user }] }` |
| The instance itself | `- { self: true }` |
| Owner or admin | two grants |
| Admin *and* owner | one grant, two keys |
| Value threshold | `when: [{ fact: Total charged, at-least: 100 }]` |
| Configurable threshold / feature flag | `when: [{ entity: settings, fact: Approval required, is: true }]` |
| Read while Published | `{ effect: reads }` and `when: [{ state: Published }]` |
| Move gated by origin | `{ effect: changes, from: Pending, to: Cancelled }` |
| Information change gated by state | `{ effect: changes, facts: [Delivery details] }` and `when: [{ state: Pending }]` |
| *Never from this state* | `{ effect: changes, from: Refunded, to: Cancelled }` and `permits: []` |
| Gate the Product does not own | `- { configuredBy: role-assignment }` |
| Field-level visibility | `appliesTo: [{ …, facts: [Margin] }]` |
| Place-scoped | `appliesTo: [{ …, contexts: [...] }]` |
| Unattended behaviour | `- { unattended: true }` |
| Screens | at least one Actor using the Screen's container must have a possible grant |
| *Never deletable* | `{ effect: removes }` and `permits: []` |
| Derivation | `appliesTo: [{ …, facts: [Total charged] }]` and the formula in prose |

### How a modelled product's own RBAC lands

A product's permission feature is product behaviour, not this layer. **Role**
becomes an Entity with its own lifecycle, `assign-role` a Capability, and this
layer constrains who may create a Role.

| The product has | It is | Where it lands |
| --- | --- | --- |
| A fixed, shipped set of roles | a closed vocabulary | Entities that act — `permits.actors` works directly |
| User-defined roles created at runtime | instances | Entity `Role` — never one Entity per customer role |
| ABAC policies on attributes | instances | Entity `Policy`, and the Capabilities that define and evaluate it |

## What `lint` reports

`lint` checks **structural eligibility**. It cannot prove runtime ownership, a
fact's value, or customer configuration, and the plan never says it does. A
Step's actor has a *possible* grant when, for some grant in every Rule selecting
the operation: `actors` lists it; or `related` ends on its type; or `self` is
set and it is the targeted Entity; or `unattended` is set and the Scenario is
unattended; or `configuredBy` is set — and every `when.state` in that grant
equals the Step's `from` when the Step has one.

**Structure:**

- `permits` on a Rule with a behavioural or Context target.
- A grant with none of `actors`, `related`, `self`, `unattended`,
  `configuredBy`.
- `unattended` other than `true`; `self` other than `true`; `related: []`.
- `permits.actors`, a `related` endpoint, or a `self` target naming an Entity
  that does not act.
- `configuredBy` naming a missing Entity.
- `related` or a defaulted `when` on a Rule with other than exactly one Entity
  target.
- A `related` segment matching no relation, declared or inverse, from the
  current Entity; matching more than one; or passing through a self-relation.
- A grant whose `actors` excludes the type its `related` path ends on — it can
  never be satisfied.
- `when` not a list; a condition with no operator or two; an operator outside
  the eight.
- `when.fact` not a fact of the targeted Entity, or of `when.entity`;
  `when.entity` missing.
- `when.state` not a state of the targeted Entity; on a `creates` target;
  combined with `when.entity`.
- An Entity target whose `id`, `from`, `to`, `facts` entry, or `contexts`
  place does not resolve; `from` on a `creates` or `reads` target; `to` on a
  `removes` or `reads` target; a `contexts` place that presents the Entity
  nowhere.
- **Warning:** two permission Rules with identical target selectors.
- **Warning:** a target `from`, or a grant `when.state`, that every Step the
  target selects already satisfies — the minimal selector is canonical.

**Rules × Steps and Screens** — hard errors, ungraded:

- A Step performing an operation a Rule closes with `permits: []`, naming the
  Rule.
- A Step performing a governed operation whose actor has no possible grant in
  some Rule selecting it.
- A governed operation on a Step with no `actor` in an attended Scenario.
- An unattended Scenario performing a governed operation that no `unattended`
  grant permits.
- A Screen presenting an Entity whose `reads` are governed, where no Actor using
  the Screen's container has a possible grant.
- Fact-scoped Rules are checked by Screen reach only, since Steps cannot cite a
  fact.

**Removed:** the single-target warning no longer fires on Entity targets.

## What `verify` does

Confirms each Rule is actually enforced in code. An enforcement it cannot
locate is reported as **not established**, never as `code-right`.

| Rule carries | `verify` establishes that |
| --- | --- |
| `permits: []` | the code refuses the operation |
| `actors` | the check exists |
| `related` | the relationship lookup exists |
| `self` | the identity check exists |
| `when` | the comparison holds against a real value — the check `lint` deliberately does not make |
| `configuredBy` | the gate exists; who passes it is customer configuration and is not in the repository |
| `facts` and a derivation in prose | the formula is what the code computes |

## What is presented

- **Arcs on the Entity state machine carry their constraints**, drawn by
  [the Entity plan](./entity-at-the-center.md#what-is-presented): *Private →
  Published · `publish-collection` · owner only*.
- **A prohibition is a note on the state node**, not a phantom arc: *nothing
  leaves Fulfilled · Rule: fulfilled orders are final*. Steps draw arcs, and a
  forbidden operation has no Step.
- **A fact governed by Rules carries a marker** on its line in *Information
  kept*: *Total charged · 1 Rule*. Nothing more; the Rule page is the reading.
- **The Rule page reads its grants back as a sentence**, so a reader who never
  saw the format can tell it is wrong.

## What the skills do

- **`businesslens-map` gains a permission sweep** after the Entity sweep: walk
  every authorization check at the Product boundary; each becomes a grant on an
  Entity operation, or is reported as implementation-only under the
  *privilege that exists only in code* rule.
- **`businesslens-verify`** does the table above.
- `agents/openai.yaml` follows the skills.

## The wire

`spec/report.md` changes before the projection. A Rule record carries its
Entity targets as `{ type: "entity", entityId, effect, to, facts, contexts }`
and `permits` as `null` when omitted, `[]` for a prohibition, or a list of
grants. A grant is `{ actorIds, related, self, when, unattended,
configuredByEntityId }`, a `related` segment is `{ verb, entityId }`, and a
condition is `{ entityId, fact, state, operator, value }` where `value` is an
untyped scalar or `{ configuredByEntityId }`. Validation resolves every id
exactly as it resolves an Actor or Capability today.

## Release

Breaking, in one release with the other two plans: **folder schema 7 → 8**,
**Product Report v12 → v13**. `docs/business-rules.md` is where the model is
explained to users, and it grows accordingly.

Each shipped model carries a live case for every check. Which Rule lands
where, grant by grant, is
[The three models and the landing site](./models-and-landing.md#coverage-matrix).

**ADR-0017 — a Business Rule states what must remain true, including who may.**
Records why the constraint layer is not on the Entity, three-state `permits`,
AND across Rules, segmented paths, and the operator set, together with the
rejected alternatives below.

## Design record: what was tried and rejected

Recorded because the next reader will propose them again.

**`permits: []` as an error.** The first draft said *nobody may* is already
expressed by the lifecycle not having the operation. Reversed once the lifecycle
became derived from Steps: an absent arc is silence, and silence must not read
as prohibition.

**OR across Rules.** Any matching grant would suffice. Rejected because adding a
Rule could then only widen, and a broad Rule would silently loosen a narrow one.
Under AND, adding a Rule can only restrict, and the split-grant trap it creates
is caught by the identical-selector warning.

**No overlap between permission Rules.** One place per operation, an error on
overlap. Rejected because a broad Rule and a narrow one composing is the
ordinary case, not the mistake.

**Verb-only `related` paths.** `related: [owns]` reads well and fails on a
Workspace and a Folder that both *contain* Documents. Resolving that by
renaming a verb serves `lint` at the expense of the product's own words.

**Implicit AND/OR.** An earlier design had `actors` and `related` OR-ing while
`when` AND-ed, with the rule stated in prose. It was unknowable from the file.

**A `when`-only grant meaning *anyone, when*.** Rejected: *anyone* already has
an encoding, and a grant with no who is indistinguishable from a forgotten one.

**A single-mapping `when`.** One condition per grant, two conditions refused.
Rejected for the list: it is one shape for every count, and it matches *keys
within a grant are AND*.

**`over`/`under` only.** See the operator table. Correct for integers, wrong
for money.

**`permits` on a Capability target.** *Who may perform this behaviour.*
Rejected: an operation is an Entity effect, Interface `actors` already records
who uses a surface, and the Step check would duplicate the Entity one.

**No `from` on the Entity target.** The first settled shape put the current
state only in `when.state`. It could not say *a Refunded order is never
cancelled*: a prohibition has no grant to carry a `when`, so the only spelling
enumerated every other state and every actor that stays allowed, turning one
narrow claim into a permission policy for the whole operation. Reversed: a
target selects by the Step's own keys.

**`when.state` on `reads` only.** The next draft, to keep one spelling per
case. It could not say *the shopper edits delivery details only while
Pending*: an information change is `changes` with neither `from` nor `to`, so
it carries no state to select by, exactly like a read. Reversed for *a target
selects, a grant conditions*, with the redundancy warning holding the minimal
spelling canonical.

**`from` alone on an information-change Step.** So that targets could select
renames by state and `when.state` stay on reads. Rejected: it pushes the claim
onto every such Step, and a Step that omits it silently escapes the Rule.

**Rule-level `when`, `asserts`, `derives`.** Sketched as *scope + statement +
optional when + optional asserts/derives + optional permits*. Deferred, not
rejected: a structured derivation needs an arithmetic language, and that is not
added casually. If it comes, `appliesTo.facts` identifies the result and the
derivation names its inputs without repeating the target.

**Typed facts.** Chosen against, again: the operator carries the comparison, so
thresholds stay checkable without the Entity becoming a schema.
