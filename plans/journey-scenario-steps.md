# Journey Scenario steps

## Decision

BusinessLens Product Report v9 changes in place. There is no v10 compatibility
layer and no dual authored shape.

A Journey Scenario has one ordered `steps` list in frontmatter. Each step owns
its required single-line text and may name one Capability. A Capability-bearing
step also owns a `routes` mapping from route id to exact context.

```yaml
steps:
  - text: The Reader opens an unread library with nothing left to read
    capability: reading-state
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
  - text: The Reader refreshes their followed sources
    capability: feed-synchronization
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
  - text: No feed returns an item the library does not already hold
  - text: The unread library still presents the caught-up state
    capability: reading-state
    routes:
      web: reader-web::personal-library
      mobile: reader-mobile::personal-library
```

Journey Scenarios no longer author `flow`, `operation`, stage ids, a top-level
`routes` block, or Markdown `## Steps`. Capability Scenarios continue to author
their local behavioral Steps as a Markdown ordered list.

The Journey Scenario page renders this sequence once. A separate derived
Capability sequence may remain only on the parent Journey page or in a named
topology view where it answers a different question.

## Invariants

- `steps` is required and non-empty.
- Every step has non-empty, single-line `text`.
- `capability` is optional.
- A Capability-bearing step has a non-empty `routes` mapping.
- A step without a Capability cannot declare `routes`.
- All Capability-bearing steps declare the same route-id set.
- Route ids are unique lowercase kebab-case keys by construction.
- Each route context is within that step Capability's availability.
- No two route ids carry the same context through every Capability-bearing step.
- Each route's first Capability-bearing context permits a participating Journey
  Actor.
- Every Journey Scenario Actor is supported by at least one routed context.
- An achieved Journey Scenario uses at least two distinct Capabilities.
- A not-achieved Journey Scenario may use one Capability.
- Journey Capability, Domain, Screen-participation, Business Rule, entry-route,
  and handoff projections derive from Capability-bearing steps.

## Execution order

1. Change `spec/format.md` before parser or linter behavior.
2. Change `spec/report.md` before export, open, portable validation, or viewer
   behavior. Keep `schemaVersion: "9.0.0"` and replace the v9 shape in place.
3. Replace the authored model types and parser with structured Journey steps.
4. Replace lint and portable-report validation, including route correlation,
   Actor, availability, Journey derivation, Screen, and Business Rule checks.
5. Update export and expansion so v9 round-trips the new shape canonically.
6. Migrate the golden fixture and Content Feed Reader Blueprint semantically.
7. Update the report workspace, Journey parent projections, topology views,
   peeks, cards, and Journey Scenario page to use one annotated sequence.
8. Align Product Model docs, CLI docs, skills, embedded format references,
   rubrics, and the changelog.
9. Replace tests for the removed model and add coverage for the new invariants.
10. Validate every skill, run `npm run verify`, and run strict Claude plugin
    validation when the CLI is available.

## Migration policy

This is an intentional breaking replacement within Product Report v9. Old
authored `flow`, `operation`, top-level Journey Scenario `routes`, and Journey
Markdown `## Steps` receive direct findings naming `steps` as the replacement.
No automatic semantic migration or compatibility reader is retained.

## Completion

The work is complete when no production, fixture, Blueprint, documentation, or
skill source describes Journey Scenario flow operations; report v9 exports and
expands structured Journey steps losslessly; the report renders one Journey
Scenario sequence; all repository checks pass; and no publish, tag, or push has
occurred.
