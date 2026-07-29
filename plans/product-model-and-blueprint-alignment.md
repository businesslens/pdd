# Product Model and Blueprint Alignment Plan

read_when: changing `.businesslens/` terminology, Product Report v4,
build/publish/open behavior, or the contract between the open framework,
Platform Product Model Versions, private Blueprints, and public Hub delivery.

Status: Implemented follow-up to the Product Report v4 and Hub lifecycle work.

Last updated: 2026-07-29.

## 1. Executive decision

The open framework owns **product-model content**.

Platform owns **Blueprint identity and visibility**.

PDD must let a user:

- plan a new product model;
- map an existing product model;
- maintain and verify that model beside the code;
- build a source-free Product Report;
- publish the report as an immutable Platform Product Model Version;
- open a public or explicitly downloaded private Blueprint report into a new
  repository-owned model.

PDD must not:

- mark a model or report as a Blueprint;
- treat every draft product model as a Blueprint;
- add Blueprint IDs, visibility, pricing, or Hub publication state to
  `.businesslens/` or Product Report v4;
- create a public Hub record as a side effect of `publish`;
- become dependent on Platform for local model authoring or validation.

The canonical relationship is:

> PDD authors the product model and reports immutable Versions. Platform may
> turn a selected Version into a private Blueprint. Public Hub contains only
> the Blueprint revisions explicitly marked public.

## 2. Review of the current work

The current PDD work establishes the correct technical boundary:

- `businesslens-plan` authors a complete greenfield model at
  `coverage.status = draft`;
- `businesslens-init` maps an existing implementation;
- `validate` accepts draft models with evidence warnings;
- `build` emits `.businesslens/build/report.json`;
- Product Report v4 excludes repository, commit, workspace, Product/Project,
  Hub, pricing, and entitlement metadata;
- `publish` wraps the report in a target and separate Git-provenance envelope;
- Platform creates a new immutable Version for every valid publish;
- `open` validates and expands a report into canonical `.businesslens/`;
- the local build/open/build round trip is tested;
- trusted public Hub URLs and report digests are enforced.

These responsibilities should remain.

The required follow-up is primarily semantic and cross-repository:

1. most public docs, CLI help, package metadata, and skills still call
   `.businesslens/` the **product map** rather than the **product model**;
2. `docs/format.md` and related guidance call draft models “portable product
   blueprints,” which conflicts with Blueprint becoming an explicit Platform
   object;
3. publish documentation and the publish skill still use older “snapshot”
   language in places;
4. `open` currently accepts only anonymous public Hub URLs, while the planned
   Platform Hub will also contain private **My Blueprints** reports;
5. PDD and Platform vendor parallel Product Report schemas without a durable
   conformance-fixture gate.

## 3. Canonical terminology

| Term | PDD meaning |
| --- | --- |
| Product model | The complete repository-owned `.businesslens/` source artifact |
| Living product model | A product model maintained with the product and code |
| Draft product model | A planned greenfield model with relaxed evidence requirements |
| Product map | The visual or navigable representation of a product model |
| Product Report | The source-free portable build artifact derived from a product model |
| Product Model Version | The immutable Platform record created by reporting one Product Report |
| Blueprint | A private-by-default Platform object created from a selected Product Model Version |
| Blueprint Revision | One immutable selected Product Model Version in a Blueprint lineage |
| Public Blueprint | A Blueprint revision explicitly approved for anonymous Hub delivery |

Key rules:

- `coverage.status = draft` says evidence has not yet been earned. It does not
  say the model is a Blueprint.
- A draft, partial, or complete Version may become a Blueprint if Platform
  policy permits.
- The same Product Report contract works whether its Platform Version is never
  reused, becomes a private Blueprint, or becomes public.
- Product map and product model must not remain interchangeable names for the
  same source artifact.

## 4. Canonical lifecycle

```text
businesslens-plan / businesslens-init
        │
        ▼
.businesslens/ product model
        │
        │ validate and maintain
        │ businesslens build
        ▼
Product Report v4
        │
        │ businesslens publish
        ▼
Platform Product Model Version
        │
        │ Platform-only create Blueprint / add Revision
        ▼
Private Blueprint
        │
        │ Platform-only mark public
        ▼
Public Hub report
        │
        │ businesslens open
        ▼
new .businesslens/ product model
```

PDD participates in author, build, report, and open. Blueprint creation,
revision selection, and visibility are Platform operations.

## 5. Contract decisions

### 5.1 `.businesslens/`

Do not add:

- Blueprint frontmatter;
- private/public state;
- Hub slug;
- pricing/access fields;
- Platform Blueprint or Revision IDs.

The same model may be used normally, reported to Platform, or selected later
as a Blueprint without changing repository content.

