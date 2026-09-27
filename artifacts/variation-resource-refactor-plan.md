# Variation resource refactor — review plan

Status: implemented on 2026-09-27 (uncommitted). `npm run verify` and `scripts/check-variations.mjs` pass. Still owed: the step 7 determinism round.
Originally: proposal, not an implemented contract. Current behavior is preserved in
checkpoint `fcac1c9` (`Add typed resource variations and refine report presentation`).
This plan is intentionally separate and uncommitted. No refactor has begun.
Reviewed 2026-09-27 against the checkpoint; section 9 lists what the review changed.

## 1. Outcome and scope

Make a supported product choice identifiable and understandable as a whole.
“Refund review” should explain why Standard and Strict coexist and when each is
used. Readers should see that relationship in the Business Rules tab and Interface
tree without leaving their working context.

Evaluate a first-class Variation resource, then implement the agreed contract
consistently across authored models, installed skills, lint, Product Reports,
Blueprint round-trips, public APIs, documentation and every affected viewer
surface. A dedicated resource reading must complement contextual grouping, not
replace it with another mandatory navigation step.

This is a current-branch refactor. Update current producers, consumers and models
together. Do not add compatibility readers, migration commands, legacy aliases,
historical version storage or repairs to unrelated historical decisions.

## 2. Proposed model and decisions to settle

These recommendations are the starting point for prototypes and contract review,
not assumptions to silently turn into implementation.

| Decision | Proposed direction | What must be resolved |
| --- | --- | --- |
| Vocabulary | Variation names the set/decision; Alternative names a participating resource | This changes the current definition of Variation. Review copy across headings, counts, docs and vocabulary together. Alternative is a role, not another resource type. |
| Identity | `.businesslens/variations/<id>.md` with title, explanation, subtype and member resource type | Give the set its own stable identity, References and normal supporting content. No designated anchor/default member. Do not spell the subtype `type`: `appliesTo` already uses `type` for a resource type. Keep `kind` for the subtype and name the member type once on the set (for example `of: business-rule`). |
| Membership | Variation explicitly references its alternatives | One authoritative membership list; no reverse membership fields on resource files. Derived backlinks are allowed. Members are ids spelled as that type's ordinary references (qualified `interface::experience` ids where needed). Because the set names one member type, a mixed-type set cannot be written at all. |
| Usage ownership | The Variation file owns all usage; each field has exactly one level | Keep the complete selection decision reviewable in one diff. Referenced resources retain complete behavior. No duplicate authored usage in member files. |
| Eligible types | Interface, Experience, Screen, Entity, Capability, Journey, Business Rule | At least two distinct, same-type members. Product, Domain, Scenarios and Variation itself cannot be alternatives. |
| Membership limits | A resource participates in at most one Variation initially | Multiple independent dimensions and coordinated mixed-type releases require a separate design; do not imply support. |
| Containment | Membership is a relation, never ownership | Existing folders, Domain classification, Experience ownership, Screen nesting and Scenario parents remain authoritative. |
| Usage structure | Split each typed field by what it describes. **Set level:** the selection mechanism (Configuration `settings`; Experiment `assignmentUnit`, `assignmentMethod`, `assignmentFact`, `allocation`; Version `discriminator`), `takesEffect` and `stability`. **Member level:** `selectedWhen`, plus `label` for Version. | Checkpoint models repeat identical `takesEffect`/`stability` text on every member, and per-member `settings` let Standard list a threshold that never chooses between the alternatives. No field exists at both levels, so the split adds no defaults, inheritance or overrides. Confirm with the three fixture sets before writing the contract. |
| Ordering | Alternatives are a set; render by resource title, then stable key | Authored list order must not imply priority, allocation or default selection. Canonical export ordering must be deterministic. |
| Grouping axis | The Variations collection groups sets by member type (the authored `of` field). Elsewhere a set row sits in its members' Domain like any other row | Supersede the AGENTS.md sentence "Domain is the only axis" for the Variations collection. Grouping stays authored, never configured. Subtype may be a filter because every row prints it. |
| Mark and naming | A Variation is read as its member type. It wears that type's icon with a variation sub-icon in the `BlrKind` sub-mark corner, and is named "<Type> variation" (e.g. "Business Rule variation") | On an Interface set the variation sub-icon takes the type's corner on the set only; every member keeps its own type sub-icon. An Entity set uses the plain Entity mark. The variation glyph on its own marks only the Variations collection and its heading; a set row never uses it alone. |
| Variation pill | The variation lives on the title line. A set row, set reading or tree node shows a pill with subtype and count ("Configuration · 2 alternatives"). A single alternative shows its set's name ("Refund review"), or its label for a Version ("Payment webhook · v2") | No position numbers: alternatives are an unordered set, and "1 of 2" read as separate things. Replaces today's "Configuration · View N variations · Applies conditionally" line. The resource icon never changes. Keep the pill apart from the Domain owner mark. |
| Switcher | Pressing any pill opens a menu: set name and what chooses it, every alternative with its `selectedWhen`, the viewed one marked, and "Open <set>". Picking an alternative opens it; from a member it replaces the slideover resource and keeps the tab; Back returns | A menu button with its own hit area, never nested inside a row link. It is not a comparison view and adds no drawing. |
| Discovery | Variations is a seventh collection on the rail, marked with the variation glyph. Rows only in the first version: set mark, name, subtype pill, purpose, alternatives, and what chooses | Owner decision: Variation is a first-class resource that people monitor. Supersede the AGENTS.md rule "The rail lists Overview, then six collections". Any later Graph or Matrix must name its own derivation. |
| Sets in lists | Wherever two or more alternatives of one set would appear together in a list or tab, they collapse into one set row that never expands. The row opens the set; its pill's switcher opens one alternative. Trees are the exception: the set node expands to its alternatives, because each has its own children | Heading counts still count concrete resources ("Business Rules 14" with 13 rows); the set row states its alternative count. A filter matching one alternative shows that alternative's own row with its pill. |
| Creating and editing | Variations are authored as `.businesslens/variations/<id>.md` through the map and ideate skills and reviewed in the pull-request diff. The report stays read-only | Editing inside the viewer would be a separate product decision. |
| Comparison | Reuse one Variation reading for membership and selection | No new generic comparison builder, graph or matrix solely because the type exists. |

