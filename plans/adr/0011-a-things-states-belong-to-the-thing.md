# 0011 — A thing's states belong to the thing, not to the views that show it

Status: **Accepted** — 2026-08-26. The kind is named **Entity**; see
[ADR-0012](./0012-entity-and-element.md).

## Context

`## Product states` on a Screen was doing two different jobs, and the evidence is
unambiguous across the shipped models:

| Screen | Its "Product states" | What they are |
| --- | --- | --- |
| `collection-workspace` | Private · Published | the **Collection's** states |
| `public-collection` | Published · Unlisted | the **Collection's** states |
| `product-record` | Available · Unavailable | the **thing sold's** states |
| `entity-collection` | Populated · Empty | the **view's** states |
| `unread-library` | Unread available · Caught up | the **view's** states |
| `entity-page` | Overview open · Scenarios open | the **view's** states |

The teaching Blueprint writes `Private / Published / Unlisted` on **two Screens**
and, since schema 7, on the Collection as well. One fact, three copies, no link
between them. The heading invited it: a section called *Product states* on a
Screen reads as "the Product's states", which is exactly what a thing owns.

## Decision

**A thing's states belong to the thing. A view's states belong to the view.**

The Screen's section is renamed **`## View states`** and restricted to states of
the view — empty, populated, unauthorized, caught-up. A Screen that shows a thing
in some state declares the thing, and names its own view state for the
difference, because one state of a thing renders differently on different
Screens.

The rename is the substance of this decision, not an incidental. Leaving the
heading as *Product states* under a restricting rule keeps the trap open.

## Consequences

- 13 Screens across the two shipped models are touched. Most keep their content
  unchanged; the few that wrote a thing's states hand them over.
- `## Information presented` narrows the same way — what *this view* shows, never
  what the thing is. Nothing repeats: a Screen declares the thing and the reader
  follows the link.
- An asset's `state:` on a Screen names a View state. On a thing, it names one of
  that thing's own states.
