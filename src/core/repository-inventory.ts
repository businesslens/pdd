import { execFile } from 'node:child_process'
import { lstatSync } from 'node:fs'
import { join } from 'node:path'
import { promisify } from 'node:util'

const execute = promisify(execFile)

/** List names for Git comparisons without traversing symbolic links. */
export async function repositoryInventory(root: string, includeIgnored: boolean): Promise<{ paths: string[] }> {
  const [{ stdout }, { stdout: stages }] = await Promise.all([execute('git', [
    '-C', root, 'ls-files', '--cached', '--others',
    ...(includeIgnored ? [] : ['--exclude-standard']), '-z'
  ], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 }), execute('git', ['-C', root, 'ls-files', '--stage', '-z'], { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024 })])
  const submodules = new Set(stages.split('\0').filter(entry => entry.startsWith('160000 ')).map(entry => entry.slice(entry.indexOf('\t') + 1)))
  const paths = [...new Set(stdout.split('\0').filter(Boolean))].filter(path => {
    try {
      const stat = lstatSync(join(root, path))
      return stat.isFile() || stat.isSymbolicLink() || submodules.has(path)
    } catch (error) {
      // Keep inaccessible paths so Review can report unreadable contents.
      const code = (error as NodeJS.ErrnoException).code
      return submodules.has(path) || (code !== 'ENOENT' && code !== 'ENOTDIR')
    }
  }).sort()
  return { paths }
}
