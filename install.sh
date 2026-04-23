#!/usr/bin/env bash
# ────────────────────────────────────────────────────────────────
#  AI Weekender — handbook installer / updater
#  Run once to install, re-run any time to update.
#
#  Usage (from inside your project folder):
#    curl -fsSL https://raw.githubusercontent.com/GrowthX-Club/ai-weekender-handbook/main/install.sh | bash
# ────────────────────────────────────────────────────────────────

set -e

# Defaults — override with env vars if you're self-hosting
REPO_OWNER="${REPO_OWNER:-GrowthX-Club}"
REPO_NAME="${REPO_NAME:-ai-weekender-handbook}"
BRANCH="${BRANCH:-main}"
TARBALL_URL="https://github.com/${REPO_OWNER}/${REPO_NAME}/archive/${BRANCH}.tar.gz"
MARKER_FILE=".weekender-handbook"

# Colors
BLUE="\033[0;34m"
GREEN="\033[0;32m"
YELLOW="\033[0;33m"
RED="\033[0;31m"
DIM="\033[2m"
RESET="\033[0m"

echo ""
echo -e "${BLUE}AI Weekender${RESET} — GrowthX handbook"
echo ""
echo -e "  ${DIM}installing to:${RESET} ${YELLOW}${PWD}${RESET}"
echo ""

# ── 0. Sanity check — is this even a code project? ─────────────
# If there's no sign of a project here, warn loudly and give them a chance to bail.
if [ ! -d .git ] && [ ! -f package.json ] && [ ! -f pyproject.toml ] && [ ! -f Cargo.toml ] && [ ! -f Gemfile ] && [ ! -d src ] && [ ! -d app ] && [ ! -d convex ]; then
  echo -e "${YELLOW}⚠  heads up${RESET}"
  echo -e "   this folder doesn't look like a code project."
  echo -e "   no .git, package.json, pyproject.toml, or project folder."
  echo ""
  echo -e "   if this isn't your weekender project, ${RED}press Ctrl+C now${RESET}"
  echo -e "   and cd into the right folder before running again."
  echo ""
  echo -e "   ${DIM}continuing in 5 seconds...${RESET}"
  sleep 5
  echo ""
fi

# ── 1. Detect: fresh install vs update ─────────────────────────
MODE="install"
if [ -d "handbook" ]; then
  if [ -f "handbook/$MARKER_FILE" ]; then
    MODE="update"
    CURRENT_VERSION="$(cat handbook/$MARKER_FILE 2>/dev/null | tr -d '[:space:]' || echo 'unknown')"
    echo -e "${DIM}→ existing install detected (version: ${CURRENT_VERSION}) — updating${RESET}"
  else
    echo -e "${RED}✗${RESET} ./handbook/ exists but isn't a Weekender handbook install."
    echo -e "  I won't touch it. If you want to replace it, remove it first:"
    echo -e "  ${DIM}rm -rf ./handbook${RESET}"
    exit 1
  fi
else
  echo -e "${DIM}→ fresh install${RESET}"
fi

# ── 2. Download the latest handbook ────────────────────────────
echo -e "${DIM}→ downloading${RESET}"
TMP_DIR="$(mktemp -d)"
cd "$TMP_DIR"

if command -v curl >/dev/null 2>&1; then
  curl -fsSL "$TARBALL_URL" -o handbook.tar.gz
elif command -v wget >/dev/null 2>&1; then
  wget -qO handbook.tar.gz "$TARBALL_URL"
else
  echo -e "${RED}✗${RESET} neither curl nor wget found. install one and retry."
  exit 1
fi

tar -xzf handbook.tar.gz
cd - > /dev/null

EXTRACTED_DIR="$TMP_DIR/${REPO_NAME}-${BRANCH}"

if [ ! -d "$EXTRACTED_DIR" ]; then
  echo -e "${RED}✗${RESET} couldn't find extracted folder at $EXTRACTED_DIR"
  rm -rf "$TMP_DIR"
  exit 1
fi

# ── 3. Replace handbook contents ───────────────────────────────
# The repo layout: markdown files live at the repo root (flat) or under handbook/
SOURCE_DIR=""
if [ -f "$EXTRACTED_DIR/README.md" ] && [ -f "$EXTRACTED_DIR/09-scoring.md" ]; then
  SOURCE_DIR="$EXTRACTED_DIR"
