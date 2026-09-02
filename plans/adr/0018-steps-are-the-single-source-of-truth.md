# 0018 — Steps are the single source of truth; the Entity describes, Rules constrain

Status: **Accepted** — 2026-09-02

Supersedes in part
[0014](./0014-relations-and-transitions-live-in-frontmatter.md): relations
stay in frontmatter; `transitions` is deleted.
[0011](./0011-a-things-states-belong-to-the-thing.md) keeps its half — a
thing's states belong to the thing.

## Context

The Entity was nominally the centre of the model and factually absent from most
of the acceptance surface. Across the three shipped models, 9%, 18% and 24% of
Steps named any Entity. The misses were ordinary — *"The admin opens the order
in the console"*, *"The item is removed from that collection"* — each naming an
Entity in English while the model said nothing.

Neither cause was the author's judgment. The skills never asked for it, and the
resources that owned the relationship said the least: a Capability declared
`entities: [id, …]`, thirteen ids on one Capability with no verb, no effect, no
state — so many identical unlabelled edges that the topology view dropped them.

`transitions` on the Entity had two defects, and the second is the stronger. It
stated a second time what a Step already states. And a per-Entity list cannot
express a combined lifecycle: *settling a payment confirms an Order and creates
a Shipment* is one act on two things, which only a Step can say.

## Decision

> **The Entity says what a thing is and what facts it has. Steps say what
> happens to it. Business Rules say what must remain true, including who may.**

- **`entities:` is required on every Step**, and `[]` is allowed. Silence
  becomes impossible; an omission becomes a claim that can be reviewed,
  linted, and contradicted by code. An entry is
  `{ entity, as?, effect, from?, to? }` with `effect` one of `creates`,
  `changes`, `removes`, `reads`, defaulting to `changes`. State keys are
  explicit and never inferred from a neighbouring Step: `creates` takes `to`,
  `removes` takes `from`, `changes` takes both or neither, `reads` takes none.
- **`as` is a scenario-local instance alias.** An `(entity, as)` pair appears
  at most once per Step; once an Entity is aliased in a Scenario, every
  mention of it there is aliased.
- **`transitions` is deleted. Capability `entities` is deleted.** Screen
  `entities` stays: a Screen has no acceptance surface, so nothing else states
  what it presents. The rule in general: a resource with an acceptance surface
  must not restate what its Steps demonstrate; a resource without one authors
  its own facts.
- **Facts gain names.** `- **Name** — prose`, unique per Entity, cited by that
  exact name and only from a Business Rule.
- **`actor` is valid on Product and condition Steps**, meaning the Actor the
  Step is attributable to. It joins the Scenario's Actor set and is forbidden
  in an unattended Scenario.
- **No wildcard `from`.** *Archive from any state* is one Scenario per origin.
  A Journey Step with a non-read effect requires `capability`.
- **The lifecycle is composed**, and `lint` reports what the composition is
  missing: an unreached state and an unproduced origin are warnings; no
  creation and no termination are notes the report shows. The first listed
  state stays implicitly reachable.
- **A Step whose text names an Entity title it does not declare** is a graded
  finding, exempting the Step's own `actor` and the phrase *"The Product"*.

## Considered and rejected

- **An `operations` table on the Entity.** The deleted Capability list moved
  to the other side and enriched. See
  [0017](./0017-a-business-rule-states-what-must-remain-true.md).
- **Deriving an arc's origin from Step order.** Inference from a neighbour is
  exactly the implicit reading this decision removes.
- **Making an unreached state an error for a `complete` model.** Surfacing the
  gap is the honest version; coercing coverage is not.
- **Dropping the chaining check** when the two-collections example made it
  fire falsely. Aliases make the check correct instead.
- **A bare mention after an alias** meaning a third, unnamed instance. It is
  the silent reading aliases exist to remove.
- **A wildcard `from`.** The origin an author did not write is an inference.

## Consequences

- **The accepted cost.** Two authors with different Scenario sets derive
  different lifecycles over the same states. This is a real loss against
  [0002](./0002-determinism-outranks-expressiveness.md)'s top axis, taken
  because the alternative cannot express a cross-entity lifecycle at all, and
  because the composition findings surface the resulting gaps.
- The Entity page draws its state machine from Steps: arcs labelled by
  Capability, constrained by Rules, with co-effects. A Capability page shows an
  aggregate per Entity. A Journey states what it leaves behind.
- `businesslens-map` and `businesslens-ideate` gain an Entity sweep after
  Steps are drafted. `businesslens-verify` verifies the Step's claims,
  including an `entities: []` the code contradicts.
- Folder schema 7 → 8 and Product Report v12 → v13, shared with
  [0016](./0016-one-resource-type-actor-is-the-subset-that-acts.md) and 0017.
