# Resource navigation and visualization placement

Status: implemented, 2026-09-09. Landing authentication conflicts are resolved;
the latest verification results and remaining gates are recorded below.

## Outcome

Introduce the Product Model through six independent resource collections:
Entities, Interfaces, Domains, Capabilities, Journeys, and Business Rules.
Overview sits above Resources. Every named visualization has one primary home
with its subject, and resource pages open the same reading with a relevant focus.

Experiences and Screens retain their identities, report pages, and qualified ids.
Their complete documentation lives in the Interfaces article. Report readers
reach them through Interfaces. Scenarios remain
inside their Capability or Journey. Journeys remain independent because they
express Actor goals crossing Capabilities and interaction contexts.

## Filesystem and model

Keep the authored format, paths, ids, ownership, and report data schema unchanged.
Interfaces already own Experiences and direct Screens; Experiences own Screens;
Capabilities and Journeys own their respective Scenarios. Domains classify
Capabilities and Entities without owning their files. Six collection entry points
do not reduce the eleven formal resource types to six.

Update BusinessLens's own model before implementation: report Overview, resource
collection, resource page, named visualization Screen, inspection Capability,
and acceptance Scenarios for placement, ownership, state restoration and scope.
Record current approved behavior, not this implementation history, in the model.

## Report navigation

The rail contains Overview and a Resources section with the six collections.
Remove the Topology/Explore navigation destinations. Keep the rail flat.
Collections open List by default; card/table appearance stays inside List.
Collection readings are URL-backed and have an obvious return to List.

Interfaces List is an expandable instance directory. A name opens the resource;
a separate chevron expands children. Interface, Experience and Screen pages keep
Interfaces selected in the rail. Breadcrumbs follow actual ownership. A Screen
directly under an Interface has no invented Experience ancestor. Shared Screens
appear once under their Interface, with references from its Experiences.
Large directories offer search/type narrowing with owner context; small ones do
not pay for unnecessary controls. Global search still finds every resource type.

## Complete visualization placement

| Reading | Primary home | Form |
| --- | --- | --- |
| Product map, renamed Domain map | Domains → Map | Grouped Capabilities and Entities by authored Domain |
| Interface map, formerly Sitemap | Interfaces → Map | Interactive Vue Flow containment tree |
| Compare delivery | Interfaces → secondary Compare delivery action | Structured cross-Interface delivery reading |
| Entity relationships, formerly What it keeps | Entities → Relationships | Vue Flow graph with verbs and cardinalities |
| What changes what | Capabilities → What changes what | Capability × Entity mutation matrix with Scenario evidence |
| Rule attachments, formerly Rule reach | Business Rules → Attachments | Explicit attachment matrix retaining target restrictions |
| Journey composition | Journey → Scenarios → Composition | Ordered Capability occurrences in Scenario columns |
| Entity Lifecycle | Entity → Lifecycle | Vue Flow state machine derived from Scenario effects |
| All resources and connections, formerly Everything | Overview → secondary action | Complete grouped inventory and focused directional connections |

Interface Overview retains contained resources and delivery. Experience Overview
shows its Screens, links to shared Screens, and available Capabilities. Resource
Overview retains incoming/outgoing Connections without repeating information
already shown. Scenario Steps and route comparisons remain in Scenarios.
No additional resource-page tabs beyond Overview, Scenarios or Lifecycle.

Domain map adds classified Entities alongside Capabilities and removes the access
rail; Actors and Interface delivery are already explained in Interfaces. Keep
unassigned resources visible, including a model with no Domains. Unassigned is a
display group, never an authored Domain. Classification does not imply containment
or dependencies. Interface map edges express containment, not navigation routes.
Rule matrices show authored attachments, not inferred enforcement. Mutation
matrices show creates/changes/removes and their evidence, excluding reads.

Keep existing Vue Flow graph rendering and measured placement. Keep the useful
HTML tables and structured readings. This work relocates and clarifies these
readings rather than replacing their rendering engines.

## Contextual links and continuity

- Domain pages open Domain map with that Domain in focus.
- Interfaces, Experiences and Screens open Interface map with ownership context.
- Entities open focused relationships and mutation readings.
- Capabilities open their mutation reading and relevant Domain context.
- Rules and resources with explicit attachments open the same attachment matrix.
- Contextual links do not create additional homes. Show active scope and provide
  a way to clear it. Back returns to the originating page and reading.
