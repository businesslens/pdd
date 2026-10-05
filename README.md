# BusinessLens

[![npm](https://img.shields.io/npm/v/businesslens)](https://www.npmjs.com/package/businesslens)
[![Check](https://github.com/businesslens/pdd/actions/workflows/check.yml/badge.svg)](https://github.com/businesslens/pdd/actions/workflows/check.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**Product-Driven Development for coding agents.**

BusinessLens keeps what your product is meant to do in a Git-tracked Product
Model, `.businesslens/`, and gives your coding agent three skills to work with
it: **map** an existing product, **ideate** a change before it is built, and
**verify** the code against the model afterwards.

```bash
npx businesslens install
```

Markdown files in your repository, reviewed in pull requests. Mapping, ideating,
verifying, linting and viewing need no account and no hosted service.

## Why Product-Driven Development

Coding agents write implementation faster than a team can keep track of what
the product is supposed to do. Intent ends up in prompts, plan files and chat
history that nobody reviews twice, and the code they produce is too large to
read for meaning.

- **Omissions don't show in a diff.** It shows what changed, not the refusal
  case nobody specified or the role that should never have been able to act.
- **Drift is silent.** After a refactor, nothing says whether the product still
  does what was agreed.
- **Authority is unclear.** When code and plan disagree, someone has to decide
  which one is right, and an agent should not decide that alone.

BusinessLens moves product intent into a structured model: one reviewable file
per Capability, Business Rule, Entity or Interface. People approve changes to it
as a pull-request diff; agents read it as durable product context in every
session.

Checking it is two separate jobs. `businesslens lint` proves the files are
well-formed and consistent with each other. The `businesslens-verify` skill
compares their meaning with the code. Lint never claims the code is right.

## Features

- **A Product Model in Git.** Markdown in `.businesslens/`: who the product
  serves, where they use it, what it can do, what it keeps, which rules must stay
  true (including who may act), and where it works more than one way.
- **Three focused agent skills.** `businesslens-map` drafts the model from an
  existing repository, `businesslens-ideate` decides a new product or change, and
  `businesslens-verify` checks the code against the model and resolves what
  disagrees. Each shows its proposal before writing.
- **Structural lint and semantic verification, kept apart.** `lint` is
  deterministic and fits CI; verify works from evidence and says what it could
  not inspect.
- **A loop around your own build flow.** Ideate before, verify after; plan mode,
  an SDD tool or freestyle in between.
- **A private local report.** `businesslens view` opens your model, or a GitHub
  repository's branch or pull request, in the browser on localhost. On your own
  checkout it follows your edits as you save.
- **Blueprints.** Export a source-free model, pull a reviewed one from the
  catalog as a starting point, open one you were given, or contribute yours by
  pull request.
- **Many agents.** Claude Code, Codex, Cursor, Gemini CLI and GitHub Copilot, at
  project or global scope, or as a Claude Code plugin.
- **Safe by default.** The skills read your code and never run it. Installation
  never overwrites a skill directory it does not own. Nothing is submitted
  anywhere unless you run `blueprint contribute`.

![The local report open on a Blueprint's overview page](./docs/images/report-overview.webp)

## Getting started

Requires Node.js 20.12 or newer.

**1. Install the skills** into your coding agent:

```bash
npx businesslens install
```

The installer detects your agents, asks for project or global scope, and
installs only the three skills. Type `/businesslens-` in your agent to see them
(`$businesslens-` in Codex). See [Installation](./docs/installation.md) for
non-interactive use and the Claude Code plugin.

**2. Choose where to start:**

| You have | Run | Guide |
| --- | --- | --- |
| Existing code | `/businesslens-map` in your agent | [From your repo](./docs/from-your-repo.md) |
| An idea, no code yet | `/businesslens-ideate` in your agent | [From an idea](./docs/from-an-idea.md) |
| A familiar kind of product | `npx businesslens blueprint pull <name>` in the terminal | [From a Blueprint](./docs/from-a-blueprint.md) |

Codex uses `$` instead of `/`, for example `$businesslens-map`. Browse
Blueprints at [businesslens.io/blueprints](https://businesslens.io/blueprints).

**3. Check and look at the result:**

```bash
npx businesslens lint
npx businesslens view
```

Then review and commit `.businesslens/` like any other change.

## Working with coding agents

Every product change runs the same loop:

```text
ideate or map → approve the Product Model change → build → verify → merge
```

Start with the change you want, in plain words:

```text
/businesslens-ideate add guest checkout: buyers can pay without creating an account
```

Ideate drafts the model change (new Scenarios, the Business Rules they need,
what changes on which Interface) and writes `.businesslens/` only once you
approve. Build it with your usual flow; BusinessLens builds nothing itself. Then:

```text
/businesslens-verify this branch
```

Verify compares the branch with the model. When it finds a gap, it asks who is
right and routes the fix: update the model meaning you approve, map an area that
was never modeled, or hand an acceptance packet to the builder your agent
provides. It re-checks after every change, finishes with `lint`, and stops with
the exact blocker when it cannot finish. Add `report only` to forbid every write
and handoff.

**Map or verify?** Map adopts BusinessLens on existing code. Return to it only
to cover more of the product or to remap an area you no longer trust. Verify is
the everyday skill: after changes and refactors, on suspected drift, before a
release, or as a full audit with `/businesslens-verify current`.

## The Product Model at a glance

```text
.businesslens/
├── product.md          # the one Product
├── interfaces/         # where people and systems meet it
├── entities/           # what it keeps, including who acts
├── domains/            # optional subject areas
├── capabilities/       # what it can do, with Scenarios for each case
├── journeys/           # goals that need several Capabilities
├── business-rules/     # what must stay true, and who may act
├── variations/         # supported alternatives, and what picks one
├── coverage.md         # what the model covers, and its known gaps
└── README.md           # orientation for anyone opening the folder
```

Each file is one resource, and the folder it sits in decides its type. A
resource stays a single `<id>.md` until it needs room for assets or child
resources. The model describes the product, not the code: it names no
frameworks or endpoints, only what a person using the product could confirm.
Optional References point at designs, documents or code for navigation, never
as proof.

To go further:

- [Model overview](./docs/product-model.md): the folder in five minutes.
- One page per resource type under [`docs/`](./docs/), for example
  [Capabilities](./docs/capabilities.md) and
  [Business Rules](./docs/business-rules.md).
- [`spec/format.md`](./spec/format.md): the normative format contract.

## Reference

### Commands

| Where | Command | Purpose |
| --- | --- | --- |
| Terminal | `npx businesslens install` | Install the three skills |
| Terminal | `npx businesslens update` | Refresh managed skill installations |
| Terminal | `npx businesslens lint` | Check Product Model structure; no claim about the code |
| Terminal | `npx businesslens view` | View the current Product Model, or a GitHub repository's, privately on localhost |
| Terminal | `npx businesslens blueprint export` | Compile the model into a source-free Blueprint |
| Terminal | `npx businesslens blueprint pull <name>` | Pull a catalog Blueprint |
| Terminal | `npx businesslens blueprint open <report>` | Expand a local Blueprint |
| Terminal | `npx businesslens blueprint contribute` | Propose a Blueprint by pull request |
| Agent | `businesslens-map` | Map established repository behavior |
| Agent | `businesslens-ideate` | Decide intended behavior and write approved meaning |
| Agent | `businesslens-verify` | Verify the code against the model and resolve gaps |

Options for each command are in the [CLI reference](./docs/cli.md); each skill
has a page under [Skills](./docs/skills.md).

### Where the Product Model is defined

Use these sources in this order:

1. [Model overview](./docs/product-model.md) and the resource type pages under
   [`docs/`](./docs/): approachable explanations, examples and the relevant
   `lint` findings. They restate the format contract and never add a second
   definition.
2. [`spec/format.md`](./spec/format.md): the normative contract for the authored
   `.businesslens/` files. It changes before the parser or linter does. Its
   companion [`spec/report.md`](./spec/report.md) is the contract for the
   Product Report, its portable projection and expansion.
3. [`src/core/model.ts`](./src/core/model.ts),
   [`src/core/frontmatter.ts`](./src/core/frontmatter.ts),
   [`src/core/markdown.ts`](./src/core/markdown.ts) and
   [`src/commands/lint.ts`](./src/commands/lint.ts): what the CLI parses and
   enforces today.
4. [`src/core/portable.ts`](./src/core/portable.ts) and
   [`src/commands/export.ts`](./src/commands/export.ts): the Product Report JSON
   schema and the projection from the authored model.

The installed skills carry self-contained format summaries and rubrics, so an
agent can judge what lint cannot prove, such as whether something is a durable
Capability or a Journey across several. They stay consistent with
`spec/format.md` and never supersede it.

### Documentation

- [Introduction](./docs/index.md) · [Installation](./docs/installation.md) ·
  [Development loop](./docs/index.md#the-development-loop)
- Start [from your repo](./docs/from-your-repo.md),
  [from a Blueprint](./docs/from-a-blueprint.md), or
  [from an idea](./docs/from-an-idea.md)
- [Product Model](./docs/product-model.md) · [References](./docs/references.md)
- [Skills](./docs/skills.md) · [CLI](./docs/cli.md)
- [Format contract](./spec/format.md) · [Report contract](./spec/report.md)

### Nuxt layers

The package also exposes separately composable Nuxt layers:

- `businesslens/nuxt/report-viewer` renders a Product Report without owning its
  host navigation or page shell. See its [README](./layers/nuxt/report-viewer/README.md).
- `businesslens/nuxt/theme` provides the stable BusinessLens palette, type,
  semantic UI foundation, approved surfaces, logo/wordmark renderer, and
  browser/install icon family.
- `businesslens/nuxt/theme-lab` extends that theme with opt-in background
  experiments used by the landing site and local report viewer. A consumer that
  does not opt in receives the stable presentation from `theme`; a background
  graduates by moving into `theme`, never by a consumer depending on
  `theme-lab` in production.

### Safety

- BusinessLens analysis phases inspect untrusted repositories without executing
  target code. A builder your agent provides may run normal project checks
  under its own permissions.
- `install` writes only skill directories. It refuses to overwrite an unowned
  skill directory unless `--force` is explicit, and `update` touches only marked
  installations.
- The skills write only inside `.businesslens/`, including its own
  `.businesslens/README.md`. BusinessLens never writes your `AGENTS.md`,
  `CLAUDE.md` or root README.
- Nothing submits model data except the explicit
  `businesslens blueprint contribute` command.
- No command commits, publishes, tags or pushes implicitly; `blueprint
  contribute` pushes its proposal branch only after you confirm.

## License

MIT.
