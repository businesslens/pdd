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
- An Experience is who is there and what they can do — a coherent Actor
  context with one access mode inside exactly one Interface, the folder that
  holds it — never what it looks like. Whether an Interface is divided into
  Experiences is derived, never judged: it is divided when it serves more than
  one `access` value, or when its Actors split into groups no Capability
  available there bridges (a Capability bridges the Actors its Scenario Steps
  name). Otherwise it holds no Experiences and availability names the
  Interface directly. `lint` decides and reports a violation as an error;
  Experiences that are alternatives in a Variation, and an Experience whose
  name also exists under another Interface — a counterpart — justify
  themselves. `access` is the most open the context can be; a setting that
  closes it (content public only while guests are allowed) is a grant's
  `when`, never a second Experience holding the same Screens. A
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

The model records what an Actor can reach, see, supply, do and trigger at each
place. It never says how that looks or is built. One test decides every case:

> Rebuild a view with a different component library, layout, typography,
> colors, spacing, icons, motion and copy. Everything that would still have to
> be true is the model's: who can reach the view, what facts it shows, what
> abilities it offers, what conditions change that, and what happens next.
> Everything the redesign is free to change is design's, and the model says
> nothing about it.

Design lives in `visual` References with `role: intent`. Ordinary copy is
design; when exact wording is a product requirement, a Business Rule identifies
its authoritative Reference.

- **Screen facts.** A Screen's `entities` distinguish `shows` (what the Product
  discloses) from `collects` (what the Actor supplies). Each present list is
  non-empty and names Entity facts; a prefilled editable fact can be in both. A
  bare Entity id is only for an Entity without named facts. Read permissions
  apply only to `shows`.
- **Screen Capabilities are derived.** Never author Screen `capabilities`: they
  are the Capabilities of Steps placed exactly on that Screen, from both
  Scenario kinds. Parent and child Screens keep separate sets, and every Screen
  needs at least one.
- **Step facts.** On every `reads`, `changes` and `creates` entry, write
  `facts`: the exhaustive named Product facts read, changed or initialized,
  including product-defined defaults. `[]` means none, never unspecified.
  `removes` has no `facts`. Do not infer operation effects from form fields or
  list incidental implementation data.
- **Nesting.** A child Screen subdivides its parent's persistent selected
  subject or process: changing the parent context changes or ends the child.
  Tabs within one resource reading and wizard stages qualify. Choose the
  nearest qualifying context as the parent. A process stage needs its own Actor
  decision or input on the same draft or operation; a completion message, a
  generated credential reveal or a read-only result is an Outcome on the
  process Screen, not a child. A generic settings or category selector is
  neither a selected subject nor a process. Opening a destination from a view
  does not make that view its owner: a panel opened from several views sits
  once at their common Interface or Experience. URLs, co-visibility, modal
  versus page, and different drawings of the same information decide nothing.
  Treat ambiguous ownership as a question for the author.
- **Conditions.** An empty, unauthorized or blocked view is a `condition` Step,
  Edge case or Rule outcome in the Scenario that meets it, and its capture
  attaches to that Scenario. Confirmation stays behavior on its host;
  preserving the underlying view is an Outcome.
- **Movement and reach.** Steps say movement and entry points say arrival;
  `navigation` lists only Screens reachable from every place in its Interface
  or Experience.
- **Journeys and browsing.** A wizard is a Journey only when its Scenario
  crosses Capabilities. Ordinary filtering, sorting and searching are Scenarios
  of the browsing Capability unless the general Capability test establishes an
  independent purpose, permission, availability or outcome.
- **Languages.** `languages` belongs to the Product, optionally narrowed by an
  Interface. Content kept in several languages is an Entity fact, and how a
  language is chosen for someone is a kept fact such as *Preferred language*
  with the Steps that set it; neither is `languages` or a Variation.
- **One encoding per kind of difference.** A flag deciding whether someone may
  perform an Entity operation is a grant's `when` (*self-service cancellation
  on or off*). A setting, assignment or version choosing between complete,
  supported forms of a resource is a Variation of the smallest resource that
  contains the difference: *a checkout that skips address review for half of
  Shoppers* is an Experiment of two Scenarios of Checkout; *a store that keeps a
  VAT invoice or a sales tax receipt* is a Configuration of Entities, carried
  into the Scenarios that create each. A branch on state the behavior meets —
  out of stock, payment declined — is Scenario conditions and outcomes; a
  difference only in looks is design. A different address or header alone
  never makes a separate Interface.
- **What selects.** A Variation chooses by a fact that exists to choose — a
  setting, an experiment assignment, a version discriminator — or by the
  deployment, fixed before the behavior starts. A fact describing the thing
  the behavior acts on is state, read by a `condition` Step or decision point
  even when someone set it earlier: a page's own editor format is a condition
  of editing, while the site's sign-in method selects between sign-in
  Capabilities. A decision point is a choice made during one run; a setting
  deciding the form of the run before it starts — sign-in that starts at the
  provider automatically, registration that requires email confirmation —
  selects Scenario alternatives, while the unconfirmed account sign-in later
  meets is state. A resource that exists only under some alternatives
  (registration while the sign-in method is password) stays ordinary; a
  Business Rule without `permits` applying to it names the Variation.
- **Variations.** One `variations/<id>.md` per set, per the shared format
  reference: membership only in its `alternatives`; the mechanism,
  `takesEffect` and `stability` once on the set; `selectedWhen` (and a
  Version's `label`) per alternative. A set exists only when two or more
  resources of one type are all supported now and something selects between
  them; a threshold or other parameter stays content of one resource.
  Alternatives of a Scenario Variation share their Capability or Journey, and a
  Step is never an alternative. Link
  existing Entities and facts; never invent Entities, settings, allocations,
  defaults or timing. Omit an optional field the evidence does not establish,
  say so in a required one, and record the gap in Coverage.
- **Prohibitions.** A Rule can prohibit a fact nobody reads; it needs
  resolvable references, not an example of the prohibited behavior.
  Experiments and messages are ordinary Entities and behavior only when the
  Product manages them.

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
