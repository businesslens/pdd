# Screens and supporting references

## Objective

Extend the BusinessLens Product Model with a platform-neutral Screen entity so
websites and mobile applications can describe meaningful user-visible views
without bringing component specifications, screenshots, capture workflows, or
other implementation material into the model.

Supporting material remains outside `.businesslens/`. Existing entity `links`
provide typed references to it and are structurally validated without being
treated as proof of product or implementation alignment.

## Product boundary

A Screen is a meaningful user-visible view where product information or
capabilities are exposed. It is not necessarily a web page, URL, mobile view
controller, component, route file, or full-screen presentation.

Screens model:

- the Experiences in which the view appears;
- the Features it exposes;
- optional Scenarios in which it participates;
- optional product-facing URLs or deep links;
- information presented to the user;
- actions available to the user;
- product-significant states; and
- the Screen's capability boundary.

Screens do not model:

- component trees or design systems;
- framework routes, source modules, selectors, or view controllers;
- responsive breakpoints, themes, hover states, or visual variants;
- screenshot storage, generation, capture, freshness, or comparison;
- sitemaps, navigation stacks, or manually maintained transition graphs.

A product-significant state belongs in the model when it changes what the user
understands, what the user can do, or the product outcome. Empty, unavailable,
unauthorized, validation-failure, and completed states normally qualify.
Skeletons, themes, viewport variants, and transient presentation details do not.

## Platform model

No `platform` field or platform taxonomy is added. Experience remains the
product's stable audience-and-capability boundary. Web and mobile are separate
Experiences only when that boundary materially differs; otherwise one
Experience may expose multiple entry points.

One Screen may relate to one or more Experiences. The same Screen represents
web and mobile when its purpose, information, actions, states, and capability
boundary are materially shared. Separate Screens are authored when those
product semantics differ.

Optional Screen `entryPoints` reuse the existing compact entry-point shape for
public product addresses such as web routes and supported mobile deep links.
Internal navigation identifiers remain outside the model. Source-free
projection must preserve rooted product routes and non-file URI schemes while
removing repository paths and `file:` URLs.

## Authored shape

Screens live at `screens/<screen-id>.md`. The collection is optional because
CLI, API, and other non-visual products must remain valid.

```markdown
---
experiences: [blueprint-catalog]
features: [inspect-blueprint]
scenarios: [inspect-listed-blueprint]
entryPoints:
  - web: /blueprints/:slug
  - ios: businesslens://blueprints/:slug
links:
  - rel: visual
    href: docs/ui/blueprint-record.png
    title: Current visual reference
---

# Blueprint record

Shows the information needed to understand and use a Blueprint.

## Intent

Help users decide whether the Blueprint fits their product.

## Information presented

- Blueprint purpose
- Supported experiences
- Included journeys and rules

## Available actions

- Copy the pull command
- Inspect product behavior

## Product states

### Available

The Blueprint can be inspected and pulled.

### Unavailable

The reason it cannot be used is explained.

## Capability boundary

The screen does not edit or execute the Blueprint.
```

Required Screen contract:

- lowercase kebab-case filename ID;
- H1 title and lead description;
- at least one valid `experiences` relation;
- at least one valid `features` relation;
- `## Information presented` containing at least one bullet;
- `## Capability boundary` containing non-empty prose.

Optional Screen contract:

- `scenarios` relations;
- compact `entryPoints`;
- `## Intent`;
- `## Available actions` containing bullets when present;
- `## Product states` containing H3 names with non-empty descriptions;
- universal `codeRefs` and `links`; and
- unrecognized H2 supporting content.

Screen relations are owned by the Screen. Experiences, Features, and Scenarios
do not duplicate Screen ID lists; consumers derive backlinks.

## Sitemaps and navigation

BusinessLens does not add a Sitemap entity. An XML sitemap is an implementation
and SEO artifact. A UX sitemap or information-architecture diagram may be an
external `doc` or `visual` link. A screen inventory is a generated projection
of Screens grouped by Experience. Goal-oriented movement remains modeled by
Journeys and Scenarios.

No `parentScreen`, `nextScreen`, or generic transition relations are introduced
until a concrete product question cannot be answered through Experiences,
Screens, Journeys, and Scenarios.

## Supporting references

The existing `links` field remains the only supporting-reference mechanism. Its
meaning expands from an SDD-only bridge to supporting content maintained outside
the Product Model.

Existing relation kinds remain:

- `spec`
- `proposal`
- `doc`
- `adr`

New relation kinds are:

- `visual` for screenshots, mockups, prototypes, and design references;
- `research` for supporting product research.

Lint validates structure, supported relation kinds, URL syntax, safe schemes,
and repository-relative targets after removing query strings and fragments.
Remote resources are not fetched. BusinessLens never stores, copies, downloads,
generates, or assesses a referenced screenshot. Verify surfaces lint findings
but never treats the existence of a reference as evidence of correctness.

Repository-relative references remain useful inside their owning repository and
are removed from source-free reports. Public HTTP(S) references are preserved.

## Compatibility and schemas

The folder format advances to schema `2`. Schema `1` models remain readable and
valid when they contain no Screens. A `screens/` collection requires schema `2`,
and unknown future folder schemas fail explicitly instead of being silently
interpreted.

Adding a first-class `model.screens` collection changes the strict Product
Report wire shape, so exports advance to Product Report v5. Readers continue to
accept Product Report v4 and normalize it in memory with an empty Screen
collection. New exports emit v5, and `open` reconstructs schema `2` models.

Screens participate in report summary, coverage counts, navigational mapped
counts, source-free redaction, validation, export, and expansion.

## Implementation sequence

1. Update `spec/format.md` before parser or lint behavior.
2. Add Screen Markdown parsing and folder-schema validation to the core model.
3. Extend entry-point classification and the existing link grammar.
4. Add Screen relationship, required-section, state, reference, and count linting.
5. Add Product Report v5 schemas and v4-to-v5 normalization.
6. Extend export, redaction, open, SDK exports, and CLI summaries.
7. Add the flat `docs/screens.md` entity page and update related user docs.
8. Update all installed skill format references and mapping, ideation, and
   verification guidance while preserving their self-contained behavior.
9. Expand the golden fixture and add parser, lint, cross-platform, redaction,
   compatibility, SDK, and round-trip tests.
10. Run `npm run verify` and validate every public skill with the skill-creator
    validator. Do not publish, tag, or push as part of this work.

## Acceptance criteria

- Existing screenless schema `1` Product Models continue to lint.
- New schema `2` models may contain zero or more Screens.
- The same Screen contract supports web routes, mobile deep links, both, or no
  direct entry point.
- Screens cannot reference missing Experiences, Features, or Scenarios.
- Product states remain embedded Screen content rather than standalone files.
- Local and public supporting links are structurally validated, but no remote
  content or screenshot is managed by BusinessLens.
- Product Report v5 round-trips Screens without losing product content.
- Product Report v4 remains accepted and expands without Screens.
- Source-free reports remove repository-local Screen links and code references
  while preserving public links and product-facing entry points.
- No Sitemap, Navigation, Visual Reference, or Screen State entity is added.
