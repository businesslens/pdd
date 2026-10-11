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

It holds **what the product is** and leaves **how it's built** (architecture,
ADRs, visual design, components, API style, libraries) to the sources that
already own it. Rebuild the product on a different stack: whatever must still
be true belongs to the model.

## Example: a kanban board

The [Kanban Board](https://businesslens.io/blueprints/kanban-board) Blueprint is
the Product Model of a board where a small team plans its work and an **AI agent
proposes the next cards**. It has no code behind it, yet it answers which
capability creates a card, who may change one, and what the product does when
the agent tries to move a card itself.

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

**Dogfooded:** BusinessLens is developed with BusinessLens. Its own Product Model
lives in this repository's [`.businesslens/` folder](./.businesslens/); open it
with `npx businesslens view businesslens/pdd`.

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

## <img src="./.github/readme/square-terminal.svg" alt="" width="28" height="28" align="top"> CLI

`install`, `update`, `lint`, `view` and the `blueprint` commands. Every command
and option: [CLI reference](https://businesslens.io/docs/cli), or
`npx businesslens --help`.

## Questions people ask first

- **[We already have docs and AGENTS.md. Why another source?](docs/faq.md#we-already-have-documentation-why-do-we-need-a-product-model)**
  It makes them leaner: docs teach, architecture records how, code implements,
  and none has to double as the spec. If something isn't in the model, nobody
  decided it.
- **[Why a structured format instead of free-form docs?](docs/faq.md#why-a-structured-format-instead-of-free-form-documentation)**
  It fixes where the product ends, so agents know where each decision lives and
  every role reviews the same definition.
- **[Does it change how we implement, or lock us in?](docs/faq.md#doesnt-this-lock-me-into-a-new-development-lifecycle)**
  No. Keep your agent and workflow; contributors without agents work as today.
  Delete `.businesslens/` and your repository is exactly as it was.
- **[Doesn't it add work to every pull request?](docs/faq.md#doesnt-keeping-the-model-current-add-work-to-every-pr)**
  Each fact gets one home instead of several that drift, and the model can
  catch up after a change lands.
- **[How is it different from SDD, a PRD, an ERD or a design spec?](docs/faq.md#what-it-is)**
  SDD describes each change, a PRD helps decide, an ERD shapes storage, design
  shapes the look. The model holds the resulting product and is checked against
  the code.
- **[How do reviewers see a model change?](docs/faq.md#how-do-reviewers-see-a-model-change)**
  As a Git diff today, with a visual diff in the report coming
  ([#19](https://github.com/businesslens/pdd/issues/19)).
  `npx businesslens view <owner>/<repo> --pr <n>` opens any pull request's
  model without cloning.
- **[Does it work across several repositories?](docs/faq.md#my-product-spans-multiple-repositories--is-that-supported)**
  Not yet: one repository per model
  ([#17](https://github.com/businesslens/pdd/issues/17)).
- **[What does it cost, and does my code leave my machine?](docs/faq.md#does-my-code-leave-my-machine)**
  Nothing, and no. It is MIT-licensed with no account; the CLI never uploads
  your code, and the skills run inside the agent you chose.

More in the [FAQ](docs/faq.md).

## License

BusinessLens is released under the **MIT License**: do anything, just give
credit. See [LICENSE](./LICENSE).