Illustrative file structure (field spellings remain a contract decision):

```yaml
# variations/refund-review.md
kind: configuration
of: business-rule
settings:
  - { entity: store-settings, fact: Refund review mode }
takesEffect: When a refund is requested. A settings change applies to subsequent requests.
stability: A refund already under review keeps the policy captured when it was requested.
alternatives:
  - id: refund-review-standard
    selectedWhen: Refund review mode is Standard. Missing mode uses Standard; unsupported values prevent a new refund from starting.
  - id: refund-review-strict
    selectedWhen: Refund review mode is Strict.
---
# Refund review
Why Standard and Strict coexist, with References.
```

```text
business-rules/refund-review-standard.md   statement and appliesTo, no variation keys
business-rules/refund-review-strict.md     statement and appliesTo, no variation keys
```

The Refund approval threshold leaves `settings`: it parameterizes the Standard
statement but does not choose between the alternatives.

The Variation may explain why alternatives coexist and cite evidence. Business
Rules still own policy, Entities own Information kept and States, and Scenarios
own behavior paths. Selection references confer neither permission nor delivery.
Ordinary rule targets, Steps and Contexts continue to reference concrete resources;
they must not silently acquire “all alternatives” semantics.

Deleting a member must expose an invalid reference. Removing the final alternative
requires explicitly removing the now-invalid Variation and retaining any still
meaningful applicability in the appropriate ordinary model content. Do not silently
promote a remaining member or auto-delete product meaning.

## 3. Visualization trial before schema implementation

Produce a local review artifact with real-sized desktop and phone prototypes.
Clearly label proposed UI and synthetic examples. Show the checkpoint beside the
proposals, including expanded/collapsed and filtered states. Do not alter production
renderers merely to prepare the trial.

