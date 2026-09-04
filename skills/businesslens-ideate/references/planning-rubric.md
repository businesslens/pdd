# Planning rubric

## Scope

- Plan one coherent intent a reviewer can approve or reject as a whole.
- Prefer the smallest product-complete change over a speculative epic.
- In a verification handoff, solve the exact gap; do not broaden the product.

## Resources

- An Actor is a role, not a resource type: an Entity that carries
  `kind: person|system` and `acts: external|internal`, relative to the Product
  boundary. Actors differ by Product goals, triggers, responsibilities, or
  privileges; two roles with the same goals and permissions are one Entity.
- Interfaces are supported interaction contracts. Decide web, mobile, CLI,
  partner API, and integration commitments independently; internal APIs and
  frameworks are not Product Interfaces. Give each Interface exactly one
  authored interaction type; use the contract (`web`, `mobile-app`, `cli`,
  `api`, and so on), not its implementation technology.
- An Experience is a coherent Actor context with a stable audience, access, and
  capability boundary inside exactly one Interface — the folder that holds it.
  Whether an Interface is divided into Experiences is derived, never judged: it
  is divided when it serves more than one `access` value, or when its Actors
  split into groups no Capability available there bridges (a Capability bridges
  the Actors its Scenario Steps name). Otherwise it holds no Experiences and
  availability names the Interface directly. `lint` decides and reports a
  violation as an error; the one exception is an Experience whose name also
  exists under another Interface — a counterpart, which justifies itself. A
  page or command group alone is not an Experience.
- Screens are optional stable user-visible product views. State their
  information, available actions, View states, and capability boundary without
  specifying components, layouts, or visual variants.
- A Screen belongs to one Interface or Experience. The same view on web and on
  mobile is two Screens with the same name — counterparts, told apart by their
  path — each stating its own purpose, information, and actions, so a
  divergence between them is visible instead of silent. Public routes and deep
  links may be entry points, but internal navigation identifiers do not belong.
- Domains are optional Capability organization; Journeys may cross them.
- Capabilities are durable Product abilities, not UI labels, Journey titles,
  or sequence steps. Declare availability Contexts whose places are an
  undivided Interface or an Experience.
- Business Rules are durable constraints, derivations, or permissions with typed
  behavioral, direct Context, or Entity targets. An Entity target selects an
  operation on a thing (`effect`, `from`, `to`) or the facts it governs; who may
  perform it is a `permits` grant — `actors`, `related`, `self`, `unattended`,
  `configuredBy`, each optionally conditioned by `when` — and permission claims
  live only here, never in Scenario prose. Derive Domain backlinks instead of
  targeting Domains.
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
