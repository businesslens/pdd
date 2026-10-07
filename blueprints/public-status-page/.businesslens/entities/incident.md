---
domain: incidents
relations:
  - entity: component
    verb: affects
    cardinality: many-to-many
  - entity: incident-update
    verb: has
    cardinality: one-to-many
---

# Incident

An unplanned problem operators have declared on the page, told through a
timeline of updates until it is resolved.

## Information kept

- **Title** — the short name visitors see for the problem
- **Impact** — how severe the operators judge it: Minor, Major or Critical
- **Affected components** — the components the operators said it affects
- **Started at** — when it was declared
- **Resolved at** — when the operators resolved it, once they have

## States

### Investigating

Declared; the operators are looking into the cause. It is shown on the current
status page.

### Identified

The operators have found the cause and are working on a fix.

### Monitoring

A fix is in place and the operators are watching to make sure it holds.

### Resolved

Over. It leaves the current status page and stays in the page's history with
its full timeline.
