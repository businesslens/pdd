# Product Report visualization brief

## Current status

No existing experiment should be treated as the selected direction. The
current options explored presentation styles, but none discovered the right
way to understand the Product Model.

Do not begin by restyling an existing experiment. Start again from the
information architecture and the questions the report must answer.

## Final conclusions

### 1. The report is not one visualization

The Product Model contains different kinds of information:

- Actors
- Interfaces
- Experiences
- Screens
- Domains
- Capabilities
- Journeys
- Scenarios
- Business Rules

These entities describe different dimensions of the Product. Trying to place
all of them into one universal diagram creates an unreadable graph and makes
important relationships look equally significant.

The report should therefore be a collection of purpose-built views over one
shared model.

### 2. Each view must answer a clear Product question

A view should exist because it helps someone answer a question, such as:

- What is this Product made of?
- How can an Actor access it?
- What Screens exist in each Interface or Experience?
- What Journeys does the Product support?
- Which Capabilities support which Journeys?
- Where is a Business Rule enforced?
- What changes if a particular Interface, Experience, Journey, or Capability
  is selected?

The report should not organize itself around entity counts or around
displaying every field merely because the data exists.

### 3. Topology is useful, but not as a universal homepage

A whole-model topology containing every entity and relationship becomes
visual noise. It cannot simultaneously explain access, behavior, UI structure,
Capabilities, and policy.

Topology should normally be contextual:

1. Enter a meaningful section, such as Journeys, Screens, Capabilities, or
   Rules.
2. Select a specific entity.
3. Open a topology view for that entity and the relationships relevant to the
   current section.
4. Allow the user to expand the neighborhood intentionally if more context is
   needed.

For example:

- A Journey topology might show its Actors, access contexts, Capabilities,
  Screens, Scenarios, and Rules.
- A Screen topology might show its Interface and Experience placement, exposed
  Capabilities, and participating Journeys.
- A Capability topology might show its Domain, Journeys, Screens, and governing
  Rules.

The graph should explain one relationship question at a time. It should not
attempt to prove that the entire model is connected.

### 4. Different relationships need different visual forms

Not every relationship should be drawn as nodes and edges.

Use:

- Graphs for local structure and dependency
- Maps for spatial or navigational organization
- Lanes for progression and Scenarios
- Tables for scanning and exact comparison
- Cards for browsing and recognition
- Matrices for many-to-many coverage
- Detail panels for complete entity content

The visualization technique should follow the question being answered.

### 5. The report needs overview and detail

Each major section should support two levels:

- An overview for understanding the shape of that part of the Product
- A focused view for inspecting one entity completely

The user should be able to move from “show me all Journeys” to “explain this
Journey” without losing their place or opening an unrelated report structure.

### 6. Completeness does not mean simultaneity

The report must expose the complete Product Model, but it does not need to show
all of it at once.

Information can be progressively disclosed through:

- Section navigation
- Selection
- Filters
- Comparison modes
- Contextual topology
- Entity detail views

A useful first view is more important than maximum initial density.

### 7. Interfaces and Experiences are access context

Interfaces describe the Product interaction contract or delivery surface,
such as:

- Browser application
- Mobile application
- CLI

Experiences are optional contexts inside an Interface when the Interface
contains meaningfully different access boundaries or Product contexts.

The report must support Products without Experiences. It must not assume every
Interface is a graphical application.

Screens are relevant to graphical Interfaces, but should not be forced onto
CLI-shaped Products or other contexts where “Screen” is not a meaningful
concept.

An API should not be forced into a graphical Product Model merely to satisfy
the visualization. If APIs are represented, they need a purpose-built
interpretation rather than pretending endpoints are Screens.

### 8. The visualization must use authored meaning

Do not invent quality scores, health grades, maturity labels, or confidence
indicators unless the Product Model explicitly defines them.

Derived information should be factual and explainable, such as:

- Number of Journeys using a Capability
- Screens participating in a Journey
- Rules attached to a Scenario
- Access contexts exposing a Capability
- Missing or unusually concentrated relationships

The report should help people notice patterns without silently judging the
Product.

## Required views

### 1. Product topology

A topology view is required, but its precise scope must be carefully designed.

Its purpose is to show meaningful structure and relationships, not every
entity at once.

At minimum, it should support:

- A deliberately limited overview
- Entity selection
- Contextual expansion
- Relationship filtering
- Clear relationship direction
- Different shapes or labels for entity kinds
- A readable selected-entity explanation
- A way to return to the previous context

A strong topology should be able to answer questions such as:

