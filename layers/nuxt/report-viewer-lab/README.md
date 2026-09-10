# Product Report viewer lab

The private Nuxt layer reserved for Product Report experiments.

It extends the stable `report-viewer` layer and is composed only into the
bundled local viewer. It has no package export and is excluded from published
package files, so an audition cannot become part of the public renderer by
accident.

There are no active report experiments. The selected Overview/Scenarios page and
direct-to-page navigation now live in `report-viewer`; the coverage mark was
auditioned here across the whole palette and its umber reading is now the stable
`BlrCoverageBadge`; the filter placement was auditioned across four positions
and the reading-aligned one is now the only one; the background audition remains
independently owned by `theme-lab`.

A future report experiment belongs here when it needs to shadow a stable
component or add a local-only control. Once decided, promote the selected
behavior into `report-viewer` and remove the experiment implementation from
this layer.
