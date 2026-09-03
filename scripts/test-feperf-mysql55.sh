#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
WEB_ROOT="$(cd "${PROJECT_DIR}/.." && pwd)"

MYSQL_IMAGE="${FEPERF_TEST_MYSQL_IMAGE:-mazeyqian/web:mysql-5.5}"
MYSQL_PLATFORM="${FEPERF_TEST_MYSQL_PLATFORM:-linux/amd64}"
MYSQL_IMAGE_ID="${FEPERF_TEST_MYSQL_IMAGE_ID:-sha256:c9c671d0c959183154313d6830d46f9a00d5937f97415c15ebd3c6844f6f1467}"
MYSQL_CONTAINER="${FEPERF_TEST_MYSQL_CONTAINER:-rain-feperf-mysql55-test}"
MYSQL_PORT="${FEPERF_TEST_MYSQL_PORT:-3306}"
APP_PORT="${FEPERF_TEST_APP_PORT:-3224}"
BACKUP="${FEPERF_TEST_BACKUP:-/Users/cheng/artifacts/rain-feperf-multidb.mysql5.5.bak.20260901134812.sql}"
BACKUP_SHA256="${FEPERF_TEST_BACKUP_SHA256:-270ed3e2d29584ff2192a163b6e5c078585270b4834e81bdee2881c302544ec3}"
NODE_BIN="${FEPERF_TEST_NODE_BIN:-${HOME}/.nvm/versions/node/v10.24.1/bin/node}"
AUTHORITATIVE_CONFIG="${FEPERF_TEST_CONFIG:-/Users/cheng/web/server/config/node-koa-rain/env.production.js}"
LOCAL_CONFIG="${PROJECT_DIR}/src/config/env.production.js"

APP_PID=""
CREATED_CONTAINER=false
TEST_TMP=""
TEMP_EXISTED=false
VIDEO_EXISTED=false

fail() {
  printf 'FEPerf integration test failed: %s\n' "$*" >&2
  exit 1
}

stop_app() {
  if [ -n "$APP_PID" ] && kill -0 "$APP_PID" 2>/dev/null; then
    kill "$APP_PID" 2>/dev/null || true
    wait "$APP_PID" 2>/dev/null || true
  fi
  APP_PID=""
}

cleanup() {
  stop_app
  if [ "$CREATED_CONTAINER" = true ]; then
    docker rm -f "$MYSQL_CONTAINER" >/dev/null 2>&1 || true
  fi
  if [ -n "$TEST_TMP" ]; then
    rm -rf "$TEST_TMP"
  fi
  if [ "$TEMP_EXISTED" = false ] && [ -d "${WEB_ROOT}/temp" ]; then
    rmdir "${WEB_ROOT}/temp" 2>/dev/null || true
  fi
  if [ "$VIDEO_EXISTED" = false ] && [ -d "${WEB_ROOT}/video" ]; then
    rmdir "${WEB_ROOT}/video" 2>/dev/null || true
  fi
}

trap cleanup EXIT INT TERM

require_command() {
  command -v "$1" >/dev/null 2>&1 || fail "Missing required command: $1"
}

port_is_busy() {
  lsof -nP -iTCP:"$1" -sTCP:LISTEN >/dev/null 2>&1
}

mysql_value() {
  local query="$1"
  docker exec "$MYSQL_CONTAINER" sh -c \
    'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -N -e "$1"' _ "$query"
}

assert_mysql_value() {
  local query="$1"
  local expected="$2"
  local actual
  actual="$(mysql_value "$query")"
  [ "$actual" = "$expected" ] || fail \
    "Unexpected MySQL result for [$query]: expected $expected, got $actual"
}

start_app() {
  local schedules="$1"
  local log_file="$2"

  (
    cd "$PROJECT_DIR"
    exec env \
      NODE_ENV=production \
      TZ=Asia/Shanghai \
      FEPERF_SCHEDULE_ENABLED="$schedules" \
      FEPERF_TEST_MYSQL_HOST=127.0.0.1 \
      FEPERF_TEST_SILENT_LOGS=true \
      "$NODE_BIN" scripts/run-feperf-node10-test.js
  ) >"$log_file" 2>&1 &
  APP_PID=$!

  for _ in $(seq 1 60); do
    if curl --silent --fail "http://127.0.0.1:${APP_PORT}/feperf/ping" >/dev/null; then
      return
    fi
    if ! kill -0 "$APP_PID" 2>/dev/null; then
      tail -n 80 "$log_file" >&2 || true
      fail "Rain exited before its health check passed"
    fi
    sleep 1
  done

  tail -n 80 "$log_file" >&2 || true
  fail "Timed out waiting for Rain on port ${APP_PORT}"
}

require_command docker
require_command curl
require_command lsof
require_command shasum
require_command seq

[ -x "$NODE_BIN" ] || fail "Node 10 executable not found: $NODE_BIN"
[ "$("$NODE_BIN" --version)" = "v10.24.1" ] || fail "Expected Node v10.24.1"
[ "$MYSQL_PORT" = "3306" ] || fail "Rain's current ORM config requires MySQL port 3306"
[ "$APP_PORT" = "3224" ] || fail "Rain currently listens on port 3224"
[ -f "$BACKUP" ] || fail "MySQL backup not found: $BACKUP"
[ -f "$AUTHORITATIVE_CONFIG" ] || fail "Production config not found: $AUTHORITATIVE_CONFIG"
[ -f "$LOCAL_CONFIG" ] || fail "Rain runtime config not found: $LOCAL_CONFIG"
[ -d "$PROJECT_DIR/node_modules" ] || fail "Install Rain dependencies before running this test"

