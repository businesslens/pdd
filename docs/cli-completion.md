---
title: completion
description: Print a shell completion script so Tab completes BusinessLens commands, options and their values in Bash, Zsh and Fish.
section: open-source
group: CLI
order: 29
---

# `businesslens completion`

Print a completion script, so Tab completes BusinessLens commands, options and
their values in your shell.

```bash
businesslens completion <bash|zsh|fish>
```

The script goes to standard output. BusinessLens never writes it anywhere or
edits your shell profile; you choose where it goes below.

Completion is for the `businesslens` command, so it needs the CLI installed
globally (`npm install --global businesslens`, or with pnpm, Yarn or Bun).
`npx businesslens` is not completed.

## What completes

| You type | Tab offers |
| --- | --- |
| `businesslens ` | The commands |
| `businesslens blueprint ` | `export`, `open`, `pull`, `contribute` |
| `businesslens install --` | The options that command accepts, plus the global ones |
| `--scope ` | `project`, `global` |
| `--providers claude,` | The remaining agents, keeping those already chosen |
| `--cwd ` or `-c ` | Directories |
| `blueprint open ` | Files, `.json` reports first (Zsh and Fish) |

Free-form values such as `--port`, `--pr`, `--branch`, `--catalog` and Blueprint
names get no suggestions. Zsh and Fish also show each suggestion's description.

Each Tab asks the installed CLI, which reads its own commands and prints what
fits. It runs no command, reads no project files and never uses the network.
Because the answers come from the installed CLI, a new release completes its
own commands without regenerating the script.

## Bash

For the current session:

```bash
eval "$(businesslens completion bash)"
```

To keep it, with the [bash-completion](https://github.com/scop/bash-completion)
package installed:

```bash
mkdir -p ~/.local/share/bash-completion/completions
businesslens completion bash > ~/.local/share/bash-completion/completions/businesslens
```

Without that package, add the `eval` line to `~/.bashrc` instead.

Bash 3, the version macOS ships, has no way to switch off file-name completion,
so values without suggestions fall back to file names there.

## Zsh

For the current session, once `compinit` has run (most setups run it):

```zsh
source <(businesslens completion zsh)
```

To keep it, write the script into a directory on your `fpath`:

```zsh
mkdir -p ~/.zsh/completions
businesslens completion zsh > ~/.zsh/completions/_businesslens
```

and in `~/.zshrc`, before `compinit` runs:

```zsh
fpath=(~/.zsh/completions $fpath)
```

Start a new shell. If it does not complete yet, clear the completion cache with
`rm -f ~/.zcompdump*` and start another.

## Fish

For the current session:

```fish
businesslens completion fish | source
```

To keep it:

```fish
businesslens completion fish > ~/.config/fish/completions/businesslens.fish
```

## Refreshing and removing

After updating the CLI, run the same command that kept the script to refresh it,
then start a new shell (Zsh: clear `~/.zcompdump*` as above).

To remove completion, delete the file you wrote, or the `eval` line from
`~/.bashrc`:

| Shell | File |
| --- | --- |
| Bash | `~/.local/share/bash-completion/completions/businesslens` |
| Zsh | `~/.zsh/completions/_businesslens`, and its `fpath` line if nothing else uses it |
| Fish | `~/.config/fish/completions/businesslens.fish` |

PowerShell is not supported yet.

## Exit codes

| Code | Meaning |
| --- | --- |
| `0` | The script was printed |
| `2` | The shell is missing or not one of `bash`, `zsh`, `fish` |
