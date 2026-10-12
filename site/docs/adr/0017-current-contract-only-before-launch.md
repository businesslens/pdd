# Only the current contract before launch

Status: accepted and implemented in Landing; coordinated CLI cleanup is in PDD.

read_when: removing obsolete behavior or deciding whether an older caller needs support.

BusinessLens has no customers and has not launched. Publication of a URL or
installation of a package does not, by itself, justify keeping an obsolete
implementation. The current producer and consumer must agree; historical ones
do not require adapters, redirects, aliases, or old-schema readers.

This supersedes the redirect requirements in ADR-0007 and ADR-0010 and the
released-contract exemption previously recorded in `AGENTS.md` and the routing
documentation. Their vocabulary and editorial decisions remain historical
records of the decisions they made; this ADR changes only compatibility policy.

## Consequences

- Removed pages and blog slugs return ordinary 404s. Current links, feeds,
  navigation, and sitemaps name only current routes.
- `/api/v1` stays because current CLI, publisher, and browser clients use it.
  Its version segment does not make it obsolete. A future simplification changes
  the current callers and handlers together.
- Stored catalog cards use the current projection. Re-publish local Blueprints
  after projection changes; reset an isolated local database explicitly after
  schema changes. Bootstrap never guesses that it should drop existing data.
- Publication still projects public fields deliberately. Required fields are
  not synthesized for obsolete inputs. Current optional fields and a legitimate
  summary drawing for reports without Experiences remain supported.
- The current CLI accepts its documented commands and options. Removed commands
  and historical options receive normal usage errors.
- One-off provider migrations leave the routine reconciler once the old managed
  resources are inactive. Provider records are not deleted by code cleanup.
- Authentication redirects, current framework compatibility settings, dependency
  constraints, and ownership checks still serve the current product.

Anonymous pulls, session-independent catalog SSR, source-free published reports,
private unlisted records, uncached report downloads, and service-free boot/build
remain mandatory. Production database recovery is an operational decision; this
policy never authorizes an unreviewed reset of shared data.

The implementation inventory is in
[the cleanup record](../design/plans/prelaunch-cleanup.md).
