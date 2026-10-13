# Contributing

Keep contributions focused: the CLI stays dependency-light, and every skill
stays reusable, self-contained, and well-scoped.

## Local development

The repository is a pnpm workspace: the package itself plus the private local
viewer in `viewer/app`. `package.json` pins the pnpm version in
`packageManager`; with Corepack (`corepack enable`) or pnpm 9.7 or later, that
exact version runs. It needs Node.js 22.13 or later, newer than the published
package's own floor: consumers still install `pdd-toolkit` on Node.js 20.12
or later, with any package manager.

Activate the current pdd-kit worktree as the machine-wide development CLI and keep
all published package outputs current:

```bash
pnpm install --frozen-lockfile
pnpm dev
```

The initial build must succeed before `~/.local/bin/pdd-kit-dev` is atomically
linked to this worktree. The command then runs `tsdown --watch` in the
foreground; stopping the watcher leaves `pdd-kit-dev` pointing at the last
successful build. Run `pnpm dev` in another worktree to switch the link,
`pdd-kit-dev --dev-info` to inspect it, and `pnpm dev:unlink` from the active
worktree to remove it.

From any target repository, `pdd-kit-dev lint` and the other public commands
use the active checkout. Installed map, ideate, and verify skills recognize the
same explicit development launcher; without it they retain their release-pinned
npm runner.

1. Format changes start in `spec/format.md`, then flow into `src/core/` and
   `src/commands/lint.ts` with a failing-case test per new structural rule, and into
   the matching resource-type page under `docs/`. Changes to the serialized report
   start in `spec/report.md` instead.
2. Keep `src/core/portable.ts` in step with `spec/report.md`. The site
   (`site/`) reads the same schema from this checkout, so a schema-version bump
   updates it in the same pull request.
3. Update the golden fixture (`test/fixtures/fixture-shop/`) and its expected
   counts when the format gains required content.
4. For skills: update the matching `SKILL.md`, keep references self-contained,
   keep names prefixed with `pdd-`, update `agents/openai.yaml`, and
   list new skills in `.claude-plugin/plugin.json`. pdd-kit analysis never
   executes target code; verify delegates implementation to a harness-supplied
   builder and then inspects again.
5. `pnpm install` sets up Git hooks (`lefthook.yml`): fast checks before each
   commit and the package build before each push. Do not skip them with
   `--no-verify`. Run `pnpm verify` before opening a PR. Change dependencies
   with `pnpm add` or `pnpm remove` and commit the updated `pnpm-lock.yaml`; CI
   installs with `--frozen-lockfile` and fails when it drifts.
6. Do not add secrets, customer data, or private repository URLs.

## Contributing a Blueprint

A Blueprint is a Product Model of a common kind of product that anyone can pull
instead of starting blank. You propose one from your own repository with the
CLI, which opens the pull request for you:

```bash
npx pdd-toolkit blueprint contribute
```

It needs the [GitHub CLI](https://cli.github.com) signed in, a model with no
lint errors, a category, tags, authors and an SPDX license in the Product's
frontmatter, and a `logo.svg` beside `product-model/product/product.md`. The
command regenerates the model from its portable export, so the pull request
carries only product meaning: no code References, local paths or Coverage.
Every step is described in
[`pdd-kit blueprint contribute`](./docs/cli-contribute.md).

A good Blueprint is a complete brief: small enough for an agent to build end to
end, complete enough that nothing is missing, and generic rather than a model
of a named product. Merging the pull request publishes it: within minutes it
appears in `blueprint list` and on
[pdd-kit.dev/blueprints](https://pdd-kit.dev/blueprints), and
`npx pdd-toolkit blueprint pull <slug>` in an empty folder gives you exactly
what others will get.