### 5.2 Product Report v4

Keep Product Report source-free and Blueprint-neutral.

It contains only the product knowledge required to:

- inspect and validate the model;
- render product structure;
- compare immutable model states;
- reconstruct canonical `.businesslens/`.

Blueprint ownership, visibility, publication, release notes, pricing, and
entitlement remain Platform metadata.

### 5.3 Publish envelope

`ProjectSubmissionV4` continues to contain:

- target Product/Project slug and optional Git ref;
- separate Git provenance;
- exact Product Report.

Do not add a Blueprint target or `publishAsBlueprint` switch. `publish`
reports a Version; a later Platform action chooses whether that Version
belongs to a Blueprint.

The default `target.projectSlug = report.id` remains valid. `target.ref`
identifies the selected branch, tag, or pull-request Track: ordinary publish
uses the current branch, while explicit tag and PR options carry their ref
metadata. Add a separate Project-slug option only if an approved Platform
workflow needs a slug that differs from the stable report ID; do not add it
solely for Blueprint creation.

### 5.4 Open

`open` consumes Product Reports, not Blueprint records. It should remain
semantically indifferent to whether a report came from:

- a local build;
- an anonymous public Hub download;
- an authenticated private Blueprint download saved locally.

The current local-file flow already supports private Blueprint use:

```bash
businesslens open ./report.json
```

Authenticated remote opening is a later contract. It must use an explicit,
scoped, short-lived download token or equivalent capability. It must never
reuse:

- `BUSINESSLENS_API_KEY`;
- browser cookies;
- a general workspace submission key;
- credentials embedded in a URL.

Do not broaden `trustedReportUrl` until Platform defines the exact private
route, authentication mechanism, redirect policy, and digest behavior.

## 6. Required PDD changes

### Phase A — make product model the canonical artifact name

Update `docs/terminology.md` first, then propagate the decision.

Required wording:

- `.businesslens/` is the product model;
- product map is a view/visualization of the product model;
- greenfield planning creates a draft product model;
- the model remains repository-owned and useful offline.

Review:

- `README.md`;
- `package.json`;
- `docs/index.md`;
- `docs/guide.md`;
- `docs/product-map.md`;
- `docs/format.md`;
- `docs/quickstart.md`;
- tutorials;
- validation documentation;
- skill documentation;
- `src/cli.ts` help and user-facing messages;
- every `skills/businesslens-*/SKILL.md`;
- skill `agents/openai.yaml` labels and prompts;
- installed format/rubric/evidence references.

This is not a blind string replacement. Keep “map” when referring to:

- mapping as an action;
- a visual/navigable product map;
- map-specific UI or topology;
- legacy prose quoted for migration context.

Exit criterion: a repository user can distinguish the canonical product model
from its product-map visualization.

### Phase B — remove implicit Blueprint semantics from draft coverage

Change copy that currently says:

- “draft maps are valid portable product blueprints”;
- “build emits a reusable blueprint”;
- any equivalent wording that treats `draft` as Blueprint identity.

Replace it with:

> Draft product models are valid, portable planned models. They may build and
> report immutable Versions. Platform may later create a Blueprint from any
> valid selected Version.

Review at minimum:

- `docs/format.md`;
- `docs/guide.md`;
- `docs/cli.md`;
- `docs/validation-rules.md`;
- `docs/tutorial-plan-new-product.md`;
- `docs/skill-businesslens-publish.md`;
- planning, validation, and publishing skills.

No validator or schema change is required. Draft behavior remains:

- valid with evidence warnings;
- buildable;
- publishable as a private Product Model Version;
- not automatically reusable or public.

### Phase C — align publish language with Product Model Versions

Update the publish documentation and skill to say:

- `build` creates a Product Report;
- `publish` reports a new immutable Product Model Version;
- Git provenance is separate from the report;
- every publish creates a Version in the relevant Track;
- public Hub visibility is never a side effect.

Remove outdated “commit-pinned snapshot” and “one project tracks one branch”
language where the current implementation uses Git Tracks and immutable
Versions.

Review:

- `docs/skill-businesslens-publish.md`;
- `skills/businesslens-publish/SKILL.md`;
- `skills/businesslens-publish/agents/openai.yaml`;
- `docs/cli.md`;
- `docs/ci.md`;
- `src/cli.ts`;
- publish tests and expected error messages.

### Phase D — establish report-schema conformance

PDD and Platform currently maintain structurally equivalent Product Report v4
schemas in separate repositories.

Add a shared fixture contract containing:

- at least one complete valid report;
- at least one valid draft report;
- relationship failures;
- summary/count mismatches;
- evidence-rule cases;
- canonical JSON and digest expectations;
- build/open/build semantic equality.

