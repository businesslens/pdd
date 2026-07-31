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
- **Blank repository** — `/businesslens-plan` interviews you and authors the
  whole product as a draft model, before any code exists.

(Codex users invoke skills as `$businesslens-init` / `$businesslens-plan`.)

## The loop for every feature

Planning is editing the model. Git is the change model — branches hold plans,
pull requests review them, history archives them:

```text
/businesslens-plan add guest checkout   # model describes intended behavior
… implement with your coding agent …
/businesslens-verify                    # code checked against the plan, evidence attached
npx businesslens validate               # green = done; CI gates the PR
```

Between plan and verify, new journeys and scenarios without `codeRefs`
appear as expected validation findings. `/businesslens-verify` also derives
changed and deleted work from the model diff, so the full plan is checked.
Code changed without a plan? `/businesslens-sync` repairs the model.

## Terminal or agent?

BusinessLens has two deliberate surfaces:

| Where | Command | Purpose |
| --- | --- | --- |
| Terminal | `npx businesslens install` | Install the agent skills |
| Terminal | `npx businesslens update` | Refresh managed skill installations |
| Terminal | `npx businesslens validate` | Deterministically validate the model |
| Terminal | `npx businesslens export` | Compile the model into source-free `report.json` |
| Terminal | `npx businesslens@latest pull blueprint-name` | Anonymously pull a catalog Blueprint into a canonical Product Model |
| Terminal | `npx businesslens open` | Expand a local Product Report into a canonical Product Model |
| Terminal | `npx businesslens contribute` | Propose the model as a public catalog Blueprint |
| AI harness | the ten `businesslens-*` skills | Map, plan, implement, verify, and maintain the product truth |

The installer never creates `.businesslens/` or modifies `AGENTS.md`. Those
require repository analysis and belong to the skills.

## Skills

| Skill | Use it when |
| --- | --- |
| `businesslens-init` | Adopting BusinessLens in a repository that already has code |
| `businesslens-plan` | Planning a product (blank repo) or a feature (mapped repo) before code |
| `businesslens-verify` | Planned model changes were implemented and need evidence-backed checking |
| `businesslens-sync` | Code changed without a plan and the model drifted |
| `businesslens-deep-dive` | One journey or experience needs exhaustive coverage |
| `businesslens-validate` | The model needs a read-only deterministic check |
| `businesslens-doctor` | The model fails validation, looks stale, or needs a health report |
| `businesslens-ideate` | The user is deciding what to build |
| `businesslens-implement` | A model exists with no implementation |
| `businesslens-contribute` | The user explicitly wants the model in the public catalog |

Every skill is self-contained and follows the open Agent Skills folder
format. Claude Code plugin users may alternatively install from this
repository's marketplace manifest; the standalone CLI remains the primary
installation experience.

## Documentation

Learn the flow:

- [Introduction](./docs/index.md) · [Installation](./docs/installation.md) ·
  [Quickstart](./docs/quickstart.md)
- [How it works](./docs/guide.md) · [The product model](./docs/product-model.md) ·
  [Terminology](./docs/terminology.md)
- [Map existing code](./docs/tutorial-map-existing-product.md)
- [Plan a new product](./docs/tutorial-plan-new-product.md)
- [Ship a feature](./docs/tutorial-ship-a-feature.md)
- [Recover from drift](./docs/tutorial-recover-from-drift.md)

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
