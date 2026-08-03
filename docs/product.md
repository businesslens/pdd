---
title: Product
description: The coherent value promise named by one Product Model, including its identity, intent, tags, limitations, and optional References.
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
behavior matters as Product scope.

## The file

The Product lives at `product.md`:

```md [product.md]
---
id: acme-shop
tags: [commerce]
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

`id` is required, lowercase kebab-case, and at most 64 characters. Unlike
entity IDs, it is declared in frontmatter because it names the whole model and
may differ from the repository name. `tags`, `limitations`, and
[References](./references.md) are optional. The first H1 is the Product title,
the lead paragraph is its description, and optional `## Intent` explains the
outcome its shape protects.

## What `lint` checks

| Finding | Meaning |
| --- | --- |
| `product.md is missing` | Add the single Product manifest. |
| `missing id` or invalid-id finding | Supply a lowercase kebab-case ID of at most 64 characters. |
| Missing H1 or lead finding | Supply the Product title and description. |
| Unknown frontmatter or Reference finding | Use only `id`, `tags`, `limitations`, and optional `references`, with the documented Reference shape. |
