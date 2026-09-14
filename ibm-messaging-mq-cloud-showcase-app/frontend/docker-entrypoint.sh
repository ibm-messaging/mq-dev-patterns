#!/usr/bin/env sh
#  Copyright 2024, 2026 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the 'License');
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
 
#  http://www.apache.org/licenses/LICENSE-2.0
 
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

set -eu

# Required variables — container exits immediately with a clear message if absent
: "${REACT_APP_BE_HOST:?REACT_APP_BE_HOST is required}"
: "${REACT_APP_BE_PORT:?REACT_APP_BE_PORT is required}"

# Optional variables with safe defaults
frontend_as_proxy="${REACT_APP_FE_AS_PROXY:-false}"
backend_tls="${REACT_APP_BE_TLS:-false}"

# Validate boolean values — collect all errors before exiting
errors=0

case "$frontend_as_proxy" in
    true|false) ;;
    *) echo "REACT_APP_FE_AS_PROXY must be 'true' or 'false'" >&2; errors=1 ;;
esac

case "$backend_tls" in
    true|false) ;;
    *) echo "REACT_APP_BE_TLS must be 'true' or 'false'" >&2; errors=1 ;;
esac

[ "$errors" = "0" ] || exit 1

# Select nginx template based on proxy mode
nginxTemplate="nginx.conf.template"
if [ "$frontend_as_proxy" = "true" ]; then
    nginxTemplate="nginx.conf.proxy.template"
fi

# Set HTTP protocol based on TLS flag
if [ "$backend_tls" = "true" ]; then
    export HTTP_PROTOCOL="https"
else
    export HTTP_PROTOCOL="http"
fi

# Render the nginx config from the selected template
envsubst '${HTTP_PROTOCOL} ${REACT_APP_BE_HOST} ${REACT_APP_BE_PORT}' \
    < "/etc/nginx/conf.d/${nginxTemplate}" \
    > /etc/nginx/conf.d/default.conf

exec "$@"
