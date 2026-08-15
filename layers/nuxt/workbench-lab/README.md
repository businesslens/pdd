# Workbench audition layer

Three parts of the Workbench, five options each, switchable from **Variations**
in the local viewer's header. Everything else — the rail, the collections, the
grouping, the routing — stays exactly as it ships.

This layer never ships: `package.json` excludes it from `files`, there is no
export for it, and `test/workbench-lab.test.ts` holds both.

## How it works

The variations **shadow** shipped components by name. Nuxt resolves a component
from the topmost layer that defines it, and the local viewer extends this lab
above `report-viewer`, so `BlrEntityPeek.vue` and `BlrEntityPage.vue` here stand
in front of the shipped ones. **Not one line of `report-viewer` changed.**

When an axis is at its default, the dispatcher renders the *shipped* component
by path — the baseline in the comparison is the thing that actually ships, not
a copy of it that can drift.

## Axis 1 — Peek · *the slideover is hard to read*

| Option | Premise | Costs |
| --- | --- | --- |
| **Zones** (default, shipped) | Identity, a sentence, three facts, connections as chips. | Many small objects of similar weight; long relation labels crowd the chips. |
| **Prose** | The entity described in two sentences, with only the names as links. | Counts are harder to compare; a long sentence hides its own structure. |
| **Spec sheet** | One aligned two-column table, every fact and relation on its own row. | Reads as data, not meaning; nothing is emphasised over anything else. |
| **Map** | A small diagram: what reaches it on the left, what it reaches on the right. | Holds few names at panel width; the lead has to shrink. |
| **Bars** | Relations as bars sized by count — the shape of an entity before its words. | Implies comparability across kinds that may not be comparable. |

Only **Map** distinguishes inbound from outbound, which the model authors and a
flat chip list throws away. Only **Bars** shows the entity's weight before its
words.

Measured at 1600×1000 across Capability, Capability Scenario, Journey, Screen
and Actor: **Zones, Map and Bars fit the panel on every kind.** Prose overflows
by 160px and Spec by 328px on an Actor — both list every relation by name
rather than capping, which is the trade they are making, so the overflow is part
of what is being judged rather than a bug to tune away.

## Axis 2 — Page · *the drilldown is too occupied*

Measured on the `Reading state` Capability page, 1600×1000, pane 891px:

| Option | Content height | What it does |
| --- | --- | --- |
| **One scroll** (default, shipped) | 1214px | Every section stacked. Nothing hidden, nothing to learn. |
| **Tabs** | 293px | Named destinations with counts. Empty tabs are not rendered. |
| **Split** | 788px | Reading left; connections, counterparts, references dock right. |
| **Anchored** | 1254px | One scroll plus a contents rail that tracks where you are. |
| **Accordion** | 645px | Sections collapsed with counts; Overview and Detail start open. |

`Tabs` and `Accordion` fit the pane without scrolling. `Anchored` is *longer*
than the baseline — it adds orientation, not brevity, which is the question it
exists to ask.

## Axis 3 — Scenarios · *parent ⇄ child is hard to navigate*

| Option | On the parent page | On a Scenario page |
| --- | --- | --- |
| **Cards** (default, shipped) | Child rows, each opening a page. | Parent link. |
| **Stepper** | Numbered list. | Parent link, plus `‹ prev · 2 of 3 · next ›`. |
| **Inline** | Children expand where listed — no page needed. | Parent link. |
| **Split** | List left, chosen Scenario right, in place. | Parent link plus stepper. |
| **Sibling rail** | Plain list. | A rail of every sibling that stays while you move. |

### Fixed in the base, not auditioned

A Scenario page's breadcrumb read `Capability Scenarios › Create an owned
collection` — a collection the reader never chose, and no sign of the parent
they came from. It now walks the containment:

```
Content Feed Reader › CAPABILITIES › Collection creation › Create an owned collection
Content Feed Reader › JOURNEYS › Catch up on unread › Work through the unread backlog
```

That is a defect, not a preference, so it is in `report-viewer` and every
variation inherits it.

## What they share

All fifteen options render the same projection and the same shipped primitives —
`BlrEntityBody`, `BlrConnections`, `BlrEntityCard`, `BlrAvail`. The peek
variations draw from one `peekFacts` module and the page layouts arrange one
`sectionsFor` list, so a comparison is never between two different summaries of
the same entity.

## Adding an option

Add it to the axis in `app/utils/labVariants.ts` — `premise` and `cost` are both
required, because an option that claims no weakness decides nothing — then a
component beside its siblings, and a branch in the dispatcher (`BlrEntityPeek`,
`BlrEntityPage`, or `BlrChildren`).
