#!/bin/sh
set -e
# Downloaded videos live in the work dir (Railway volume, small). n8n copies each video to R2
# within a few minutes, so delete downloaded files older than 20 minutes every 5 minutes.
(
  while true; do
    find /var/lib/telegram-bot-api -type f -mmin +20 \( -path '*/videos/*' -o -path '*/documents/*' -o -path '*/temp/*' \) -delete 2>/dev/null || true
    find /tmp/telegram-bot-api -type f -mmin +20 -delete 2>/dev/null || true
    sleep 300
  done
) &
nginx
exec /docker-entrypoint.sh "$@"
