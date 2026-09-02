#!/usr/bin/env bash
set -euo pipefail

SUDOERS_FILE="/etc/sudoers.d/lazyufw-nopasswd"

if [ "$(id -u)" -ne 0 ]; then
    echo "Run this uninstaller with sudo." >&2
    exit 1
fi

if [ -f "$SUDOERS_FILE" ]; then
    rm -f "$SUDOERS_FILE"
    echo "lazyufw: removed $SUDOERS_FILE"
else
    echo "lazyufw: no sudoers drop-in found, nothing to remove"
fi