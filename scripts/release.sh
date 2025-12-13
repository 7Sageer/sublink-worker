#!/bin/bash

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if version argument is provided
if [ -z "$1" ]; then
  echo -e "${RED}Error: Version number required${NC}"
  echo "Usage: ./scripts/release.sh <version>"
  echo "Example: ./scripts/release.sh v2.0.1"
  exit 1
fi

VERSION=$1

# Validate version format (must start with v)
if [[ ! $VERSION =~ ^v[0-9]+\.[0-9]+\.[0-9]+$ ]]; then
  echo -e "${RED}Error: Invalid version format${NC}"
  echo "Version must be in format: vX.Y.Z (e.g., v2.0.1)"
  exit 1
fi

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
  echo -e "${RED}Error: GitHub CLI (gh) is not installed${NC}"
  echo "Install it from: https://cli.github.com/"
  exit 1
fi

echo -e "${YELLOW}Starting release process for $VERSION...${NC}\n"

# Check for uncommitted changes
if [[ -n $(git status -s) ]]; then
  echo -e "${RED}Error: You have uncommitted changes${NC}"
  echo "Please commit or stash your changes before releasing"
  git status -s
  exit 1
fi

# Check if tag already exists
if git rev-parse "$VERSION" >/dev/null 2>&1; then
  echo -e "${RED}Error: Tag $VERSION already exists${NC}"
  exit 1
fi

# Update package.json version (remove 'v' prefix for npm)
NPM_VERSION=${VERSION#v}
echo -e "${YELLOW}→ Updating package.json version to $NPM_VERSION${NC}"
npm version $NPM_VERSION --no-git-tag-version

# Update src/constants.js version
echo -e "${YELLOW}→ Updating src/constants.js version to $NPM_VERSION${NC}"
sed -i.bak "s/export const APP_VERSION = '.*';/export const APP_VERSION = '$NPM_VERSION';/" src/constants.js
rm -f src/constants.js.bak

# Commit version bump
echo -e "${YELLOW}→ Committing version bump${NC}"
git add package.json package-lock.json src/constants.js
git commit -m "chore: release $VERSION"

# Create annotated tag
echo -e "${YELLOW}→ Creating Git tag $VERSION${NC}"
git tag $VERSION -a -m "Release $VERSION

See changelog: https://sublink.works/updates/"

# Push commit and tag
echo -e "${YELLOW}→ Pushing to remote${NC}"
git push origin $(git branch --show-current)
git push origin $VERSION

# Create GitHub Release with auto-generated notes
echo -e "${YELLOW}→ Creating GitHub Release${NC}"
RELEASE_URL=$(gh release create $VERSION \
  --title "Sublink Worker $VERSION" \
  --generate-notes)

echo -e "\n${GREEN}✅ Release $VERSION completed successfully!${NC}"
echo -e "${GREEN}→ Release URL: $RELEASE_URL${NC}\n"
echo -e "${YELLOW}Next steps:${NC}"
echo "1. Update changelog at docs/updates/index.md"
echo "2. Review and edit the release notes if needed: $RELEASE_URL"
echo "3. Deploy to production if auto-deploy is not configured"
