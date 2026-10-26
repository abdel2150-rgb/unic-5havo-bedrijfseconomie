#!/usr/bin/env bash
# Publish only generated static assets; preserve the current checkout and index.
set -euo pipefail
cd "$(dirname "$0")/.."
repo_root=$(pwd)
repo_git_dir=$(git rev-parse --absolute-git-dir)
npm test
npm run build
touch dist/.nojekyll
site_temp=$(mktemp -d)
trap 'rm -rf "$site_temp"' EXIT
parent_args=()
if git ls-remote --exit-code origin refs/heads/gh-pages > "$site_temp/remote"; then
  git fetch --no-tags origin refs/heads/gh-pages
  site_parent=$(git rev-parse FETCH_HEAD)
  parent_args=(-p "$site_parent")
else
  remote_status=$?
  if [ "$remote_status" -ne 2 ]; then exit "$remote_status"; fi
fi
GIT_INDEX_FILE="$site_temp/index" git --git-dir="$repo_git_dir" --work-tree="$repo_root/dist" add --all
site_tree=$(GIT_INDEX_FILE="$site_temp/index" git --git-dir="$repo_git_dir" write-tree)
if [ "${#parent_args[@]}" -gt 0 ] && [ "$site_tree" = "$(git rev-parse "$site_parent^{tree}")" ]; then
  echo 'De websitebranch bevat deze build al.'
  exit 0
fi
site_commit=$(git commit-tree "$site_tree" "${parent_args[@]}" -m 'Publish validated learning website')
git push origin "$site_commit:refs/heads/gh-pages"
git update-ref refs/heads/gh-pages "$site_commit"
echo 'Websitebestanden staan op gh-pages. Selecteer in GitHub Settings > Pages: Deploy from a branch, gh-pages, / (root).'
