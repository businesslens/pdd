# Experience in the model, design out of it

> Plan, not a contract. `spec/format.md` and `spec/report.md` bind; this file
> records what we intend to change in them and why, so the review can happen
> against one page. Delete it once it has shipped, as earlier plans were.

**Status: in implementation, 2026-09-21.** Grilled to an empty frontier; every
decision below was put as a question and answered. One refinement surfaced by
the fixtures: L4 checks `actor` Steps only and ignores Entities that act, since a
Product or condition Step reads what the Product consults and a read of an
Actor names a participant, not something on screen.

## Why

User experience is part of any product model, and the format already has three
resource types for it. But two things were never settled:

1. **Where the model stops.** No page says that component libraries, styling,
   typography, color, layout or copy are outside it. The rubrics repeat "not
   components, layouts, themes" in fragments; the landing never mentions design.
2. **Screens are mostly free prose.** `## Information presented`,
   `## Available actions`, `## View states` and `## Capability boundary` connect
   to nothing, so two lint-clean models of one product diverge silently there.
   The fixture already shows the cost: the "Margin is for operators" Rule has to
   scope itself to one Screen because a Screen cannot say which facts it shows.

Real products also need answers the format does not give today: global
reachability (a cart reachable from everywhere), confirmations and slideovers,
filters and search, wizards, forms, the UI as a state machine, and variation:
languages, feature flags, and two versions served at once.

## The border

**The model says what an Actor can reach, see, do and trigger at each place. It
never says how that looks or is built.**

The test, stated the same way in `docs/`, the three rubrics and the landing:

> Rebuild a view with a different component library, layout, typography,
> colors, spacing, icons, motion and copy. Everything that would still have to
> be true is the model's: who can reach the view, what facts it shows, what
> abilities it offers, what conditions change that, and what happens next.
> Everything the redesign is free to change is design's, and the model says
> nothing about it.

In the model: which surfaces exist and their interaction type; which languages
they serve; who is in each context and with what access; which views exist,
nested how, and what facts and abilities each has, including the facts an
Actor enters; what is always reachable inside a context; where behavior moves
between views; the conditions and outcomes an Actor meets; who may act; and
the Product's own vocabulary for all of it.

Out of the model: component libraries, theming, layout, typography, color,
radius and borders, iconography, motion, microcopy and tone, gestures versus
buttons, breakpoints, loading and hover states, navigation chrome, the order
of navigation items, and quality attributes such as accessibility or
performance unless they change what an Actor can do. These live in a design
system and design files, attached as `visual` References with `role: intent`.

**Text.** The model says that an Actor is told something and under which
condition: a Step, an Edge case, or a Rule outcome. It never says the words.
Legally required text is a Rule ("consent is captured before creation") whose
wording lives in a Reference. No carve-out.

## The unifying idea

A UI is places and transitions. **Places are authored; transitions are
derived.** Screens are the places. Transitions come from Scenario Steps, the
same way an Entity's lifecycle is composed from Steps: the lifecycle is Steps
projected onto one Entity, the UI map is Steps projected onto places. An edge
no Scenario walks is not a product commitment. Two things Steps cannot say are
authored on the structure side: what is always reachable (`navigation`), and
which views sit inside which (nested Screens). Nothing else is added.

`navigation` is **structure, not a relation**, in the same sense as folder
containment: it states a fact about the container, and the map draws it as an
always-reachable mark on the Screen, never as edges. This keeps the repository
rule that an authored list narrows a derived relation and never creates one.

## Decisions

### D1. Interface: unchanged, plus `navigation`

`navigation` is an optional list of shared Screens of the Interface that are
reachable from every place inside it. It names shared Screens only: a Screen
inside a restricted Experience cannot be reachable from a public one. Order
carries no meaning; lint ignores it and the report sorts as it sorts
everything. It replaces the `screens:` reading-order field, which stated no
product fact and was never enforced.

`## Capability boundary` is removed. `availability` on Capabilities is already
the positive claim of what an Interface offers, and D7 renders it.

### D2. Experience: unchanged, plus `navigation` and `version`

