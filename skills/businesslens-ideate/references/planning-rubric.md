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
- An Experience is who is there and what they can do — a coherent Actor context
  with one access mode, and one version where several are served at once —
  inside exactly one Interface, the folder that holds it; never what it looks
  like. Whether an Interface is divided into Experiences is derived, never
  judged: it is divided when it serves more than one `access` value, when its
  Actors split into groups no Capability available there bridges (a Capability
  bridges the Actors its Scenario Steps name), or when it serves two or more
  versions at once through one entry point, each Experience carrying `version`.
  Otherwise it holds no Experiences and availability names the Interface
  directly. `lint` decides and reports a violation as an error; the one
  exception is an Experience whose name also
  exists under another Interface — a counterpart, which justifies itself. A
  page or command group alone is not an Experience.
- Screens are optional stable views an Actor reaches: places, decided under
  "Places, not designs" below, never components, layouts or visual variants.
- A Screen belongs to one Interface, Experience or parent Screen. The same view
  on web and on mobile is two Screens with the same name — counterparts, told
  apart by their path — each listing its own facts and Capabilities, so a
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
  live only here, never in Scenario prose. Title a Rule with its assertion
  about what it selects — a permission names the operation and who may perform
  it — never with a consequence, a feature, or the mechanism behind it; those
  go in the lead or `## Rationale`. Derive Domain backlinks instead of
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
- Record intent as the outcome a boundary or behavior protects, without
  comparisons to discarded designs.
- Do not assume parity across Interfaces. Decide each availability Context and
  every Scenario's Step Contexts independently.

## Places, not designs

The model says what an Actor can reach, see, do and trigger at each place,
never how it looks or is built. Decide every borderline fact with the redesign
test:

> Rebuild a view with a different component library, layout, typography,
> colors, spacing, icons, motion and copy. Everything that would still have to
> be true is the model's: who can reach the view, what facts it shows, what
> abilities it offers, what conditions change that, and what happens next.
> Everything the redesign is free to change is design's, and the model says
> nothing about it.

- Out of the model: component libraries, theming, layout, typography, color,
  radius and borders, iconography, motion, microcopy and tone, gestures versus
  buttons, breakpoints, loading and hover states, navigation chrome, the order
  of navigation items, and quality attributes such as accessibility or
  performance unless they change what an Actor can do. Attach the design
  system, mockups or design files as `visual` References with `role: intent`;
  write none of it in prose.
- Text: decide that an Actor is told something and under which condition — a
  Step, an Edge case, a Rule outcome — never the words. Legally required text
  is a Rule ("consent is captured before creation") whose wording is a
  Reference.
- A Screen is a place. It lists the Capabilities its own Steps use and, for
  each Entity it presents, the facts on screen — read or entered alike, so a
  form presents what it collects and the creating Step cites nothing. Name
  facts as `{ entity, facts }`; a bare id only while the model is not
  `complete`, and always for an Entity with no named facts.
- A child Screen is a region whose content depends on an act inside its
  parent — picking a row, choosing a tab, advancing a step. Whether it is
  visible at the same time, and whether it has its own address, do not decide
  it; the same content drawn differently is design. A parent Screen is a
  place: a Step placed there is on the parent, not in any child. Capabilities
  do not flow up or down.

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

- A wizard is nested Screens on the structure axis. The Scenario walking it is
  a Journey only where it crosses Capabilities, otherwise a Capability
  Scenario; the two axes are independent.
- Every ability a Screen exposes has a Scenario with a Step placed exactly on
  that Screen — an export button included. There is no cheaper spelling of
  "this ability exists here": plan the Scenario, or leave the Capability off
  the Screen.
- Filters, sorting and search are Scenarios of the Capability that presents
  the set, never Capabilities of their own; cite the facts they use as `facts`
  on the `reads` Step. Search that presents a set nothing else does — one
  search returning products, orders and customers — is a Capability.
- Empty, unauthorized and blocked are condition Steps, Edge cases, Rule
  outcomes or a child Screen, never a state on the Screen; a screenshot of a
  state attaches to the Scenario or Edge case that reaches it.
- `navigation` on an Interface or Experience names only Screens reachable from
  every place inside it — a cart, a global search. Nothing else about
  navigation is authored: no sitemaps, menus, back links or item order. Entry
  points say what is addressable; Steps say movement.
- Variation: `languages` on the Product, narrowed on an Interface, never on
  Experiences or Screens. A flag, A/B test or dynamic configuration that
  changes what an Actor can do is a fact on a settings Entity read by a Rule
  `when`; the experiment itself — cohorts, assignment, metrics — is not
  modeled, and one that changes only looks is design. Versions served at once
  are places: an own entry point (`/api/v2`, a separate app) is an Interface,
  a shared one is Experiences under it, each carrying `version`. Who sees which
  is a fact on the Actor or tenant Entity read by a Rule. Historical versions
  are never modeled; Git is the history.

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
- While a choice remains open, discuss a recommendation and its tradeoff in the
  conversation. After resolution, record the resulting product meaning without
  retaining discarded directions or replaying settled discussion on later runs.
- Record material unresolved points as limitations instead of guessing; an
  unchosen option is not a limitation or product exclusion.
- Keep screenshots, mockups, design systems, research, and sitemaps external.
  References may attach them with `role: intent` or `role: context`, but
  BusinessLens neither creates nor certifies them.