- Migrate original Topology URLs and newer Explore destination URLs, plus old
  Experience/Screen collection URLs, to their resource homes.
- Preserve valid focus, filters, expansion, graph position, Scenario and route
  selection across browser history, refresh, and model recompilation.
- Support both local `s` and catalog `tab` section parameters and multiple viewer
  instances; do not change the portable Product Report schema for navigation.

## Public docs in pdd

Keep docs flat and preserve access from existing URLs. Introduce the six main collections in
Product Model, with Product as the whole-product definition and child types
explained under their owning family. Make Interface → Screen explicit alongside
Interface → Experience → Screen, with optional layers clear.

Explain Experiences and Screens as sections of `docs/interfaces.md`, with their
complete definitions, file examples, and lint constraints. They have no separate
docs pages or sidebar entries. Restore the existing documentation UI and remove
the custom navigation tree, parent metadata, and code-block UX changes.
Former docs URLs redirect to the corresponding Interfaces sections.
Update resource docs with their named report reading and update CLI view guidance.
Move their vocabulary definitions to Interfaces with section anchors, update
resource and documentation links, and regenerate the vocabulary registry.
Keep doc ordering contiguous after removing the two standalone pages.

## Sibling landing repository

- Keep the existing Nuxt Content schema and documentation navigation components.
  Redirect the former Experience and Screen docs URLs to Interfaces sections.
- Teach six main collections on the homepage. Interfaces introduces Experiences
  and Screens; Capabilities and Journeys introduce their respective Scenarios.
  Retain all formal type names and meanings, and use a balanced six-card layout.
- Keep the original desktop and mobile hero artwork per the user's follow-up;
  remove the replacement assets. Align the internal glossary, documentation contracts,
  marketing descriptions and decisions. Add an ADR superseding the eight equal
  primary-card policy without merging or deleting resource types.
- Use the shared report layer in the Blueprint viewer with the same placement,
  state persistence, ownership and URL migration as the CLI host.
- Keep unrelated authentication changes intact. Do not publish or commit.

## Execution and validation

1. Save this plan and update the approved self-model and governing navigation
   documentation. Lint the self-model.
2. Implement resource ownership, collection readings, migration and contextual
   links. Refocus Domain map and build the Interface directory.
3. Update PDD documentation and vocabulary, then landing navigation, homepage,
   contract documentation and ADR.
4. Run focused semantic/navigation tests, PDD `npm run verify`, skill/plugin
   validation, browser navigation/accessibility/layout checks, and packed
   consumers as appropriate. Exercise both hosts, direct links and history.
5. Run landing's editorconfig, peers, lint, typecheck, knip, screenshot manifest,
   integration, browser, build and applicable visual/performance checks. Record
   exact pre-existing blockers separately from failures introduced here.

Acceptance includes every reading above; direct and shared Screens; Interfaces
without Experiences and nonvisual Interfaces; models without Domains/Journeys;
unassigned and disconnected resources; repeated titles with distinct ids; large
graphs; understandable mobile navigation; and preserved state after reload/edit.

## Implementation and verification

Implemented the six collection rail, all nine reading placements, the Interface
directory and ownership breadcrumbs, shared Screen references, Domain
classification, legacy URL migration, and persistent collection/diagram state.
Updated the self-model, governing navigation guidance, public docs, vocabulary,
consolidated Interfaces documentation, six homepage cards,
and the landing decision record. Authored paths and portable report schema remain
unchanged.

Collection facets, grouping, card/table preferences and collapsed groups use
session storage scoped to the report and host path. The selected collection,
named reading, resource, diagram filters, directory search and expansion remain
URL-backed. Deleted facet IDs are discarded on model updates. Documentation uses
its original navigation, layout, and code-block components.

Validation of the initial implementation (before the documentation refinement):

- PDD `npm run verify`: 380 tests in 27 files passed, including both typechecks,
  production viewer build, repository, source-size and Blueprint checks.
- Self-model structural lint: no errors or warnings. Bounded source alignment
  review found no remaining mismatch after the final fixes.
