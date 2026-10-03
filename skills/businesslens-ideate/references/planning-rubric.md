# Planning rubric

## Scope

- Plan one coherent intent a reviewer can approve or reject as a whole.
- Prefer the smallest product-complete change over a speculative epic.
- In a verification handoff, solve the exact gap; do not broaden the product.

## Resources

- An Actor is a role, not a resource type: an Entity that carries `kind:
  person|system` and `acts: external|internal`, relative to the Product
  boundary. Actors differ by Product goals, triggers, responsibilities, or
  privileges; two roles with the same goals and permissions are one Entity. A
  fixed, shipped set of roles is one Entity that acts per role, never one person
  Entity with a Role fact; roles created at runtime are one `Role` Entity with a
  lifecycle. Roles operators define in configuration, outside the product, are
  modeled the same way: one Role Entity (its name, permissions and members)
  granted through `configuredBy`, with no Capability that creates it. A
  configuration that also grants directly to people stays its own Entity, and
  the people who hold configured roles are one acting Entity. Each shipped role
  stays an Entity that acts even where configuration also defines roles or
  assigns people to them; one held per container, such as an organization or a
  project, is held through a membership Entity that does not act, whose Role
  fact names the role. A relation that holds whatever the role (the sender of a
  message) is declared to each role Entity, with one `related` grant per role.
  Facts that belong to the person whatever their role — email, display and
  notification preferences — live once on an Account Entity that does not act,
  and each role Entity relates to it one-to-one;
  they are never copied onto every role. A Step any role may take names the
  least privileged role the Product's default permissions allow, ignoring grants
  later made on a single resource.
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
  name, and roles sharing an Account are one group). Otherwise it holds no
  Experiences and availability names the Interface directly. `lint` decides and
  reports a violation as an error; Experiences that are alternatives in a
  Variation, and an Experience whose name also exists under another Interface —
  a counterpart — justify themselves. `access` is the most open the context can
  be; a setting that closes it (content public only while guests are allowed) is
  a grant's `when`, never a reason for an Experience of its own. A setting that
  opens it, such as anonymous access, is the same: access follows who is there.
  People not signed in, including anonymous visitors and wherever people sign
  in, are one public context; people signed in are one authenticated context,
  and the areas only some of their roles may enter, such as administration, one
  restricted context. Two Experiences of one Interface that share an `access`
  value and an Actor are a `lint` error. A
  page or command group alone is not an Experience.
- Screens are optional stable views an Actor reaches: places, decided under
  "Places, not designs" below, never components, layouts or visual variants.
- A Screen belongs to one Interface, Experience or parent Screen. The same view
  on web and on mobile is two Screens with the same name — counterparts, told
  apart by their path — each listing its own facts and Capabilities, so a
  divergence between them is visible instead of silent. Public routes and deep
  links may be entry points, but internal navigation identifiers do not belong.
- Create Domains from the Product's planned sections — its navigation, settings
  and administration areas — one per section holding two or more Capabilities
  (the finest navigation level that still holds two or more; a parent menu is a
  section only when none of its direct children is); a Capability no section
  reaches (signing in, or one only an emailed link
  or a schedule starts) joins the section whose Capabilities change the same
  Entities, or has no Domain when more than one section or none does; one alone
  on a page beside a sibling section has none either; a map never writes a
  Domain of one Capability; existing Domains are the
  author's and are never re-cut. Journeys may cross Domains.
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
  typed Actor/Product/condition Steps and named Context place routes. Every
  Capability needs at least one; cover primary,
  permission, validation, conflict, and external-failure behavior where the
  product distinguishes them.
