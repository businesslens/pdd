# Resource navigation across report, docs and homepage

read_when: implementing or reviewing the six main resource collections.

Approved 2026-09-09. This is a historical implementation record: "Landing" is
the site's former separate repository, now `site/` of `itai-gendler/pdd-kit`,
and "PDD" is the rest of that repository. The durable site decision is
[ADR-0016](../../adr/0016-six-main-resource-collections.md); `itai-gendler/pdd-kit`
keeps its half of the rules in its own `AGENTS.md` rather than in a plan.
[ADR-0018](../../adr/0018-variations-is-the-seventh-main-collection.md) later
added Variations as a seventh card; read "six-card" below as the plan's count.

Landing owns the six-card homepage and child-type introductions, and the Blueprint
host's use of the shared report navigation. PDD owns the model, docs content,
viewer and CLI host. Existing graph rendering and matrix semantics are retained.

Documentation keeps its original UI. Experiences and Screens are sections of
the Interfaces document; the custom navigation tree and parent metadata are removed.
The original desktop and mobile hero artwork is retained per the user's follow-up;
the replacement assets are removed.

Validate the consolidated article and section links, homepage contents and responsive
layout, and report parity through the installed layer. Run the repository quality,
browser and visual gates; preserve unrelated authentication edits.

Implemented 2026-09-09, with documentation revised per the user's follow-up.
The earlier authentication merge conflicts are resolved. After the documentation
refinement, the actual checkout passes production build, both typechecks, lint,
the structural gates, 250 integration tests and all 16 documentation/vocabulary
browser tests. Original desktop/mobile navigation, merged sections, vocabulary
links and 301 redirects were verified. The earlier five authentication browser
checks also passed; the full unrelated browser suite was not repeated.

The canonical visual suite stops on homepage differences from the existing
light/dark baselines, before reaching docs. Baselines remain unchanged. The
performance check reported a separate 54-byte overage in preloaded JavaScript
Brotli after the docs refinement.

Hero restoration follow-up: the original responsive assets and component are
restored, and both replacements are deleted. Desktop/mobile browser checks,
production build, ESLint and editorconfig pass. Production output contains only
the original hero assets. Hero image budgets pass; the existing preloaded
JavaScript Brotli gate now measures 289,612 bytes against 289,500 (112 bytes over).

Surface grammar follow-up, 2026-09-10: the shipped report was reviewed and its
controls consolidated. Tabs are now its only switch, a surface is headed by the
name the reader clicked, ways out sit on that heading row, and named views are
tabs of the collection they belong to. Compare delivery and Composition became
tabs; All resources and connections was removed; the legacy URL migration was
deleted, so links shared earlier open the Overview. The six-card homepage and
child-type introductions this plan owns are unaffected.

Landing followed the linked package: the Blueprint host drops the retired
Scenario reading mode, and report parity reads tabs and collection headings
rather than view headings. Editorconfig, peers, lint, typecheck and knip pass.
The browser, visual and performance suites were not rerun. The rules this
follows are `itai-gendler/pdd-kit`'s Report viewer standards; the work is
[pdd#48](https://github.com/itai-gendler/pdd-kit/pull/48).

Consolidation follow-up, 2026-09-10: four further decisions closed upstream. The
Overview surface is the Product's own page, headed by the rail row that opens it
and qualified by `Product`, with About, Coverage and References as its readings;
nothing is labelled `Product Report`, which named the rendered artifact rather
than a resource type. Filters became one control per axis inside the reading
they narrow, with no size threshold, so two reports of the same renderer no
longer differ for an invisible reason. Compare delivery became a Capability by
Interface matrix. A resource type's mark is reserved to that type, and three
controls that had borrowed one now carry unreserved glyphs.

None of this changes what landing owns. The six-card homepage and child-type
introductions are unaffected, and the Blueprint host continues to render the
shared layer with no report-specific configuration. The public documentation pdd
authors was corrected in the same release; `docs/` there now explains the model
and leaves the report to explain itself.

Review follow-up, 2026-09-10: removed the two docs redirects added by this branch;
the consolidated sections need no backward compatibility. Removed the duplicate
navigation note from `CONTEXT.md`; ADR-0016 owns that decision.

Cleanup follow-up, 2026-09-12: issue #62's cleanup refreshed the deferred visual
baselines for the merged design. The production build also passed the existing
performance budgets.
