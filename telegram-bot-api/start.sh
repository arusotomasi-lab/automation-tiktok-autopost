#!/bin/sh
set -e
nginx
exec /docker-entrypoint.sh "$@"