- What directly supports this Journey?
- Through which access contexts is it available?
- Which Rules affect it?
- Which Screens and Capabilities connect this part of the Product?

The topology should usually be available inside a section rather than being
the report’s dominant home view.

### 2. Screen map

A dedicated Screen map is required for Products with graphical Interfaces.

This view should explain the Product’s visible surface:

- Which Screens belong to each Interface
- Which Experience contains each Screen, when Experiences exist
- Which Screens are available directly through an Interface
- Which Screens participate in a selected Journey
- Which Capabilities each Screen exposes
- Relevant states and actions
- Meaningful relationships between Screens, when those relationships are
  actually authored or derivable

This is not automatically a navigation flowchart. Journey participation must
not be presented as screen-to-screen navigation unless the model contains
evidence for that sequence.

A useful conceptual hierarchy is:

```text
Interface
├── Directly available Screens
└── Experience
    └── Screens
```

The Screen map should support both:

- A complete landscape
- A Journey-focused overlay or filter

It must also handle Interfaces with no Screens gracefully.

### 3. Journey browser

Journeys require both card and table representations.

#### Card view

Cards are for browsing and recognition. Each card should communicate:

- Journey title
- Intended outcome
- Participating Actors
- Availability contexts
- Number and names of Scenarios
- Important Screens
- Supporting Capabilities
- Relevant Rules

Cards should make Journeys feel like Product promises, not database records.

#### Table view

The table is for scanning and comparison. It should allow users to compare
Journeys across dimensions such as:

- Actors
- Interfaces and Experiences
- Capabilities
- Screens
- Scenarios
- Rules
- Authored step depth

The table should remain factual. It should not introduce arbitrary rankings.

#### Journey detail

Selecting a Journey should reveal:

- The Journey’s goal or promise
- Availability
- Actors
- Supporting Capabilities
- Participating Screens
- Complete Scenarios
- Triggers
- Ordered steps
- Decisions
- Outcomes
- Edge cases
- Business Rules
- A local Journey topology

The Scenario narrative should remain readable; it should not be reduced
entirely to counts.

### 4. Capability map and matrices

Capabilities need a dedicated view because they describe what the Product can
durably do, independently of a particular Screen or Journey.

The main view should show:

- Capabilities grouped by Domain when Domains exist
- Capabilities without a Domain
- Capability descriptions
- Journey reuse
- Screen exposure
- Availability
- Governing Rules

Matrices should be used where many-to-many comparison is genuinely useful.
Important candidates include:

- Capabilities × Journeys
- Capabilities × Screens
- Capabilities × Interfaces or Experiences
- Capabilities × Business Rules
- Domains × Journeys

A matrix should answer a named question. Do not create one universal matrix
with interchangeable axes merely because it is technically possible.

Examples:

- “Which Product promises depend on each Capability?”
- “Where can each Capability be reached?”
- “Which Screens expose each Capability?”
- “Which Rules constrain each Capability?”

Selecting a matrix cell should explain the relationship, not merely highlight
it.

## Important supporting views

These were not established as the four primary requirements, but the model
will probably need them.

### Scenario flow

A Scenario benefits from a readable sequence:

```text
Trigger → Steps and decisions → Outcome
```

Screens, Rules, and edge cases can be attached to the relevant parts of the
flow. This should prioritize behavioral comprehension over decorative
process-diagram styling.

### Business Rule impact

A Rule view should show:

- The Rule statement and rationale
- Where it is directly attached
- Affected Domains and Capabilities
- Affected Journeys and Scenarios
- Narrowed availability, if applicable
- A contextual impact topology

Direct and derived impact must be visually distinguishable.

### Access-context view

An Interface or Experience view should explain:

- Which Actors enter through it
- Which Screens exist there
- Which Capabilities are available
- Which Journeys can be completed
- What boundary the context establishes

This is especially important for comparing mobile and browser applications or
direct Interface availability against Experience-scoped availability.

## Design expectations

The next exploration should:

- Begin with information architecture, not visual style
- Prototype the four required views individually before combining them
- Use the same realistic Product Model in every prototype
- Show complete, meaningful entity content rather than placeholder cards
- Demonstrate selection and drill-down
- Handle optional Experiences
- Handle non-graphical Interfaces
- Remain readable with larger models
- Avoid one giant universal graph
- Avoid turning every view into cards
- Avoid presenting the same layout in different visual themes
- Avoid invented analytics and quality scores

The first design exercise should probably focus on one excellent Journey
browser, one excellent Screen map, one Capability matrix, and one contextual
topology. Only after those individual views work should they be assembled into
a unified report.
