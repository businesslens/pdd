---
title: FAQ
description: Where to start from an existing repo, an idea, or a Blueprint — and what Product-Driven Development costs, sends, and replaces.
---

# FAQ

<a name="why-a-product-model"></a>

## Why a Product Model

How the model relates to the documentation, agent instructions, and knowledge you already have.

### I already have documentation. Why do I need a Product Model?

With the model as the foundation, each source focuses on what it is good at.

*What each source of information focuses on when the Product Model holds the product definition*

| Information source | Goal |
| --- | --- |
| **Product Model** | Defines what the product is |
| User-facing documentation | Teaches people to use the product |
| Internal documentation | Records architecture, design decisions, and onboarding |
| Design and architecture | Describes how it should look and work |
| Code and tests | Implements and verifies how it is built |
| Tickets, chats, and people | Carry context, requests, and undocumented knowledge |

Your product definition is scattered across multiple information sources, and **some of it might not
appear anywhere at all**. Each source holds a piece, none holds all of it, and they drift from each
other. The Product Model brings order: **a structured, single definition of what the product is**,
readable and maintainable by both humans and coding agents.

Yes, it is a new source. But it makes every other source **leaner and focused on its own concern**.
The model becomes the core: documentation can teach users and include the product knowledge they
need, without doubling as a spec for contributors. Architecture files can describe how the system is
built. Design files can shape how it looks. Code can implement. Each source draws from the model
what its audience needs, and carries material that is not product definition at all (setup guides,
style systems, deployment configuration, onboarding). It also **makes uncovered aspects visible**:
if something is not in the model, nobody decided it.

### I already have AGENTS.md and docs. Isn't that enough?

It can, and they help. But user docs hold the user subset, and even internal docs are free-form:
each written its own way, with no common structure, **mixing product decisions with design and
implementation**. The rest stays in the code, or worse, **is not defined anywhere at all**. Every
agent reconstructs it from scratch, differently each time, **with nobody reviewing what it
concluded**.

