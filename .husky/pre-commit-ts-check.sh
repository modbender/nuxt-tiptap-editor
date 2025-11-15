#!/bin/bash
# Check if any TypeScript/Vue files are staged
if git diff --cached --name-only --diff-filter=ACM | grep -qE '\.(ts|tsx|vue)$'; then
  echo "Running type checks..."
  pnpm test:types
fi

