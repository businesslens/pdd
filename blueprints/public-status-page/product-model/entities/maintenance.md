---
domain: maintenance
relations:
  - entity: component
    verb: affects
    cardinality: many-to-many
---

# Maintenance

A window of planned work, announced on the page before it starts.

## Information kept

- **Title** — the short name visitors see for the work
- **Description** — what will happen and what visitors may notice
- **Starts at** — when the window opens
- **Ends at** — when the window is planned to close, or when it actually closed
- **Affected components** — the components that will be under maintenance

## States

### Scheduled

Announced and upcoming. Shown on the current status page ahead of its start.

### In progress

Under way. Its affected components show Under maintenance.

### Completed

Over. It leaves the current status page and stays in the page's history.

### Cancelled

Called off before it started. Nothing in it happens, and it is no longer shown
as upcoming.
