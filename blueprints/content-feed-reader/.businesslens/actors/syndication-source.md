# Syndication source

An external system that publishes a feed of items at an address. It is outside
the product's control and outside its trust boundary: it may be unavailable,
slow, permanently gone, or serving content the product cannot parse. It may
republish an item under a new identifier, change its address, or return items
the reader has already seen.

The product treats every response from a syndication source as a claim to be
reconciled against the library, never as an instruction to change it.
