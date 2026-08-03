# Planning rubric

## Scope

- Plan one coherent intent a reviewer can approve or reject as a whole.
- Prefer the smallest product-complete change over a speculative epic.
- In a verification handoff, solve the exact gap; do not broaden the product.

## Entities

- Actors differ by Product goals, triggers, responsibilities, or privileges;
  classify each as person/system and internal/external.
- Interfaces are supported interaction contracts. Decide web, mobile, CLI,
  partner API, and integration commitments independently; internal APIs and
  frameworks are not Product Interfaces.
- Experiences are coherent Actor contexts with stable audience, access, and
  capability boundaries across Interfaces. A page or command group alone is
  not an Experience.
- Screens are optional stable user-visible product views. State their
  information, available actions, product-significant states, and capability
  boundary without specifying components, layouts, or visual variants.
- Reuse one Screen across web and mobile when its product semantics are shared;
  separate it only for a material product difference. Public routes and deep
  links may be entry points, but internal navigation identifiers do not belong.
- Domains are optional Capability organization; Journeys may cross them.
- Capabilities are durable Product abilities, not UI labels, Journey titles,
  or sequence steps. Declare exact intended Interface–Experience availability.
- Business rules are reusable policies or invariants.
- Journeys express stable user or operator goals.
- Scenarios express observable paths through a goal, not implementation
  branches. Cover primary, permission, validation, conflict, and
  external-failure behavior where the product distinguishes them.
- Use a decision point only when one condition creates two or more materially
  different outcomes.
- Record intent where the reason behind a boundary or behavior will guide
  implementation choices.
- Do not assume parity across Interfaces. Decide each availability pair and
  allow Scenarios to narrow a Journey only when behavior materially differs.

## Scenarios are the acceptance contract

Write Trigger, ordered Steps, Decision points when behavior branches, and
Outcome so a reviewer can compare source behavior without executing it.

- Good: “Submitting an empty cart shows an error and keeps the cart.”
- Too vague: “Cart validation works.”
- Wrong altitude: “POST /cart returns 400.”

## Dialogue

- Propose concrete drafts and let the user correct them.
- Batch related open questions; ask only decisions the user must make.
- State a recommendation and its tradeoff when multiple directions remain.
- Record unresolved points as limitations instead of guessing.
- Keep screenshots, mockups, research, and sitemaps external. References may
  attach them with `role: intent` or `role: context`, but BusinessLens neither
  creates nor certifies them.
