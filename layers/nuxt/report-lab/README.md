# BusinessLens Nuxt Report Lab

An **optional** Nuxt layer that renders one Product Report through ten
competing designs so a direction can be chosen by looking rather than by
argument. It is the report-shaped sibling of `theme-lab`: an audition surface,
not a product surface.

Nothing here is part of the shipped report contract. `report-viewer` stays the
stable renderer; when a design wins, its parts are promoted into
`report-viewer` and `src/`, and the rest of this layer is deleted.

## What it adds

- `BusinessLensReportLab` — projects the whole report once and renders it
  through the selected design.
- `BusinessLensReportLabRow` — the audition control, built to sit in the
  theme lab bar's `#after` slot. `shift` + `←`/`→` steps through the designs.
- `projectReportWorkspace()` — the complete projection of a Product Report v8:
  every entity kind, every authored field, plus the backlinks the format never
  stores because it records each relation in one direction only.
- A shared Vue Flow foundation: one node component for every entity kind, a
  deterministic layered layout, and `BlrTopology` — the contextual
  neighbourhood graph every design opens from a selected entity.

## The designs

All ten start from the conclusions in `REPORT-VISUALIZATION-BRIEF.md`: the
report is a collection of purpose-built views over one shared model, each view
answers a named Product question, and topology is contextual rather than the
home page. Every design contains the four required views — Journey browser
(cards, table and detail), Screen map, Capability map with named matrices, and
contextual topology — plus Scenario flows, Business Rule impact and
access-context views. They differ in information architecture: which question
comes first, and how a reader moves from overview to one entity.

| Design | Organising idea |
| --- | --- |
| Meridian | The reference answer: one section per Product question, topology inside the selected entity |
| Inquiry | The questions themselves are the navigation; each opens the view built to answer it |
| Canvas | Scene-based topology with a docked inspector — as graph-forward as the brief allows |
| Tripane | Nav, working view and inspector always on screen; selection never navigates away |
| Narrative | One scrolling story from access to constraints, detail unfolding inline |
| Promises | Journeys first; Screens, Capabilities and Rules are reached through the promise they serve |
| Gateway | The Screen map is the front door; a selected access context scopes every other view |
| Crossgrid | Named matrices are the spine; each answers one written question |
| Beacon | Search-first explorer; any entity in two keystrokes, views as tabs |
| Panorama | A wall of live view tiles, each expandable to the whole surface |

`Shipped` renders the current `BusinessLensReportViewer` unchanged, as the
baseline to compare against. It is not counted among the ten experiments.

## Use

```ts
export default defineNuxtConfig({
  extends: ['businesslens/nuxt/report-lab']
})
```

```vue
<BusinessLensThemeLabBar :row-count="3">
  <template #after>
    <BusinessLensReportLabRow />
  </template>
</BusinessLensThemeLabBar>

<BusinessLensReportLab :report="report" :logo-src="logoSrc" />
```

The layer extends `report-viewer` and `theme-lab`, so extending it alone gives
a host the stable renderer, the shared visual foundation and the audition
controls.

## Selection

The design and the width override are cookies (`bl-report-design`,
`bl-report-width`) read during SSR and mirrored onto `<html>` as
`data-report-design` and `data-report-width`, so a reload never flashes the
previous design. Width defaults to whatever each design was drawn for and can
be forced to one column, wide, or edge to edge.

## Colour

Categorical colour uses one fixed slot order, validated against the
BusinessLens surfaces in both modes (`app/utils/reportPalette.ts` records the
result). Nine entity kinds is past what hue alone can separate, so colour is
never the only encoding: every coloured mark ships with a label, and graph
nodes additionally carry a per-kind silhouette and icon.