`navigation` names the Experience's own Screens, nested ones by child path.
Same rules as D1. `## Capability boundary` is removed for the same reason.

`version` is described in D9. The name Experience stays. "The admin experience"
is how product people speak, and the border sentence uses it: an Experience is
who is there and what they can do, never what it looks like.

### D3. Screen: rewritten to relations only

```yaml
capabilities: [browse-catalog, place-order]
entities:
  - { entity: catalog-product, facts: [Name, Price, Availability] }
  - { entity: cart, facts: [Item count] }
entryPoints:
  - customer-web: /products/:id
references: [...]
```

```md
# Product record

Shows what a shopper needs to evaluate one product.

## Intent            (optional)
```

Removed: `## Information presented`, `## Available actions`,
`## View states`, `## Capability boundary`, and the `state` key on References
and on `assets`.

| Removed | Now lives in |
| --- | --- |
| Information presented | `entities[].facts` — a fact of an Entity the Screen presents, or a Rule derivation, or not product |
| Available actions | `capabilities`, plus the Steps placed on the Screen |
| View states | condition Steps, Edge cases, Rule outcomes, or a nested Screen |
| Capability boundary | nothing; `capabilities` is already the positive claim, Steps settle the rest |
| `state` on a screenshot | the Scenario or Edge case that reaches that state carries the Reference |

**"Presents" means the fact is on screen**, whether the Actor reads it or
enters it. A sign-up form lists `{ entity: account, facts: [Email, Password] }`;
the Step that creates the Account cites nothing. Reading versus entering is
design.

`entities[]` accepts `{ entity, facts }`, or a bare id. A bare id is allowed
only while the model is not `complete`; a complete model names facts. An Entity
with no named facts is always cited bare. `facts` names the Entity's named
facts exactly as a Business Rule's `facts` target does. This inverts the
current spec sentence that only a Rule cites a fact.

`capabilities` stays authored and required. Each Screen lists only the
Capabilities its own Steps use; the coverage check (L3) keeps it honest.
Unrecognized H2s still fall through to `supportingSections`.

### D4. Screens nest

An expanded Screen may hold `screens/`. Place ids grow one segment per level:
`customer-web::storefront::onboarding::choose-plan`. Containment keeps its
meaning everywhere: a Step on a child is inside the parent, a Rule selector on
the parent covers the child, `navigation` may name a nested Screen by its
child path, and the derived map is hierarchical. Depth is unlimited because the
rule is the same at every level. This supersedes "a Screen has one structural
parent" and "any other nested directory is invalid" in the spec.

**What is a child Screen, decidably:** a region whose content depends on an act
inside its parent — picking a row, choosing a tab, advancing a step. Whether
it is visible at the same time as the parent, and whether it has its own
address, do not decide it. A region with the same content drawn differently is
design. The test is decidable from code without judging layout.

**A parent Screen is a place.** A Step placed on the parent means "on the
parent, not in any child". The list of a master-detail and the shell of a
wizard have Steps of their own.

**Capabilities do not flow up or down.** A child lists what its own Steps use;
the parent does not repeat it. The report sums the subtree.

| Case | Modeling |
| --- | --- |
| Confirmation dialog | two Steps on the host Screen: ask, confirm |
| Slideover or panel with its own facts | a child Screen of the view it opens over |
| Tabs showing different facts | child Screens |
| Rows / Graph drawing of one set | design; one Screen |
| Wizard | one parent Screen, one child per step, a Scenario walking them in order |
| Master-detail | detail is a child Screen of the list |
| Overlay preserving the parent's state | Scenario Outcome, not structure |
| Modal versus page versus inline | design; not modeled |

**Wizards** are nested Screens on the structure axis. The Scenario walking one
is a Journey only where it crosses Capabilities, otherwise a Capability
Scenario. Every doc sentence calling a wizard "Journey evidence" is rewritten
to say so; the two axes are independent.

### D5. Steps cite facts

An entity entry on a `reads` or `changes` Step may carry `facts`. `creates` and
`removes` may not: what a creation collects is presented by the Screen (D3).

