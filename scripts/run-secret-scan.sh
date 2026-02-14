#!/usr/bin/env sh

set -eu

gitleaks_image="ghcr.io/gitleaks/gitleaks:latest"
repo_root="$(pwd)"

if upstream_ref=$(git rev-parse --abbrev-ref --symbolic-full-name "@{u}" 2>/dev/null); then
  commit_range="${upstream_ref}..HEAD"
else
  root_commit=$(git rev-list --max-parents=0 HEAD | tail -n 1)
  commit_range="${root_commit}..HEAD"
fi

if command -v docker >/dev/null 2>&1; then
  echo "Running gitleaks (docker) for commit range ${commit_range}"
  docker run --rm \
    -v "${repo_root}:/path" \
    -w /path \
    "${gitleaks_image}" \
    git --no-banner --redact --log-opts="${commit_range}"
  exit 0
fi

if command -v gitleaks >/dev/null 2>&1; then
  echo "Running gitleaks for commit range ${commit_range}"
  gitleaks git --no-banner --redact --log-opts="${commit_range}"
  exit 0
fi

if command -v detect-secrets-hook >/dev/null 2>&1 && [ -f .secrets.baseline ]; then
  echo "Running detect-secrets-hook for changed files in ${commit_range}"
  changed_files=$(git diff --name-only "${commit_range}")
  if [ -z "${changed_files}" ]; then
    echo "No changed files to scan."
    exit 0
  fi

  # shellcheck disable=SC2086
  detect-secrets-hook --baseline .secrets.baseline ${changed_files}
  exit 0
fi

echo "Skipping secret scan: install Docker or gitleaks, or detect-secrets with a .secrets.baseline file."
