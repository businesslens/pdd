---
title: publish
description: Build and report an immutable Product Model Version with trusted credentials and Git provenance.
section: open-source
group: CLI
order: 26
---

# `businesslens publish`

Build the local Product Model, pin it to the current Git revision, and submit
it to the BusinessLens Platform:

```bash
export BUSINESSLENS_API_KEY=... # workspace project key
npx businesslens@latest publish
```

Every successful submission creates a new immutable Version in a branch, tag,
or pull-request Track. Existing Versions are never replaced, and a failed
publish is safe to retry.

Publishing is an explicit network action. Agent sessions should invoke the
`businesslens-publish` skill, which performs preflight checks and uses the
bundled runner to isolate the CLI from target-local npm binaries and
configuration.

## Prerequisites

Before submitting, the command requires:

- a valid `.businesslens/` model;
- `BUSINESSLENS_API_KEY` in the environment;
- an `origin` that normalizes to a public HTTPS URL without credentials;
- no uncommitted tracked files; and
- no uncommitted or untracked authored files under `.businesslens/`.

The command first performs a [`build`](./cli-build.md), then adds the
repository URL, branch, commit, commit message, and commit time to a separate
submission envelope. These provenance fields are not added to `report.json`.

## Choose the Track

With no ref option, the command publishes into a Track for the checked-out
branch:

```bash
npx businesslens@latest publish --yes
```

Other targets are:

```bash
# HEAD must be the commit referenced by this existing tag
npx businesslens@latest publish --tag v1.2.0 --yes

# Pull-request metadata
npx businesslens@latest publish \
  --pull-request 42 \
  --base-branch main \
  --pr-title "Add saved searches" \
  --pr-url "https://github.com/acme/shop/pull/42" \
  --yes
```

| Target | Requirements |
| --- | --- |
| Current branch | A checked-out branch |
| `--tag <name>` | The tag exists and points at `HEAD`; detached HEAD is allowed for that exact tag |
| `--pull-request <number>` | A positive PR number and `--base-branch <name>` |

`--tag` and `--pull-request` are mutually exclusive. `--base-branch`,
`--pr-title`, and `--pr-url` are valid only with `--pull-request`.

## Options

| Option | Meaning |
| --- | --- |
| `--yes` | Skip the interactive confirmation; required in non-interactive sessions |
| `--tag <name>` | Publish `HEAD` into the named tag Track |
| `--pull-request <number>` | Publish into the numbered pull-request Track |
| `--base-branch <name>` | Set the PR base branch; required with `--pull-request` |
| `--pr-title <title>` | Include optional pull-request title metadata |
| `--pr-url <url>` | Include an optional absolute pull-request URL |

Without `--yes`, an interactive terminal displays the product, abbreviated
commit, target, and Platform origin before asking for confirmation. A
non-interactive session without `--yes` is refused with exit code `2`.

## What the submission exposes

The report names the origin repository in several places: `codeRefs`, journey
`entryPoints`, repository-relative `links`, and `coverage.sourceAreas`. A
published Product Model Version is private to its workspace, and that evidence
is what makes it useful there.

Evidence never travels further. Before the Platform serves a report as a
download or as a public Hub Blueprint, it applies `redactSourceEvidence` from
the shared [`businesslens/report`](./format.md#source-evidence-and-redaction)
contract, which removes all of it. Publishing does not make anything public: it
records an immutable Version, and Blueprint creation and visibility are
separate Platform actions.

Author-written prose is delivered as written, so keep repository internals out
of `method`, `unmapped`, `limitations`, and entity prose.

Git provenance — repository URL, branch, commit, and commit subject — travels
beside the report in the submission envelope, never inside it.

## Platform and credential safety

The destination comes from `platform.url` in `.businesslens/config.yaml` and
defaults to `https://app.businesslens.io`. The API key is read only from
`BUSINESSLENS_API_KEY`.

To prevent credential disclosure, a remote destination must be the official
origin. Local development may use HTTP or HTTPS on any port with
`localhost`, `127.x.x.x`, or `::1`:

```yaml
platform:
  url: http://localhost:3000
```

Credentials, URL paths, query strings, and fragments are rejected before any
request.

## Platform failures

| Status | Meaning |
| --- | --- |
| `400` | The payload was rejected; fix the listed model issues |
| `401` | The Platform rejected `BUSINESSLENS_API_KEY` |
| `403` | The key cannot submit projects; create a workspace project key |
| `409` | The submission conflicts with the existing project; inspect the listed conflicts |
