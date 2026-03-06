#!/bin/sh
set -eu

: "${CLICKHOUSE_DB:?CLICKHOUSE_DB is required}"

clickhouse-client \
  --host 127.0.0.1 \
  --user "${CLICKHOUSE_USER:-default}" \
  --password "${CLICKHOUSE_PASSWORD:-}" \
  --query "CREATE DATABASE IF NOT EXISTS \`${CLICKHOUSE_DB}\`"
