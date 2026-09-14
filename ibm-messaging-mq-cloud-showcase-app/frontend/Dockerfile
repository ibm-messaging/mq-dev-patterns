
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
# serve the compiled program.

###########################################################
# This starts the BUILD phase
###########################################################
# ECR public mirror — avoids Docker Hub.
# Node 22 Alpine — smallest image with no native binaries requiring glibc.
FROM public.ecr.aws/docker/library/node:22-alpine AS builder
WORKDIR /app

# Manifest files copied before source so the npm ci layer is cached
# independently of application source changes.
COPY ./AWS-MQ-showcase/package.json ./AWS-MQ-showcase/package-lock.json ./

# HUSKY=0 skips the prepare script - no .git directory exists inside the container.
# npm ci installs exactly what the lockfile specifies for reproducible builds.
ENV HUSKY=0
RUN npm ci

# Source copied after install to preserve the cached dependency layer.
COPY ./AWS-MQ-showcase/ ./
RUN npm run build

###########################################################
# This starts the RUNTIME phase
###########################################################
# ECR public mirror — avoids Docker Hub.
# nginx-unprivileged — runs as UID 101 (non-root) and listens on port 8080.
FROM public.ecr.aws/nginx/nginx-unprivileged:stable-alpine AS frontendimage

# Set nginx configuration as per application requirements
COPY nginx.conf.template /etc/nginx/conf.d/
COPY nginx.conf.proxy.template /etc/nginx/conf.d/
# --chmod=755 guarantees the script is executable regardless of host umask.
COPY --chmod=755 docker-entrypoint.sh /docker-entrypoint.sh
ENTRYPOINT ["/docker-entrypoint.sh"]

# Copy only the built static assets from the builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# nginx-unprivileged binds to 8080 (non-root processes cannot bind to port 80).
EXPOSE 8080

# Alpine-based image ships wget, enabling this loopback health check.
# Docker polls every 30s and marks the container unhealthy after 3 failures.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD wget -qO- http://localhost:8080/ || exit 1

# daemon off keeps nginx in the foreground so Docker can track the process.
CMD ["nginx", "-g", "daemon off;"]
