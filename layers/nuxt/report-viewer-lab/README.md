# Product Report viewer lab

The private Nuxt layer reserved for Product Report experiments.

It extends the stable `report-viewer` layer and is composed only into the
bundled local viewer. It has no package export and is excluded from published
package files, so an audition cannot become part of the public renderer by
accident.

The **Table navigation** audition is decided: Edge handles with Divider middle
now live in `report-viewer` across all three comparison views. Subtle handles sit
on the subject divider and the table’s right edge, centered on the visible rows;
narrow readings use compact header arrows. Controls move one column at a time,
with page scrolling, sticky headers, and expanded details preserved. The shadow
component, alternative placements, selectors, and experiment cookies have been
removed. The background audition remains independently owned by `theme-lab`.

The **Table corner**
audition is decided: Inset at 14 px is the stable diagonal header across
Compare delivery, What changes what, and Rule attachments. The alternatives,
cookie composable, and Table corner selector have been removed.

The **Control size**
audition is decided: page controls, filters and graph buttons use Nuxt UI's
`sm` size (28px) at every viewport width. The top navbar retains its own sizing.
The size selector, cookie composable and global override have been removed.

The **Scenario Step card** audition is decided: Guided flow is now the stable `BlrScenarioStep`.
It labels Action or Condition, Who, Entity effects, Where and Capability, and
reads each Entity effect as a phrase. The alternative drawings, their cookie
composable and the Step card selector have been removed.

Earlier experiments are decided: the selected Overview/Scenarios page and
direct-to-page navigation now live in `report-viewer`; the coverage mark was
auditioned here across the whole palette and its umber reading is now the stable
`BlrCoverageBadge`; the filter placement was auditioned across four positions
and the reading-aligned one is now the only one; the background audition remains
independently owned by `theme-lab`.

A future report experiment belongs here when it needs to shadow a stable
component or add a local-only control. Once decided, promote the selected
behavior into `report-viewer` and remove the experiment implementation from
this layer.