- All three public skill validators and the strict Claude plugin validator passed.
- Report browser navigation passed at 1440 and 390 px, including old links,
  contextual readings, direct/shared Screens, Back and refresh. Collection
  grouping, card/table preference and facet restoration were also exercised.
- Diagram geometry passed 96 readings across three models and four widths,
  plus the 500-resource / 2,000-relation stress case. Placement, connectors,
  readable labels and viewport restoration passed.
- Report accessibility: 44 reading/theme/viewport scans plus Interface directory
  and Experience page scans passed with no WCAG A/AA violations.
- Packed npm and pnpm consumers passed preparation, typechecking, production
  builds, SSR/hydration, lazy graph workers, multiple viewer instances, resource
  navigation, catalog parameter migration and Lifecycle checks. CLI-only install
  kept Nuxt, Vue Flow and ELK optional. The final dry pack is 2,096,178 bytes,
  below the existing 2,097,152-byte ceiling; future additions have little headroom.
- Landing's 26 focused navigation/homepage tests, changed-file ESLint,
  editorconfig, peers, knip and screenshot manifest validation passed.
- An isolated review copy passed Nuxt typechecking and browser checks for
  clickable parent/child docs topics, disclosure persistence, reload, mobile docs
  navigation, six homepage cards and responsive layout. Six accessibility scans
  across docs/homepage desktop/mobile pages passed after making code examples
  keyboard-focusable.

Landing follow-up validation:

After the user reported the Nitro `Unexpected "<<"` error, resolved the stash
conflicts in `../landing/server/auth-methods.ts` and
`../landing/server/middleware/page-guards.ts`. The resolution retains the current
login redirect guard, global route authorization, and development-only password
override. Both files now match their existing committed implementations.

The actual landing checkout now passes its production build, both typechecks,
lint, editorconfig, peers, knip, screenshot manifest, and all 252 integration
tests in 44 files. Five targeted production browser tests pass for login,
anonymous sessions, protected admin/account routes and production API exposure.
The running development server also returns the expected login and protected
page responses. The full browser and visual suites have not been rerun.

The performance check now runs: all measured budgets pass except preloaded
JavaScript Brotli, at 289,520 bytes against the 289,500-byte ceiling. This
20-byte overage remains separate from the resolved auth compilation failure.
No commit, push or deployment was performed.

## Documentation refinement, 2026-09-09

Per the user's follow-up, Experiences and Screens now live as H2 sections of
`docs/interfaces.md`. Their file examples, constraints and definitions are
preserved. Removed the standalone articles, repaired links and source references,
and moved vocabulary terms to their corresponding section anchors. The landing
docs layout, desktop/mobile navigation, content schema and code-block component
match their original committed implementations. The custom navigation components,
parent metadata and their tests are removed. Old article URLs return 301 redirects
to the corresponding sections, including after refresh.

Validation of this refinement:

- PDD `npm run verify`: all 380 tests in 27 files passed, along with both
  typechecks, viewer production build, size, repository and Blueprint checks.
- Self-model lint: no errors or warnings. All three original articles' fenced
  file examples are preserved verbatim. Vocabulary generation retains 54 terms.
- Final dry pack: 2,094,125 bytes, below the 2,097,152-byte ceiling.
- Landing production build, both typechecks, editorconfig, peers, lint, knip,
  screenshot manifest and all 250 integration tests in 43 files passed. The
  removed custom-navigation test file accounts for the two fewer tests.
- All 16 documentation and vocabulary production browser tests passed, covering
  desktop/mobile vocabulary, navigation, search, redirects, refresh, section links
  and the suites' WCAG A/AA checks.
- Visually inspected the restored desktop sidebar, merged Experience section,
  mobile Screen section and original mobile menu. No page overflow at 390 px.
  Followed all four moved vocabulary links into the correct visible headings.
- The canonical screenshot suite was run, but both themes stop at the earlier
  homepage changes differing from the committed baselines, before reaching docs.
  No baselines were rewritten. The performance check still fails its preloaded
  JavaScript Brotli budget: 289,554 bytes against 289,500 (54 bytes over).

The full unrelated browser suite and packed-consumer tests were not repeated for
this documentation refinement. No commit, push or deployment was performed.
