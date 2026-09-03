import { containsPlace } from './ids.js'

export type PermissionEffect = 'creates' | 'changes' | 'removes' | 'reads'

/** One Entity selector, normalized across the folder and Product Report forms. */
export interface PermissionTarget {
  entityId: string
  effect: PermissionEffect | null
  from: string | null
  to: string | null
  facts: string[]
  contextPlaces: string[]
}

/** Only the parts of a grant that structural validation can resolve statically. */
export interface PermissionGrant {
  actorIds: string[]
  relatedActorId: string | null
  self: boolean
  unattended: boolean
  stateConditions: string[]
}

export interface PermissionRule {
  id: string
  targets: PermissionTarget[]
  /** Empty means the selected operations are forbidden to everyone. */
  grants: PermissionGrant[]
}

export interface PermissionOperation {
  label: string
  actorId: string | null
  unattended: boolean
  entityId: string
  alias: string | null
  effect: PermissionEffect
  from: string | null
  to: string | null
  contextPlaces: string[]
}

export interface PermissionScreen {
  label: string
  id: string
  containerId: string
  entityIds: string[]
  actorIds: string[]
}

export interface PermissionBehavior {
  rules: PermissionRule[]
  operations: PermissionOperation[]
  screens: PermissionScreen[]
}

/** Nothing about an operation, its instance, or its states is left to guess. */
export function describePermissionOperation(operation: PermissionOperation): string {
  const name = operation.alias ? `${operation.entityId} (${operation.alias})` : operation.entityId
  if (operation.effect === 'reads') return `reads "${name}"`
  if (operation.effect === 'creates') return `creates "${name}"${operation.to ? ` as ${operation.to}` : ''}`
  if (operation.effect === 'removes') return `removes "${name}"${operation.from ? ` from ${operation.from}` : ''}`
  if (operation.from && operation.to) return `moves "${name}" from ${operation.from} to ${operation.to}`
  return `changes "${name}"`
}

function operationInPlaces(operation: PermissionOperation, selectors: string[]): boolean {
  return !selectors.length || operation.contextPlaces.some(place =>
    selectors.some(selector => containsPlace(selector, place)))
}

/** The shared selector algebra used by validation and lint's canonicality warnings. */
export function permissionTargetSelectsOperation(
  target: PermissionTarget,
  operation: PermissionOperation,
  ignoreFrom = false
): boolean {
  if (target.entityId !== operation.entityId || target.facts.length) return false
  if (target.effect !== null && target.effect !== operation.effect) return false
  if (!ignoreFrom && target.from !== null && target.from !== operation.from) return false
  if (target.to !== null && target.to !== operation.to) return false
  return operationInPlaces(operation, target.contextPlaces)
}

function grantCanPermitOperation(
  grant: PermissionGrant,
  operation: PermissionOperation,
  targetId: string
): boolean {
  const stateHolds = grant.stateConditions.every(state => operation.from === null || state === operation.from)
  if (operation.unattended) return grant.unattended && stateHolds
  if (grant.unattended || operation.actorId === null) return false
  if (grant.actorIds.length && !grant.actorIds.includes(operation.actorId)) return false
  if (grant.relatedActorId !== null && grant.relatedActorId !== operation.actorId) return false
  if (grant.self && operation.actorId !== targetId) return false
  return stateHolds
}

function targetSelectsScreen(target: PermissionTarget, entityId: string, screenId: string): boolean {
  // A read carries no state, so a target that selects by `from` or `to` is
  // about a state move and can never govern what a Screen presents.
  return target.entityId === entityId
    && (target.effect === null || target.effect === 'reads')
    && target.from === null
    && target.to === null
    && (!target.contextPlaces.length || target.contextPlaces.some(place => containsPlace(place, screenId)))
}

function grantCanPermitScreen(grant: PermissionGrant, actorId: string, entityId: string): boolean {
  return !grant.unattended
    && (!grant.actorIds.length || grant.actorIds.includes(actorId))
    && (grant.relatedActorId === null || grant.relatedActorId === actorId)
    && (!grant.self || actorId === entityId)
}

/**
 * Apply permission Rules to the Steps and Screens they govern.
 *
 * Every matching Rule is visited independently, preserving AND across Rules;
 * any grant of one Rule may permit, preserving OR within that Rule.
 */
export function validatePermissionBehavior(behavior: PermissionBehavior): string[] {
  const issues: string[] = []

  for (const operation of behavior.operations) {
    const described = describePermissionOperation(operation)
    for (const rule of behavior.rules) {
      const targets = rule.targets.filter(target => permissionTargetSelectsOperation(target, operation))
      if (!targets.length) continue
      if (!rule.grants.length) {
        issues.push(`${operation.label}: ${described}, which rule "${rule.id}" forbids to everyone`)
        continue
      }
      if (!operation.unattended && operation.actorId === null) {
        issues.push(`${operation.label}: ${described}, which rule "${rule.id}" governs, so it needs an actor`)
        continue
      }
      if (!rule.grants.some(grant => grantCanPermitOperation(grant, operation, targets[0]!.entityId))) {
        issues.push(operation.unattended
          ? `${operation.label}: ${described} unattended, and rule "${rule.id}" has no "unattended" grant for it`
          : `${operation.label}: actor "${operation.actorId}" ${described}, and no grant of rule "${rule.id}" can permit it`)
      }
    }
  }

  for (const screen of behavior.screens) {
    for (const entityId of screen.entityIds) {
      for (const rule of behavior.rules) {
        if (!rule.targets.some(target => targetSelectsScreen(target, entityId, screen.id))) continue
        if (!rule.grants.length) {
          issues.push(`${screen.label}: presents "${entityId}", which rule "${rule.id}" forbids anyone to read`)
          continue
        }
        const permitted = screen.actorIds.some(actorId =>
          rule.grants.some(grant => grantCanPermitScreen(grant, actorId, entityId)))
        if (!permitted) {
          issues.push(`${screen.label}: presents "${entityId}", and no actor of "${screen.containerId}" has a grant to read it in rule "${rule.id}"`)
        }
      }
    }
  }

  return issues
}