```yaml
- text: The shopper narrows the catalog by category and price
  kind: actor
  actor: shopper
  entities:
    - { entity: catalog-product, effect: reads, facts: [Category, Price] }
  contexts:
    web: { place: customer-web::storefront::catalog }
```

**Filters, sorting and search are Scenarios of the Capability that presents
the set**, never Capabilities of their own, and the facts they use are cited
on the Step. Which filters exist is product; how they are drawn is not.
**Search that presents a set nothing else does** — a global search returning
products, orders and customers — is a Capability, because its purpose differs
from every presenting Capability. Fact-scoped read Rules are then checked
against Steps as well as Screens.

**Every ability has a Scenario.** A complete model has a Step behind every
Capability a Screen exposes, an export button included. There is no cheaper
encoding of "this ability exists here"; that would be two valid spellings of
one claim. A partial model's map is islands, which is a visible absence.

### D6. The UI map is derived

Nodes: Screens, nested. Edges, two sources: a place change between consecutive
contextualized Steps in any Scenario, labelled with its Capability; and entry
points from outside. `navigation` is a mark on the node, not edges. Conditions
such as empty, unauthorized or blocked are condition Steps and Rule outcomes,
and appear as the Scenario branch that meets them. This is why View states can
go.

The lifecycle join — what changes on this Screen and into which states — is a
per-Screen question and lives as a "Changes made here" block on the Screen
reading, summed over the subtree with attribution. It is not a map feature.

The map becomes the Interfaces collection's Graph, replacing the containment
drawing, which the Rows tree already shows.

### D7. The report leads with delivery

An Interface or Experience reading opens with the Capabilities available
there, grouped by Domain, each naming the Screen that exposes it, with
available-but-unexposed Capabilities called out. This is the first block of
the Overview tab; the Experiences & Screens tab stays. The Interfaces tree card
carries Capability counts per node. The model already holds this through
`availability` and Screen `capabilities`, once, on purpose; L7 makes the
contradiction between the two lists a lint finding as well.

### D8. Not modeled, and said so

- **Outbound messages** (confirmation email, push, SMS). A Product Step with
  `reads` and prose. Content beyond the facts it carries is copy. Deferred as a
  `messages/` collection; recorded in `spec/rejected.md` with the reason: no
  Step runs on a message, so the map machinery does not apply.
- **Navigation beyond `navigation`.** Sitemaps, back links, menus, route trees,
  and the order of navigation items. Entry points say what is addressable;
  Steps say movement.
- **Collected information as a section.** The Screen presents the facts a form
  collects (D3); a Rule says what is required.
- **Quality attributes.** In only as a Capability or Rule when they change what
  an Actor can do; otherwise Product prose.
- **Experiments and cohorts.** See D9.
- **Historical versions.** Git is the model's history.

### D10. Sketches are derived, never authored

Added after the round shipped its first two commits. A reader wants a rough
view of a Screen; an authored one is design by the redesign test and is
rejected. The report derives one instead, with the same skeleton for every
place: frame from the Interface type, strip from `navigation`, presented facts
as placeholders grouped by Entity, edited facts as fields, Capabilities as
actions, child Screens as tabs; and a Storyboard draws a Scenario route as a
sequence of them. Report only, bound in `spec/report.md`; nothing in
`spec/format.md` changes.

### D9. Variation

- **Languages.** `languages` is a list of language tags on the Product. An
  Interface may narrow it; Experiences and Screens never carry it. A redesign
  cannot drop German, so it is product; the vocabulary is closed, and `verify`
  can check it against i18n configuration.
- **Flags, A/B tests, dynamic configuration.** The format already has them: a
  settings Entity holds the flag as a fact and a Rule reads it with `when`,
  targeting an Entity operation or a Capability. An A/B test that changes what
  an Actor can do is a flag; one that changes looks is design. The experiment
  itself — cohorts, assignment, metrics — is not modeled. No new machinery;
  the border section says this in one paragraph.