The model is a structured way to define a product: a fixed set of resource types (entities,
interfaces, capabilities, scenarios, business rules, variations) and how they connect. Technical
aspects (architecture, design docs, ADRs) stay out of it, so you keep maintaining those however you
like. [Read why your agent is guessing](https://pdd-kit.dev/blog/your-agent-is-guessing).

### Why a structured format instead of free-form documentation?

The format is the point. I have spent the recent months building this, drawing on years of product
and engineering experience to pin down **where the boundary between product and non-product falls**:
what belongs in the model (entities, interfaces, capabilities, scenarios, business rules,
variations) and what stays out (architecture, layout, API style, libraries). That boundary is what
makes the model useful.

A well-defined format means agents achieve greater accuracy because they know exactly where to find
each decision and how the pieces connect. It means humans can review the entire product in a rich,
visual report using the [view command](./cli-view.md) instead of piecing it together from scattered
sources. And it means you and your agent finally **see the same definition and evolve it together**,
in the most structured way you have ever had.

The format is still in its early phases. It will evolve as adoption grows and feedback comes in, and
it is open source precisely so that evolution is shared.

<a name="adopting-it"></a>

## Adopting it

What changes in your workflow and your reviews — and what does not.

### Why add yet another tool to my stack?

PDD is not a standard tool you add to your workflow. It is a format, and the tooling around it just
helps maintain it. The product definition **already exists**, scattered across docs, code, tickets,
and people. PDD gives it a structured home so the rest of your tools can do their jobs better.

Contributors who do not use agents work exactly as they do today. **Updating the model is the same
kind of work** as updating docs or tests when behavior changes, not a new kind. You control when in
your existing development loop the model gets updated and by whom, although the recommendation is to
update the model before initiating new work as a best practice.

### Doesn't this lock me into a new development lifecycle?

No. **PDD does not touch how you implement**. You keep your current workflow, your coding agent,
your planning tools. What PDD adds is a structured format for the product definition you already
have, informally scattered across docs, code, tickets, and people. You are not adopting a new
paradigm; you are giving a home to decisions that today live nowhere in particular.

### Doesn't keeping the model current add work to every PR?

The split makes maintenance easier, not harder. Today a behavior change can touch the code, the user
docs and any internal docs, each holding part of it in its own way, so they drift and nobody knows
which one is right. With the model, **each fact has one home**: the agent updates the model along
with the code, and the user docs take the part users need from it, adding only what is truly
user-facing (installation, setup, examples). **It does not have to block a PR either**: the model
can catch up after changes land.

### How do reviewers see a model change?

Currently a model change can only be reviewed as a Git diff. That is a gap being closed: every
change to the model will be visualized in a diff mode in the report. In the flow we envision, that
change is reviewed and approved first, before implementation even starts. [Follow the diff
visualization issue](https://github.com/itai-gendler/pdd-kit/issues/19).

### Can I share the report without running it locally?

The report runs on your machine, not on a hosted page. Anyone can open the model of any PR with one
command, without cloning:

```sh
npx pdd-toolkit view <owner>/<repo> --pr <n>
```

Share that command alongside the pull request.

<a name="what-it-is"></a>

## What it is and isn't

How the Product Model relates to SDD frameworks, AI-generated docs, PRDs, user stories, ERDs, and design.

### How is this different from SDD?

They work at different altitudes and are meant to coexist. **PDD defines the product, not the
change**. Spec-driven frameworks like OpenSpec and spec-kit own the change level: how one piece of
work is designed, built, and split into tasks. PDD lets you choose whatever tool you want for
implementation. It does not touch that phase. [Read how PDD and SDD fit
together](https://pdd-kit.dev/blog/pdd-and-spec-driven-development).

### How is this different from DeepWiki or AI-generated docs?

Tools like DeepWiki are useful for exploration, but they mix product rules, architecture,
implementation details, and configuration together without drawing a boundary. **A Product Model
draws that boundary explicitly**: it holds what the product is, and leaves everything else (user
docs, internal docs, design, architecture, code) to the sources that already own it.

### Isn't this just a fancy PRD?

No. A PRD and a Product Model are different artifacts with different jobs.

*PRD and Product Model comparison*

|  | PRD | Product Model |
| --- | --- | --- |
| Primary job | Help a team decide and communicate what product or change to pursue | Keep approved product intent and the implementation aligned over time |
| Contains | Research, alternatives, assumptions, scope, metrics, rollout plans, and proposed requirements | The resulting durable product decisions |
| Structure | Flexible and chosen for the document | A defined, repeatable structure of resource types and relationships |
| Scope | May cover a feature, initiative, or entire product | Connects the modeled product scope in one coherent definition |
| Lifetime | Often follows a decision or initiative and may later become historical | Evolves with the product and remains versioned alongside the implementation |
| Audience | Primarily supports human discussion and approval | Designed to be read by both people and coding agents |
| Relationship to code | Informs implementation but is not normally checked against it | Can be linted, built from, and verified against the implementation |
| Role in PDD | Optional decision record and supporting evidence | Required source of truth and build-and-verification contract |

A PRD can inform the Product Model, but it does not replace it. Attach it as a PRD Reference with
the intent role when it shaped approved meaning, or the context role when it preserves supporting
history. The Product Model remains the self-contained statement of what the product has been
approved to do. [See how references work](https://pdd-kit.dev/docs/references).

### Why doesn't the product model have a user story resource type?

A user story can describe one ability, one acceptance case, or an entire multi-ability goal,
depending on how a backlog is sized. It therefore has no single Product Model equivalent.

pdd-kit maps its lasting meaning instead: the Entity that acts, a Capability and its Capability
Scenarios for one ability, or a Journey and its Journey Scenarios for a broader goal. The original
Jira story can remain linked as a context Reference. [Link external work with
references](https://pdd-kit.dev/docs/references).

### Isn't the Product Model just an ERD?

No. They describe different things, and only the top layer overlaps.

*ERD and Product Model comparison*

|  | ERD | Product Model |
| --- | --- | --- |
| Question it answers | How is the data shaped and stored | What does the product keep, and what changes it |
| Contains | Entities, attributes, keys, cardinality, types, indexes, and join tables | Things a user can point at, what the product keeps about them, and how they relate |
| Lifecycle | None — an ERD does not describe a thing changing | States, with transitions composed from the Scenario Steps that create, change, or remove a thing |
| Link to behavior | None | Steps declare what they do to Entities, and Screens the facts they show and collect |
| What it excludes | Nothing about storage — that is its subject | Types, keys, indexes, and join tables; a thing no user can name is a table, not an Entity |
| Role in PDD | Optional implementation Reference alongside the model | The product-level source of truth the implementation is verified against |

Only its top layer, and deliberately. An ERD is usually drawn at three levels: conceptual entities
and their relationships, then logical attributes and keys, then physical tables and types. The
Product Model works at the conceptual level and stops there. It also carries three things no ERD
has: a lifecycle for each thing, composed from every Scenario Step that creates, changes, or removes
it; edges into behavior, because a Step declares what it does to a thing and a Screen declares which
facts it shows and which it collects; and who may act, because a Business Rule says who may perform
an operation on a thing.

Neither replaces the other. An ERD answers how the data is shaped; the Product Model answers what
the product keeps and what changes it. An engineer designing storage still needs types, keys, and
indexes, and none of them belong in the model. Attach the schema as a Reference with the
implementation role instead — realization, never meaning. [Read how Entities carry product
meaning](./entities.md).

### Is the Product Model a design spec?

No, and deliberately not. A design system answers how the product looks and is built; the model
answers what an Actor can reach, see, do and trigger at each place: the facts a Screen shows or
collects, the abilities it offers, who may act, and what happens next.

One test decides every case: rebuild a view with a different component library, layout, colors and
copy. Whatever would still have to be true is the model's; whatever the redesign is free to change
is design's. Design files attach to the place they shape as References. [Read where the model stops
and design begins](./interfaces.md#is-this-a-design-spec).

### Does the Product Model replace my UI/UX design?

No. It holds the experience your design has to serve, never the design itself.

| In the model | Left to design |
| --- | --- |
| Who can reach each place | Colors, typography, copy |
| What it shows and asks for | Components, layout, modals |
| What can be done there | Tabs, wizards and menus |
| Which rules apply | CLI syntax and flags |
| What happens next | API style: CRUD or RPC |

To tell which side something falls on, imagine rebuilding the product from scratch: a web app on a
different component library, a CLI with a different command style, an API in RPC instead of CRUD.
Whatever would still have to be true after the rebuild is the model's; whatever the rebuild is free
to change is design. Design files, help text and API descriptions attach to the place they shape as
References. [Read where the model stops](./interfaces.md#is-this-a-design-spec).

<a name="getting-started"></a>

## Getting started

Three ways in, what each one leaves in your repository, and the projects supported today.

### I already have a codebase — where do I start?

Install the skills and run /pdd-map. It reads the code without running it, asks what the
code can’t settle, and writes product-model/ only after you approve. npx pdd-toolkit view then
opens it as a report.

Nothing is rewritten and no framework is imposed; the model is added beside the code. [Walk through
mapping an existing product](./from-your-repo.md).

### I have an idea but nothing built yet.

Start by deciding what the product is. Ideation proposes distinct product shapes — who each one
serves, the single job it does, and what it deliberately is not — and writes nothing until you pick
one. The same conversation turns your approved choice into the model your coding agent implements.

That order matters: an agent given a one-line idea invents the missing product decisions silently.
[Walk through starting from an idea](./from-an-idea.md).

### I want to start from something proven.

Pull a Blueprint. It expands into an empty directory as a complete Product Model you can hand
straight to a coding agent, and you choose the stack. A Blueprint carries the product definition,
not an implementation.

Every Blueprint has cleared the same bar: given the pulled model and the words “build this” and
nothing else, an agent ships a working product. [Browse the
Blueprints](https://pdd-kit.dev/blueprints).

### What actually lands in my repository?

A product-model/ directory of Markdown files — the Product and its Entities, the people and systems
that act on it among them, Interfaces, optional Experiences, Screens and Domains, Capabilities with
local Scenarios, optional Journeys with end-to-end Scenarios, Business Rules, and Variations where
one product choice has several supported answers. Plain text, reviewable in a pull request,
versioned with the code it describes.

No database, no service, and no lock-in: delete the directory and your repository is exactly as it
was. [Read about the Product Model](./product-model.md).

### When do I use map, and when do I use verify?

Map is for adoption, a deliberately untrusted area, or expanding model coverage. It is not a daily
command. Verify is for normal product changes, refactors, suspected drift, pre-release checks, and
full or named current-state audits.

You rarely name either. Ask your agent to implement a change and PDD will run it in phases: your
agent implements each phase, and verify checks it before the next. Ask whether the code still
matches the model whenever you want to be sure, for example before a release. [Read the verification
loop](./skill-pdd-verify.md).

### Is this meant for open-source projects or also closed-source commercial ones?

Both. **Open-source projects are natural candidates** because most of their information sources are
already in the repository, and they usually live in a single repo.

Closed-source commercial projects benefit just as much, as long as the project is in a single
repository. Multi-repository support is planned. [Follow the multi-repository support
issue](https://github.com/itai-gendler/pdd-kit/issues/17).

### My product spans multiple repositories — is that supported?

Not yet. pdd-kit currently works with one repository at a time. [Follow the multi-repository
support issue](https://github.com/itai-gendler/pdd-kit/issues/17) for the design and implementation
progress.

<a name="trust-and-help"></a>

## Trust and help

What it costs, what leaves your machine, and where to get help.

### What does it cost?

Nothing. pdd-kit is an open-source project: the format, the CLI, the skills, and the Blueprints
are all MIT licensed, and everything runs in your own repository and coding-agent harness.

### Does my code leave my machine?

The pdd-kit CLI does not upload your code or Product Model. Linting, export, and expanding a
pulled model run locally. The map, ideate, and verify skills run inside the coding-agent harness you
chose, so that harness’s data handling and permissions still apply.

The CLI reaches the network only for explicit operations: listing and pulling download Blueprints
from a GitHub Release, contributing uses your own authenticated GitHub CLI to open a public pull
request, and running the package through npx contacts the registry. Everything the CLI does is
auditable in the [public source](https://github.com/itai-gendler/pdd-kit). What the site keeps is set out in the
[privacy policy](https://pdd-kit.dev/privacy).

### Do I need an account?

No. Listing and pulling Blueprints are anonymous — no account, sign-in, or credential
is involved at any point, and the site has no accounts at all.

### How do I contribute a Blueprint?

By pull request against [itai-gendler/pdd-kit](https://github.com/itai-gendler/pdd-kit). The CLI drives it,
projecting away repository-local implementation paths so the contribution carries the product and
nothing from your repository.

The bar is an executable brief: small enough for an agent to build end to end, complete enough that
nothing is missing, and generic rather than a model of a named product. The test is whether a coding
agent that has never seen it can build the product from “build this” alone. [Read the contributing
guide](https://github.com/itai-gendler/pdd-kit/blob/main/CONTRIBUTING.md).

### Where do I get help?

Bugs, missing product concepts, and format questions belong in [GitHub
issues](https://github.com/itai-gendler/pdd-kit/issues). Security reports go through the [security
policy](https://github.com/itai-gendler/pdd-kit/blob/main/SECURITY.md) rather than a public issue.

## Still have a question?

Ask it in a GitHub issue, or start with the docs.

- [Open an issue](https://github.com/itai-gendler/pdd-kit/issues)
- [Read the docs](https://pdd-kit.dev/docs)
