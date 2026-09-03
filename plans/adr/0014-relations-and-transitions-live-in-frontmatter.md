# 0014 — Relational structure lives in frontmatter

Status: **Accepted** — 2026-08-27

Superseded in part by [0013](./0013-relationships-are-product-meaning.md) and [0018](./0018-steps-are-the-single-source-of-truth.md): relations stay in frontmatter, but `cardinality` states both ends — `one-to-one|one-to-many|many-to-many`, not `one` or `many`; `transitions` is deleted and the lifecycle is composed from Steps, each of which carries an `entities` list of `{ entity, effect, from, to }` effects rather than a single `entity` + `state`.

## Context

`spec/format.md` states the rule:

> **Frontmatter = relations and navigation, with one relational-prose
> exception.** Both Scenario types keep their structured `steps` in frontmatter
> so each single-line statement stays beside its kind, responsible Actor,
> Capability qualification, and route-specific Contexts. Other prose remains in
> the Markdown body.

Every existing field obeys it. Frontmatter holds references to other elements by
id (`actors`, `screens`, `domain`, `entities`, `availability`, `appliesTo`),
closed-set classifications (`kind`, `relationship`, `access`, `result`), and
navigation (`entryPoints`, `routes`). Sections hold this element's own content —
prose, and lists of prose, and H3 state groups. **No section names another
element by id.**

Except `## Transitions`, added a day earlier in this same release, which names a
Capability id. That was an unforced departure, and it carried a concrete hazard:
the line is regex-parsed, so a state named `Sold by owner` silently mis-parses.

```
- Available → Sold by owner     parses as to="Sold", by="owner", and lints clean
```

## Decision

**Relational structure goes in frontmatter.** Two consequences:

- An Entity's relations are frontmatter records —
  `{ entity, verb, cardinality }`. `verb` is a free single-line phrase in the
  product's own words; `cardinality` is `one` or `many`, written explicitly so
  that *one* is a choice somebody made rather than a silent default.
- `## Transitions` becomes `transitions: [{ from, to, by }]`.

**A relation is declared on one side only**; the inverse is derived and shown on
the other, so the two can never disagree.

## Consequences

- Ids are parsed, not regexed. The `Sold by owner` class of silent mis-parse is
  gone.
- Readability in a pull-request diff is the real cost, and it is the cost
  `appliesTo` and `steps` already pay. `## States` stays a section: its content
  is the Entity's own, and it names nothing.
- A kept fact that only restates an edge is removed. *"The saved items it
  holds"* becomes the relation; *"The order the owner arranged its items in"*
  stays, because the ordering is a fact no edge expresses. The test for a kept
  bullet: **does it say anything beyond the existence of the edge?**
- A Scenario Step gains `entity` and optional `state`, and a Scenario's Entity
  set is **derived from its Steps** — the precedent the format already set for
  Actors, Screens, Experiences and Interfaces.
