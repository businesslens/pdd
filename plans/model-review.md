# Model review: how good is the model we reached

Status: **implemented and verified.** Findings are ranked and each
carries one proposed change. The decisions taken on them are recorded in
[Decisions](#decisions) below, and the design decisions they produced are
[ADR-0001 through ADR-0007](./adr/).

Written against `main` at `dbca71a`, folder schema 6, Product Report v10,
package 0.8.0.

## What was measured, and how

Scope: the entity model, its folder encoding, and the Product Report wire
contract. The report viewer is out of scope; `docs/` is in.

Axes, ranked: **determinism → reviewability → economy → falsifiability →
expressiveness → legibility → buildability.** Determinism first because this is
an agent-authored format: if `businesslens-map` can wobble, `verify` has no
stable contract to check and the catalog has no comparable Blueprints.

Standard of judgment: the shipped agent, working from the 462 lines that
actually install (`SKILL.md` 106 + `references/format.md` 279 +
`references/mapping-rubric.md` 77), not the 1,112-line `spec/format.md`. The
human never reads either — they meet the model through `docs/`, the agent's
proposed delta, and the PR diff.

Instruments:

1. **Determinism diff.** BusinessLens mapped twice, independently, no contact.
2. **Encoding probe.** One two-sided marketplace authored two structurally
   different ways.
3. **Placement test.** 15 real product things, list committed before authoring.
4. **Wire tests.** Export, inspect, expand, diff.
5. **Blueprint probe.** Content Feed Reader read for buildability and coverage.

Caveat recorded before authoring: for this target both authors could read the
full spec as product evidence. **Divergence is therefore a lower bound.**

## The result in one line

**The format determines the skeleton and underdetermines the body.**

Both authors independently found the same three Interfaces, zero Experiences,
the same dependency boundary, the same Actor-vs-dependency direction, the same
compact Product, and the same coverage status. Inside that skeleton, capability
granularity diverged 4x, domains 3-vs-5, journeys 4-vs-5 with half disjoint, the
Rule/Scenario boundary inverted, authored depth differed 1.8x, and **not one
Capability, Journey, or Business Rule id matched.** Both models pass
`businesslens lint`: *"Product Model structure is sound."*

## What shipped

Folder schema **7** and Product Report **v11**, in one release.
`npm run verify` is green: **256 tests**, repository checks, Blueprint checks,
`npm pack --dry-run` inspected, all three skills validated, and the Claude plugin
manifest validated.

Two fixes were proven end to end rather than only compiled. An unattended
Scenario survives export and expansion with its `unattended: true` intact, and
the expanded model lints clean. An author's `unmapped`, `limitations`, and
`rationale` now survive expansion verbatim, with the import note **appended** to
`limitations` rather than substituted for the author's prose.

Three things were discovered during implementation and are recorded here because
they changed the design:

- **F2 needed a counterpart exception.** Flattening an Interface that carries a
  single Experience would have broken the counterpart relationship with its
  platform twin — `reader-mobile::personal-library` against
  `reader-web::personal-library`. An Experience with a counterpart under another
  Interface is exempt.
- **F5 reached further than the Scenario rule.** An unattended Scenario derives
  no Actor, so the "does this place permit the Scenario's Actors" check had no
  answer for it, in both the linter and the report validator. Both now exempt it.
- **F1's naming check needed a verb vocabulary.** A pure suffix test flags
  `publish-and-share-a-collection`, which is a perfectly good verb-object id. The
  check now warns only on a nominalised id containing no product verb.

The golden fixture failed three of its own new rules, which is the format working:
`admin-web` carried a ceremonial single Experience, the `catalog` Domain held one
Capability, and the refund Rule governed exactly one behavior. All three are fixed.

## Decisions

Taken 2026-08-26. These supersede the recommendations as originally drafted;
where a second pass changed a recommendation, that is noted.

| # | Decision | Outcome |
| --- | --- | --- |
| Q1 | Which findings are accepted | **All except F8**, with F10 split: F10b accepted, F10a rejected |
| Q2 | Interface/Experience boundary | **Derived mechanically from authored fields, enforced by `lint`** — revised from a prose test |
| Q3 | Product objects | **A tenth entity kind**, with a computable existence rule |
| Q4 | Naming rule | **Retroactive** — fixture and Blueprint renamed |
| Q5 | Release shape | **One release** — folder schema 7, Product Report v11 — revised from staged |

### Rejected, with reasons

**F8 — Blueprint provenance. Rejected as contrary to product design.** A
Blueprint carries no claim about its own origin; neutrality is deliberate.
Recorded as [ADR-0007](./adr/0007-blueprints-are-provenance-neutral.md), which a
future proposal must supersede rather than extend.

**F10a — Context specificity. Rejected on review.** The finding proposed
softening Step Context specificity from a hard maximum to a floor. On second
look the fragility it describes — authoring a Screen invalidating Contexts
elsewhere — is the rule working: once the Screen exists, the Step genuinely does
occur there. Specificity stays a hard maximum.

### F7, narrowed by ADR-0007

The original finding asked expansion to preserve all four authored coverage
prose fields. ADR-0007 splits them:

- `method` describes **how a model was derived** — a provenance claim. Expansion
  may overwrite it, and `spec/report.md` must stop listing it among the prose
  that is never rewritten.
- `unmapped`, `limitations`, and `rationale` describe **the model's own
  completeness**. They carry no provenance, they are exactly what a reader
  pulling a Blueprint needs, and they must survive expansion intact.


## Findings

### F1 — Two lint-clean models of one product share zero behavioral ids
*determinism*

| Kind | A | B | Shared ids |
| --- | --- | --- | --- |
| Capabilities | 11 | 14 | **0 of 25** |
| Journeys | 4 | 5 | **0 of 9** |
| Business Rules | 7 | 8 | **0 of 15** |
| Domains | 3 | 5 | 1 of 7 |
| Actors | 2 | 3 | 1 of 4 |

A used noun phrases (`model-linting`, `report-export`), B verb phrases
(`lint-model-structure`, `export-blueprint`); `product-engineer` vs `developer`;
`report-viewer` vs `local-report-viewer`. Ids are the format's entire identity
mechanism — the filesystem is the id authority — so two models of one product
cannot be diffed, merged, or compared. For a catalog of comparable Blueprints
this is structural, not cosmetic.

**Proposed change.** State a naming rule in the format, not as style: behavioral
entity ids are `verb-object`, cross-cutting entity ids are the bare noun. This
does not fix granularity (F2, F4) but it removes the cheapest third of the
divergence and makes the rest visible.

### F2 — The Interface/Experience boundary admits two lint-clean encodings
*determinism, expressiveness*

Demonstrated, not argued. One two-sided marketplace, authored twice:

- **A:** two Interfaces, `host-web` and `guest-web`.
- **B:** one Interface `stayfinder-web` with Experiences `hosting` and
  `booking`.

Both: *"Product Model structure is sound."* Every Context place id differs;
every `availability` differs. The docs' four-condition Experience test returns
**true** for both, and the Interface test returns **true** for both. The tests do
not discriminate.

This joint was invisible to the determinism diff, because BusinessLens has no
Experience-worthy contexts and both authors correctly wrote zero.

**Proposed change.** Make the choice derivable rather than judged. The candidate
that survives both readings: an Interface is one *interaction contract*, and
Experiences exist if and only if one Interface serves more than one Actor
population with disjoint capability boundaries. Under that rule the marketplace
has exactly one legal encoding. The alternative — delete Experience and allow
Interfaces to nest — is cleaner but larger.

### F3 — A required closed enum has no correct value for the product's own main surface
*expressiveness*

The agent-skill surface is a genuine inbound interaction contract: a person types
`/businesslens-map` and the product responds. Author A typed it `cli`; author B
typed it `messaging`. Both logged, independently, that **none of the nine values
fits**. `type` is required, the enum is closed, and no doc says what to do when
nothing fits (verified: no such guidance exists in `docs/`).

BusinessLens's most important interaction form is one its own format cannot name.

**Proposed change.** Add `agent` to the enum. The enum's purpose is to state the
supported interaction contract, and an agent-skill surface is one — it has
actors, a boundary, and independently verifiable behavior.

### F4 — The Business Rule / Capability Scenario boundary is undefined, and inverted between authors
*determinism*

A perfect mirror. Author A made *"publication requires complete identity"* a
**Business Rule** and *"writing requires approval"* a **Scenario**. Author B did
exactly the opposite. Same two facts, opposite classifications, both directions,
both lint-clean.

`docs/` contains no statement of the boundary (verified). The one disambiguation
table in `docs/product-model.md` covers only the four behavioral entities and
does not mention Business Rule at all.

**Proposed change.** State the boundary: a Business Rule is a constraint that
must hold across **two or more** behaviors, or across a Context independent of
any single behavior. Anything true of exactly one Capability is a `condition`
Step or an Outcome in that Capability's Scenario. This is checkable by `lint` —
a Rule whose `appliesTo` resolves to exactly one behavioral entity with no
`contexts` narrowing is a warning.

### F5 — The model cannot express unattended behavior, and the teaching Blueprint proves it
*expressiveness, falsifiability*

Every Scenario requires at least one `actor` Step, and every Capability requires
`availability` naming an Interface or Experience. A scheduled job has neither.

This is not hypothetical. In the shipped Content Feed Reader Blueprint,
`feed-synchronization` states in prose that the Product reads feeds *"when the
Reader refreshes their sources, **and on a recurring schedule the Product
owns**."* The phrase "recurring schedule" appears **exactly once in the entire
Blueprint**, in that sentence. Both of its Scenarios begin with a Reader actor
Step. **The scheduled path has zero acceptance coverage — in a model whose
`coverage.md` says `status: complete`.**

So a `complete` model contains named, uncovered behavior, and the format is why.

**Proposed change.** Permit a Scenario whose first Step is `kind: condition` with
no Actor, and drop the "at least one actor Step" rule to "at least one actor Step
**or** an explicit unattended trigger". Availability for an unattended Capability
should name the Contexts where an Actor *observes the outcome*, which is what the
Blueprint was already reaching for.

### F6 — A reviewer can see what the model says, but not what it omits
*reviewability*

The map workflow's step 7 makes a human approve product meaning. That gate is the
product's answer to "the agent might get it wrong." But Stage 1 showed the actual
failure mode is **granularity and omission** — one Capability where four belong,
two Actors where three belong, four Journeys where five belong. None of that is
visible in a delta. A reviewer reviews what is present; the divergence lives in
what is absent.

Both authoring runs volunteered their judgment calls unprompted — A recorded 11,
B recorded 10 — which is the right instinct and is not required by anything.

**Proposed change.** Two parts. (1) Make the delta presentation *require* a
"judgment calls" section naming each choice that could defensibly have gone the
other way, with the alternative stated. (2) Re-aim `docs/` at reviewing rather
than authoring — see F12.

### F7 — `blueprint open` destroys author prose the spec promises is never rewritten
*falsifiability*

`spec/report.md:182` — *"Author-written prose — `method`, `unmapped`,
`limitations`, `rationale`, `intent` ... is never rewritten. It carries product
meaning and belongs to the author."*

Verified by round trip. The **exported report preserves** all four fields
verbatim. **Expansion replaces them.** Three authored `method` lines became
*"Opened from a portable Product Report; source-repository navigation was
intentionally removed."* The authored coverage rationale was replaced wholesale
with *"Product behavior, relationships, and model breadth were imported from a
Product Report."*

The promise is scoped to the projection; expansion is not covered by it and
violates its intent. The concrete cost lands on the marketplace: a user who pulls
a Blueprint receives a `coverage.md` in which the author's account of *how they
built it and what they left out* — the material that tells you whether to trust
it — has been overwritten with tool boilerplate.

**Proposed change.** Expansion writes the report's authored coverage prose
verbatim and *appends* its import note as an additional `limitations` entry.
Never substitution.

### F8 — A published Blueprint cannot say whether anyone ever built it — REJECTED
*falsifiability, marketplace* · **rejected: see [ADR-0007](./adr/0007-blueprints-are-provenance-neutral.md)**

Blueprints are always portable, and the portable projection keeps only HTTP(S)
intent/context references — every `kind: code` implementation reference is
stripped. So a model mapped from a working, verified product arrives in the
catalog **byte-indistinguishable** from one somebody imagined in an afternoon.

Given that the marketplace's purpose is "cool systems users can achieve
building", a user has no way to tell which Blueprints anyone has ever built.

**Proposed change.** Add a product-level provenance field to the report —
`derivedFrom: implementation | intent | mixed` — computed at export from whether
the model carried implementation references, and preserved by the projection.
This is product-level provenance, not repository navigation, so the reason the
projection strips paths does not apply to it.

### F9 — There is no entity for a product object or its lifecycle
*expressiveness, buildability*

`## Product states` exists only on a **Screen**. A Listing's
`draft → published → paused → archived` therefore has no home: if listings appear
on six Screens you either repeat the states six times or pick one arbitrarily,
and the transitions themselves (archived is terminal; draft cannot go straight to
paused) fit nowhere but one Business Rule per edge.

Both authoring runs hit the softer version of this: author A's Screen states came
out as *view* states ("Populated / Empty"), which is what the field actually
models.

The buildability probe against Content Feed Reader lands in the same place. Of
the questions a builder must resolve before writing code, the ones that are
genuine product meaning with nowhere to go are all object questions: what a
saved item *is*, what the product retains about it, what happens to it when its
source drops it.

**Proposed change.** Move `## Product states` off Screen. Either give the model
an optional object kind that owns states and their transitions, or — cheaper —
allow `## Product states` on a Capability, whose intent already names the thing
whose state changes.

### F10a — Step Contexts are coupled to Screen existence — REJECTED
*economy* · **rejected: the fragility is the specificity rule working**

### F10b — A Screen shared across Experiences cannot be modeled once
*expressiveness* · accepted

A Scenario Step must name *"a Screen when one exists, otherwise the leaf
Experience or Interface."* So **authoring a Screen invalidates Step Contexts in
Scenarios that do not mention it.** Model no Screens and the same Steps sit
legally at the Interface; add one later and existing Contexts become wrong.

Compounding it: *"An Interface holds either `screens/` or `experiences/`, never
both."* A Screen shared across the Experiences of one Interface — a search
results page, a settings page — cannot be modeled once. It must be duplicated per
Experience, and the format's "counterpart" concept does not cover it, being
defined as the same thing on two *Interfaces*.

**Proposed change.** Make Context specificity a floor, not a maximum: a Step may
name any place at or below the Capability's availability Context, and `lint`
warns only when a *more specific* place is available **and the Step is the only
one in its route**. Separately, allow an Interface to hold `screens/` beside
`experiences/` for Screens genuinely shared across them.

### F11 — `entryPoints` has three key vocabularies, one of them enforced
*legibility*

- On an **Interface**: unvalidated. Author A keyed by interaction type
  (`cli:`, `web:`); author B keyed by free label — `skill:` on a `messaging`
  Interface, `cli:` on a `web` Interface. **Both lint clean.**
- On an **Experience** and a **Screen**: must name the containing Interface's id.
  Enforced.

One field name, three vocabularies, one rule. Author A got it wrong on all three
Interfaces on the first pass; the error message (*"each entry point must be a
single `type: path` map"*) names a rule that is not in fact enforced.

**Proposed change.** Enforce one vocabulary. On an Interface the key must equal
that Interface's own `type`; on an Experience or Screen it must equal the
containing Interface id. Both are checkable and both are already what the
examples do.

### F12 — The page that must carry the model has no diagram and disambiguates 4 of 9 kinds
*legibility*

`docs/product-model.md` is 214 lines and contains **zero diagrams** (verified).
The model's own central claim is structural — *"two hierarchies and one axis"* —
which is precisely the claim a picture carries and prose does not.

Its one disambiguation table, *"Which behavioral entity?"*, covers Capability,
Capability Scenario, Journey, and Journey Scenario. Business Rule, Actor,
Interface, Experience, Screen, and Domain are absent — and F2 and F4 are exactly
the boundaries it omits.

Supporting measurement: across `spec/format.md`, explanation mass tracks
contestedness rather than importance. **Journey — optional — has 311 doc lines
and 6 defining sentences. Actor — required — has 91 and 0.** The spec carries 88
prohibitive statements, roughly one per 12 lines.

Placement test result: of 15 committed items, **7 place cleanly** (webhook →
Interface + Actor; the polled dependency → no entity; partner API → Interface;
CSV export → Capability + Screen action; the 30-day refund → Rule), and **8 are
ambiguous or homeless** — onboarding checklist (Journey *and* Screen *and*
Capability, all three simultaneously correct and unlinked), the nightly job (F5),
the Listing lifecycle (F9), the shared search page (F10), the rate limiter and
offline mode (F4's boundary), SSO (rule says Interface, judgment says no), and
the support agent's console (F2's boundary).

**Proposed change.** Aim `docs/` at the reviewer, not the author — the human
never authors. Add one diagram of the two hierarchies and the axis, extend the
disambiguation table to all nine kinds, and give each entity page a "what to
challenge when an agent proposes one" section stating the alternative it was
chosen over.

### F13 — Domain resembles the thing its own documentation warns against
*economy*

Optional, single-valued, and the only authored Domain edge in the entire format
is `domain:` on a Capability. Author A created 3, author B created 5, one id in
common, and the cuts did not correspond. `docs/domains.md` warns *"Do not create
a Domain to re-gather Capabilities you have just split… A Domain that exists only
to hold them is a folder, not a region"* — and author A's log records that its
three Domains are uncomfortably close to exactly that.

**Proposed change.** Do not delete it — the Blueprint's three Domains
(`reading`, `sources`, `collections`) are genuine subject regions and carry the
report's colour grouping. Instead require what makes it checkable: a Domain is
valid only when its `## Boundary` names something it explicitly does **not** own,
and `lint` warns on a Domain holding fewer than two Capabilities.

## What is working, and should be protected

These converged independently across two authors and should not be disturbed by
any fix above.

- **The Actor/dependency direction rule.** Both authors placed the catalog and
  GitHub identically as outbound dependencies with no entity, and both correctly
  made the coding agent an Actor. This rule is doing real, hard work.
- **"A command group is not an Experience."** Both authors wrote zero
  Experiences and both cited this line. The single most effective sentence in the
  shipped rubric.
- **Screen reuse over duplication.** Both collapsed ten kinds' worth of
  collection views into one `collection` Screen.
- **Compact/expanded derived from content.** Both chose compact `product.md` for
  the same reason, and the round trip normalizes correctly.
- **Authored/derived separation survives the round trip.** Journey
  `capabilityIds`, `domainIds`, and `failureOnlyCapabilityIds` are carried in the
  report and correctly *not* re-authored on expansion. The wire contract is sound
  here; the defect is F7, which is about prose, not structure.
- **Coverage as breadth, never verification.** Both authors set `partial` and
  neither confused it with implementation alignment.

## Verdict

The model is at a good point in its **outer** structure and a weak point in its
**inner** discriminations.

What is settled and worth building on: the Product/Actor/Interface/Capability
spine, the inbound/outbound direction rule, containment by path, the
compact/expanded shape rule, and the authored/derived split in the wire format.
None of that wobbled under an independent second author.

What is not settled: every boundary that decides *how many* entities exist and
*which kind* a thing is — Interface vs Experience (F2), Rule vs Scenario (F4),
Capability granularity (F1), Domain cuts (F13), Journey warrant. These are the
decisions an agent makes dozens of times per model, they do not converge, and
the human gate cannot catch them (F6).

All accepted findings ship in **one release**: folder schema 7 and Product
Report v11. There is no informational dependency between them — F2 is proven
ambiguous by the encoding probe regardless of naming, and F5 and F9 are proven
holes regardless of anything else — so staging would cost a second full
migration across parser, viewer, skills, fixtures, and Blueprint while buying
nothing.

Per [ADR-0006](./adr/0006-determinism-is-verified-by-independent-double-authoring.md),
the double-authoring re-run is the **validation gate after** the release, not a
staging device before it.

## On adopting a `.businesslens/` for this repository

Author A's model is lint-clean and its coverage is honest. But two independent
maps of this repository agreed on almost none of its behavioral ids, so
committing either one would be committing one arbitrary reading of the product
as the authoritative one. **Adopt after F1 and F2 are decided, not before** —
otherwise the dogfood becomes a hostage to a naming and granularity choice made
by whichever run happened to be kept.
