# 0017 — A Business Rule states what must remain true, including who may

Status: **Accepted** — 2026-09-02

## Context

Permission had no home. *Only the Reader who created a collection can change
it* lived in the lead paragraph of a Rule, as English, where nothing could
resolve it, draw it, or check it against code. Two homes were argued.

**On the Entity**, as an `operations` table enumerating every Capability that
may create, change, remove or read it, deny by default. Rejected: it restated
what Steps already say from the other side, and its gate caught only internal
inconsistency — a Step claiming a false `creates` is a truth error, which is
`verify`'s domain against source, not `lint`'s against the model.

**In the Business Rule.** A Rule already owns where it applies and already
governs several behaviours at once. What it lacked was a target that names a
thing and a way to say who.

Along the way the Rule's own scope was found too narrow. *Business Rules say
who may* left no home for *Total charged equals Subtotal plus Tax minus
Discount* or *a refund never exceeds the charge*, which are Rules by any
reading.

## Decision

**A Business Rule states a durable constraint, derivation, or authorization
policy. Permission claims appear only in Business Rules; not every Business Rule
is a permission.**

1. **Entity targets.** `appliesTo` accepts
   `{ type: entity, id, effect?, from?, to?, facts?, contexts? }`. **A target
   selects; a grant conditions.** `effect`, `from` and `to` select Steps by the
   keys their `entities` entry already carries. `facts` names the facts the
   Rule governs. Entity targets are exempt from the single-target warning.
2. **Three-state `permits`.** Omitted: no authorization claim. `[]`: the
   operation is forbidden to everyone. A list: permitted through any one
   grant. Silence is not a claim; `[]` is. A Rule with `permits` targets
   Entities only.
3. **The algebra.** Grants within a Rule are OR. Keys within a grant are AND.
   Rules selecting the same operation are AND. An operation no permission Rule
   selects is open. Two permission Rules with identical selectors warn.
4. **Grant keys.** `actors`; `related`, a path of `{ verb, entity }` segments
   ending on an Entity that acts; `self: true`; `when`, a list of conditions
   AND-ed, each with one of eight operators — `over`, `under`, `at-least`,
   `at-most`, `is`, `is-not`, `present`, `absent` — or a `state`;
   `unattended: true`; `configuredBy`, an Entity id. Every grant names a who.
5. **The minimal selector is canonical.** A target `from`, or a grant
   `when.state`, that every selected Step already satisfies is a warning.
6. **`lint` checks structural eligibility; `verify` checks enforcement.**
   `lint` never claims a runtime grant is satisfied. An enforcement `verify`
   cannot locate is *not established*, never *code-right*.
7. **Derivations are prose plus `appliesTo.facts`.** No arithmetic language.

## Considered and rejected

- **`permits: []` as an error**, on the ground that the lifecycle not having an
  operation already says nobody may. Reversed once the lifecycle became
  derived from Steps: an absent arc is silence.
- **OR across Rules.** Adding a Rule could then only widen.
- **No overlap between permission Rules.** A broad Rule and a narrow one
  composing is the ordinary case, not the mistake.
- **Verb-only `related` paths.** Fails when a Workspace and a Folder both
  *contain* Documents, and fixing it by renaming a verb serves `lint` at the
  expense of the product's own words.
- **Implicit AND/OR** — `actors` and `related` OR-ing while `when` AND-ed, in
  prose. Unknowable from the file.
- **A `when`-only grant meaning *anyone, when*.** *Anyone* already has an
  encoding, and a grant with no who is indistinguishable from a forgotten one.
- **A single-mapping `when`.** The list is one shape for every count.
- **`over`/`under` only.** The off-by-one argument holds for integers and facts
  are untyped; `over: 99.99` is the wrong rule for money and for time.
- **`permits` on a Capability target.** An operation is an Entity effect;
  Interface `actors` already records who uses a surface.
- **No `from` on the target**, current state only in `when.state`. Could not
  say *a Refunded order is never cancelled*: a prohibition has no grant to
  carry a `when`, so the only spelling enumerated every other state and actor.
- **`when.state` on `reads` targets only.** Could not say *edit delivery
  details only while Pending*: an information change carries no state to
  select by, exactly like a read.
- **`from` alone on an information-change Step.** A Step that omits it
  silently escapes the Rule.
- **Rule-level `when`, `asserts`, `derives`.** Deferred, not rejected. A
  structured derivation needs defined behaviour for types, units, money,
  rounding, collections, missing values and time.
- **Typed facts.** The operator carries the comparison, so thresholds stay
  checkable without the Entity becoming a schema.

## Consequences

- `docs/business-rules.md` is where the permission model is explained, and it
  grows accordingly. `docs/entities.md` explains named facts.
- The Entity page draws a Rule's grants on the arcs it constrains, a
  prohibition as a note on the state, and a governed fact with a marker.
- `businesslens-map` gains a permission sweep: each authorization check at the
  Product boundary becomes a grant or is reported as implementation-only.
- Folder schema 7 → 8 and Product Report v12 → v13, shared with
  [0016](./0016-one-resource-type-actor-is-the-subset-that-acts.md) and
  [0018](./0018-steps-are-the-single-source-of-truth.md).
