# Public terminology lives with the Product Model entities

`CONTEXT.md` remains the landing repository's internal vocabulary contract.
Public definitions are owned by the corresponding Product Model pages in
`businesslens/pdd/docs/` and rendered in the landing documentation tree.

A separate `pdd/docs/terminology.md` was described in several documents but
never existed. Creating it would duplicate the entity pages and create the same
drift those pages are intended to prevent.

## Decision

- Each public Product Model term is defined on its owning PDD documentation page.
- `CONTEXT.md` uses the same nouns internally and links to public documentation
  when a longer explanation is useful.
- There is no `/docs/terminology` route and no standalone public glossary.
- A vocabulary change reviews `CONTEXT.md` and the affected PDD entity pages in
  the same cross-repository change.

## Consequences

ADR-0009's dependency on `pdd/docs/terminology.md` and ADR-0010's comparison to
that two-file contract are superseded by this decision. The requirement that
marketing, documentation, and implementation use one vocabulary remains.
