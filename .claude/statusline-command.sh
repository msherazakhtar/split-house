#!/usr/bin/env bash
# Claude Code status line script
# Format: split-house | Claude Sonnet 4.6 | 2.4k used | 42%

input=$(cat)

# Current directory (basename)
cwd=$(echo "$input" | grep -o '"current_dir":"[^"]*"' | head -1 | cut -d'"' -f4)
[ -z "$cwd" ] && cwd=$(echo "$input" | grep -o '"cwd":"[^"]*"' | head -1 | cut -d'"' -f4)
dir=$(basename "$cwd")
[ -z "$dir" ] && dir="split-house"

# Model display name
model=$(echo "$input" | grep -o '"display_name":"[^"]*"' | head -1 | cut -d'"' -f4)

# Token count (raw number)
tokens=$(echo "$input" | grep -o '"used_tokens":[0-9]*' | head -1 | cut -d':' -f2)

# Context usage percentage
used=$(echo "$input" | grep -o '"used_percentage":[0-9.]*' | head -1 | cut -d':' -f2)

# Format token count as compact string (e.g. 2400 -> 2.4k, 100000 -> 100k)
format_tokens() {
  local n=$1
  if [ -z "$n" ] || [ "$n" -eq 0 ] 2>/dev/null; then
    echo ""
  elif [ "$n" -lt 1000 ]; then
    echo "${n}"
  elif [ "$n" -lt 10000 ]; then
    local whole=$((n / 1000))
    local frac=$(( (n % 1000) / 100 ))
    echo "${whole}.${frac}k"
  else
    echo "$((n / 1000))k"
  fi
}

tok_fmt=$(format_tokens "$tokens")

# Build status line
parts="$dir"

if [ -n "$model" ]; then
  parts="$parts | $model"
fi

if [ -n "$tok_fmt" ]; then
  parts="$parts | ${tok_fmt} used"
fi

if [ -n "$used" ]; then
  used_int=$(printf '%.0f' "$used")
  parts="$parts | ${used_int}%"
fi

printf '%s' "$parts"
