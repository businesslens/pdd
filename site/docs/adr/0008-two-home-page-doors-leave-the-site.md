# Two of the home page's three doors leave the site

The home page states the practice, then offers three entry paths: **from your repo**
(`businesslens-map`), **from a Blueprint** (`businesslens blueprint pull`), and **from an idea**
(`businesslens-ideate`). Only the middle one has a destination on `pdd-kit.dev`. The other two
hand the visitor to `/docs` and from there to their own terminal, and the doors say so rather than
disguising it.

This is deliberate. The site cannot yet render a Product Model, so the catalog is the only one of
the three paths it can actually demonstrate. Sending the other two off-site is honest about where
their value shows up.

## Considered and rejected

**Making Blueprints the single door**, which is what shipped: every primary call to action on the
site read "Browse Blueprints". One teaching Blueprint exists, and `app/pages/index.vue:61-83`
advertised a second that does not — `saas-foundation`, tagged
`Commercial preview`, an access tier deleted with `/pricing`. The entire funnel pointed at the
thinnest surface and overstated it.

**Building an on-site preview of what `map` produces**, so all three doors could stay. That is a
Product Model viewer — decision 15 in [`plan.md`](../../plan.md), "start from the Hub surface, add
views later" — and it is a feature, not launch copy.

## Consequences

- The hero and persistent header call to action are **Get started** → `/docs`, which serves all
  three doors. The hero uses a standard primary button rather than presenting an install command
  as its broadest offer. "Browse Blueprints" stays as a secondary action where the catalog is the
  subject.
- **The doors are hero buttons rather than a section.** They started as a section carrying a
  situation, a description and a command each; the home page was too long, and a choice is a
  button. The labels became verbs — *Map existing repo*, *Start from a Blueprint*, *Start from an
  idea* — and the explanation each door used to carry now lives at the other end of the link.
- The separate featured-Blueprints section is deleted, along with the hardcoded pair. The Blueprint
  door names one real Blueprint as proof and links to `/blueprints`, so the page reads correctly at
  one Blueprint and at twenty without an edit.
- The PDD repository owns the workflow documentation. Its three starting doors
  and map/ideate/build/verify loop must use the same names as this page.
- Door names are fixed in [`CONTEXT.md`](../../CONTEXT.md) because they appear on the home page, in
  `/faq`, and in the docs. A visitor who meets the same door under two names counts two products.
- Revisit when the site renders a Product Model. Two of these doors become demonstrable on-site,
  and the reason for sending them away expires.
