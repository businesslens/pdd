import { spawnSync } from 'node:child_process'
import { chmodSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { Argument, Command, Option } from 'commander'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { complete, completes, formatCompletion } from '../src/core/completion.js'

const ROOT = join(__dirname, '..')
const CLI = join(ROOT, 'dist', 'cli.js')

let sandbox: string
let bin: string
let home: string

function run(command: string, args: string[], cwd = sandbox) {
  const result = spawnSync(command, args, {
    cwd,
    encoding: 'utf8',
    env: {
      ...process.env,
      HOME: home,
      XDG_CONFIG_HOME: join(home, '.config'),
      PATH: `${bin}${delimiter}${process.env.PATH ?? ''}`
    }
  })
  return { status: result.status ?? 1, stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
}

/** Candidate values (descriptions dropped) and the directive, from the real CLI. */
function suggest(...words: string[]) {
  const result = run('node', [CLI, '__complete', ...words])
  expect(result.status, result.stderr).toBe(0)
  const lines = result.stdout.trimEnd().split('\n')
  return { values: lines.slice(0, -1).map(line => line.split('\t')[0]), directive: lines.at(-1) }
}

function hasShell(shell: string): boolean {
  return spawnSync(shell, ['-c', 'exit 0']).status === 0
}

beforeAll(() => {
  sandbox = mkdtempSync(join(tmpdir(), 'bl-completion-'))
  home = join(sandbox, 'home')
  bin = join(sandbox, 'bin')
  mkdirSync(home)
  mkdirSync(bin)
  // The printed scripts call `businesslens` from PATH, as a global install does.
  writeFileSync(join(bin, 'businesslens'), `#!/bin/sh\nexec node "${CLI}" "$@"\n`)
  chmodSync(join(bin, 'businesslens'), 0o755)
  mkdirSync(join(sandbox, 'my dir'))
  writeFileSync(join(sandbox, 'report.json'), '{}')
  writeFileSync(join(sandbox, 'notes.txt'), '')
})

afterAll(() => {
  rmSync(sandbox, { recursive: true, force: true })
})

describe('completion command', () => {
  it('prints a script for each shell and writes nothing', () => {
    for (const shell of ['bash', 'zsh', 'fish']) {
      const result = run('node', [CLI, 'completion', shell])
      expect(result.status, shell).toBe(0)
      expect(result.stderr).toBe('')
      expect(result.stdout).toContain('businesslens __complete')
    }
    expect(readdirSync(sandbox).sort()).toEqual(['bin', 'home', 'my dir', 'notes.txt', 'report.json'])
    expect(readdirSync(home)).toEqual([])
  })

  it('ships the scripts in the package', () => {
    const { files } = JSON.parse(readFileSync(join(ROOT, 'package.json'), 'utf8')) as { files: string[] }
    expect(files).toContain('completions')
  })

  it('refuses an unknown or missing shell as a usage error', () => {
    const unknown = run('node', [CLI, 'completion', 'tcsh'])
    expect(unknown.status).toBe(2)
    expect(unknown.stderr).toContain('Allowed choices are bash, zsh, fish')
    expect(run('node', [CLI, 'completion']).status).toBe(2)
  })
})

describe('completion candidates', () => {
  it('offers root commands for empty input, and nothing retired', () => {
    expect(suggest('')).toEqual({
      values: ['install', 'update', 'lint', 'view', 'blueprint', 'completion', 'help'],
      directive: ':none'
    })
    expect(suggest().values).toEqual(suggest('').values)
    for (const retired of ['build', 'validate', 'export', 'open', 'pull', 'contribute', 'checkpoint', '__complete']) {
      expect(suggest('').values).not.toContain(retired)
    }
  })

  it('offers Blueprint subcommands only inside blueprint, and help topics after help', () => {
    expect(suggest('blueprint', '').values).toEqual(['export', 'open', 'pull', 'contribute', 'help'])
    expect(suggest('--cwd', 'some dir', 'blueprint', '').values).toContain('pull')
    expect(suggest('help', '').values).toEqual(['install', 'update', 'lint', 'view', 'blueprint', 'completion'])
    expect(suggest('blueprint', 'help', '').values).toEqual(['export', 'open', 'pull', 'contribute'])
    expect(suggest('lint', 'extra', '').values).not.toContain('install')
  })

  it('offers the options of the command in context, without repeating used ones', () => {
    expect(suggest('install', '--').values).toEqual(['--providers', '--scope', '--yes', '--force', '--help', '--cwd', '--version'])
    expect(suggest('install', '--yes', '--').values).not.toContain('--yes')
    expect(suggest('blueprint', 'pull', 'name', '--').values).toEqual(['--catalog', '--force', '--help', '--cwd', '--version'])
    expect(suggest('view', '--').values).toContain('--no-open')
    expect(suggest('view', '--').values).not.toContain('--open')
    expect(suggest('-').values).toEqual(['--cwd', '-c', '--version', '-V', '--help', '-h'])
    expect(suggest('lint', '').values).toEqual(['--json', '--help', '--cwd', '--version'])
  })

  it('completes scope and provider values, keeping chosen providers', () => {
    expect(suggest('install', '--scope', '')).toEqual({ values: ['project', 'global'], directive: ':none' })
    expect(suggest('update', '--scope=').values).toEqual(['project', 'global'])
    expect(suggest('install', '--providers', '').values).toEqual(['claude', 'codex', 'cursor', 'gemini', 'github'])
    expect(suggest('install', '--providers', 'claude,cursor,').values)
      .toEqual(['claude,cursor,codex', 'claude,cursor,gemini', 'claude,cursor,github'])
    expect(suggest('update', '--providers=codex,c').values).toEqual(['codex,claude', 'codex,cursor', 'codex,gemini', 'codex,github'])
    expect(run('node', [CLI, '__complete', 'install', '--providers', '']).stdout).toContain('claude\tClaude Code')
  })

  it('hands paths to the shell and invents no free-form values', () => {
    expect(suggest('--cwd', '')).toEqual({ values: [], directive: ':directories' })
    expect(suggest('-c', 'my d')).toEqual({ values: [], directive: ':directories' })
    expect(suggest('--cwd=my dir/x')).toEqual({ values: [], directive: ':directories' })
    expect(suggest('blueprint', 'open', '')).toEqual({ values: [], directive: ':files:.json' })
    expect(suggest('--cwd', 'my dir', 'blueprint', 'open', 'my dir/r')).toEqual({ values: [], directive: ':files:.json' })
    for (const words of [['view', '--port', ''], ['view', '--pr', ''], ['view', '--branch', ''], ['blueprint', 'pull', 'x', '--catalog', '']]) {
      expect(suggest(...words), words.join(' ')).toEqual({ values: [], directive: ':none' })
    }
    expect(suggest('completion', '').values).toEqual(['bash', 'zsh', 'fish'])
  })

  it('matches the commands and options help documents', () => {
    const helpFlags = (text: string) => [...text.matchAll(/^ {2}(?:-\w, )?(--[\w-]+)/gm)].map(([, name]) => name!).sort()
    const helpCommands = (text: string) => {
      const section = text.split(/\n\n/).find(block => block.startsWith('Commands:')) ?? ''
      return [...section.matchAll(/^ {2}(\S+)/gm)].map(([, name]) => name!)
    }
    const visit = (path: string[]) => {
      const help = run('node', [CLI, ...path, '--help']).stdout
      const commands = helpCommands(help)
      const offered = suggest(...path, '--').values.sort()
      expect(offered, path.join(' ') || 'root').toEqual(helpFlags(help))
      if (!commands.length) return
      expect(suggest(...path, '').values, path.join(' ') || 'root').toEqual(commands)
      for (const command of commands.filter(name => name !== 'help')) visit([...path, command])
    }
    visit([])
  }, 60_000)
})

describe('completion engine', () => {
  it('reads the tree without parsing it, running actions or hooks', () => {
    const action = vi.fn()
    const hook = vi.fn()
    const program = new Command('tool').hook('preAction', hook)
    program.command('go').option('--fast').action(action)
    program.command('read')
      .addArgument(completes(new Argument('<file>'), { native: 'files' }))
      .addOption(new Option('--mode <mode>').choices(['a', 'b']))
      .action(action)
    expect(complete(program, ['']).candidates.map(({ value }) => value)).toEqual(['go', 'read', 'help'])
    expect(complete(program, ['go', '--'])).toEqual({ candidates: [{ value: '--fast', description: '' }, { value: '--help', description: 'display help for command' }] })
    expect(complete(program, ['read', '--mode', ''])).toEqual({ candidates: [{ value: 'a' }, { value: 'b' }] })
    expect(complete(program, ['read', ''])).toEqual({ candidates: [], native: 'files' })
    expect(action).not.toHaveBeenCalled()
    expect(hook).not.toHaveBeenCalled()
  })

  it('writes one candidate per line and a closing directive', () => {
    expect(formatCompletion({ candidates: [{ value: 'a', description: 'one\ttwo\nthree' }, { value: 'b' }] }))
      .toBe('a\tone two three\nb\n:none\n')
    expect(formatCompletion({ candidates: [], native: 'files', extension: '.json' })).toBe(':files:.json\n')
    expect(formatCompletion({ candidates: [], native: 'files' })).toBe(':files\n')
  })
})

describe.skipIf(!hasShell('bash'))('bash script', () => {
  /** Runs the completion function for `words` with the cursor on the last one. */
  function bash(words: string[]) {
    const script = join(sandbox, 'completion.bash')
    writeFileSync(script, run('node', [CLI, 'completion', 'bash']).stdout)
    const quoted = words.map(word => `'${word.replace(/'/g, `'\\''`)}'`).join(' ')
    const result = run('bash', ['-c', [
      `source '${script}'`,
      'compopt() { echo "compopt $*" >&2; }',
      `COMP_WORDS=(businesslens ${quoted})`,
      `COMP_CWORD=${words.length}`,
      '_businesslens',
      'printf "%s\\n" "${COMPREPLY[@]}"'
    ].join('\n')])
    expect(result.status, result.stderr).toBe(0)
    return { replies: result.stdout.split('\n').filter(Boolean), compopt: result.stderr.trim() }
  }

  it('is valid bash and registers for businesslens', () => {
    const result = run('bash', ['-c', `${run('node', [CLI, 'completion', 'bash']).stdout}\ncomplete -p businesslens`])
    expect(result.status, result.stderr).toBe(0)
    expect(result.stdout).toContain('-F _businesslens businesslens')
  })

  it('completes commands, options and values in context', () => {
    expect(bash(['']).replies).toEqual(['install', 'update', 'lint', 'view', 'blueprint', 'completion', 'help'])
    expect(bash(['blueprint', 'p']).replies).toEqual(['pull'])
    expect(bash(['install', '--s']).replies).toEqual(['--scope'])
    expect(bash(['install', '--providers', 'claude,c']).replies).toEqual(['claude,codex', 'claude,cursor'])
    // Bash splits --scope=gl into three words; only the value is replaced.
    expect(bash(['install', '--scope', '=', 'gl']).replies).toEqual(['global'])
    expect(bash(['install', '--providers', '=']).replies).toEqual(['claude', 'codex', 'cursor', 'gemini', 'github'])
    // An escaped path earlier on the line is only an option value.
    expect(bash(['--cwd', 'my\\ dir', 'lint', '--j']).replies).toEqual(['--json'])
  }, 60_000)

  it('leaves paths to readline and suppresses file names elsewhere', () => {
    expect(bash(['--cwd', 'my'])).toEqual({ replies: [], compopt: 'compopt +o default -o dirnames' })
    expect(bash(['blueprint', 'open', 'rep'])).toEqual({ replies: [], compopt: '' })
    expect(bash(['view', '--port', ''])).toEqual({ replies: [], compopt: 'compopt +o default' })
  }, 30_000)
})

describe.skipIf(!hasShell('zsh'))('zsh script', () => {
  function zsh(words: string[], prefix = words.at(-1) ?? '') {
    const script = join(sandbox, '_businesslens')
    writeFileSync(script, run('node', [CLI, 'completion', 'zsh']).stdout)
    const quoted = words.map(word => `'${word.replace(/'/g, `'\\''`)}'`).join(' ')
    const result = run('zsh', ['-f', '-c', [
      // Stand-ins for the completion system, which needs a terminal.
      'compdef() { :; }',
      '_describe() { print -rl -- "${(@P)${@[-1]}}"; }',
      '_files() { print -r -- "files $*"; }',
      '_path_files() { print -r -- "path_files $*"; }',
      'compset() { print -r -- "compset $*"; }',
      `source '${script}'`,
      `words=(businesslens ${quoted})`,
      `CURRENT=${words.length + 1}`,
      `PREFIX='${prefix}'`,
      '_businesslens'
    ].join('\n')])
    // A completer returns 1 when it adds nothing, so only stderr marks a fault.
    expect(result.stderr).toBe('')
    return result.stdout.split('\n').filter(Boolean)
  }

  it('is valid zsh', () => {
    const result = run('zsh', ['-n', '-c', run('node', [CLI, 'completion', 'zsh']).stdout])
    expect(result.status, result.stderr).toBe(0)
  })

  it('describes candidates and leaves paths to zsh', () => {
    expect(zsh([''])).toContain('install:Install BusinessLens skills')
    expect(zsh(['install', '--providers', 'claude,'])).toContain('claude,codex:Codex CLI')
    expect(zsh(['install', '--scope=g'])).toEqual(['compset -P *=', 'project', 'global'])
    expect(zsh(['--cwd', 'my\\ d'])).toEqual(['path_files -/'])
    expect(zsh(['blueprint', 'open', ''])).toEqual(['files -g *.json(-.)'])
    expect(zsh(['view', '--port', ''])).toEqual([])
  }, 30_000)
})

describe.skipIf(!hasShell('fish'))('fish script', () => {
  function fish(line: string) {
    const script = join(sandbox, 'businesslens.fish')
    writeFileSync(script, run('node', [CLI, 'completion', 'fish']).stdout)
    const result = run('fish', ['--no-config', '-c', `source '${script}'; complete -C '${line.replace(/'/g, "\\'")}'`])
    expect(result.status, result.stderr).toBe(0)
    expect(result.stderr).toBe('')
    return result.stdout.split('\n').filter(Boolean)
  }

  it('completes commands with descriptions, options and values', () => {
    expect(fish('businesslens ')).toContain('install\tInstall BusinessLens skills')
    expect(fish('businesslens blueprint ')).toContain('pull\tPull a catalog Blueprint')
    expect(fish('businesslens install --providers claude,')).toContain('claude,codex\tCodex CLI')
    expect(fish('businesslens install --scope=').sort()).toEqual(['--scope=global', '--scope=project'])
    expect(fish('businesslens view --port ')).toEqual([])
  }, 30_000)

  it('completes paths natively, including spaces', () => {
    expect(fish('businesslens --cwd my')).toEqual(['my dir/'])
    expect(fish('businesslens --cwd=my')).toEqual(['--cwd=my dir/'])
    expect(fish('businesslens blueprint open ')).toEqual(expect.arrayContaining(['my dir/', 'report.json']))
  }, 30_000)
})
