#!/usr/bin/env bash
set -euo pipefail

SUDOERS_FILE="/etc/sudoers.d/lazyufw-nopasswd"
TARGET_USER="${SUDO_USER:-$USER}"

UFW_PATH=""
for candidate in /usr/sbin/ufw /usr/bin/ufw /sbin/ufw; do
    if [ -x "$candidate" ]; then
        UFW_PATH="$candidate"
        break
    fi
done

if [ -z "$UFW_PATH" ]; then
    echo "ufw not found on this system. Install ufw first." >&2
    exit 1
fi

if [ "$(id -u)" -ne 0 ]; then
    echo "Run this installer with sudo." >&2
    exit 1
fi

echo "$TARGET_USER ALL=(root) NOPASSWD: $UFW_PATH" > "$SUDOERS_FILE"
chmod 0440 "$SUDOERS_FILE"

if ! visudo -c -f "$SUDOERS_FILE" >/dev/null 2>&1; then
    echo "Generated sudoers file failed validation, removing it." >&2
    rm -f "$SUDOERS_FILE"
    exit 1
fi

echo "lazyufw: passwordless sudo enabled for $TARGET_USER on $UFW_PATH"
echo "lazyufw: set UFW_PATH=$UFW_PATH in your environment if it's not auto-detected"