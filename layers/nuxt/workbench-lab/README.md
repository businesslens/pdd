# Workbench audition layer

Five readings of one Product Model, switchable from the local viewer's header.
This layer never ships: `package.json` excludes it from `files`, there is no
`./nuxt/workbench-lab` export, and `test/workbench-lab.test.ts` holds all three.

The shipped Workbench was reached by argument. These four alternatives exist so
it can be reached by comparison instead — each starts from a different premise
about what a Product Model *is*, and each is complete enough to be used, because
a sketch you cannot navigate proves nothing.

| Reading | Premise | What a click means | What it costs |
| --- | --- | --- | --- |
| **Workbench** | Ten collections, each with a containment worth grouping by. | Peek from a list, then open the page. | Cross-kind questions need Topology; the rail is always a decision. |
| **Atlas** | A territory. Position and adjacency carry meaning. | Select a box; it reads beside the map, which never moves. | Reading long bodies on a canvas; finding what you cannot see. |
| **Storyline** | A set of promises unfolding in time. | Follow a Journey left to right; Scenarios are variant tracks. | Everything not on a Journey. |
| **Ledger** | A dataset. Every entity is a row; kind is a column. | Type a query; expand a row in place. `j`/`k`, `Enter`, `/`. | Narrative and shape. |
| **Columns** | Three trees, best walked one level at a time. | Drill left to right; the last column is the reading. | Multi-parent entities appear in several paths; horizontal space. |

## What they share, and why

Every variation renders the same `projectReportWorkspace` output and the same
entity primitives — `BlrLabReading` wraps `BlrEntityBody` and `BlrConnections`,
which are the shipped components. Four different renderings of a Screen would
make the comparison meaningless: what is being compared is **navigation**, not
typography.

`app/utils/model.ts` is the single reach across into `report-viewer`. A
variation that forked the projection would be auditioning something else.

## Things worth watching for while comparing

- **Counterparts.** Two Screens can share a title across Interfaces. Ledger
  shows the qualified id, Storyline names the Interface, Columns puts them in
  different paths, Atlas separates them in space, and the Workbench carries the
  scope on the row. Each solves it differently; some more cheaply than others.
- **What is unreached.** Only Storyline can show you a Capability that no
  promise runs through, because only Storyline is organized by promise.
- **Cross-kind questions.** Only Ledger takes "what in this model mentions
  publishing" as a single gesture.
- **Where your place goes.** Atlas never moves the map; Ledger never moves the
  row; Columns never scrolls to go deeper; the Workbench navigates away and
  comes back with the browser.

## Adding one

Add an entry to `app/utils/workbenchVariants.ts` — `premise`, `gesture` and
`cost` are all required, because an option that claims no weakness is not a
comparison — then a `BlrLab<Name>.vue` beside the others, and a branch in
`BusinessLensReportLab.vue`. Take `workspace`, `variant` and `logoSrc`, wrap the
body in `BlrLabFrame`, and use `BlrLabReading` for the reading.
