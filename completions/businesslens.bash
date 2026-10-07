# businesslens completion for bash. Print it with `businesslens completion bash`.
# Candidates come from the installed CLI on every Tab: `businesslens __complete`
# reads its own command tree, offline, and runs nothing.
_businesslens() {
  local cur=${COMP_WORDS[COMP_CWORD]} word line out directive i
  local -a args
  args=()
  # Bash splits "--option=value" at "="; hand BusinessLens the joined word.
  for ((i = 1; i <= COMP_CWORD; i++)); do
    word=${COMP_WORDS[i]}
    if [[ $word == "=" && ${#args[@]} -gt 0 && ${args[${#args[@]}-1]} == --* ]]; then
      args[${#args[@]}-1]+="="
      [[ $i == "$COMP_CWORD" ]] && cur=""
      continue
    fi
    if [[ $i -gt 1 && ${COMP_WORDS[i-1]} == "=" && ${#args[@]} -gt 0 && ${args[${#args[@]}-1]} == --*= ]]; then
      args[${#args[@]}-1]+=$word
    else
      args+=("$word")
    fi
  done
  out=$(businesslens __complete "${args[@]}" 2>/dev/null) || return 0
  directive=${out##*$'\n'}
  COMPREPLY=()
  while IFS= read -r line; do
    [[ $line == :* ]] && continue
    line=${line%%$'\t'*}
    [[ $line == "$cur"* ]] && COMPREPLY+=("$line")
  done <<< "$out"
  # Paths complete natively, so readline quotes them. Bash 3 has no compopt, so
  # there every value without suggestions falls back to file names.
  if type compopt >/dev/null 2>&1; then
    case $directive in
      :directories) compopt +o default -o dirnames ;;
      :files*) ;;
      *) compopt +o default ;;
    esac
  fi
  return 0
}
complete -o default -F _businesslens businesslens
