<p align="center">
  <a href="https://businesslens.io">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="./layers/nuxt/theme/public/brand/logo/mark-dark.svg">
      <img src="./layers/nuxt/theme/public/brand/logo/mark.svg" alt="BusinessLens logo" width="64">
    </picture>
  </a>
</p>

<h1 align="center"><a href="https://businesslens.io">BusinessLens</a></h1>
<p align="center"><strong>Product-Driven Development for coding agents (OSS)</strong></p>
<p align="center">Your AI agent is guessing what the product is. PDD gives agents and humans a shared product model that is git-tracked, reviewable, and verifiable.</p>

<p align="center">
  <a href="https://www.npmjs.com/package/businesslens"><img src="https://img.shields.io/npm/v/businesslens" alt="npm version"></a>
  <a href="https://github.com/businesslens/pdd/actions/workflows/check.yml"><img src="https://github.com/businesslens/pdd/actions/workflows/check.yml/badge.svg" alt="Check"></a>
  <a href="./LICENSE"><img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT license"></a>
</p>

<p align="center">
<code>npx businesslens install</code>
</p>

<p align="center">
<a href="#map-existing-repo-recommended"><strong>Map your own repo today!</strong></a>
</p>

## The problem

Where is your **product model** today? Scattered across tickets, design docs,
the wiki, chats, source code, tests and people: shared by none, checked by
nothing. So your **AI agent guesses** what the product is
([AI is writing code for products it doesn't understand](https://businesslens.io/blog/your-agent-is-guessing)).

**Product-Driven Development (PDD)** keeps the **product in one place**, apart
from how it's built: a shared product model for agents and humans that is
**git-tracked, reviewable and verifiable**
([Introducing BusinessLens](https://businesslens.io/blog/introducing-businesslens)).

## The Product Model

`.businesslens/`, a [Product Model](https://businesslens.io/docs/product-model):
one definition of what the product does, as plain Markdown next to the code. It
is made of:

- **[Entities](https://businesslens.io/docs/entities):** what the product keeps, and who acts on it (Order, Customer, Payment provider).
- **[Interfaces](https://businesslens.io/docs/interfaces):** how people and systems reach the product (Web app, Mobile app, Partner API).
- **[Domains](https://businesslens.io/docs/domains):** the subject areas the product is split into (Ordering, Catalog, Billing).
- **[Capabilities](https://businesslens.io/docs/capabilities):** what the product lets someone do (Check out, Cancel order, Refund).
- **[Journeys](https://businesslens.io/docs/journeys):** one goal, carried across several capabilities (Browse and buy, Sign up, Reorder).
- **[Business rules](https://businesslens.io/docs/business-rules):** what must always hold, and who may do what (Max 3 per order, Only managers refund, Total includes tax).
- **[Variations](https://businesslens.io/docs/variations):** where the product works in more than one way (Feature flag, Plan tier, A/B test).

## What it holds, and what it leaves out

The model holds **what the product is**: what it keeps, who may do what, where,
and what happens next. It leaves **how it's built** to the sources that already
own it: architecture, ADRs, visual design, components, API style and libraries.
Rebuild the product on a different stack: whatever must still be true belongs to
the model.

It is one more source, but it makes the others leaner. Docs teach, architecture
records how, code implements, and none of them has to double as the spec. And
if something isn't in the model, nobody decided it.

## Why a Product Model in the AI era

Agents write code faster than anyone can explain to them what the product is.
They fill the gaps by guessing, and the guesses ship.

1. **One definition.** Not scattered across tickets, docs, chats and people, but one model beside the code.
2. **Agents know what to build.** They read the Journeys, Scenarios and Rules instead of guessing.
3. **Done means it matches the product.** Verify checks the code against the approved model.
4. **Drift is easy to spot.** The model stays a clear reference as behavior changes.
5. **Decisions travel with the code.** Model and code changes are reviewed in one pull request.

## What it isn't

- **Not SDD.** Spec-driven tools such as OpenSpec, spec-kit and Kiro describe
  each change; PDD describes the product. Use both
  ([how they fit together](https://businesslens.io/blog/pdd-and-spec-driven-development)).
- **Not a PRD.** A PRD helps decide; the model keeps the resulting decisions
  and is checked against the code.
- **Not an ERD.** It stays at the conceptual level and adds lifecycles and who
  may act. No keys or types.
- **Not a design spec.** Whatever survives a redesign is the model's; the rest
  belongs to design.
- **Not AI-generated docs.** It draws the product boundary, and you approve
  every change.

## Example: the Product Model of a kanban board

To show what a Product Model answers, here is one for a **kanban board**: a
conceptual product where a small team plans its work on shared boards of
columns and cards, and an **AI agent proposes the next cards**. It is the
[Kanban Board](https://businesslens.io/blueprints/kanban-board) Blueprint, a
model with no code behind it. Every answer below is read from the model.

<p align="center">
  <img src="./.github/readme/report/overview.jpg" alt="The Kanban Board Blueprint open in the BusinessLens report: the Product Overview with its description, intent and product details" width="800">
</p>

<p align="center">
<a href="https://businesslens.io/blueprints/kanban-board"><strong>View the Kanban Board Product Model live</strong></a>
</p>

Or open it on your machine:

```bash
npx businesslens blueprint pull kanban-board
npx businesslens view
```

### 1. Entities, and which capabilities change them

All 9 entities in the kanban model: what the product keeps, and who acts on it.

<img src="./.github/readme/report/1a-entities.jpg" alt="Entities list: the start of the kanban model's 9 entities, grouped by domain" width="800">

Which capabilities create, change or remove each entity, filtered to the four
capabilities around a proposed card:

- **Card proposals** creates a proposed card, never a card.
- **Proposed card acceptance** is what turns it into a card on the board.
- **Proposed card dismissal** changes the proposal and leaves the board alone.

<img src="./.github/readme/report/1b-what-changes-what.jpg" alt="Changes, filtered to four capabilities: Card and Proposed card against Card proposals, Proposed card acceptance, Proposed card dismissal and Card creation" width="800">

### 2. Capabilities, and which interfaces offer them

All 23 capabilities in the kanban model: what the product lets someone do.

<img src="./.github/readme/report/2a-capabilities.jpg" alt="Capabilities list: the start of the kanban model's 23 capabilities, grouped by domain" width="800">

Which interfaces offer each capability, filtered to six card capabilities:

- **The agent connection** offers one capability: proposing cards.
- **Every change to a card** happens in the board web application, by a member.

<img src="./.github/readme/report/2b-compare-delivery.jpg" alt="Delivery, filtered to six card capabilities: which of them the Agent connection and the Board web application offer" width="800">

### 3. Business rules, and where they apply

All 32 business rules in the kanban model: what must always hold, and who may
do what.

<img src="./.github/readme/report/3a-business-rules.jpg" alt="Business rules list: the start of the kanban model's 32 business rules, grouped by domain" width="800">

Where each business rule is attached, filtered to the five attached to the
Proposed card entity:

- **Creating one:** only an AI agent a member connected proposes cards.
- **Deciding on one:** only the board's members accept or dismiss it.
- **Deleting one:** it goes only with its board.

<img src="./.github/readme/report/3b-rule-attachments.jpg" alt="Attachments, filtered to the Proposed card entity: five business rules, as creates, changes, reads, removes and attached" width="600">

### 4. An entity: what it keeps, and how its state changes

The Proposed card entity, one of the 9, and the information kept about it:

- **Four pieces of information:** its title, description, reason and suggested
  column.

<img src="./.github/readme/report/4a-proposed-card.jpg" alt="Proposed card overview: its description and the four pieces of information it keeps" width="800">

How it moves through its states, and the capability behind every move:

- **Three states:** Proposed, then Accepted or Dismissed. Created and Removed
  mark where its life begins and ends.
- **Removing it** on its own is forbidden from every state; deleting its board
  removes it.

<img src="./.github/readme/report/4b-lifecycle.jpg" alt="Proposed card lifecycle: Card proposals creates it in Proposed; members accept or dismiss it. Removing it on its own is forbidden; deleting its board removes it" width="800">

### 5. A capability's scenarios, and one step by step

The 4 scenarios of the Card proposals capability:

- **Four scenarios:** proposing cards for a goal, proposing a next step for a
  stalled card, and two refusals.

<img src="./.github/readme/report/5a-scenarios.jpg" alt="Card proposals scenarios: the four scenarios with their triggers and outcomes" width="800">

One of them, opened step by step:

- **Refuse a direct change from the AI agent:** the agent tries to move a card
  itself, and the product refuses. Every step says who acts, what is read,
  where, and which business rules govern it.
- **Its edge case:** editing, deleting or creating a card, or accepting its own
  proposal, is refused the same way.

<img src="./.github/readme/report/5b-scenario.jpg" alt="The Refuse a direct change from the AI agent scenario: three steps, each with who acts, entity effects, where and the governing business rules, and its edge case" width="800">

---

## <img src="./.github/readme/rocket.svg" alt="" width="28" height="28" align="top"> Get started

```bash
npx businesslens install
```

This adds the skills to Claude Code, Codex, Cursor, Gemini CLI and GitHub
Copilot. Then start from where you are, inside your agent (Codex uses `$`
instead of `/`):

### Map existing repo (recommended)

Have code? Run the map skill:

```text
/businesslens-map
```

It reads the code without running it, asks what the code can't answer, and
writes `.businesslens/` once you approve. Then open the report:

```bash
npx businesslens view
```

[From your repo](https://businesslens.io/docs/from-your-repo)

### Start from an idea

No code yet? Describe the product you want:

```text
/businesslens-ideate I want to build a booking app for dog walkers
```

You pick from a few product shapes, then approve the model.
[From an idea](https://businesslens.io/docs/from-an-idea)

### Start from a Blueprint

A familiar kind of product? Pull a reviewed model:

```bash
npx businesslens blueprint pull <name>
```

[Browse the catalog](https://businesslens.io/blueprints) ·
[From a Blueprint](https://businesslens.io/docs/from-a-blueprint)

## The development loop

<p align="center">
  <img src="./.github/readme/development-loop.svg" alt="The development loop: ideate with /businesslens-ideate, implement in phases with your own agent, verify each part with /businesslens-verify" width="600">
</p>

- **Ideate** (`/businesslens-ideate`): the agent records the change in the model
  first, and nothing is written until you approve it.
- **Implement:** your agent builds it your way, in phases, with plan mode, an
  SDD tool, or freestyle.
- **Verify** (`/businesslens-verify`): the agent checks the code against the
  model and fixes either one until they agree.

## What changes for your team

- **How you implement doesn't.** Keep your agent and your way of working: plan
  mode, an SDD tool or freestyle.
- **Contributors without agents work as today.** Updating the model is the same
  kind of work as updating docs or tests when behavior changes.
- **It doesn't have to block a pull request.** Updating the model before new
  work is best practice, but it can catch up after a change lands.
- **No lock-in.** Delete `.businesslens/` and your repository is exactly as it
  was.

## Who it helps

One shared definition of what the product does helps everyone who works on it:

- **Coding agents** read the scenarios and business rules before they change
  anything. The map, ideate and verify skills run in Claude Code, Codex,
  Cursor, Gemini CLI and GitHub Copilot.
- **Maintainers and reviewers** see a behavior change as a change to the model:
  plain `.md` files, reviewed in the same pull request as the code and checked
  by `businesslens lint`.
- **New contributors** learn what the product does, who may do what and where,
  in a local report (`businesslens view`) instead of reading the whole codebase.
- **Product managers and docs writers** find product answers in one place,
  with optional references to the code and material behind them.
- **Teams starting something new** pull a reviewed Blueprint instead of facing
  a blank page.

Free and MIT-licensed, with no account and no hosted service. The CLI never
uploads your code, and the skills read it without running it, inside the agent
you already use.

**Dogfooded:** BusinessLens is developed with BusinessLens. Its own Product Model
lives in this repository's [`.businesslens/` folder](./.businesslens/); open it
with `npx businesslens view businesslens/pdd`.

## Scope today

- One repository per model ([multi-repo: #17](https://github.com/businesslens/pdd/issues/17)).
- Model changes are reviewed as Git diffs; a visual diff in the report is coming
  ([#19](https://github.com/businesslens/pdd/issues/19)).
- The report runs locally, and `npx businesslens view <owner>/<repo> --pr <n>`
  opens any pull request's model without cloning.
- The format is early and changes in the open.

## <img src="./.github/readme/square-terminal.svg" alt="" width="28" height="28" align="top"> CLI

`install`, `update`, `lint`, `view` and the `blueprint` commands. Every command
and option: [CLI reference](https://businesslens.io/docs/cli), or
`npx businesslens --help`.

## FAQ

The [FAQ](docs/faq.md) answers what people ask before adopting it:

- **[Why a Product Model](docs/faq.md#why-a-product-model):** your docs,
  AGENTS.md, and why a structured format.
- **[Adopting it](docs/faq.md#adopting-it):** your workflow, the work per pull
  request, and how reviewers see a change.
- **[What it is and isn't](docs/faq.md#what-it-is):** against SDD, AI-generated
  docs, PRDs, user stories, ERDs and design.
- **[Getting started](docs/faq.md#getting-started):** where to start, what lands
  in your repository, and the projects supported today.
- **[Trust and help](docs/faq.md#trust-and-help):** cost, what leaves your
  machine, and where to get help.

## License

BusinessLens is released under the **MIT License**: do anything, just give
credit. See [LICENSE](./LICENSE).