Chosen treatment (owner decision): a set is one row wherever its alternatives
meet in a list or tab, with its subtype pill on the title line and a switcher to
open one alternative. It never expands in a list. Trees still expand the set node
to its alternatives, because each has its own children.

Required scenes:

- Two Configuration Business Rules inside Order management: ungrouped rules before
  and after the group; distinct statements and target annotations remain readable.
- Five Experiment Screens in the Interface tree: members still expand to their
  real descendants; no five-way sibling link list.
- Two Experience alternatives under the same Interface and five members split
  across owners: actual ownership stays visible.
- Two Version Interfaces with different delivery, including a shared Capability:
  grouping must not manufacture identical reach.
- Entity, Capability and Journey groups with different States, Scenarios and
  delivery respectively: no accidental union of their behavior.
- Search/filter leaves one of five members visible; one of five attaches to a Rule
  target; no visible members; long names; phone width; keyboard-only interaction.
- Variation reading opened from a group, then an alternative, then Back and Close.
- Member Overview and Connections, the badged mark at list and tree density, and
  the vocabulary group.

Suggested compact group:

```text
▾ Refund review                           Open variation
  Configuration · 2 alternatives

  Standard refund review                               ›
    Review required above the configured threshold.
  Strict refund review                                 ›
    Review required for every refund.
```

Preferred tree:

```text
Reader mobile application
  Experiences 2
    ▾ Library experience
      Configuration · 2 alternatives
      ▸ Personal library
      ▸ Source-focused library
```

The parent above is a membership group, not an authored container. It wears the
member type's icon with a variation sub-icon, and its pill sits on the title row.
Never borrow the Experience or Domain mark for it, and never give it a standalone mark.
Chevron expands the group, title/link opens its resource reading, member title
opens that member, and a member's chevron expands its actual children.

Tree set nodes participate in normal expansion controls. Do not switch behavior
at an arbitrary member-count threshold.

## 4. Shared rendering and counting rules

- Filter concrete resources first, then group the visible occurrences by Variation
  inside their existing parent/Domain context. Do not pull an excluded sibling into
  a list just because it belongs to the set.
- With a subset, say “1 of 5 alternatives here”; the Variation link opens the full
  set. With no visible members, omit the group. With one visible member, retain the
  named relationship without an empty expansion control.
- A cross-owner or cross-Domain set can have several contextual occurrences, all
  opening the same Variation. No fake owner is assigned to the set.
- Collection headings count concrete resources, not group wrappers. “Business
  Rules 7” remains seven rules.
- Never aggregate mutually conditional grants, prohibitions, States or delivery
  into a single effective result. The viewer describes supported alternatives;
  it does not evaluate which is active for a real person/session.
- Replace “Current” with “This resource” or “Opened resource” where needed: the
  inspected alternative is not necessarily the runtime-selected one.
- Use the shared Entity chip and enlarged Field badge for selection references.
  Keep actual owner, return trail and membership visually distinct.

## 5. Complete viewer surface inventory

Every row below requires an explicit implementation or verified preservation.

