# A Blueprint's identity is its row, not its slug

Blueprints are synced from `businesslens/pdd`, where a slug can be deleted and later reused for
something unrelated. Blueprint identity is therefore the database id. Withdrawn Blueprints are
kept as soft-deleted rows, and slug uniqueness is enforced with a partial index —
`UNIQUE (slug) WHERE withdrawn_at IS NULL` — rather than a plain unique constraint.

## Consequences

- Two columns, two owners. `withdrawn_at` is written **only** by a publish run; `listed` **only**
  by an administrator. Public visibility is `withdrawn_at IS NULL AND listed`. If publishing ever
  writes `listed`, the next run silently undoes the admin kill switch — which is the whole reason
  the catalog has a database.
- Re-adding a deleted slug creates a **new** Blueprint. It does not inherit the old row's
  `listed` state or its favourites. A killed Blueprint can therefore be resurrected by deleting
  and re-adding it in `pdd`; pull request review is the gate on that.
- `report.json` returns **410** only for a withdrawn Blueprint, and **404** for both an unknown
  slug and an admin-unlisted one, so curation decisions do not leak through the public API.
- Do not "fix" the partial index into a plain unique constraint on `slug`.
