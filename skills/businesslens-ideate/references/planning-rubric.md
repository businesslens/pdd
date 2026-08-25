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
  frameworks are not Product Interfaces. Give each Interface exactly one
  authored interaction type; use the contract (`web`, `mobile-app`, `cli`,
  `api`, and so on), not its implementation technology.
- Experiences are optional coherent Actor contexts with stable audience,
  access, and capability boundaries across Interfaces. Omit them when an
  Interface is already one coherent context. A page or command group alone is
  not an Experience.
- Screens are optional stable user-visible product views. State their
  information, available actions, product-significant states, and capability
  boundary without specifying components, layouts, or visual variants.
- Reuse one Screen across web and mobile when its product semantics are shared;
  separate it only for a material product difference. Public routes and deep
  links may be entry points, but internal navigation identifiers do not belong.
- Domains are optional Capability organization; Journeys may cross them.
- Capabilities are durable Product abilities, not UI labels, Journey titles,
  or sequence steps. Declare availability Contexts whose places are an
  undivided Interface or an Experience.
- Business rules are reusable policies or invariants with typed behavioral or
  direct Context targets. Derive Domain backlinks instead of targeting Domains.
- Capability Scenarios express observable acceptance for one Capability with
  typed Actor/Product/condition Steps and named Context place routes. Every Capability needs at least one; cover primary,
  permission, validation, conflict, and external-failure behavior where the
  product distinguishes them.
- Journeys express stable user or operator goals whose achieved paths cross at
  least two distinct Capabilities. Do not create a Journey to house acceptance
  for one Capability.
- Journey Scenarios express observable paths through a goal. Write one ordered
  typed Steps list, annotate responsible Actors and Steps that exercise locally
  identified Capabilities, and place every named route at its most-specific Context place.
- Use a decision point only when branches converge on the same result without
  changing the Capability sequence. Otherwise write separate Scenarios.
- Record intent where the reason behind a boundary or behavior will guide
  implementation choices.
- Do not assume parity across Interfaces. Decide each availability Context and
  every Scenario's Step Contexts independently.

## Scenarios are the acceptance contract

Write Trigger, ordered typed Steps, Decision points when a linear sequence branches,
and Outcome so a reviewer can compare source behavior without executing it.
Both Scenario types author this sequence once in structured frontmatter; Steps
that apply to all routes may omit `contexts`, and Journey Steps may omit Capability.

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