ACTUAL_IMAGE_ID="$(docker image inspect "$MYSQL_IMAGE" --format '{{.Id}}' 2>/dev/null)" ||
  fail "Docker image is not available locally: $MYSQL_IMAGE"
[ "$ACTUAL_IMAGE_ID" = "$MYSQL_IMAGE_ID" ] ||
  fail "Docker image digest mismatch: expected $MYSQL_IMAGE_ID, got $ACTUAL_IMAGE_ID"

ACTUAL_BACKUP_SHA256="$(shasum -a 256 "$BACKUP" | awk '{print $1}')"
[ "$ACTUAL_BACKUP_SHA256" = "$BACKUP_SHA256" ] ||
  fail "Backup checksum mismatch: expected $BACKUP_SHA256, got $ACTUAL_BACKUP_SHA256"

if docker container inspect "$MYSQL_CONTAINER" >/dev/null 2>&1; then
  fail "Docker container name is already in use: $MYSQL_CONTAINER"
fi
port_is_busy "$MYSQL_PORT" && fail "Port $MYSQL_PORT is already in use"
port_is_busy "$APP_PORT" && fail "Port $APP_PORT is already in use"

"$NODE_BIN" -e '
  const local = require(process.argv[1]).mysqlConf;
  const production = require(process.argv[2]).mysqlConf;
  [ "$mysql_username", "$mysql_password", "$mysql_database" ].forEach(key => {
    if (local[key] !== production[key]) process.exit(1);
  });
' "$LOCAL_CONFIG" "$AUTHORITATIVE_CONFIG" ||
  fail "Rain runtime credentials do not match the authoritative production config"

[ -d "${WEB_ROOT}/temp" ] && TEMP_EXISTED=true
[ -d "${WEB_ROOT}/video" ] && VIDEO_EXISTED=true
umask 077
TEST_TMP="$(mktemp -d "${TMPDIR:-/tmp}/rain-feperf-test.XXXXXX")"

MYSQL_PASSWORD="$("$NODE_BIN" -e \
  'process.stdout.write(require(process.argv[1]).mysqlConf.$mysql_password)' \
  "$AUTHORITATIVE_CONFIG")"
printf 'MYSQL_ROOT_PASSWORD=%s\n' "$MYSQL_PASSWORD" >"${TEST_TMP}/mysql.env"
unset MYSQL_PASSWORD

printf 'Starting disposable MySQL 5.5 container...\n'
docker run --detach \
  --pull=never \
  --platform "$MYSQL_PLATFORM" \
  --name "$MYSQL_CONTAINER" \
  --publish "127.0.0.1:${MYSQL_PORT}:3306" \
  --tmpfs /var/lib/mysql \
  --env-file "${TEST_TMP}/mysql.env" \
  "$MYSQL_IMAGE" >/dev/null
CREATED_CONTAINER=true

for _ in $(seq 1 90); do
  if docker exec "$MYSQL_CONTAINER" sh -c \
    'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1"' >/dev/null 2>&1; then
    break
  fi
  sleep 1
done
docker exec "$MYSQL_CONTAINER" sh -c \
  'mysql -uroot -p"$MYSQL_ROOT_PASSWORD" -e "SELECT 1"' >/dev/null 2>&1 ||
  fail "MySQL did not become ready"

printf 'Restoring verified backup...\n'
docker exec -i "$MYSQL_CONTAINER" sh -c \
  'exec mysql -uroot -p"$MYSQL_ROOT_PASSWORD"' <"$BACKUP"

assert_mysql_value \
  "SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'rain';" \
  "30"
assert_mysql_value "SELECT COUNT(*) FROM rain.perf_report_log;" "0"
assert_mysql_value "SELECT COUNT(*) FROM rain.perf_statistics;" "985"
assert_mysql_value "SELECT COUNT(*) FROM rain.perf_topics;" "7"
assert_mysql_value "SELECT COUNT(*) FROM rain.mazey_log;" "4166"

printf 'Running core API integration with schedules disabled...\n'
start_app false "${TEST_TMP}/rain-core.log"
if ! TZ=Asia/Shanghai FEPERF_TEST_APP_PORT="$APP_PORT" \
  "$NODE_BIN" "$SCRIPT_DIR/test-feperf-api.js" core; then
  tail -n 80 "${TEST_TMP}/rain-core.log" >&2 || true
  fail "Core API integration failed"
fi
assert_mysql_value "SELECT COUNT(*) FROM rain.perf_report_log;" "1"
assert_mysql_value "SELECT COUNT(*) FROM rain.perf_statistics;" "986"
assert_mysql_value "SELECT COUNT(*) FROM rain.perf_topics;" "8"
assert_mysql_value \
  "SELECT COUNT(*) FROM rain.perf_statistics WHERE topic = 'codex_test' AND ss_status = 1;" \
  "1"
stop_app

printf 'Running schedule cache integration...\n'
start_app true "${TEST_TMP}/rain-cache.log"
if ! TZ=Asia/Shanghai FEPERF_TEST_APP_PORT="$APP_PORT" \
  "$NODE_BIN" "$SCRIPT_DIR/test-feperf-api.js" cache; then
  tail -n 80 "${TEST_TMP}/rain-cache.log" >&2 || true
  fail "Schedule cache integration failed"
fi
stop_app

printf 'FEPerf Docker MySQL 5.5 and Node 10 integration test passed.\n'
