import { describe, expect, it } from 'vitest'
import { conditionInstanceIssue, singletonRelationIssue, type RelationEdge } from '../src/core/model-checks.js'

/*
 * The shared checks folder lint and report validation both call. The model
 * here: a Workspace has Documents and Members; a Document has Comments; an
 * Account sends and receives Transfers; an Account is one Profile's; a Comment
 * replies to a Comment; Store settings are the Product's one instance.
 */
const relations: RelationEdge[] = [
  { from: 'workspace', to: 'document', cardinality: 'one-to-many' },
  { from: 'workspace', to: 'membership', cardinality: 'one-to-many' },
  { from: 'member', to: 'membership', cardinality: 'one-to-many' },
  { from: 'document', to: 'comment', cardinality: 'one-to-many' },
  { from: 'comment', to: 'comment', cardinality: 'one-to-many' },
  { from: 'account', to: 'transfer', cardinality: 'one-to-many' },
  { from: 'account', to: 'transfer', cardinality: 'one-to-many' },
  { from: 'profile', to: 'account', cardinality: 'one-to-one' },
  { from: 'tag', to: 'document', cardinality: 'many-to-many' }
]
const read = (entityId: string, targetId: string | undefined, grant: { actorIds?: string[], pathIds?: string[] } = {}) =>
  conditionInstanceIssue({
    entityId,
    targetId,
    actorIds: grant.actorIds ?? [],
    pathIds: grant.pathIds ?? [],
    singletonIds: new Set(['store-settings']),
    relations
  })

describe('which instance a grant condition reads', () => {
  it('reads the acting Entity only when the grant admits exactly one', () => {
    expect(read('member', 'tag', { actorIds: ['member'] })).toBeUndefined()
    expect(read('member', 'tag', { actorIds: ['member', 'admin'] })).toContain('give "member" a grant of its own')
  })

  it('reads the instance on the related path, even of the target type', () => {
    expect(read('workspace', 'tag', { pathIds: ['workspace', 'membership', 'member'] })).toBeUndefined()
    expect(read('membership', 'membership', { pathIds: ['workspace', 'membership', 'member'] })).toBeUndefined()
  })

  it('walks to-one relations from the target, chained and both ways along a one-to-one', () => {
    expect(read('workspace', 'comment')).toBeUndefined()
    expect(read('profile', 'account')).toBeUndefined()
    expect(read('account', 'profile')).toBeUndefined()
  })

  it('never walks many-to-many, a one-to-many toward its many side, or a self-relation', () => {
    expect(read('tag', 'document')).toContain('no to-one relation reaches it from "document"')
    expect(read('comment', 'workspace')).toContain('no to-one relation reaches it')
    expect(read('comment', 'comment')).toContain('the Rule\'s own target')
  })

  it('refuses a walk through two relations joining the same pair', () => {
    expect(read('account', 'transfer')).toContain('through "transfer" and "account", which two relations join')
    // The sender's and the receiver's Profile are two Profiles as well.
    expect(read('profile', 'transfer')).toContain('which two relations join')
  })

  it('reads a singleton from anywhere, and refuses the target itself or no target', () => {
    expect(read('store-settings', undefined)).toBeUndefined()
    expect(read('document', 'document')).toContain('a condition on the governed thing names no "entity"')
    expect(read('workspace', undefined)).toContain('no one Entity target to reach it from')
  })
})

describe('a singleton on a relation', () => {
  const singletons = new Set(['store-settings'])
  it('is never a many end', () => {
    expect(singletonRelationIssue({ from: 'order', to: 'store-settings', cardinality: 'one-to-many' }, singletons)).toContain('"store-settings" is singleton')
    expect(singletonRelationIssue({ from: 'store-settings', to: 'tax-rate', cardinality: 'many-to-many' }, singletons)).toContain('is many-to-many')
    expect(singletonRelationIssue({ from: 'tax-rate', to: 'store-settings', cardinality: 'many-to-many' }, singletons)).toContain('is many-to-many')
  })
  it('may hold many, or be one of a pair', () => {
    expect(singletonRelationIssue({ from: 'store-settings', to: 'tax-rate', cardinality: 'one-to-many' }, singletons)).toBeUndefined()
    expect(singletonRelationIssue({ from: 'store-settings', to: 'store', cardinality: 'one-to-one' }, singletons)).toBeUndefined()
  })
})
