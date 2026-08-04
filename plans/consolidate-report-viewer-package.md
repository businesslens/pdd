# Consolidate the report viewer into `businesslens`

## Status

Accepted, implemented, and verified on 2026-08-04.

The source, package metadata, release automation, private viewer, packed-artifact
checks, and landing integration now use the single-package architecture below.
No npm publication or application deployment was performed; those external
release operations remain explicit follow-up actions.

## Outcome

`businesslens` is the only public npm package. It exposes the pure Product
Report view-model projection beside the canonical report API, plus two distinct
Nuxt Layers: the report renderer and the site-wide BusinessLens theme. It
continues to ship the generated local viewer used by `businesslens view`.

The renderer and theme remain separate, sibling Nuxt Layers. The theme is a
BusinessLens-wide design foundation rather than a child of the report viewer.
A Layer boundary does not require an npm package boundary.

The private local-viewer workspace may remain a private build package because
it creates no publication obligation and provides useful build isolation.

## Post-implementation hardening

The implementation review was resolved as part of this delivery:

- Product identity now has one contributor-controlled input:
  `.businesslens/logo.svg`. Product Reports, catalog payloads, and Product model
  frontmatter no longer contain an icon or accent color.
- The SVG is optional for an ordinary local Product Model and required for a
  public Blueprint. It is size-bounded, shape-validated, required to be
  self-contained, and always rendered as a decorative `<img>` beside visible
  text rather than injected into the document.
- `contribute` copies the logo into the reviewed Blueprint directory. `pull`
  retrieves it through the selected catalog's same-origin, commit-pinned logo
  endpoint and restores it into the expanded model when available.
- The local viewer serves the logo directly from the model filesystem and
  refreshes it during watch mode. A locally seeded landing catalog reads only
  from an explicitly allowed source root. The shared logo component falls back
  to a packaged neutral Product placeholder when a source is absent or fails to
  load.
- Arbitrary contributor colors no longer enter text or border styles. Record
  accessibility coverage runs in both explicit light and dark modes.
- The Nuxt, Vue, Tailwind, Nuxt UI, icon-set, and font requirements are declared
  as optional peers of the one public package. Nuxt hosts declare the peers
  they use; CLI-only consumers do not install the UI toolchain.
- Development migration history is regenerated as one `0000_initial.sql`, in
  line with the landing repository's pre-production migration policy.
- Private Nuxt output, including the generated `viewer/app/dist` symlink, is
  ignored; the bundled viewer was reduced to the source-discovered UI icon set;
  and the compressed root-tarball gate is 2 MiB.
- Public terminology remains with the owning PDD entity documentation. The
  landing no longer promises a nonexistent standalone terminology route.
- Category formatting has one pure implementation, category search matches
  both stored and displayed text, card projection validates its inputs,
  administration reads only the required JSON field, report compilation
  resolves the model root once, and viewer-only CLI options are rejected for
  other commands.

## Target architecture

```text
businesslens npm package
|- CLI and Product Report APIs
|- businesslens/report/view-model
|- businesslens/nuxt/report-viewer
|- businesslens/nuxt/theme
`- bundled generated local viewer

viewer/app
`- private build workspace; never published
```

The Nuxt consumer API becomes:

```ts
export default defineNuxtConfig({
  extends: [
    'businesslens/nuxt/report-viewer',
    'businesslens/nuxt/theme'
  ]
})
```

The view-model API becomes:

```ts
import {
  projectReportView,
  type ReportViewModel
} from 'businesslens/report/view-model'
```

## Architectural constraints

- `businesslens` is the only public npm package and the only package published
  by the release workflow.
- The report renderer and BusinessLens-wide theme remain separate, sibling
  Nuxt Layers.
- The view model remains pure TypeScript under the report API and does not
  depend on Nuxt or Vue.
- The landing application remains the highest-priority Nuxt project and may
  override shared configuration, CSS, semantic tokens, components, and slots.
- Nuxt hosts own Nuxt, Vue, Tailwind CSS, Nuxt UI, and source-font packages.
- The `businesslens` CLI runtime dependency tree remains free of the Nuxt
  toolchain and theme-only font dependencies.
- The generated local viewer remains bundled into the `businesslens` tarball,
  so `businesslens view` does not install or compile Nuxt at runtime.
- The migration must not intentionally change rendering, behavior, responsive
  layout, accessibility, or host ownership.

## Implementation plan

### 1. Update the architecture contract

Revise the existing local-viewer architecture plan and related repository
documentation before moving code. They must state that:

- `businesslens` owns and exports the report-viewer and global theme Layers;
- the pure report view model lives beside the canonical report API;
- the renderer is not a separately published package;
- Nuxt hosts provide the UI toolchain and fonts;
- `viewer/app` is a private build workspace; and
- the CLI remains independent of Nuxt at runtime.

Update repository checks only as part of the corresponding structural changes,
so they continue to enforce the intended architecture throughout the migration.

