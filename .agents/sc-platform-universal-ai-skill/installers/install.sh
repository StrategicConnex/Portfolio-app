#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TARGET="$HOME/.sc-platform-universal-ai-skill"
rm -rf "$TARGET"; cp -R "$ROOT" "$TARGET"
echo "Installed to $TARGET"
