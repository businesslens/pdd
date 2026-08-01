# BusinessLens

[![npm](https://img.shields.io/npm/v/businesslens)](https://www.npmjs.com/package/businesslens)
[![Check](https://github.com/businesslens/pdd/actions/workflows/check.yml/badge.svg)](https://github.com/businesslens/pdd/actions/workflows/check.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**Product-Driven Development for coding agents.** BusinessLens builds a
Git-tracked product model in `.businesslens/`: who the product serves, what
they accomplish, and where the code proves it.

The model is Markdown, reviewable in pull requests, and useful without a
hosted service. One rule holds it together: behavioral claims need code
evidence, and a green `validate` means the model and the code agree.

```text
.businesslens/
├── product.md
├── actors/
├── experiences/
├── domains/
├── features/
├── business-rules/
├── journeys/<id>/journey.md
│   └── scenarios/<id>.md
└── coverage.md
```

## Getting started

Install the skills in the repository:

```bash
npx businesslens@latest install
```

The installer detects supported AI harnesses (Claude Code, Codex, Cursor,
Gemini CLI, GitHub Copilot), lets you customize the selection, asks for
project or global scope, and installs only the BusinessLens skills. For
automated setup: `npx businesslens@latest install --providers claude,codex
--scope project --yes`.

Then create a Product Model:

- **Existing product** — `/businesslens-init` inspects the code and builds
  the evidence-backed model.
- **Blank repository** — `/businesslens-ideate` interviews you and authors the
  whole product as a draft model, before any code exists.

(Codex users invoke skills as `$businesslens-init` / `$businesslens-ideate`.)

## The loop for every feature

Planning is editing the model. Git is the change model — branches hold plans,
pull requests review them, history archives them:

```text
/businesslens-ideate add guest checkout  # model describes intended behavior
… implement with your coding agent …
/businesslens-sync                    # code checked against the plan, evidence attached
npx businesslens validate               # green = done; CI gates the PR
```

Between planning and syncing, new journeys and scenarios without `codeRefs`
appear as expected validation findings. `/businesslens-sync` derives changed
and deleted work from the model diff too, so the full plan is checked — and it
handles the no-plan case the same way, working out which one you are in rather
than asking.

## Terminal or agent?

BusinessLens has two deliberate surfaces:

| Where | Command | Purpose |
| --- | --- | --- |
| Terminal | `npx businesslens install` | Install the agent skills |
| Terminal | `npx businesslens update` | Refresh managed skill installations |
| Terminal | `npx businesslens validate` | Gate CI, and see where a branch stands. Skills run it for you |
| Terminal | `npx businesslens blueprint export` | Compile the model into a Blueprint |
| Terminal | `npx businesslens blueprint pull <name>` | Anonymously pull a catalog Blueprint into a Product Model |
| Terminal | `npx businesslens blueprint open <report>` | Expand a Blueprint into a Product Model |
| Terminal | `npx businesslens blueprint contribute` | Propose the model as a public catalog Blueprint |
| AI harness | the six `businesslens-*` skills | Map, decide, reconcile, and maintain the product truth |

Nothing creates `.businesslens/` except the skills, and only `blueprint pull` and
`blueprint open` write to `AGENTS.md` — a model that arrived from another repository
needs a note saying what it is; one you authored does not.

## Skills

| Skill | Use it when |
| --- | --- |
| `businesslens-init` | Adopting BusinessLens in a repository that already has code |
| `businesslens-ideate` | Deciding what the product should do, and writing that decision into the model |
| `businesslens-sync` | The code moved and the model needs to catch up — with or without a plan |
| `businesslens-deep-dive` | One journey or experience needs exhaustive coverage |
| `businesslens-doctor` | The model fails validation, looks stale, or needs a health report |
| `businesslens-contribute` | The user explicitly wants the model in the public catalog |

Every skill is self-contained and follows the open Agent Skills folder
format. Claude Code plugin users may alternatively install from this
repository's marketplace manifest; the standalone CLI remains the primary
installation experience.

## Documentation

Learn the flow:

- [Introduction](./docs/index.md) · [Installation](./docs/installation.md)
- Pick a door: [From your repo](./docs/from-your-repo.md) ·
  [From a Blueprint](./docs/from-a-blueprint.md) ·
  [From an idea](./docs/from-an-idea.md)
- [Find your flow](./docs/flows.md) · [The product model](./docs/product-model.md) ·
  [Terminology](./docs/terminology.md)

Reference:

- [Skills overview](./docs/skills.md) (one page per skill)
- [Format contract](./docs/format.md)
- [CLI reference](./docs/cli.md)
- [Validation rules](./docs/validation-rules.md)
- [CI validation](./docs/ci.md)
- [PDD and SDD](./docs/pdd-and-sdd.md)

## Updating the skills

```bash
npx businesslens@latest update
```

Update discovers BusinessLens-managed installations through ownership markers
and refreshes only those skill directories. It does not touch `.businesslens/`
or `AGENTS.md`.

## Safety

- Skills inspect target repositories statically; they do not run target code.
- Installation refuses to overwrite unowned `businesslens-*` directories
  unless `--force` is explicit.
- Updates replace only artifacts marked as BusinessLens-managed.
- Installation, mapping, planning, validation, and export do not submit your
  model anywhere. Only the explicit `contribute` command or
  `businesslens-contribute` skill proposes a public catalog contribution.

## License

MIT.