### 2. Move the shared Layers under the root package

Move the contents of `packages/report-viewer` into sibling root-package-owned
Nuxt Layer directories, preferably:

```text
layers/nuxt/
|- report-viewer/
|  |- nuxt.config.ts
|  |- app/
|  `- README.md
`- theme/
   |- nuxt.config.ts
   `- app/
```

Preserve without behavioral changes:

- `BusinessLensReportViewer.vue`;
- structural report CSS;
- theme CSS and `app.config` defaults;
- report-viewer and global-theme Layer metadata;
- the public view-model types; and
- the pure `projectReportView` projection, relocated into the root report API.

Do not nest or combine the report-viewer and theme Layers. Their separation
allows a host to use the renderer without adopting the BusinessLens visual
foundation, and allows the landing to use the theme across non-report pages.

### 3. Add root package exports and packed files

Extend the existing `businesslens` exports with entries equivalent to:

```json
{
  "./report/view-model": {
    "types": "./dist/report-view-model.d.ts",
    "default": "./dist/report-view-model.js"
  },
  "./nuxt/report-viewer": "./layers/nuxt/report-viewer/nuxt.config.ts",
  "./nuxt/theme": "./layers/nuxt/theme/nuxt.config.ts"
}
```

Add the Layer directory to the root package's `files` whitelist. Preserve the
existing `businesslens/report`, `businesslens/report/digest`, CLI, docs, skills,
and generated local-viewer contents.

Verify exports against the packed tarball rather than only against the source
worktree.

### 4. Integrate the view model into the root build

Configure the root TypeScript build to emit the view-model JavaScript and type
declarations alongside the existing public report entries.

The resulting entry must:

- remain browser-safe;
- avoid Node-only imports;
- preserve all current public types;
- keep catalog metadata out of the shared report model;
- avoid importing unpublished root source paths from the Vue component; and
- be tested through the public package export.

Keep one implementation of the projection. Do not retain a source copy under a
removed workspace package.

### 5. Keep UI dependencies out of the CLI runtime tree

Do not add Nuxt, Vue, Tailwind CSS, Nuxt UI, or the Fontsource packages as normal
runtime dependencies of `businesslens`.

Instead:

- declare the complete UI build stack directly in `viewer/app`;
- keep the same packages directly installed in the landing application;
- optionally declare framework compatibility as optional peer dependencies on
  `businesslens`, provided doing so does not auto-install or warn for CLI-only
  consumers; and
- document the dependencies required when consuming a Nuxt Layer subpath.

The initial font strategy is host ownership. Restore direct dependencies on:

- `@fontsource-variable/archivo`;
- `@fontsource-variable/inter`; and
- `@fontsource/ibm-plex-mono`

in the landing application and private local-viewer workspace. Do not bundle or
vendor fonts during this refactor. That can be considered separately after the
package consolidation is stable.

### 6. Update the private local viewer

Change `viewer/app` to extend the relocated Layers through repository-relative
paths while developing and building PDD. Remove its dependency on
`@businesslens/report-viewer`.

Retain:

- `private: true`;
- its Nuxt, Vue, Tailwind CSS, Nuxt UI, UI-icon, font, and typecheck dependencies;
- static generation;
- the same-origin report endpoint contract; and
- copying its generated public output into `businesslens/dist/viewer`.

Do not remove the private workspace merely to reduce the number of package
manifests. It is not published and therefore does not conflict with the
single-public-package outcome.

### 7. Remove the standalone public package

After the root exports and private viewer work from the source tree:

- remove `packages/report-viewer/package.json` and its package-only files;
- remove the `packages/*` workspace entry if nothing else uses it;
- remove `@businesslens/report-viewer` version synchronization;
- remove package-specific repository assertions;
- replace its size budget with a Layer-source or root-package budget if useful;
- update changelog and documentation references; and
- remove all internal dependencies on the old package name.

Before removal, check whether `@businesslens/report-viewer` has ever been
published. If it has not been published, no compatibility release is required.
If it has been published, deprecate it on npm with a message directing consumers
to `businesslens/nuxt/report-viewer`; do not publish another functional version
unless a compatibility period is explicitly chosen.

### 8. Simplify release automation

Change release automation to pack, smoke-test, and publish only:

```text
businesslens-<version>.tgz
```

Remove:

- separate report-viewer packing;
- separate report-viewer publication;
- publication ordering between the two public packages;
- separate version synchronization; and
- tarball outputs specific to `@businesslens/report-viewer`.

The root tarball checks must assert the presence of:

- the core Layer config;
- the theme Layer config;
- the shared Vue component and CSS;
- the compiled view-model JavaScript and declarations; and
- the generated static local viewer.

Continue enforcing a root-package size budget.

### 9. Migrate the landing application

In the landing repository:

- remove `@businesslens/report-viewer` from dependencies;
- change both `extends` entries to the new `businesslens` subpaths;
- change all view-model imports to `businesslens/report/view-model`;
- restore the three direct Fontsource dependencies;
- retain direct Nuxt, Vue, Tailwind CSS, and Nuxt UI dependencies;
- update source comments and design documentation that name the old package;
  and
- regenerate the pnpm lockfile.

Preserve landing ownership of catalog data, API behavior, SEO, errors, pull and
provenance actions, marketing styling, page backgrounds, and site chrome.

Nuxt UI must continue to load early enough for Nuxt Content prose components.
The landing project must retain higher configuration and CSS priority than both
shared Layers.

### 10. Simplify local PDD linking

Change the landing development link workflow to manage only:

```text
node_modules/businesslens -> PDD worktree
```

Remove all link, unlink, status, rollback, fixture, and validation handling for
`node_modules/@businesslens/report-viewer`.

The linked-root validation must instead confirm that the `businesslens`
worktree contains:

- both Layer configs;
- compiled view-model outputs;
- the root package manifest exports; and
- the existing CLI build artifacts.

Preserve ownership-safe rollback and the guarantee that link and unlink do not
modify package manifests or lockfiles.

### 11. Update documentation and naming

Replace functional references to `@businesslens/report-viewer` with the new
`businesslens` subpaths in:

- PDD README and CLI documentation;
- the Layer README;
- changelog entries;
- architecture plans;
- landing design documentation;
- source comments; and
- release documentation.

Keep historical references only when they are needed to explain an already
published package or migration path.

## Verification plan

### PDD checks

Run:

- root TypeScript typecheck;
- local-viewer typecheck and static generation;
- the complete `npm run verify` suite;
- `npm pack --dry-run`; and
- an explicit inspection of the packed root artifact.

Add or update tests that prove:

- the public view-model export projects the expected Product Report;
- the Vue component builds from the packed Layer;
- both Layer subpaths resolve from an installed `businesslens` tarball;
- the private viewer builds from the repository-relative Layers;
- the generated viewer remains inside the CLI tarball; and
- repository checks no longer require a separately public viewer package.

### CLI-only installation smoke test

Install the packed root tarball into an empty fixture without Nuxt host
dependencies and verify:

- the CLI runs;
- the report library exports work;
- `businesslens view --no-open` serves the generated viewer; and
- Nuxt, Vue, Tailwind CSS, Nuxt UI, and Fontsource packages are not installed
  transitively by `businesslens`.

### Nuxt consumer smoke test

Install the same root tarball into a minimal Nuxt fixture that directly provides
the required UI and font dependencies. Extend both public Layer subpaths and
run:

- `nuxt prepare`;
- TypeScript checking; and
- a production Nuxt build or generation.

Render a representative report and assert that Nuxt UI components, semantic
theme values, fonts, Layer CSS, and host overrides all resolve from the packed
artifact.

### Landing checks

Run:

- `pnpm typecheck`;
- lint and integration tests;
- the production build;
- Blueprint SSR and projection tests;
- PDD link and unlink integration tests;
- targeted Blueprint Playwright tests; and
- light, dark, desktop, and mobile screenshot checks.

Confirm that catalog error states, query-string sections, pull actions,
provenance, accessibility, and responsive behavior remain unchanged.

### Final reference audit

Search both repositories for:

```text
@businesslens/report-viewer
@businesslens/local-report-viewer
```

No functional reference to the public report-viewer package may remain.
References to the private workspace name may remain only if the workspace still
uses that name internally.

## Delivery order

1. Update architecture documentation and repository expectations.
2. Relocate the Layers under the `businesslens` root package.
3. Add root exports, packed files, and compiled view-model output.
4. Update and verify the private local viewer.
5. Validate the root tarball as both a CLI and a Nuxt Layer provider.
6. Migrate the landing application and local-link workflow.
7. Run parity, accessibility, build, and screenshot verification.
8. Remove the standalone public workspace and release automation.
9. Run full verification in both repositories.
10. Publish only `businesslens`, pin it in landing, and deploy.

Keep both repositories buildable at each delivery boundary. Do not delete the
old package workspace until the root exports and local viewer have passed their
packed-artifact checks.

## Definition of done

- `businesslens` is the only publicly packed and published npm package.
- Landing declares only one BusinessLens package dependency.
- The report-viewer and global theme Nuxt Layers load from sibling
  `businesslens/nuxt/*` subpaths.
- The shared view-model projection loads from a compiled `businesslens` export.
- Landing and `businesslens view` render the same shared component.
- Host configuration, CSS, and slots continue to override shared defaults.
- Nuxt UI and Nuxt Content module behavior remains correct.
- CLI-only installations do not acquire the Nuxt toolchain or font packages.
- The generated local viewer remains self-contained in the CLI artifact.
- Local PDD linking manages one installed BusinessLens package.
- Release automation performs one npm publication.
- Full verification passes in PDD and landing.
