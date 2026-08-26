# Catalog product

Something the store offers for sale, and whether a shopper may buy it now.

## Information kept

- Its name and description
- Its price
- Whether stock remains

## States

### Available

Enough stock remains that a shopper can add it to a cart and buy it.

### Unavailable

No stock remains. The product is still browsable, and the reason it cannot be
bought is explained.

## Transitions

- Available → Unavailable by place-order