- **Concurrent versions are places.** A version with its own entry point
  (`/api/v2`, a separate app) is its own Interface. Versions sharing an entry
  point are Experiences under one Interface, each carrying `version:`. A third
  reason lets an Interface divide: it serves two or more versions at once.
  `version` is valid only where two or more are live under one Interface, so a
  single-version product never writes it. Screens shared between versions are
  duplicated like counterparts are today; that cost is accepted.
- **Who sees which version or flag** is a fact on the Actor or tenant Entity
  read by a Rule, the same shape as a flag. There is no cohort concept.

## Lint rules added

| # | Rule | Grade |
| --- | --- | --- |
| L1 | Every `navigation` entry resolves to a shared Screen of the Interface, or a Screen inside the Experience, by path | error |
| L2 | Every fact named on a Screen or Step exists on that Entity | error |
| L3 | Every Capability a Screen exposes has at least one Step placed exactly on that Screen | error for `complete`, warning otherwise |
| L4 | An `actor` Step on a Screen that `reads` an Entity the Screen does not present; Product and condition Steps and Entities that act are exempt | error |
| L5 | A Step citing a fact on a Screen that presents the Entity without that fact | error |
| L6 | Fact-scoped read Rules are checked against Screen facts and Step facts, not Entity presence alone | replaces the current check |
| L7 | A Capability available on an Interface or Experience that no Screen there exposes (Interfaces with Screens only) | warning; error for `complete` |
| L8 | A read Rule governing a fact that no Screen presents and no Step cites | warning; error for `complete` |
| L9 | A bare Entity id on a Screen in a `complete` model, where the Entity has named facts | error |
| L10 | `languages` entries are well-formed tags; an Interface's list is a subset of the Product's | error |
| L11 | `version` appears only where two or more Experiences of one Interface carry distinct values; the divide check accepts version as a reason | error |

Removed: checks for the four deleted Screen sections, Capability boundary on
Interfaces and Experiences, and the `state` key on References and assets.
`creates`/`removes` entries carrying `facts` are an error.

## Facts from the code that shape the work

- **L6 is a rewrite, not a refinement.** Today a fact-scoped target never
  selects a Step at all, and the Screen check ignores the Rule's facts. The
  Margin Rule carries its context selector purely to dodge the shopper Screen
  that presents `order`.
- **`screens:` is parsed and consumed nowhere**: not linted, not exported, not
  in the report contract, not in `docs/`. Replacing it breaks nothing; L1 is a
  new check, not a rename.
- **Nesting breaks three hard-coded spots**: the spec's "one structural
  parent", the `open` command's path builder, and the viewer's flat
  Interface/Experience/Screen triple. The id grammar and the containment
  helpers already accept any depth.
- **The self-model's tabs are View states today.** The resource reading has
  seven, the Product overview three. Under D4 they become about ten child
  Screens. Accepted as the honest model.
- **Every existing wizard mention frames it as Journey evidence** in the spec
  and both behavior docs. D4 rewrites them.
- **`docs/interfaces.md` carries an exhaustive navigation prohibition** that
  `navigation` sits inside. It is rewritten, not extended.

## Considered and rejected

For `spec/rejected.md` once the plan is approved. Nothing there addresses
Screens, navigation, view states or transitions today; these are the first
entries on the subject.

- **Keeping View states, derived from a new Step context dimension.** A lot of
  machinery for a screenshot label; every view state has a home already.
- **Authored transitions on Screens** (`next`, `parent`, `over`). Unbounded,
  second encoding of Steps, and the reason the sitemap ban exists.
- **A `presentation: page | overlay` field on Screens.** Design vocabulary; the
  product fact (the parent stays) is a Scenario Outcome.
- **Co-visibility or addressability as the child-Screen test.** The first
  flips with the breakpoint; the second is routing. Selection-dependence is
  decidable from code alone.
- **Filters as Capabilities.** Same purpose and outcome as the presenting
  Capability, so a Scenario by the format's own split rule.
- **A cheaper positive claim for abilities without a Scenario.** Two valid
  spellings of "this ability exists here".
- **`creates` Steps citing facts.** The Screen presents what a form collects;
  a second home for the same claim.
