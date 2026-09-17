import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { coverageStatus, cancelCoverageReview, finishCoverageReview, recordCoverageReview, startCoverageReview } from '../core/repository-coverage.js'

export async function runCoverage(cwd: string, action: 'start' | 'record' | 'finish' | 'cancel' | 'status', argument?: string, includePaths?: string[]): Promise<number> {
  let result: unknown
  if (action === 'start') result = await startCoverageReview(cwd, includePaths)
  else if (action === 'status') result = await coverageStatus(cwd)
  else if (action === 'finish') result = await finishCoverageReview(cwd, argument!)
  else if (action === 'cancel') result = await cancelCoverageReview(cwd, argument!)
  else {
    let raw = ''
    if (argument === '-') for await (const chunk of process.stdin) raw += chunk
    else raw = await readFile(resolve(cwd, argument!), 'utf8')
    result = await recordCoverageReview(cwd, JSON.parse(raw))
  }
  console.log(JSON.stringify(result, null, 2))
  return 0
}
