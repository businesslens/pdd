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
  with one access mode —
  inside exactly one Interface, the folder that holds it; never what it looks
  like. Whether an Interface is divided into Experiences is derived, never
  judged: it is divided when it serves more than one `access` value, when its
  Actors split into groups no Capability available there bridges (a Capability
  bridges the Actors its Scenario Steps name ).
  Otherwise it holds no Experiences and availability names the Interface
  directly. `lint` decides and reports a violation as an error; exceptions are Experiences that are alternatives in a Variation and an Experience
  whose name also exists under another Interface — a counterpart. A
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

The model records what an Actor can reach, see, supply, do and trigger. Layout,
styling and ordinary copy remain external design References. When exact wording
is a product requirement, a Business Rule identifies its authoritative Reference;
verify that wording, or report it unverifiable when the source is unavailable.

- A Screen's `entities` distinguish `shows` (Product disclosure) from `collects`
  (Actor input). Each is a non-empty list of named Entity facts when present.
  A prefilled editable fact can occur in both. A bare Entity id is only for an
  Entity without named facts. Read permissions apply only to `shows`.
- Never author Screen `capabilities`: derive them from Capabilities exercised by
  Steps placed exactly there, including both Scenario kinds. Parent and child
  Screens have separate sets. A Screen needs at least one placed Capability.
- On every `reads`, `changes` and `creates` Entity entry, write `facts`: the
  exhaustive named Product facts read, changed or initialized, including
  product-defined defaults. `[]` means no named facts, never unspecified.
  Removal names the whole Entity and has no authored `facts`. Do not infer
  operation effects from form fields or include incidental implementation data.
- A child Screen subdivides its parent's persistent selected subject or process;
  changing that parent context also changes or ends the child. Tabs within a
  resource reading and wizard stages qualify. Opening a destination from a view
  alone does not establish ownership: a shared resource panel belongs once at
  the common Interface or Experience container of its launch sites. URLs,
  co-visibility and modal/page presentation do not decide ownership. Different
  drawings of the same information remain one Screen. Confirmation normally
  stays behavior on its host; preserving the underlying view is an Outcome.
  Treat ambiguous ownership as an authoring question, never claim that lint
  establishes semantic determinism.
Choose the nearest qualifying persistent context as the parent. A generic
settings/category selector is not itself a selected subject or an in-progress
process. A process stage requires its own Actor decision or input while retaining
the same draft or operation; a completion message, generated credential reveal
or read-only result alone is an Outcome on that process Screen, not a child.

- A wizard is a Journey only when its Scenario crosses Capabilities.
- Ordinary filtering, sorting and searching are browsing Scenarios. Split them
  when the general Capability test establishes an independent purpose,
  permission, availability or outcome; returning the same set is not decisive.
- A view condition belongs in Scenario conditions, Edge cases or Rule outcomes.
  Attach a condition's capture to its Scenario, not to a new Screen state key.
- `navigation` lists Screens reachable from every place in its Interface or
  Experience. Entry points describe arrival; Steps describe movement.
- Languages belong to the Product, optionally narrowed by Interface. There is no
  Experience `version` field. Independently supported contracts may be separate
  Interfaces; addresses and headers alone never decide. Supported alternatives of one
  resource type form one Variation file, `variations/<id>.md`, following the
  shared format reference: one `kind` (Experiment, Configuration or Version) and
  one `of` per set; membership only in its `alternatives`, never on the
  alternatives' own files; the mechanism, `takesEffect` and `stability` once on
  the set; `selectedWhen` (and a Version's `label`) per alternative. Create one
  only when two or more resources of one type are all supported now and something
  selects between them; a threshold or other parameter stays content of one
  resource. Link existing selection Entities and facts; never invent Entities,
  settings, allocations, defaults or timing. Check eligibility, selection,
  defaults and stability as relevant to the subtype. Selection prose is not
  executable; record what evidence does not establish as unresolved in Coverage. Ordinary
  outcomes stay Scenarios and visual-only differences stay References. Do not
  claim deterministic granularity from lint alone. A permission flag may
  be a grant's `when` on an Entity operation, never a Capability target.
- A Rule can prohibit a fact nobody reads. Require resolvable references, not an
  example of prohibited behavior. Experiments and messages can be ordinary
  Product Entities and behavior when the Product manages them.


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
