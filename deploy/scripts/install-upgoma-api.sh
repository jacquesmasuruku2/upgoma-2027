#!/usr/bin/env bash
set -euo pipefail

if [[ "${EUID}" -ne 0 ]]; then
  echo "Run with sudo: sudo bash $0 [repository-root] [service-user]" >&2
  exit 1
fi

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
DEFAULT_REPO_ROOT="$(cd -- "${SCRIPT_DIR}/../.." && pwd)"
REPO_ROOT="${1:-${DEFAULT_REPO_ROOT}}"
REPO_ROOT="$(cd -- "${REPO_ROOT}" && pwd)"

if [[ -n "${2:-}" ]]; then
  SERVICE_USER="$2"
else
  SERVICE_USER="$(stat -c '%U' "${REPO_ROOT}")"
fi

if [[ "${SERVICE_USER}" == "root" ]] || ! id "${SERVICE_USER}" >/dev/null 2>&1; then
  echo "Pass a valid non-root service user as the second argument." >&2
  exit 1
fi

if [[ "${REPO_ROOT}" =~ [[:space:]] || "${SERVICE_USER}" =~ [[:space:]] ]]; then
  echo "Repository path and service user must not contain whitespace." >&2
  exit 1
fi

API_ENTRY="${REPO_ROOT}/apps/server/server/admission-api.mjs"
ENV_FILE="${REPO_ROOT}/.env"
UNIT_FILE="/etc/systemd/system/upgoma-api.service"
NODE_BIN="$(command -v node || true)"

if [[ ! -f "${API_ENTRY}" ]]; then
  echo "API entry point not found: ${API_ENTRY}" >&2
  exit 1
fi
if [[ ! -r "${ENV_FILE}" ]] || ! runuser -u "${SERVICE_USER}" -- test -r "${ENV_FILE}"; then
  echo "The repository .env must exist and be readable by ${SERVICE_USER}." >&2
  echo "No environment values have been read or displayed by this installer." >&2
  exit 1
fi
if [[ -z "${NODE_BIN}" ]]; then
  echo "Node.js is not installed or is not available on PATH." >&2
  exit 1
fi

runuser -u "${SERVICE_USER}" -- "${NODE_BIN}" --check "${API_ENTRY}"

cat > "${UNIT_FILE}" <<EOF
[Unit]
Description=UPGoma Node API
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
User=${SERVICE_USER}
WorkingDirectory=${REPO_ROOT}
Environment=NODE_ENV=production
ExecStart=${NODE_BIN} ${API_ENTRY}
Restart=on-failure
RestartSec=5
TimeoutStopSec=30
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=full

[Install]
WantedBy=multi-user.target
EOF

chmod 0644 "${UNIT_FILE}"
systemctl daemon-reload
if ! systemctl enable --now upgoma-api.service; then
  systemctl --no-pager --full status upgoma-api.service || true
  journalctl --no-pager -u upgoma-api.service -n 80 || true
  exit 1
fi

if ! systemctl is-active --quiet upgoma-api.service; then
  systemctl --no-pager --full status upgoma-api.service || true
  journalctl --no-pager -u upgoma-api.service -n 80 || true
  exit 1
fi

if ! HTTP_STATUS="$(curl --silent --show-error --max-time 10 --output /dev/null --write-out '%{http_code}' http://127.0.0.1:8787/api/auth/session)"; then
  echo "Could not reach the API health endpoint at 127.0.0.1:8787." >&2
  journalctl --no-pager -u upgoma-api.service -n 40 >&2 || true
  exit 1
fi
if [[ "${HTTP_STATUS}" != "401" ]]; then
  echo "API health check returned HTTP ${HTTP_STATUS}; expected 401 without a session." >&2
  journalctl --no-pager -u upgoma-api.service -n 40 >&2 || true
  exit 1
fi

echo "UPGoma API is enabled and active; unauthenticated session check returned HTTP 401."
echo "Next, add deploy/nginx/admission-api-location.conf inside the HTTPS server block for api.upgoma.org."
echo "Then run: nginx -t && systemctl reload nginx"
