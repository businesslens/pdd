# Shared BusinessLens Theme Lab

## Decision

BusinessLens has two different visual responsibilities and must keep them
separate:

- `businesslens/nuxt/theme` is the stable, production-safe visual foundation.
  It owns fonts, semantic color tokens, typography, selection, scrollbars, the
  approved page surfaces, the approved brand renderer, and the complete
  logo/wordmark/browser-icon identity that every
  BusinessLens Nuxt host can adopt without also adopting experiments.
- `businesslens/nuxt/theme-lab` is an optional layer that extends `theme`. It
  owns the undecided background variants, their experiment state, and the
  shared background control.

Both the landing application and the local OSS report viewer opt into
`theme-lab`. That shared host flow lets the same background concept be auditioned
against both the marketing site and a dense Product Report. Consumers that do
not opt in receive the approved stable presentation from `theme`.

## Ownership boundaries

### Stable theme

`layers/nuxt/theme` owns only reusable visual primitives:

- the BusinessLens font faces;
- brass, terracotta, umber, and semantic Nuxt UI token mappings;
- base typography and browser chrome styling;
- the approved light and dark page surfaces;
- the approved mark and wordmark artwork at canonical, non-variant paths;
- the shared brand renderer and complete favicon/install-icon family;
- the stable head composable that registers those icons;
- no navigation, product copy, experimental selectors, or report-specific
  presentation.

### Shared theme lab

`layers/nuxt/theme-lab` owns:

- the background variant registry and alternative CSS implementations;
- cookie-backed experiment state with SSR-safe defaults;
- document attributes and browser theme color derived from the selected backgrounds;
- the background experiment row;
- the common sticky lab bar and its extension slots.

The lab's initial selections remain Glow for light mode and Espresso for dark
mode. The approved identity is never overridden by a lab selection.

### Host applications

Hosts compose their own shells and decide which controls are visible.

- The landing application keeps its production navigation and its
  landing-only blog, CTA, and hero experiments. Those controls are injected
  into the shared lab bar through slots; they are not moved into the shared
  layer.
- The OSS report viewer composes `report-viewer` and `theme-lab`, using the same
  stable identity, experimental backgrounds, and shared one-row lab as the
  landing application. Its navigation is intentionally narrower:
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

Background state is persisted by stable cookie keys so the same browser
selection can survive rebuilds and SSR hydration. The composables, not host
layouts, stamp the selected backgrounds onto the document. Hosts consume the
public state and components; they do not duplicate registries or CSS.

The shared bar supports host-specific rows through explicit `before` and
`after` slots plus a declared row count. The declared count drives one shared
CSS offset variable, which keeps sticky host navigation aligned without the
lab needing to know its contents.

## Composition and promotion

1. Keep the report renderer on the stable theme so it remains usable without
   experimental controls.
2. Compose `report-viewer` and `theme-lab` in the local viewer host, matching the
   landing application's design flow.
3. Add shared experiments to the lab and exercise them in both hosts.
4. When a background is approved, move its stable implementation to `theme`
   and delete its alternatives and control from `theme-lab`.
5. Keep host navigation, product copy, legal links, and report layout outside
   both visual layers.

## Future shared variants

A future shared experiment is added in one place:

1. add its metadata and stable id to the background registry;
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
- The approved mark, wordmark, and favicon render identically in both hosts and
  cannot be changed through the lab.
- The landing application retains four experiment rows: Blog, CTA, background,
  and the route-specific hero or Blueprint row.
- The OSS viewer exposes only the shared background row.
- Both navbars account for the lab height and remain independently composed.
- Hiding the lab removes its layout offset but keeps the selected variants.
- A consumer can adopt the stable theme without receiving any lab UI or
  experimental visual choices.
- Package, type, unit, integration, and production-build checks pass.
