# Planning rubric

Every format rule — Actors and roles, Interfaces and their division into
Experiences, Screens, Domains, naming, Entities, the Capability split test,
Business Rules and prohibitions, Journeys, Step and Screen facts, availability
in every context, Variations and what selects them — lives in
[format.md](format.md). This rubric holds only the planning method.

## Scope

- Plan one coherent intent a reviewer can approve or reject as a whole.
- Prefer the smallest product-complete change over a speculative epic.
- In a verification handoff, solve the exact gap; do not broaden the product.

## Decide each commitment

- Decide web, mobile, CLI, partner API, and integration commitments
  independently; internal APIs and frameworks are not Product Interfaces.
- Do not assume parity across Interfaces. Decide each availability Context and
  every Scenario's Step Contexts independently.
- Decide each Interface's access from who will reach each planned place —
  without signing in, once signed in, or only the roles that administer the
  Product, its settings or members, may enter (the administration area). `lint`
  cannot see this until Experiences exist; deciding it is yours.
- Record intent as the outcome a boundary or behavior protects, without
  comparisons to discarded designs.

## Places, not designs

The model records what an Actor can reach, see, supply, do and trigger at each
place. It never says how that looks or is built. One test decides every case:

> Rebuild a view with a different component library, layout, typography,
> colors, spacing, icons, motion and copy. Everything that would still have to
> be true is the model's: who can reach the view, what facts it shows, what
> abilities it offers, what conditions change that, and what happens next.
> Everything the redesign is free to change is design's, and the model says
> nothing about it.

Design — component libraries, theming, layout, typography, color,
iconography, motion, microcopy and tone, gestures versus buttons, breakpoints,
loading and hover states, navigation chrome and the order of navigation items,
and quality attributes that do not change what an Actor can do — lives in
`visual` References with `role: intent`, never in prose. Ordinary copy is
design; when exact wording is a product requirement, a Business Rule identifies
its authoritative Reference.

## Scenarios are the acceptance contract

Every Capability needs at least one Capability Scenario; cover primary,
permission, validation, conflict, and external-failure behavior where the
Product distinguishes them. Write Trigger, ordered typed Steps, Decision points
when a linear sequence branches, and Outcome so a reviewer can compare source
behavior without executing it.

- Good: “Submitting an empty cart shows an error and keeps the cart.”
- Too vague: “Cart validation works.”
- Wrong altitude: “POST /cart returns 400.”

## Dialogue

- Propose concrete drafts and let the user correct them.
- Batch related open questions; ask only decisions the user must make.
- While a choice remains open, discuss a recommendation and its tradeoff in the
  conversation. After resolution, record the resulting product meaning without
  retaining discarded directions or replaying settled discussion on later runs.
- Record material unresolved points as limitations instead of guessing; an
  unchosen option is not a limitation or product exclusion.
- Keep screenshots, mockups, design systems, research, and sitemaps external.
  References may attach them with `role: intent` or `role: context`, but
  BusinessLens neither creates nor certifies them.
