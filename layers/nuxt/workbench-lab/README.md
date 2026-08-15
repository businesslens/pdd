# Workbench audition layer

Three decisions left open, five options each. Switch them in the **experiment
bar** — the sliders button in the header opens it, the same one the background
audition uses.

Everything else — the rail, the collections, the grouping, the routing — stays
exactly as it ships. This layer never ships either: `package.json` excludes it
from `files`, there is no export for it, and `test/workbench-lab.test.ts` holds
both.

## What the first round settled

- **The page is tabbed**, and Detail, Connections and Also-on belong *in* the
  Overview rather than beside it. They are what an overview of an entity is —
  what it says, what it touches, where else it exists. As peers they made four
  thin tabs where one full one was wanted.
- **The slideover shows what the page shows.** It is the same component in a
  different container, so a reader picks where to read rather than learning an
  entity twice. Every panel carries `Open as page`.
- **A Scenario has no page.** It is read inside its parent, because you read a
  Capability's Scenarios to compare them and a page put each one alone. Reaching
  one by URL or ⌘K opens the parent with that Scenario chosen.

## How it works

The variations **shadow** shipped components by name — Nuxt resolves a component
from the topmost layer that defines it, and the local viewer extends this lab
above `report-viewer`. `BlrEntityPage.vue` and `BlrInspector.vue` here stand in
front of the shipped ones. **Not one line of `report-viewer` changed.**

Both dispatchers render one component, `BlrEntityReading`. That is the point: a
page and a panel that disagree about an entity is the thing that made the old
peek hard to trust.

## Axis 1 — Page · *how few tabs can it get away with?*

| Option | What it does | Costs |
| --- | --- | --- |
| **Two tabs** (default) | Overview holds everything; Scenarios is the only other tab. | Long Overview for a Screen, which authors states, actions and information. |
| **Detail apart** | Overview keeps identity and relations; the authored body gets a tab. | Splits the two things a reader most often wants together. |
| **Side tabs** | The same tabs down the left, names always visible. | About 11rem of reading width, on every page. |
| **Disclosed** | One Overview; relations and references fold away at its end. | Back to one long scroll for anyone who wanted the connections. |
| **Two column** | Overview in two columns: reading left, relations right. | Needs width; below 1280px it stacks and reads like Two tabs. |

## Axis 2 — Slideover · *the same reading, in how much room?*

| Option | Width | Costs |
| --- | --- | --- |
| **Narrow** | 448px | Tabs wrap; the body reads in a column half the page width. |
| **Wide** (default) | 672px | Covers most of the list, so the place you came from stops being visible. |
| **Sheet** | 1152px | If it covers everything it is a page — and pages already have URLs. |
| **Side tabs** | 640px, tabs on the left edge | Two navigation columns on screen at once, counting the rail. |
| **No slideover** | — a row opens the page | Every glance costs the list you were scanning, and a trip back. |

## Axis 3 — Scenarios · *inside the parent, but where?*

| Option | What it does | Costs |
| --- | --- | --- |
| **Inline** | Each expands where it is listed, one at a time. | The list is pushed down as you read, so the next one moves. |
| **Split** (default) | List left, chosen Scenario right. The list never moves. | Reads in a narrower column than the page it sits on. |
| **Index** | A compact strip above, the reading at full width below. | Long lists push the reading below the fold. |
| **Tabs** | Each Scenario is a tab. | Ten Capability Scenarios make ten tabs, and tab strips do not scale. |
| **Sequence** | All of them in order. Nothing to click, comparison is free. | The longest by far, with the parent's own reading above all of it. |

## Fixed in the base, not auditioned

A Scenario page's breadcrumb read `Capability Scenarios › Create an owned
collection` — a collection the reader never chose, with no sign of the parent.
It now walks the containment, and every option inherits it:

```
Content Feed Reader › CAPABILITIES › Collection creation › Create an owned collection
Content Feed Reader › JOURNEYS     › Catch up on unread  › Work through the unread backlog
```

## Adding an option

Add it to the axis in `app/utils/labVariants.ts` — `premise` and `cost` are both
required, because an option that claims no weakness decides nothing — then
handle it where its axis is read: `BlrEntityReading` for the page, `BlrInspector`
for the slideover, `BlrScenarios` for the Scenarios.
