---
entities:
  - { entity: interface, facts: [Type, Navigation] }
  - { entity: experience, facts: [Navigation] }
  - { entity: screen, facts: [Exposure, Presents, Nesting] }
capabilities: [view-product-model]
---

# Sketch

A rough view of a Screen, Interface or Experience, derived from the model and
never authored: the frame the Interface type implies, the Screens always
reachable as its strip, the facts presented as placeholders grouped by Entity,
the facts a Step edits there as fields, the Capabilities offered as actions,
and child Screens as tabs, which open their own Sketch. A container's Sketch
is a wall of its Screens in miniature; one with no Screens lists what is
available there as its frame would. The skeleton is the same for every place,
so it is never a design, and the drawing states its derivation once.
