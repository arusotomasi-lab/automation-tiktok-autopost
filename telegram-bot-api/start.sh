#!/bin/sh
set -e
# Downloaded videos live in the work dir (Railway volume). Delete files older than 6 hours
# every hour so the volume never fills up; n8n copies each video to R2 within minutes.
(
  while true; do
    find /var/lib/telegram-bot-api -type f -mmin +360 \( -path '*/videos/*' -o -path '*/documents/*' -o -path '*/temp/*' \) -delete 2>/dev/null || true
    find /tmp/telegram-bot-api -type f -mmin +360 -delete 2>/dev/null || true
    sleep 3600
  done
) &
nginx
exec /docker-entrypoint.sh "$@"