Both repositories must consume the same fixture corpus or verify it from an
immutable shared source. A schema change is complete only when:

- PDD build output validates in Platform;
- Platform-delivered report validates in PDD;
- semantic validators report equivalent failures;
- canonical digest calculation agrees.

Avoid importing runtime code across repositories or making local validation
depend on network access.

### Phase E — private Blueprint report handoff

For the initial internal Platform rollout:

1. authorize and download the private Product Report in the browser;
2. save it locally;
3. run `businesslens open ./report.json`.

No PDD network change is required for that flow.

When remote private opening is approved:

1. define the private Platform endpoint and media type;
2. define a scoped one-use or short-lived download credential;
3. add an explicit CLI option for the token source without printing it;
4. extend the trusted path allowlist narrowly;
5. keep redirect refusal, size limit, timeout, digest verification, and
   overwrite safety;
6. add credential-redaction and token-scope tests.

Public anonymous Hub opening must remain credential-free.

### Phase F — update tests and release checks

Add or update tests for:

- CLI help uses product-model language;
- draft build/publish does not claim Blueprint creation;
- publish payload contains no Blueprint state;
- Product Report contains no Blueprint metadata;
- local opening works for a downloaded private report;
- public remote opening remains origin/path restricted;
- schema conformance fixtures pass in both repositories;
- docs frontmatter/order and installed skill copies remain valid.

Run every skill through the repository’s required skill validation and update
the changelog before release.

## 7. Source change map

Expected PDD areas:

- `package.json`: package description;
- `README.md`: primary positioning and command descriptions;
- `docs/terminology.md`: canonical vocabulary;
- `docs/product-map.md`: visualization rather than artifact identity;
- `docs/format.md`: product-model contract and draft semantics;
- `docs/guide.md`: lifecycle;
- `docs/cli.md`: build/publish/open descriptions;
- `docs/ci.md`: immutable Version publishing;
- tutorials and validation documentation;
- `docs/skill-businesslens-*.md`;
- `skills/businesslens-*/SKILL.md`;
- `skills/businesslens-*/agents/openai.yaml`;
- skill reference copies;
- `src/cli.ts`: help text;
- `src/commands/build.ts`: user-facing output only if needed;
- `src/commands/publish.ts`: user-facing output only if needed;
- `src/commands/open.ts`: no private-network change in the initial phase;
- `src/core/portable.ts`: fixture conformance, not Blueprint fields;
- build, publish, open, CLI, and end-to-end tests.

## 8. Cross-repository dependencies

### Platform

Platform must:

- create Blueprint identity from an existing Product Model Version;
- keep Blueprints private by default;
- maintain immutable Blueprint Revisions without copying Product Reports;
- expose private report download only with workspace authorization;
- expose anonymous reports only when the Blueprint is marked public;
- preserve digest and round-trip behavior.

### Landing

Landing must:

- use product model as the concrete company noun;
- explain PDD as the authoring/maintenance path;
- explain Blueprint as a Platform object created from a Version;
- describe Hub as **My Blueprints** plus **Public**;
- label the internal-only launch state accurately.

## 9. Acceptance criteria

- `.businesslens/` is consistently called the product model.
- Product map is reserved for the model’s visual/navigable representation.
- Draft coverage is never presented as automatic Blueprint identity.
- Build, publish, and open responsibilities remain offline-first and explicit.
- Product Report v4 and the publish envelope contain no Blueprint state.
- Publish reports an immutable Product Model Version and never makes it public.
- A private Blueprint report downloaded from Platform opens locally without a
  PDD format conversion.
- Public remote Hub opening retains strict trust and digest rules.
- PDD and Platform pass the same report conformance fixtures.
- All docs, skills, CLI help, and package metadata use the same lifecycle.

## 10. Verification

After implementation:

```bash
npm run verify
```

Before a release:

```bash
npm pack --dry-run
```

Also run the required validator against every `SKILL.md` and validate the
Claude plugin when its CLI is available.

End-to-end:

1. plan a draft product model;
2. validate and build it;
3. publish it as a Product Model Version;
4. create a private Blueprint in Platform;
5. download its report;
6. open the report into an empty repository;
7. rebuild and compare semantic equality;
8. mark the Blueprint public in Platform;
9. open the pinned anonymous public report;
10. confirm the same semantic result.

## 11. Non-goals

- Adding a Blueprint editor to PDD or Platform through this repository.
- Adding Blueprint identity to `.businesslens/`.
- Adding private/public state to Product Report v4.
- Automatically creating a Blueprint during `publish`.
- Automatically treating draft coverage as reusable.
- Granting customer public Hub publication rights.
- Relaxing remote URL, redirect, size, digest, or overwrite protections.
- Making local authoring or validation require a BusinessLens account.
