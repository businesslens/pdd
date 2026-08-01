# A Blueprint is a source-free Product Model

**Blueprint** used to mean "a Product Model curated into the public catalog."
It now means "a Product Model with no source evidence" — no `codeRefs`, no
repository-relative links or entry points. The catalog thing it used to name is
now a **Catalog Entry**.

The old definition made the word unusable as a CLI namespace. `businesslens
blueprint export` would have exported something that was not a Blueprint, since
nothing local had been curated into anything. Naming the namespace after the
destination rather than the artifact was possible, but it left every command in
it operating on a thing the glossary had no name for.

The new definition is **structural and decidable**: look at the artifact and ask
whether it cites this checkout's files. That was already the line the code drew
— `redactSourceEvidence` ran on both the contribute and open paths — it just had
no name. Now `blueprint export` redacts too, so all four namespace members
produce or consume the same thing, and the namespace is named after it.

## What moved

| Term | Was | Is |
| --- | --- | --- |
| Product Model | `.businesslens/` | unchanged — cites this repo's code |
| Blueprint | a model curated into the catalog | a model with no source evidence |
| Product Report | the source-free representation | the file format a Blueprint travels in |
| Catalog Entry | *(no name)* | a Blueprint the catalog stores under a slug |

The `listed` / `withdrawn` state machine belongs to Catalog Entry, not to
Blueprint. Those states only ever described the catalog record.

## Considered options

- **Keep the definition and name the namespace after the destination.**
  Cheapest — one clarifying sentence, no ADR, and CLI namespaces routinely name
  a domain rather than an existing instance (`gh repo create` creates a repo
  that does not exist). Rejected because "the thing `export` produces" deserved
  a name regardless, and there was already an unnamed concept sitting there.
- **Absorb Product Report entirely.** One term instead of two, and the grammar
  reads perfectly. Rejected because `ProductReportV4` is a schema name, a wire
  payload the hosted catalog serves, and a filename — a format genuinely
  distinct from what it carries.
- **Name the namespace `report` or `catalog`.** No glossary pressure at all.
  Rejected because `catalog` would lie about `export` and `open`, which never
  touch the network, and `report` names the envelope rather than the contents.

## Consequences

- **The wire contract now uses the old vocabulary.** `/api/v1/blueprints/:slug`
  and the `x-businesslens-blueprint` header name what this glossary calls a
  Catalog Entry. Renaming them would be a coordinated change with the hosted
  catalog for no user-visible benefit, so they stay. This is the one place the
  protocol and the glossary disagree, and it is deliberate.
- `blueprints/<slug>/` in this repository holds Catalog Entry sources. The
  directory name is unchanged for the same reason.
- "Source-free" now means one thing. It previously meant only "does not leak the
  origin repository URL" — `test/e2e.test.ts` asserted a *"source-free report"*
  whose `codeRefs` were fully intact.
- Coverage keeps its `mapped` counts through redaction, so a Blueprint still
  records how much of the model it came from was evidence-backed — just not by
  what.
