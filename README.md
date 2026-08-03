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
├── product.md
├── actors/
├── experiences/
├── screens/                  # optional product views
├── domains/
├── features/
├── business-rules/
├── journeys/<id>/journey.md
│   └── scenarios/<id>.md
└── coverage.md
```

## Getting started

Install the skills:

```bash
npx businesslens@latest install
```

Then choose one starting door:

- **Existing product** — `/businesslens-map` creates the model from established
  repository behavior.
- **Blank repository** — `/businesslens-ideate` decides and authors the product
  before implementation.
- **Blueprint** — `npx businesslens@latest blueprint pull <name>` opens a
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
| Terminal | `npx businesslens blueprint export` | Compile the model into a source-free Blueprint |
| Terminal | `npx businesslens blueprint pull <name>` | Pull a catalog Blueprint |
| Terminal | `npx businesslens blueprint open <report>` | Expand a local Blueprint |
| Terminal | `npx businesslens blueprint contribute` | Propose a Blueprint by pull request |
| AI harness | `businesslens-map` | Map established repository behavior |
| AI harness | `businesslens-ideate` | Decide intended behavior and write approved meaning |
| AI harness | `businesslens-verify` | Verify and automatically resolve model/code gaps |

Catalog contribution stays in the CLI; there is no contribution skill.

## Product Model semantics

- `codeRefs` are optional tracked-file bookmarks. They are not proof,
  implementation state, or verification receipts.
- `coverage.status` describes model breadth: `draft` while the model itself is
  under review, `partial` with known unmapped areas, and `complete` when the
  intended product scope is modeled.
- A complete model may contain zero codeRefs.
- Screens are optional platform-neutral product views. Screenshots and other
  supporting visuals remain external links, not model assets or evidence.
- `lint` checks format, required content, relationships, link/reference grammar,
  and tracked bookmark paths. `verify` checks meaning against current code.

Every model creation path writes `.businesslens/README.md`. BusinessLens never
writes target `AGENTS.md`, `CLAUDE.md`, or root README files.

## Documentation

- [Introduction](./docs/index.md) · [Installation](./docs/installation.md) ·
  [The loop](./docs/the-loop.md)
- Start [from your repo](./docs/from-your-repo.md),
  [from a Blueprint](./docs/from-a-blueprint.md), or
  [from an idea](./docs/from-an-idea.md)
- [Product Model](./docs/product-model.md) ·
  [Code refs & coverage](./docs/code-refs-and-coverage.md)
- [Skills](./docs/skills.md) · [CLI](./docs/cli.md) ·
  [Lint in CI](./docs/ci.md)
- [Format contract](./spec/format.md)

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
