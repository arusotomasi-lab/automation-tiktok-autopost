#!/bin/sh
set -e
# Downloaded videos live in the work dir (Railway volume, small). n8n fetches each file right after
# getFile (seconds), so they are safe to delete quickly. A full volume crashes the server
# ("Can't create directories"), so purge all media on boot and anything older than 1 min every 20 s.
WORK=/var/lib/telegram-bot-api
purge() {
  find "$WORK" -type f \( -path '*/videos/*' -o -path '*/documents/*' -o -path '*/temp/*' -o -path '*/animations/*' -o -path '*/video_notes/*' \) "$@" -delete 2>/dev/null || true
  find /tmp/telegram-bot-api -type f "$@" -delete 2>/dev/null || true
}
purge
(
  while true; do
    sleep 20
    purge -mmin +1
  done
) &
nginx
exec /docker-entrypoint.sh "$@"
