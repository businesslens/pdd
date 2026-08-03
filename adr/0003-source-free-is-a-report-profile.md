# Source-free is a Report profile, not what a Blueprint is

Supersedes [ADR-0002](./0002-blueprint-means-source-free.md).

**Blueprint** returns to its original meaning: a Product Report curated into the
public catalog, under a slug. **Catalog Entry** is withdrawn — it existed only
to hold the meaning ADR-0002 displaced. Source-free becomes what it always was
in the code: a **profile** a Product Report can be in.

ADR-0002 needed a name for the thing `export` produces and took one that was
already load-bearing — in public copy, in the `/api/v1/blueprints/:slug` wire
contract, and in this repository's own `blueprints/<slug>/` directory. Three
places pinned the old meaning against one place needing a new one.

## What decided it

A Product Report will not always be source-free. Exporting for the catalog
strips repository-specific navigation because the report crosses an ownership
boundary; exporting a full product instance inside the boundary that owns the
code may keep it. So a Report with `codeRefs` is still a Product Report—and is
definitively not a Blueprint. Redaction cannot be the identity of anything.

The format already said so. `src/core/portable.ts` carries
`coverage.evidenceRedacted` as an optional boolean on the report, and
`validateProductReport` enforces that it agrees with the contents. Redaction has
always been a property an artifact *has*, never a category it *belongs to*.

Both definitions in circulation were describing different layers, which is why
neither felt wrong: the catalog definition names a **role** the artifact plays;
ADR-0002 named a **profile** of its contents. One term cannot carry both.

## The model

| Term | Meaning |
| --- | --- |
| **Product Model** | `.businesslens/` — cites this repository's code |
| **Product Report** | the portable serialization of a Product Model. One format, two profiles |
| — *source-free* | `evidenceRedacted: true`. No `codeRefs`, no repository-relative links or entry points. Required whenever a report crosses an ownership boundary |
| — *source-linked* | `codeRefs` intact as optional navigation. For a full product instance, inside the boundary that owns the code |
| **Blueprint** | a Product Report curated into the public catalog, under a slug. Always the source-free profile, because that is what the catalog accepts |

`listed` and `withdrawn` return to Blueprint, where they were before.

## Consequences

- **No behavior changes.** `blueprint export` still redacts, `contribute` still
  redacts again before publishing, and `blueprints:check` still rejects
  repository-specific source metadata on every pull request independently. The good decision from ADR-0002
  survives; only its vocabulary is withdrawn.
- **The CLI namespace stops being aspirational.** `businesslens blueprint export`
  means *export for blueprint purposes*, and produces exactly the profile the
  catalog accepts. It never claimed to emit a catalog entry.
- **The glossaries agree again.** `CONTEXT.md` in the landing repository states
  that it and `pdd/docs/terminology.md` must match; ADR-0002 broke that, and
  this restores it without the landing repository changing anything.
- **A future top-level `export` cannot reuse the deprecated alias.** Bare
  `export` currently aliases `blueprint export`, which redacts. If a later
  top-level `export` means *source-linked*, the same command a user types today
  would silently begin carrying source paths — the worst direction for a
  disclosure-relevant default. The alias must be removed, and a release apart,
  before that name is reused.
- **`open` will eventually need to tell the profiles apart.** It strips
  `codeRefs` on every expansion today, which is right for the only case that
  exists—a report arriving from elsewhere. A source-linked instance report
  reopened into its origin repository should keep them, so `open` will need to
  establish that it is expanding into the origin, and refuse to keep source navigation
  when it cannot.

The v4 field and API function retain the historical names
`coverage.evidenceRedacted` and `redactSourceEvidence` for wire compatibility.
ADR-0005 defines the current semantics: codeRefs are bookmarks, never proof.
