---
status: accepted
---

# Named views, not a view builder

The Product Report offers a fixed set of designed views. It does not offer a
matrix explorer, a topology configurator, or any other surface where the reader
assembles a view from axes, entity kinds, and relation types.

Filters are permitted. A filter narrows a view that already exists and already
means something; a builder asks the reader to invent the meaning first.

## Why

A view builder looks like leverage and is not. Choosing two axes from nine
entity kinds is eighty-one combinations, of which most are meaningless, several
are derivable by more than one path with different answers, and a handful are
the ones anyone actually wants. Handing that to a reader moves the hard part —
deciding which correlations are worth looking at — from the people who know the
model to the person who came here to understand it.

The concrete failure is derivation ambiguity. "Journeys × screens" is not one
relation. It is *screens this journey's scenarios name* or *screens exposing
capabilities this journey uses*, and those give different grids. A named view
picks one, states it, and is accountable for the choice. A builder renders a
checkmark and lets the reader assume.

## Consequences

- **Every matrix and every graph is designed, named, and explained in a line.**
  If a view needs a paragraph before it can be read, it is not ready to ship.
- **A new correlation costs code.** That is the point: it forces someone to
  decide whether the question is real before it becomes a surface.
- **Views state their derivation.** Where a view relates two things the format
  does not relate directly, the view names the path it took.
- **Lens switching stays inside a subject.** A subject may be presented several
  ways — cards, table, matrix, graph — because those are different readings of
  the same thing, not different things. The switcher shows exactly the lenses
  that exist, so nothing has to be discovered.
- **The reader is never shown an empty configuration screen.** Every view is
  populated the moment it opens.

## Considered options

- **Ship the builder and let usage reveal the useful presets.** Rejected: the
  useful presets were already named — capability × availability pair, screen ×
  pair, journey × scenario kind, and a few more — before any builder existed.
  The evidence arrived without the tool.
- **Ship both: presets plus an "advanced" builder.** Rejected on the same
  grounds, plus the maintenance of a general engine whose output nobody is
  accountable for. It can be revisited if a named view is repeatedly requested
  and repeatedly different.