| Surface | Planned treatment |
| --- | --- |
| Entities collection list | A set is one row within the Domain/actor section; its alternatives keep their own facts, States and expansion in their readings. Actor classification is not inherited from a sibling. |
| Interfaces collection tree | Group same-parent alternative occurrences for Interfaces, Experiences and Screens; retain nested/shared Screen placement and actual child counts. |
| Domains collection children | Domains cannot vary. Group eligible child occurrences within each Domain without moving resources between Domains. |
| Capabilities collection list | A set is one row; alternatives keep their Scenarios, contexts and delivery metrics in their readings. |
| Journeys collection list | A set is one row; alternatives keep their Scenarios and ordered Capability chains in their readings. |
| Business Rules collection list | A set is one row in its Domain (set mark, name, subtype pill, alternatives, what chooses); no expansion. Ungrouped rules unchanged. |
| Attached Business Rules tabs | When two or more alternatives of one set are attached, they collapse into one set row; a lone alternative shows its own row with the set pill. Include Entity/fact and Scenario contexts. Do not merge differing targets. |
| Resource → Delivery tree | Apply same grouping within each actual parent occurrence; preserve expand/collapse, contextual route selection and resource links. |
| Business Rule → Applies to tree | Group eligible target occurrences only when they already share a displayed parent. Each target keeps only places/operations/facts the Rule actually names. |
| Resource Overview | Show named membership, this alternative's `selectedWhen` (and Version label), and the set's mechanism from the Variation. Bordered usage box remains; link to canonical Variation reading, with the alternative focused. |
| Also on | Preserve its independent meaning: the same Experience across Interfaces. Mark named variation membership when relevant; never equate Also on with alternatives or suppress the relation. |
| Existing member Variations tab | Proposed removal in favor of a canonical Variation reading. AGENTS.md already says "A view comparing resources belongs to the collection, never to one of them", and its resource-reading rule does not list this tab. Review discoverability in prototype; if retained, it must be a derived view of the same data and the resource-reading rule must name it. |
| Variation resource reading | Overview explains why/type; Alternatives reads concrete members and expandable usage; Connections contains explicit relations; References appears when present. Show owner on each member where relevant. |
| Connections | Replace anchor/sibling edges with Variation ↔ alternative membership. Link selection Entity/fact references to the Variation with member attribution. Avoid implying the other alternatives are owned by this resource. |
| Entity Information kept / fact details | Derive incoming selection uses with Variation and alternative attribution. Keep policy constraints distinct from selector usage. |
| Entity Lifecycle, Step rules and permission annotations | Preserve unconditional-prohibition handling. Conditional alternatives remain discoverable and must not be treated as simultaneous unconditional policy. |
| Capability/Journey Scenarios | Preserve concrete Step/route targets. Membership is context, not a new executable Step or synthetic Scenario. |
| Product Overview / About | Count and explain the new type if appropriate without duplicating a collection. Keep coverage claims grounded. |
| Search palette | Search Variation titles and ordinary member titles; label resource kind clearly; open a real Variation address, not an arbitrary member. |
| Sidebar / navigation | Seven collections: Variations joins the rail. Explicitly supersede the six-collection rule; retain named working views, counts, filters and density conventions. No hidden or invented matrix. |
| Vocabulary | Dedicated Variation group: Variation, Alternative, Experiment, Configuration, Version and usage terminology; no conflicting definition in Model overview. |
| Coverage and References | Variation source paths and citations participate normally, once by location. No copying member evidence onto the set or assuming the set supplies coverage for every member. |
| Slideover, full-window reading, URLs | Stable Variation key and tab address; independent focus on an alternative. Back, Close, Escape, expand/restore and refresh preserve underlying view and expansion. |

### Every existing graph and matrix

Do not replace concrete nodes/rows/columns with a Variation: that would change the
question each drawing answers. Start with named membership visible in node/header
details and selection readings. Trial optional visual grouping only where it does
not change topology semantics; never insert membership as a containment edge.

| Drawing | Required handling |
| --- | --- |
| Entity relationships (`what-it-keeps`) | Preserve actual Entity relations/cardinalities; Variation membership is not an Entity relationship. Distinguish alternative nodes and expose their set. |
| Delivery map (`delivery-map`) | Preserve containment and authored delivery for every place; a group treatment must not look like a real Interface/Experience/Screen parent. |
| Domain reach (`domain-reach`) | Preserve derived reach and Domain classification; annotate sets spanning multiple branches without moving or deduplicating real occurrences. |
| Capability reach (`capability-reach`) | Preserve per-member places and attached Rules; alternative Rules must not read as one combined unconditional policy. |
| Journey reach (`journey-reach`) | Preserve Step-derived places and attachments for each Journey. |
| Rule reach (`rule-reach`) | Preserve explicit targets/contexts per Rule and conditional status. Membership never adds targets. |
| Compare delivery (`delivery-by-interface`) | Keep Capability rows and Interface columns. Label member headers/details with their named set; no union cell implying all alternatives deliver the same thing. |
| Rule attachments (`rule-attachments`) | Keep one concrete Rule per row and exact target cells; expose named grouping/conditionality without claiming simultaneous applicability. |
| What changes what (`what-changes-what`) | Keep concrete Entity rows and Capability columns and actual supporting Step effects; no sum across alternatives that reads as one runtime behavior. |

