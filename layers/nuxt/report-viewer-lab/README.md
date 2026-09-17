# Product Report viewer lab

The private Nuxt layer reserved for Product Report experiments.

It extends the stable `report-viewer` layer and is composed only into the
bundled local viewer. It has no package export and is excluded from published
package files, so an audition cannot become part of the public renderer by
accident.

There are no active report experiments in this layer.

The **Product picker** audition is decided: Hairline is the stable treatment,
with a faint outline, transparent background and a quiet hover highlight.
Collapsed navigation keeps a 32px trigger and 17px logo. The dropdown centers
the logo, Product name and selected checkmark in each row. This now lives in
the shared picker for local and catalog hosts; the variant selector, cookie
composable and experimental stylesheet have been removed.

The **Collapsed icons** audition is decided: collapsed navigation and utility
icons use 17px glyphs. The selected size now lives in the
stable menu components. The size selector, cookie composable and override have
been removed; expanded and mobile menus retain their existing glyph sizes.
Navigation and reference rows now use 36px targets for more breathing room;
brand controls and the collapsed Product picker retain 32px targets.

The **Control size**
audition is decided: page controls, filters and graph buttons use Nuxt UI's
`sm` size (28px) at every viewport width. The optional theme lab retains its own sizing.
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
