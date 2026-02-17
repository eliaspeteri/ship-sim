#!/usr/bin/env sh

set -eu

# Run the WASM export validation if AssemblyScript-relevant files changed in
# unpushed commits. If no upstream exists yet, run it for safety.
if upstream_ref=$(git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>/dev/null); then
  base_ref=$(git merge-base HEAD "$upstream_ref")
  if git diff --name-only "$base_ref" HEAD -- assembly asconfig.json | grep -q .; then
    echo "yes"
  else
    echo "no"
  fi
else
  echo "yes"
fi
