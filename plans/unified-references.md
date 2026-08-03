# Unified References

Status: approved for implementation

## Goal

Replace the separate `codeRefs` and `links` concepts with one universal,
repeatable `references` field. References connect a product-model entity to
material outside the model without turning that material into product truth.
The model remains self-contained: a reference can support intent, point at an
implementation artifact, or provide context, but it never replaces the
entity's product prose.

Coverage remains a Product Model overview of mapping breadth. It must not be
derived from references or imply implementation verification.

## Contract

Every semantic entity may contain:

```yaml
references:
  - kind: visual
    role: intent
    target: https://example.com/checkout-design
    title: Checkout design
  - kind: code
    role: implementation
    target: src/checkout/submit.ts#submitOrder
```

- `kind`: `code | spec | proposal | doc | adr | visual | research`
- `role`: `intent | implementation | context`
- `target`: a non-empty string
- `title`: an optional non-empty display label

`kind` says what the referenced artifact is. `role` says why it is attached to
this entity. It does not claim that the artifact is current, verified, or
evidence of alignment.

References are allowed on Product, Actor, Interface, Experience, Screen,
Domain, Capability, Journey, Scenario, and Business Rule. They are not allowed
on configuration, Coverage, or taxonomies. Reference records are strict: all
fields except `title` are required and unknown fields fail lint.

## Target rules

- `code` targets use the existing `path`, `path#symbol`, `path:start-end`, or
  `path:start-end#symbol` grammar. Their path must be repository-relative and
  tracked. HTTP targets are invalid. Any role is permitted, including intent.
- Other kinds accept an HTTP(S) URL or a repository-relative path. Absolute
  paths, `file:` URLs, and other schemes are invalid. Missing local targets
  warn without failing lint; remote targets are syntax-checked but not fetched.
- Two references on the same entity may not have the same target.

## Portable report

Keep folder schema 3 and Product Report v6 because neither has shipped.
Reports declare a reference profile. Compilation may produce a workspace
profile, while Blueprint export and import projection produce the portable
profile.

The portable profile removes:

- every `kind: code` reference;
- every `role: implementation` reference;
- every repository-relative reference target; and
- repository-local Coverage source areas and entry points.

Only HTTP(S) intent or context references survive. Replace the old evidence
redaction API and terminology with a portable-report projection. Validation
must reject a report that declares the portable profile but still contains
repository-local material.

Remove `coverage.mapped`, reference-derived counts, and
`coverage.evidenceRedacted`. Entity totals remain in the report Summary;
Coverage describes only status, method, inspected source areas, intentionally
unmapped areas, limitations, and rationale.

## Documentation and workflows

- Replace the Code refs and coverage page with one References entity-extension
  page explaining kinds, roles, target rules, portability, and lint findings.
- Move the complete Coverage contract to the Product Model overview page.
- Keep Screens focused on product structure. Mention that screenshots,
  mockups, and other visual artifacts stay external and link to References.
- Update every entity page, CLI page, README, changelog, skills, rubrics, and
  installed-model README to use the unified vocabulary.
- Mapping may add implementation/context references discovered in the repo.
  Ideation may add intent/context references and preserve useful existing ones.
  Verification may navigate implementation references but must never treat
  them as proof or change product prose merely to refresh bookkeeping.

## Migration and acceptance

- Convert every fixture and Blueprint `codeRef` to a `code` reference with
  `role: implementation`.
- Convert existing supporting links by artifact kind and role: curated designs
  and proposals normally use intent; research normally uses context.
- Keep the checked-in Blueprint comprehensive while its exported report stays
  source-free.
- Add parser, lint, SDK, export/open/pull/contribute, and end-to-end tests for
  strict records, duplicate targets, code grammar, tracked paths, local-path
  warnings, portable filtering, and Coverage independence.
- Run `npm run verify`, validate every skill, validate the Claude plugin when
  available, and inspect `npm pack --dry-run`.
