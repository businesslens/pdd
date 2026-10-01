# Verification rubric

## Trace behavior

- Compare the model's observable contract, not matching vocabulary.
- Trace each Capability Scenario route through every typed Step and
  most-specific Context place to its observable outcome.
- Trace every Journey Scenario route from its first Actor-owned Context place
  through each Capability-bearing Step to the terminal goal result. Verify
  every Context place independently and confirm the correlations are supported.
- Confirm every Actor Step is supported at its Context places and every derived
  availability place supports at least one Scenario Actor.
- Verify Interface Contexts independently. Shared services do not prove web,
  mobile, CLI, or supported API parity.
- Distinguish a missing Interface implementation from a missing shared
  Capability. Undeclared internal APIs remain implementation details.
- Tests corroborate source; they do not replace inspecting implementation.
- Partial implementation is a gap, not alignment.
- For Screens, compare places against the view's code: for each Entity listed,
  the facts disclosed match shows and inputs match collects (a bare
  id claims only presence, and is a finding when the Entity has named
  facts); each derived Capability is one a Step placed on that
  Screen uses; each child Screen subdivides its parent’s persistent working context; each
  `navigation` Screen is reachable from every place in its container. Do not
  require component, layout, theme, ordinary copy, viewport, or screenshot similarity:
  the model claims none of it, and a finding about looks is not a finding.
- For Steps, confirm each `facts` list exhaustively names what the code reads, changes
  or initializes at that place, and that an `actor` Step's `reads` sits on a Screen presenting
  the Entity (Product and condition Steps, and fact-free mentions of an Actor, are exempt).
- For a fact-scoped Rule, confirm the code at every Screen presenting the fact
  and every Step citing it — never Entity presence alone.
- For `languages`, confirm the Product's list against the locales the code
  serves and each Interface's list against what that surface loads.
- Do not claim deployed configuration, external systems, or live data state from
  source code.
- External visuals and research are context; their existence is never proof.
  Inspect an authoritative text Reference when a Rule requires exact wording;
  if it cannot be accessed, report that requirement as unverifiable.

## The border

The model records what an Actor can reach, see, supply, do and trigger at each
place. It never says how that looks or is built. The redesign test decides
which side a difference falls on:

> Rebuild a view with a different component library, layout, typography,
> colors, spacing, icons, motion and copy. Everything that would still have to
> be true is the model's: who can reach the view, what facts it shows, what
> abilities it offers, what conditions change that, and what happens next.
> Everything the redesign is free to change is design's, and the model says
> nothing about it.

A difference the redesign is free to make is never a finding. Ordinary copy is
design; compare exact wording only when a Business Rule requires its
authoritative Reference, and report it unverifiable when that source is
unavailable. The rest of the border classifies what you find:

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
  one. The same verb reached from another context is the same Capability,
  available there too: changing a password the Product requires at sign-in is
  Change password, joined to sign-in by a Journey. Ways of doing one verb that
  share all of those are Scenarios of one Capability, and the Steps of one run,
  including a link the run sends to finish it, are one Capability. A
  continuation several Capabilities share is its own: each ends its Scenarios at
  the hand-off, stated in their Outcome, and a Journey joins them.
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
  one registration — none makes a Variation; each is a decision point. A setting
  that changes only the Product's own Steps — group sync replacing or adding
  Roles — is a decision point in one Scenario, as is any choice made during a
  run; the one exception is a Step that must name a different alternative of
  another Variation, which varies with it. When such a setting changes the
  outcome — registration requiring email confirmation leaves the account
  inactive, an unknown social account is registered or refused — the branches
  are separate Scenarios, each with a `condition` Step reading the setting, not
  a Variation. If another setting also varies or splits that Scenario, each
  setting is a decision point instead. The unconfirmed account sign-in later
  meets is state. A resource that exists only under some alternatives or only
  while a setting enables it (registration while the sign-in method is password;
  social sign-in while a provider is configured) stays ordinary; a Business Rule
  without `permits` applying to it names the Variation or the setting.
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

## Separate scope from authority

Git diffs identify likely changed surfaces. They never establish a plan, choose
truth, or prove that an unchanged file is irrelevant. Include unchanged
dependencies when they determine scoped behavior.

When authority is not already explicit, present:

1. what the model says;
2. what code currently does;
3. exact inspected files;
4. the smallest meaningful choices;
5. a recommendation and why;
6. downstream findings the answer resolves.

Group questions by root decision. Do not ask a menu of symptoms.

Discuss the choices only while authority remains open. After resolution, report
the resulting decision without replaying settled alternatives on later runs.

## Internal intent resolution

Both internal authoring flows write current product meaning under the format's
persistence rule. Keep rejected approaches and selection history in the
conversation, including when drafting resource prose, supporting sections,
limitations, or README. Preserve current constraints and material unresolved
questions or missing evidence; an unchosen option is not a product exclusion.

Use when code-right or neither-right is chosen. Draft the smallest exact Product
Model delta. Cover affected Interfaces, optional Experiences, Capabilities,
  availability Contexts, Rules, Capability Scenarios, Journeys, Journey Scenarios,
  relationships, and removals. Get approval before writing. Skip broad
  brainstorming because the verification finding already supplies the problem.

## Internal scoped mapping

Use only for established behavior in an absent or deliberately untrusted model
area. Inspect it like adoption mapping, draft honest coverage and necessary
relationships, and get approval before writing. Do not silently remap trusted
areas.

Apply the border above to scoped mapping as well as verification, with the
format reference's Screen and Step fact rules.

## Stop safely

- Builder unavailable: return a complete handoff packet.
- Same build-directed gap unchanged after one attempt: stop the loop.
- Source cannot establish runtime/external behavior: report unverifiable.
- Product authority remains undecided: wait for that decision.
- Structural blocker prevents model comparison: report the lint finding first.
