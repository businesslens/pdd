# Shared BusinessLens Theme Lab

## Decision

BusinessLens has two different visual responsibilities and must keep them
separate:

- `businesslens/nuxt/theme` is the stable, production-safe visual foundation.
  It owns fonts, semantic color tokens, typography, selection, scrollbars, and
  other primitives that every BusinessLens Nuxt host can adopt without also
  adopting experiments.
- `businesslens/nuxt/theme-lab` is an optional layer that extends `theme`. It
  owns the currently undecided brand presentation: page backgrounds, logo
  marks, lockups, generated favicon families, experiment state, and the shared
  experiment controls.

Both the landing application and the local OSS report viewer opt into
`theme-lab` for now. Once a background, mark, or lockup is selected as final,
that stable choice can be promoted to `theme` and the corresponding experiment
removed from the lab without changing either host's application shell.

## Ownership boundaries

### Stable theme

`layers/nuxt/theme` owns only reusable visual primitives:

- the BusinessLens font faces;
- brass, terracotta, umber, and semantic Nuxt UI token mappings;
- base typography and browser chrome styling;
- no navigation, product copy, logo selection, favicon selection, or page
  background selection.

### Shared theme lab

`layers/nuxt/theme-lab` owns:

- the background variant registry and CSS implementations;
- the mark and lockup registry;
- the active mark and lockup SVG assets only;
- favicon assets for the active mark variants only;
- cookie-backed experiment state with SSR-safe defaults;
- document attributes and metadata derived from the selected variants;
- the shared BusinessLens brand renderer;
- the background and brand experiment rows;
- the common sticky lab bar and its extension slots.

The canonical initial selections remain Glow for light mode, Espresso for dark
mode, Bare for the mark, and Stamp for the lockup. They are defaults within the
lab, not yet stable-theme commitments.

### Host applications

Hosts compose their own shells and decide which controls are visible.

- The landing application keeps its production navigation and its
  landing-only blog, CTA, and hero experiments. Those controls are injected
  into the shared lab bar through slots; they are not moved into the shared
  layer.
- The OSS report viewer uses the same brand renderer, backgrounds, favicon
  state, and shared two-row lab. Its navigation is intentionally narrower:
  BusinessLens logo and version, theme-lab toggle, repository, color mode, and
  View docs. The repository link mirrors the landing's rounded GitHub treatment
  but uses a stable GitHub label instead of fetching or freezing a star count in
  the offline viewer. Its utility spacing is set by the host so the narrower
  cluster retains the same visual rhythm.
- The host-neutral report renderer remains unaware of both navigation and the
  theme lab.

## Public contract

Consumers opt in with:

```ts
extends: [
  'businesslens/nuxt/report-viewer',
  'businesslens/nuxt/theme-lab'
]
```

The lab extends the stable theme, so a host must not also extend
`businesslens/nuxt/theme` directly. The layer exposes auto-imported
composables and components with `BusinessLens` names to avoid collisions with
host code.

State is persisted by stable cookie keys so the same browser selection can
survive rebuilds and SSR hydration. The composables, not host layouts, stamp
the selected variants onto the document. Hosts consume the public state and
components; they do not duplicate registries or CSS.

The shared bar supports host-specific rows through explicit `before` and
`after` slots plus a declared row count. The declared count drives one shared
CSS offset variable, which keeps sticky host navigation aligned without the
lab needing to know its contents.

## Migration

1. Add and export `layers/nuxt/theme-lab`, including its variant registries,
   assets, CSS, composables, brand component, and shared controls.
2. Move active background, logo, lockup, and favicon ownership out of the
   landing application and into the new layer. Do not copy rejected variants.
3. Migrate the OSS local viewer to the lab and replace its generic scan brand
   with the selected BusinessLens identity, package version, favicon, and
   controlled production-like navigation.
4. Migrate the landing application to the shared state and controls, retaining
   only its application-specific experiment rows.
5. Update package validation, linking fixtures, documentation, and visual
   tests. Verify the layer in a packed consumer as well as both real hosts.

## Future shared variants

A future shared experiment is added in one place:

1. add its metadata and stable id to the relevant lab registry;
2. add its implementation and assets to `theme-lab`;
3. expose selection through a lab composable and shared row;
4. let every opted-in host receive it automatically.

When the experiment becomes a product decision, move the chosen primitive to
`theme`, delete the alternatives and selector from `theme-lab`, and preserve a
small compatibility migration for any persisted cookie value. Host-specific
experiments never enter the shared registry unless more than one host truly
needs the same decision surface.

## Acceptance criteria

- Light and dark backgrounds render identically in both hosts for the same lab
  selection.
- Mark, lockup, and favicon selections render identically in both hosts.
- The landing application retains all five existing experiment rows.
- The OSS viewer exposes only the shared background and brand rows.
- Both navbars account for the lab height and remain independently composed.
- Hiding the lab removes its layout offset but keeps the selected variants.
- A consumer can adopt the stable theme without receiving any lab UI or
  experimental visual choices.
- Package, type, unit, integration, and production-build checks pass.