All drawings retain the collection's original subject set, controls and counts.
No new Variation graph/matrix is included in the initial refactor.

## 6. Contracts and implementation work map

| Area | Work and principal entry points |
| --- | --- |
| Authored format | Change `spec/format.md` before parser/lint: file layout, identity, granularity, membership, usage, references, validation, ordering and removed fields. |
| Product Report | Change `spec/report.md` before export/open: Variation records, typed member references/usage, counts, canonical projection and expansion. Bump folder schema 10 → 11 and report 15.0.0 → 16.0.0 together; keep no compatibility reader. |
| Rejected decisions | Update only the affected Variation section in `spec/rejected.md`. Record what is actually chosen or deferred after review; do not record unresolved proposals as rejected facts. |
| Parse/load/lint | `src/core/model.ts`, `src/core/variations.ts`, `src/commands/lint.ts`, folder recognition and resource registries. Resolve membership once and expose deterministic reverse lookup. Error locations identify the Variation entry. |
| Conditional semantics | These checks test `variationUsage === null` or `variantOf` on the resource itself. Once membership moves to the Variation file, every Rule alternative would silently look unconditional. Resolve membership first, then rewrite: Experience justification (`src/commands/lint.ts:457`), Entity use through usage references (`lint.ts:630`), permission warnings (`lint.ts:1523-1526`), viewer unconditional prohibitions (`reportWorkspace.ts:1279`, `:1298`). Add a regression test for each. |
| Report validation / portability | `src/core/portable.ts`, `src/commands/export.ts`, `src/commands/open.ts`: same constraints for authored and imported data, no dangling members, lossless references/usage, correct counts. |
| Public library | `src/report.ts`, `src/report-selectors.ts`, `src/report-digest.ts`, `src/core/report-digest.ts`: none mentions variations today, but a new `variations` collection must reach exported types/schemas, digest inclusion and stable canonical serialization. |
| CLI / catalog flows | `view`, `lint`, `blueprint export/open/pull/contribute`: all use the same resource set. Audit catalog payload validation and portable hashes. The landing repository consumes the report viewer and schema through its linked `node_modules/businesslens`; run its typecheck and tests against this branch. No external publishing in this task. |
| Viewer projection | `reportWorkspace.ts`, `variations.ts`, `resourceConnections.ts` (its `variation ` relation-label filter), resource kind metadata, navigation/destinations, docs links, counts, resource facets and connections. No synthetic anchor in the new projection. |
| Viewer lists / trees | `BlrResourceCard`, `BlrTreeCards`, `BlrResourceTree`, `BlrResourceStructure`, `collectionChildren`, grouping/filter/expansion utilities. One contextual grouping algorithm reused across occurrences. |
| Viewer readings | `BlrVariations`, `BlrVariationUsage`, `BlrVariationLink`, `BlrPageBlock`, `BlrResourceBody`, `BlrFactRule`, `BlrFactRuleBadge`, `pageSections`, slideover and routing. Preserve separate accessible links; no nested interactive elements. |
| Topology | `productTopologyViews`, `topologyRelations`, projections, tree/graph/matrix components and their resource detail panels. Audit all nine named drawings above. |
| Public docs | Add `docs/variations.md` as the one owner of definition, granularity, shape and lint guidance. Move current narrative/terms from `docs/product-model.md`; update the other pages that mention it: `business-rules`, `capabilities`, `entities`, `interfaces`, `journeys`, `from-a-blueprint`, `from-your-repo` and `skill-businesslens-ideate`. Maintain flat layout/frontmatter order. Docs explain the model, not viewer controls. |
| Installed skills | Update map, ideate and verify plus each self-contained format/rubric. Teach when a separate Variation is justified, selection evidence vs unresolved meaning, and membership ownership. Keep `agents/openai.yaml` aligned. |
| Vocabulary / identity | Generate vocabulary from owning doc; update viewer vocabulary grouping (`vocabulary.ts`, `BlrVocabulary`) and type icon/metadata. Add a variation sub-icon to `BlrKind`'s sub-mark slot (on an Interface set it takes the type's corner, on the set only) a shared variation pill with its switcher menu, and the variation glyph as the Variations collection's mark. |
| Viewer contract guidance | Update report-viewer README. If rail/Domain grouping/resource tab conventions change, explicitly supersede relevant repository guidance rather than leaving it contradictory. |
| Product's own model | Update `.businesslens/` resource definitions, view/lint/export/open capabilities and relevant Scenarios, report collection/reading Screens, topology and vocabulary meaning. Add Variation as a modeled concept after its meaning is decided. |
| Fixtures / Blueprint | Convert `test/fixtures/fixture-shop`, `blueprints/content-feed-reader` and the repository's `.businesslens/` together. Replace anchor fields, not the resources' independent behaviors. Correct selector references such as refund threshold: it affects Standard policy but does not choose Standard vs Strict. |
| Review artifacts | Preserve checkpoint screenshots as history; new before/after artifact covers every changed surface and clearly marks any preserved surface. Update `scripts/check-resource-variations.mjs` and `scripts/check-variation-card-subtitles.mjs` to the new model and addresses. |
| Release notes | Brief user-visible outcome. No release, push, tag or package publication without a separate request. |