elif [ -d "$EXTRACTED_DIR/handbook" ]; then
  SOURCE_DIR="$EXTRACTED_DIR/handbook"
elif [ -d "$EXTRACTED_DIR/handbook-md" ]; then
  SOURCE_DIR="$EXTRACTED_DIR/handbook-md"
else
  echo -e "${RED}✗${RESET} repo layout unexpected — no handbook files found at tarball root"
  rm -rf "$TMP_DIR"
  exit 1
fi

# If updating, backup the existing folder alongside (once), then replace
if [ "$MODE" = "update" ]; then
  BACKUP_DIR="./handbook.backup-$(date +%Y%m%d-%H%M%S)"
  mv ./handbook "$BACKUP_DIR"
  echo -e "${DIM}→ previous version backed up to ${BACKUP_DIR}${RESET}"
fi

mkdir -p ./handbook
# Copy only the files we want — markdown + README. Skip install.sh, git metadata, node_modules, etc.
cp "$SOURCE_DIR"/*.md ./handbook/ 2>/dev/null || true

# Stamp the version marker. Prefer the repo's VERSION file if present, else use the commit sha slug.
if [ -f "$SOURCE_DIR/VERSION" ]; then
  cp "$SOURCE_DIR/VERSION" "./handbook/$MARKER_FILE"
else
  echo "${BRANCH}-$(date +%Y%m%d)" > "./handbook/$MARKER_FILE"
fi

rm -rf "$TMP_DIR"

NEW_VERSION="$(cat ./handbook/$MARKER_FILE | tr -d '[:space:]')"
echo -e "${GREEN}✓${RESET} handbook installed at ./handbook/ (version: ${NEW_VERSION})"

# ── 4. Append a pointer to CLAUDE.md (only on fresh install) ───
CLAUDE_MD="./CLAUDE.md"
MARKER_BLOCK="# AI Weekender context"

if [ -f "$CLAUDE_MD" ] && grep -Fq "$MARKER_BLOCK" "$CLAUDE_MD"; then
  echo -e "${DIM}→ CLAUDE.md already points to the handbook, skipping${RESET}"
else
  cat >> "$CLAUDE_MD" <<'EOF'

# AI Weekender context

This project is part of the GrowthX AI Weekender sprint.

The full handbook lives at `./handbook/` — read files from there when the user asks about:
- ideas, tracks, difficulty (see `./handbook/06-pick-an-idea.md`)
- rubric, scoring, bonus points, tie-breakers (see `./handbook/09-scoring.md`)
- setup, Claude Code install, accounts (see `./handbook/04-setup.md`)
- skills Claude uses while building (see `./handbook/05-skills.md`)
- the build pipeline: local → github → vercel → user (see `./handbook/07-build-pipeline.md`)
- the build process: scope → POC → build (see `./handbook/08-build-process.md`)
- day-by-day outcomes (see `./handbook/02-how-the-week-runs.md`)

When in doubt, start at `./handbook/README.md` for the index.

To update the handbook later, the user re-runs:
  curl -fsSL https://raw.githubusercontent.com/GrowthX-Club/ai-weekender-handbook/main/install.sh | bash

Writing style for this project: lowercase headings, direct, no corporate tone.
EOF
  echo -e "${GREEN}✓${RESET} CLAUDE.md updated"
fi

# ── 5. Done ────────────────────────────────────────────────────
echo ""
if [ "$MODE" = "install" ]; then
  echo -e "${GREEN}Handbook installed.${RESET}"
  echo ""
  echo -e "  ${DIM}next steps:${RESET}"
  echo -e "  1. open Claude Code: ${BLUE}claude --dangerously-skip-permissions${RESET}"
  echo -e "  2. say: ${BLUE}\"read the handbook and tell me what we're doing\"${RESET}"
  echo -e "  3. build."
else
  echo -e "${GREEN}Handbook updated to ${NEW_VERSION}.${RESET}"
  echo -e "  ${DIM}previous version safe at handbook.backup-*${RESET}"
fi
echo ""
