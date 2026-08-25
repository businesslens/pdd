---
title: Product
description: The coherent value promise named by one Product Model, including its identity, attribution, intent, classification, limitations, and optional References.
section: open-source
group: Product Model
order: 8
---

# The Product

**The Product is the one coherent value promise described by a Product Model.**
Its manifest gives that promise a stable identity and states what the Product
does before the model explains its audiences, interaction forms, behavior, and
constraints.

## When you create one

Every `.businesslens/` model has exactly one Product in `product.md`. Create a
separate model only when a repository contains genuinely independent value
promises. Repository structure does not make that decision: several packages
or deployables may implement one Product, while one repository may contain
several Products with independent model roots.

Website, mobile application, CLI, and supported API are usually
[Interfaces](./interfaces.md) of one Product, not separate Products. An
internal API supporting another Interface normally stays outside the model; a
partner API becomes an Interface when independent Actors use it and its
behavior matters as a Product boundary.

## The file

The Product lives at `product.md` while it has no logo:

```md [product.md]
---
id: acme-shop
summary: Discover products and complete purchases with confidence.
category: commerce
tags: [commerce]
authors:
  - name: Acme
    url: https://example.com
license: MIT
limitations: [In-store purchasing is outside this Product]
references:
  - kind: doc
    role: intent
    target: https://example.com/product-brief
---

# Acme Shop

A storefront where shoppers discover products and complete purchases.

## Intent

Let shoppers move from discovery to a confirmed order with confidence.
```

| Field or section | Required | Constraint |
| --- | --- | --- |
| `product.md` | yes | Provide exactly one Product manifest. |
| `id` | yes | Use lowercase kebab-case with at most 64 characters. The Product ID may differ from the repository name. |
| `summary` | no | Supply a single-line short description up to 400 characters. Reports fall back to the lead description when omitted. |
| `category` | no | Use a lowercase kebab-case Product classification. |
| `tags` | no | List unique Product classification tags. |
| `authors` | no | List attribution records with a required `name` and optional HTTP(S) `url`. |
| `license` | no | Use one SPDX license identifier such as `MIT`. |
| `limitations` | no | State known Product boundaries. |
| `references` | no | Use the documented [Reference](./references.md) shape. |
| H1 and lead paragraph | yes | Name and describe the Product. |
| `## Intent` | no | Explain the outcome the Product shape protects. |

Unrecognized H2 sections are kept in order as structured supporting sections
when the model is exported and expanded. A recognized H2 such as `## Intent`
may appear only once.

## Visual identity

Adding a logo expands the Product: move the manifest to
`.businesslens/product/product.md` and add
`.businesslens/product/logo.svg` beside it. Public Blueprints require this
expanded form; a local Product Model without a logo stays compact.