- **Bare Entity id meaning "all facts".** Two spellings for one claim.
- **Renaming Experience.** The name invites design talk, but the border
  sentence uses it well and the churn is large.
- **Deriving Screen `capabilities` from Steps.** A partial model needs the
  claim before coverage exists; L3 makes the authored list honest instead.
- **Capability boundary kept on Interfaces and Experiences.** The argument
  that removes it from Screens applies one level up.
- **Meaningful `navigation` order.** An author might want it either way, which
  argues against modeling it.
- **A variant dimension on Contexts** for flags and experiments. Doubles every
  Context check for a mechanism Rule `when` already covers.
- **A Product-level version registry with a `version` key on Contexts.**
  Versions that differ in what an Actor can do are places; containment and
  counterparts already draw them.
- **A cohort concept on Experiences.** Who is in the beta is a fact on an
  Entity, read by a Rule.
- **Counterpart inheritance** for twin Screens. An existing cost, not this
  plan's.

## Steps

Two pull requests under one release. The first is reviewable on its
`.businesslens/` diff, which is the binding surface; the second is not.

**PR 1: format, docs, lint, fixtures**

1. `spec/format.md`: Screen section, nesting, `navigation`, Step `facts`,
   Contexts and places, the border, `languages`, `version` and the third
   divide reason, Capability boundary removals, the text rule, the wizard
   sentences. `spec/rejected.md`: the entries above.
2. `docs/interfaces.md` rewritten with a new "Is this a design spec?" section
   mirroring "Is this an ERD?", the navigation prohibition rewritten, nesting,
   forms, versions; `docs/product-model.md` table, pointer and `languages`;
   `docs/capabilities.md` for Step facts, the filters and search rule, the
   wizard sentence; `docs/journeys.md` for Step facts and the wizard sentence;
   `docs/references.md` drops `state` and says where state screenshots go;
   `docs/business-rules.md` for L6, L8 and the flag paragraph. Then
   `npm run vocabulary`.
3. `src/core/model.ts`, `portable.ts`, `permission-validation.ts`,
   `src/commands/lint.ts`, `open.ts`: parser, schema, L1 to L11, removals,
   recursive Screen reading, the `open` path builder. `spec/report.md` for the
   projection changes.
4. `test/fixtures/fixture-shop/` and this repository's `.businesslens/`,
   including the Margin Rule losing its context selector, the resource
   reading's and Product overview's tabs becoming child Screens, and the
   Scenario prose that names tabs moving in lockstep.
5. `skills/businesslens-*/SKILL.md` and rubrics: the redesign test in one
   sentence each, the text rule, the child-Screen test, the filters and search
   rule, nesting, `navigation`, forms, D9. Validate with `quick_validate.py`.
6. Determinism round (see Acceptance). Blocks merging the rubric changes.

**PR 2: report viewer**

7. Screen reading with the "Changes made here" block; Interface and Experience
   readings leading with delivery on Overview; the UI map as the Interfaces
   Graph with `navigation` marks; nested Screens in trees and the place
   triple replaced; tree-card Capability counts.

**Elsewhere**

8. Landing repository, own PR: FAQ question "Does the model describe the UI?",
   Interfaces home-card note, `CONTEXT.md` vocabulary entry.
9. `CHANGELOG.md` `[Unreleased]`, `npm run verify`, `npm pack --dry-run`.

## Acceptance

- `npm run verify` green with the fixture and the self-model rewritten.
- A determinism round: one unfamiliar public repository with a real UI, two
  independent `businesslens-map` runs from the new rubric, diff Screens and
  Step places. Both readings defensible is a format defect; one wrong against
  the spec is a rubric defect. D3, D4 and D5 are the decisions this measures;
  nothing here is claimed closed before it runs. Three candidate repositories
  are shortlisted once step 5 lands; the choice is the reviewer's.
- The fixture's "Margin is for operators" Rule lints clean without a context
  selector, because the shopper's order-status Screen no longer presents
  Margin.
- The self-model's report tabs are child Screens and the Scenario prose that
  named tabs still lints clean.

## Open

Nothing. The determinism target is chosen when the shortlist exists.
