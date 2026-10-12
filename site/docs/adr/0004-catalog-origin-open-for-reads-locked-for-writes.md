# The catalog origin is open for reads and locked for writes

The CLI's origin allowlist existed for one reason, stated in its own docstring: to stop
`BUSINESSLENS_API_KEY` being sent to an untrusted host. `pull` is anonymous from 0.7.0, so that
reason is gone — and keeping the allowlist would prevent anyone from running a private catalog,
plausibly the shape of a future commercial offering. `businesslens blueprint pull` therefore accepts any
https origin passed to `--catalog`, defaulting to `https://pdd-kit.dev`.

The write path keeps the allowlist. `blueprints:publish` carries `BUSINESSLENS_CATALOG_KEY` and
refuses to send it anywhere but `pdd-kit.dev` or a loopback host.

## Consequences

Opening the read path is safe because `pull` sends no credentials; entity ids are constrained to
`/^[a-z0-9]+(?:-[a-z0-9]+)*$/`, so expansion cannot write outside the target directory; writes
use `flag: 'wx'` and cannot clobber existing files; and the digest, redirect-refusal,
content-type and 8 MiB checks all still run. URL *shape* validation stays — no credentials, path,
query or fragment, and https except on loopback.