- Journeys express stable user or operator goals whose achieved paths cross at
  least two distinct Capabilities. Plan one wherever the Product carries the
  Actor from one Capability into another toward one outcome — a redirect, a
  required next Step, an emailed link — and none for a sequence the Actor merely
  chooses. Returning the Actor to where they were already going after signing in
  is not a hand-off, and neither is a continuation the Product runs without the
  Actor, such as merging automatically once checks pass. Neither is a hand-off
  to a different Actor, such as an invitation another person follows: the Actor
  carried must be the same one. Do not create a Journey to house acceptance for
  one Capability.
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
  of the browsing Capability unless they differ by contract — the split test in
  the format reference: a permission (a separate grant of who may), availability
  or verb of their own; a Rule that only constrains one part does not split it.
  Parts that differ only in which grant applies, told apart by a fact of the
  thing they act on — a channel's privacy, whether a message is the Actor's own
  — are one Capability whose grants carry that condition in `when`. Settings in
  one section of the Product's navigation are one Capability however the screen
  saves them — each field on its own or one Save button — and settings in
  different sections are separate Capabilities: all notification settings are
  one. Settings are facts of one thing; entries of a list, such as permission
  entries or members, are things of their own, each added, changed and removed
  by its own Capability, even inside a settings section or through an API call
  that replaces the whole list. The same verb reached from another context is
  the same Capability, available there too: changing a password the Product
  requires at sign-in is Change password, joined to sign-in by a Journey. Ways
  of doing one verb that share all of those are Scenarios of one Capability, and
  the Steps of one run, including a link the run sends to finish it, are one
  Capability. A continuation several Capabilities share is its own: each ends
  its Scenarios at the hand-off, stated in their Outcome, and a Journey joins
  them.
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
  deployment, fixed before the behavior starts. A fact describing the thing the
  behavior acts on is state, read by a `condition` Step or decision point even
  when someone set it earlier: a page's own editor format is a condition of
  editing, while a sign-in method the deployment selects makes each method a
  Capability in a Variation; methods that coexist, the Actor choosing one at
  sign-in, are Scenarios of one Capability. A method a setting adds beside the
  others still coexists with them: it is a Scenario of that Capability, and a
  Business Rule without grants says it exists only while enabled. Scenarios vary
  only when what an Actor does differs and one choice decides it, even when
  several settings combine to make that choice: sign-in that starts at the only
  provider automatically drops the Actor's choice, so it selects Scenario
  alternatives. A choice the Actor makes on a page outside the product, such as
  picking a connector at an identity provider, is still an Actor Step. When two
  or more settings would each vary or split the same Scenario, whether they
  change the Actor's Steps or the outcome — a captcha and a provider password on
  one registration — none makes a Variation; each is a decision point. A branch
  that ends in a refusal is still its own Scenario with a `condition` Step, and
  still counts as its setting splitting the Scenario. A setting
  that changes only the Product's own Steps — group sync replacing or adding
  Roles — is a decision point in one Scenario, as is any choice made during a
  run; the one exception is a Step that must name a different alternative of
  another Variation, which varies with it. When such a setting changes the
  outcome — registration requiring email confirmation leaves the account
  inactive, an unknown social account is registered or refused — the branches
  are separate Scenarios, each with a `condition` Step reading the setting, not
  a Variation. If another setting also varies or splits that Scenario, each
  setting is a decision point instead. The unconfirmed account sign-in later
  meets is state. A setting that adds an emailed link to confirm what a run
  already did changes the outcome, never the Actor's Steps: confirming is a
  later act of its own. A resource that exists only under some alternatives or
  only while a setting enables it (registration while the sign-in method is
  password; social sign-in while a provider is configured) stays ordinary; a
  Business Rule without `permits` applying to it names the Variation or the
  setting.
- **Every context it is used from.** A Capability is available in every
  Experience in which one of its Actors uses it — guests reading pages in a
  public Experience and signed-in Users in an authenticated one — never only
  in the most open. Each Experience holds its own counterpart Screen unless
  every Experience shares it, and a Screen reached before and after signing
  in exists in each Experience that reaches it.
- **Variations.** One `variations/<id>.md` per set, per the shared format
  reference: membership only in its `alternatives`; the mechanism,
  `takesEffect` and `stability` once on the set; `selectedWhen` (and a
  Version's `label`) per alternative. A set exists only when two or more
  resources of one type are all supported now and something selects between
  them; a threshold or other value one statement reads stays content of that
  resource, but a setting that switches between two statements of one
  constraint, such as a minimum length or a length plus required kinds of
  character, selects Business Rule alternatives.
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
