
#  Copyright 2022, 2024 IBM Corp.
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
#The first stage is builds the Node program.
# The second stage is a runtime-only container that holds just the things we need to
# execute the compiled program.

###########################################################
# This starts the BUILD phase
###########################################################
FROM node:18-slim as builder
ENV APP_DIR /usr/local
WORKDIR ${APP_DIR}
RUN apt-get update \
   && npm install yarn \
   && apt-get install -y git
ENV APP_DIR /usr/local/
WORKDIR ${APP_DIR}

#get the application
COPY ./AWS-MQ-showcase/ ./

#install packages for the application
RUN yarn install

#Build the application
RUN yarn run build

###########################################################
# This starts the RUNTIME phase
###########################################################
# Now that there is a container with the compiled program we can have a smaller
# runtime image.
FROM nginx:stable-alpine3.17 as frontendImage

#Set nginx configuration as per application requirements
COPY nginx.conf.template /etc/nginx/conf.d
COPY nginx.conf.proxy.template /etc/nginx/conf.d
COPY docker-entrypoint.sh /
ENTRYPOINT ["/docker-entrypoint.sh"]
#Copy over only the built code to the default nginx location
COPY --from=builder /usr/local/build /usr/share/nginx/html

EXPOSE 80

CMD ["nginx","-g","daemon off;"]
