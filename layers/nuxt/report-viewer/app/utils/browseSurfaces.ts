/**
 * What each browse surface is for, in one line.
 *
 * The topology views have stated their question and their derivation since they
 * shipped, and it is the clearest thing in the report — a reader knows what
 * they are looking at before they look. The collections said only their name
 * and their count, which answers "what is this called" and not "what is this
 * for".
 *
 * The derivation names the containment the surface opens grouped by, so the
 * grouping is accountable rather than a preference someone set: a Screen list
 * grouped by Interface says `INTERFACES ⊃ EXPERIENCES ⊃ SCREENS`, and that is
 * the tree the format declares.
 *
 * The shape is deliberately the one `productTopologyViews` already uses. One
 * vocabulary for "here is the question and how the answer is derived", not two.
 */
import type { TopologyFlowStep } from './productTopologyViews'
import type { ReportEntityKind } from './reportWorkspace'

export interface BrowseSurface {
  /** The question a reader arrives with, answered by this collection. */
  question: string
  /** The derivation behind its reading order, left to right. */
  flow: TopologyFlowStep[]
  /** `⊃` for containment, `→` for a relation. One fewer than `flow`. */
  separators: string[]
}

export const BROWSE_SURFACES: Partial<Record<ReportEntityKind, BrowseSurface>> = {
  actor: {
    question: 'Who does the Product serve, and what do they come for?',
    flow: [
      { kind: 'actor', label: 'Actors' },
      { kind: 'journey', label: 'Journeys' }
    ],
    separators: ['→']
  },
  interface: {
    question: 'Where is the Product reachable at all?',
    flow: [
      { kind: 'interface', label: 'Interfaces' },
      { kind: 'experience', label: 'Experiences' },
      { kind: 'screen', label: 'Screens' }
    ],
    separators: ['⊃', '⊃']
  },
  experience: {
    question: 'Which named contexts does an Interface divide into?',
    flow: [
      { kind: 'interface', label: 'Interfaces' },
      { kind: 'experience', label: 'Experiences' }
    ],
    separators: ['⊃']
  },
  screen: {
    question: 'Where can an Actor see and do this?',
    flow: [
      { kind: 'interface', label: 'Interfaces' },
      { kind: 'experience', label: 'Experiences' },
      { kind: 'screen', label: 'Screens' }
    ],
    separators: ['⊃', '⊃']
  },
  domain: {
    question: 'What subjects is the Product about?',
    flow: [
      { kind: 'domain', label: 'Domains' },
      { kind: 'capability', label: 'Capabilities' }
    ],
    separators: ['⊃']
  },
  capability: {
    question: 'What can the Product do, and how is that grouped?',
    flow: [
      { kind: 'domain', label: 'Domains' },
      { kind: 'capability', label: 'Capabilities' }
    ],
    separators: ['⊃']
  },
  'capability-scenario': {
    question: 'How do we know each Capability works?',
    flow: [
      { kind: 'capability', label: 'Capabilities' },
      { kind: 'capability-scenario', label: 'Scenarios' }
    ],
    separators: ['⊃']
  },
  journey: {
    question: 'What does the Product promise an Actor?',
    flow: [
      { kind: 'actor', label: 'Actors' },
      { kind: 'journey', label: 'Journeys' }
    ],
    separators: ['→']
  },
  'journey-scenario': {
    question: 'How does each promise actually unfold?',
    flow: [
      { kind: 'journey', label: 'Journeys' },
      { kind: 'journey-scenario', label: 'Scenarios' }
    ],
    separators: ['⊃']
  },
  rule: {
    question: 'What constrains the Product, and how far does it reach?',
    flow: [
      { kind: 'rule', label: 'Business rules' },
      { kind: 'domain', label: 'Domains' }
    ],
    separators: ['→']
  }
}
