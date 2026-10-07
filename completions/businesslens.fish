# businesslens completion for fish. Print it with `businesslens completion fish`.
# Candidates come from the installed CLI on every Tab: `businesslens __complete`
# reads its own command tree, offline, and runs nothing.
function __businesslens_complete
    set -l token (commandline -ct)
    set -l words (commandline -opc) $token
    set -e words[1]
    set -l lines (businesslens __complete $words 2>/dev/null)
    or return
    test (count $lines) -gt 0
    or return
    set -l directive $lines[-1]
    set -e lines[-1]
    # A value written as --option=value completes after the "=".
    set -l prefix (string match -r -- '^--[^=]+=' $token)
    set -l value (string replace -r -- '^--[^=]+=' '' $token)
    switch $directive
        case :directories
            __fish_complete_directories "$value" '' | string replace -r -- '^' "$prefix"
        case ':files:*'
            __fish_complete_suffix (string replace -- ':files:' '' $directive)
        case :files
            __fish_complete_path "$value" | string replace -r -- '^' "$prefix"
        case '*'
            for line in $lines
                echo "$prefix$line"
            end
    end
end
complete -c businesslens -e
complete -c businesslens -f -a '(__businesslens_complete)'
