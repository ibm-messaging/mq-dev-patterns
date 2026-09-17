#  Copyright 2022, 2026 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the 'License');
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
 
#  http://www.apache.org/licenses/LICENSE-2.0
 
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

# This Dockerfile has two separate stages.
# The first stage builds the Node program.
# The second stage is a runtime-only container that holds just the things we need to
# execute the compiled program.

###########################################################
# This starts the BUILD phase
###########################################################
FROM public.ecr.aws/docker/library/node:22-slim AS builder

WORKDIR /app

# Copy package files first for optimal layer caching
COPY ./AWS-showcase-backend/package.json ./AWS-showcase-backend/package-lock.json ./

# Install packages using lockfile (allowScripts in package.json will run ibmmq postinstall securely)
RUN npm ci --omit=dev

# Copy application source files
COPY ./AWS-showcase-backend/ ./

###########################################################
# This starts the RUNTIME phase
###########################################################
FROM public.ecr.aws/docker/library/node:22-slim AS backendimage

WORKDIR /app

# Copy application and dependencies from builder stage with correct ownership
COPY --from=builder --chown=node:node /app/ /app/

# Switch to the non-root 'node' user
USER node

EXPOSE 8080

# Configure a built-in health check using local HTTP ping
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
    CMD node -e "require('http').get('http://localhost:8080/', r => r.statusCode === 200 ? process.exit(0) : process.exit(1))"

CMD ["npm", "start"]