## 7. Delivery sequence and checkpoints

1. **Model decision sheet and visual trial.** Resolve naming, membership/usage
   ownership, discovery, canonical reading and grouping defaults using the cases
   in section 3. Deliver screenshots and a concise record of chosen tradeoffs.
   This is the next work package; do not begin the full schema rewrite first.
2. **Contracts and authoring guidance.** Write the exact format/report delta,
   lint rules, public doc and three skill rubrics before implementation. Keep all
   meanings aligned and identify any external consumer dependency.
3. **Core and portable pipeline.** Implement model loading/validation, conditional
   semantics, export/open and public APIs; convert all current authored examples.
   Demonstrate lossless authored → report → folder → report behavior.
4. **Viewer resource and contextual grouping.** Add projection/readings/routing,
   then lists and trees from one grouping rule. Implement selection attribution,
   contextual subsets and truthful counts before decorative polish.
5. **All remaining views.** Complete the inventory above, including graph/matrix
   semantics, Lifecycle/facts, Also on, search, vocabulary, Coverage and References.
   Add no collection or drawing for Variations.
6. **Product model and review evidence.** Align the repository's own model, docs,
   fixtures and installed skills with the resulting behavior. Capture full visual
   coverage and report limitations rather than hiding unresolved cases.
7. **Determinism round.** A new resource type adds a boundary deciding how many
   resources exist. Map one unfamiliar repository twice, independently, from the
   installed rubric and diff the Variation sets (which things are sets, which
   subtype, which members). Fold this into the round still owed by the
   experience-border rubric changes. Fix the rubric for plainly wrong readings;
   treat "both defensible" as a format defect.
8. **Verification and review checkpoint.** Run required validation; deliver the
   updated review artifact and change summary. Leave refactor changes uncommitted
   for review unless the user subsequently asks to commit them.

## 8. Acceptance criteria

### Meaning and validation

- The set has a stable identity, and deleting the former anchor has no special
  semantic meaning. It is an ordinary member deletion with ordinary lint errors.
- All seven eligible resource types work. Domain, Product, Scenario, mixed-type,
  self/recursive membership, duplicate/missing members and membership in multiple
  sets are rejected with actionable locations.
- Wrong-subtype usage, unresolved Entity/fact references and duplicate version
  labels are rejected for both authored and imported reports.
- No authored relationship is duplicated in member files. No field falsely
  promises defaults, inheritance, instance-level joins or runtime selection.
- Permission and prohibition tests show conditional Rule alternatives cannot
  become unconditional grants/blocks after moving their metadata.
