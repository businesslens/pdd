# BusinessLens

[![npm](https://img.shields.io/npm/v/businesslens)](https://www.npmjs.com/package/businesslens)
[![Check](https://github.com/businesslens/pdd/actions/workflows/check.yml/badge.svg)](https://github.com/businesslens/pdd/actions/workflows/check.yml)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](./LICENSE)

**Product-Driven Development for coding agents.** BusinessLens keeps intended
product behavior in a Git-tracked `.businesslens/` Product Model: who the
product serves, what they accomplish, and which rules must remain true.

The model is Markdown, reviewable in pull requests, and useful without a hosted
service. `businesslens lint` checks its structure. The `businesslens-verify`
skill performs the separate semantic comparison with code and owns the
resolution loop.

```text
.businesslens/
├── README.md
├── product.md                # or product/product.md beside logo.svg
├── actors/<id>.md            # or <id>/actor.md with assets
├── interfaces/<id>.md        # or <id>/interface.md with screens/ or experiences/
├── domains/<id>.md           # or <id>/domain.md with assets; optional collection
├── capabilities/<id>.md      # or <id>/capability.md with scenarios/ or assets
├── journeys/<id>.md          # or <id>/journey.md with scenarios/ or assets; optional
├── business-rules/<id>.md    # or <id>/business-rule.md with assets
└── coverage.md
```

Leaf entities stay compact as `<id>.md`. An entity expands to
`<id>/<type>.md` only when it needs a namespace for assets or child entities.

## Getting started

Install the skills:

```bash
npx businesslens install
```

Then choose one starting door:

- **Existing product** — `/businesslens-map` creates the model from established
  repository behavior.
- **Blank repository** — `/businesslens-ideate` decides and authors the product
  before implementation.
- **Blueprint** — `npx businesslens blueprint pull <name>` opens a
  reviewed starting model.

Codex users invoke skills with `$`, for example `$businesslens-map`.

## The ongoing loop

```text
/businesslens-ideate guest checkout
        ↓ approved Product Model delta
your injected plan / build flow
        ↓ implementation
/businesslens-verify this branch
        ↓ automatically resolve gaps, re-check, and run final lint
merge
```

You invoke verify once. When it finds a gap, it groups the authority decision
and routes automatically: update approved model meaning through its internal
ideation protocol, map an absent established area, or hand an acceptance packet
to the builder supplied by your harness. It re-verifies after every change and
stops explicitly when blocked. Its completion report includes final structural
lint, so no second skill or command is required to finish the loop. Use `report
only` to disable all writes and delegation.

`map` is not daily maintenance. Use it for adoption, a deliberately untrusted
area, or coverage expansion. Use `verify` after changes, refactors, suspected
drift, before release, or for a named/full current-state audit.

## Terminal and agent surfaces

| Where | Command | Purpose |
| --- | --- | --- |
| Terminal | `npx businesslens install` | Install the three skills |
| Terminal | `npx businesslens update` | Refresh managed skill installations |
| Terminal | `npx businesslens lint` | Check Product Model structure; no semantic claim |
| Terminal | `npx businesslens view` | View the current Product Model privately on localhost |
| Terminal | `npx businesslens blueprint export` | Compile the model into a source-free Blueprint |
| Terminal | `npx businesslens blueprint pull <name>` | Pull a catalog Blueprint |
| Terminal | `npx businesslens blueprint open <report>` | Expand a local Blueprint |
| Terminal | `npx businesslens blueprint contribute` | Propose a Blueprint by pull request |
| AI harness | `businesslens-map` | Map established repository behavior |
| AI harness | `businesslens-ideate` | Decide intended behavior and write approved meaning |
| AI harness | `businesslens-verify` | Verify and automatically resolve model/code gaps |

Catalog contribution stays in the CLI; there is no contribution skill.

## Product Model semantics

- `references` optionally attach intent, implementation, or context artifacts
  to any semantic entity. They are navigation and supporting material, not
  proof or verification receipts.
- `coverage.status` describes model breadth: `draft` while the model itself is
  under review, `partial` with known unmapped areas, and `complete` when the
  intended product breadth is modeled.
- A complete model may contain zero References.
- A Product may expose several Interfaces—such as web, mobile, CLI, and a
  supported API—without being classified as one of those delivery forms.
- Experiences are optional coherent usage contexts, each belonging to exactly
  one Interface. Availability is a list of strict Context objects whose
  `place` is an undivided Interface or an Experience.
- Domains are optional regions of subject matter. Only a Capability authors
  `domain:`; every other Domain relation is derived.
- Screens are optional platform-neutral product views, nested in the Interface
  or Experience that contains them. Their path supplies their place. Product
  assets sit beside the entity they describe; anything
  under `implementation/` describes this realization and stays home.
- `lint` checks format, required content, relationships, Reference grammar, and
  tracked code-reference paths. `verify` checks meaning against current code.

Every model creation path writes `.businesslens/README.md`. BusinessLens never
writes target `AGENTS.md`, `CLAUDE.md`, or root README files.

## Where the Product Model is defined

Use these sources in this order:

1. Read the [Product Model overview](./docs/product-model.md) for the mental
   model and relationship overview.
2. Use [`spec/format.md`](./spec/format.md) as the normative contract for the
   authored `.businesslens/` files. It defines every entity, file shape,
   relation, and semantic boundary, and changes before parser or linter
   behavior changes. Its companion [`spec/report.md`](./spec/report.md) is the
   contract for the serialized Product Report, its portable projection, and
   expansion.
3. Use the individual entity pages under [`docs/`](./docs/) for approachable
   explanations, examples, and the relevant `lint` findings. They restate the
   format contract and must not introduce a second definition.
4. Follow [`src/core/model.ts`](./src/core/model.ts),
   [`src/core/frontmatter.ts`](./src/core/frontmatter.ts),
   [`src/core/markdown.ts`](./src/core/markdown.ts), and
   [`src/commands/lint.ts`](./src/commands/lint.ts) to understand what the CLI
   parses and enforces today.
5. Use [`src/core/portable.ts`](./src/core/portable.ts) for the generated Product
   Report JSON schema and relationship validation, and
   [`src/commands/export.ts`](./src/commands/export.ts) for the authored-model to
   report projection.

The installed skills carry self-contained format summaries and semantic
rubrics so agents can judge concepts that structural lint cannot prove—for
example, whether something is genuinely a durable Capability or a coherent
multi-Capability Journey. Those guides must remain consistent with
`spec/format.md`; they do not supersede it. Viewer backlinks and topology are
derived report projections, not additional authored relationships.

## Documentation

- [Introduction](./docs/index.md) · [Installation](./docs/installation.md) ·
  [Development loop](./docs/the-loop.md)
- Start [from your repo](./docs/from-your-repo.md),
  [from a Blueprint](./docs/from-a-blueprint.md), or
  [from an idea](./docs/from-an-idea.md)
- [Product Model](./docs/product-model.md) ·
  [Feed reader example](./docs/feed-reader-example.md) ·
  [References](./docs/references.md)
- [Skills](./docs/skills.md) · [CLI](./docs/cli.md) ·
  [CI/CD](./docs/ci.md)
- [Format contract](./spec/format.md) ·
  [Report contract](./spec/report.md)

## Nuxt layers

The package also exposes separately composable Nuxt layers:

- `businesslens/nuxt/report-viewer` renders a Product Report without owning its
  host navigation or page shell.
- `businesslens/nuxt/theme` provides the stable BusinessLens palette, type,
  semantic UI foundation, approved surfaces, logo/wordmark renderer, and
  browser/install icon family.
- `businesslens/nuxt/theme-lab` extends that stable theme with the shared,
  opt-in background experiments used by the landing site and local report
  viewer. A consumer that does not opt in receives the approved stable
  presentation from `theme`; a background graduates by moving into `theme`,
  never by a consumer depending on `theme-lab` in production.

## Safety

- BusinessLens analysis phases inspect untrusted repositories without executing
  target code. A separately injected builder may run normal project checks under
  its own permissions.
- Installation refuses to overwrite unowned skill directories unless `--force`
  is explicit; update touches only marked installations.
- Nothing submits model data except the explicit
  `businesslens blueprint contribute` command.
- No command publishes, tags, or pushes implicitly.

## License

MIT.