- Authors can distinguish a Variation from a Scenario branch, simple parameter
  value, ordinary Entity state, unrelated resource and cross-interface Also on.
  Treat these as explicit rubric examples, not a claim that wording proves
  deterministic granularity. The determinism round in step 7 records its diff;
  the boundary stays open until that round measures it.

### Rendering and interaction

- Two and five alternatives are understandable at desktop and phone widths.
  A named group explains what varies before a reader opens its drilldown.
- Group wrappers never count as concrete members, expand children they do not
  own, create new delivery, or combine conditional rule semantics.
- Filters/Domain/owner grouping produce truthful partial counts and no empty
  groups. Expand/collapse controls and saved density behave consistently.
- Every member and group can be reached by keyboard. Links support native new-tab
  actions. No nested anchors/buttons; no mobile overflow or hover-only information.
- Variation → member → referenced Entity → Back restores the right reading/tab;
  Close restores the original list/drawing/filter/scroll. Full-window restore,
  reload and valid recompilation preserve addresses and expansion. Deleted/invalid
  targets get an honest unavailable state; invalid recompilation preserves the
  last valid report under the existing viewer contract.
- All nine diagrams retain concrete rows/nodes/columns and their documented
  derivations. Search, counts, facts, references and vocabulary include the new type.

### Required checks and evidence

- Focused model/lint/report round-trip tests, malformed imported-report tests,
  digest/SDK assertions and conditional-permission regressions.
- Browser checks for every changed list/tree/reading and representative preserved
  graphs/matrices, including partial sets, multi-owner sets and long labels.
- Permanent fixture coverage for all three subtypes and all seven eligible types;
  use coherent examples, clearly identify synthetic layout-only stress cases.
- `npm run vocabulary`, `npm run verify`, all three skill `quick_validate.py`
  checks, and `claude plugin validate . --strict` when available.
- Landing typecheck and tests pass against this branch.
- The final review artifact includes the checkpoint, proposal and implemented
  result where applicable; screenshots alone do not substitute for interaction
  verification. Previously superseded artifacts remain historical evidence.

## 9. Review log (2026-09-27)

Checked against checkpoint `fcac1c9`. All named components, utilities and the
nine drawing ids exist; folder schema is 10 and report schema is 15.0.0.

Changed by the review:

1. **Usage split by level.** Mechanism, `takesEffect` and `stability` move to
   the set; `selectedWhen` (and Version `label`) stay per member. Replaces
   "typed fields per alternative", which repeated identical text and let a
   non-selecting setting (refund threshold) sit in `settings`.
2. **Subtype and member type named once on the set.** `kind` plus `of`; the
   `type` spelling is avoided because `appliesTo` uses it for resource types.
   Mixed-type sets become unwritable instead of a lint error.
3. **Grouping axis made explicit.** Contextual grouping contradicts the AGENTS.md
   rule "Domain is the only axis"; the plan now supersedes it explicitly.
4. **Conditional-semantics hazards named.** Four call sites key off per-resource
   variation fields and would silently treat Rule alternatives as unconditional.
5. **Inventory completed.** Added `resourceConnections.ts`, `BlrFactRule`,
   `BlrFactRuleBadge`, vocabulary files, both check scripts, fixture paths and
   the landing consumer. The docs list now names the eight pages that mention
   Variations instead of "seven family references".
6. **Determinism round scheduled** as step 7 rather than left optional.
7. **Schema bump stated.** Folder 11 and report 16.0.0 together, replacing "decide coordinated revisions".
8. **Release compatibility line removed.** Backwards compatibility is not a
   constraint; the landing check replaces it.
9. **Mark follows the member type** (owner decision). A set wears its type's icon
   with a variation sub-icon; the variation glyph alone marks the Variations
   collection.
10. **Variation on the title line** (owner decision). Sets show a subtype pill;
    a single alternative shows its set's name. No position numbers. Pressing a
    pill opens a switcher between alternatives.
11. **Variations collection** (owner decision). A seventh rail entry, grouped by
    member type. In other lists a set is one row that never expands; trees still
    expand it.

Still open for the owner: the decisions in section 2, plus whether this plan
moves to `plans/` to match the repository's other plans.
