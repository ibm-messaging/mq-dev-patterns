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
FROM --platform=linux/amd64 node:20.9.0 as builder
# ENV NODE_VERSION 18

#get the application
ENV APP_DIR /usr/local
WORKDIR ${APP_DIR}

# Update npm to latest version
RUN npm install -g npm

# Copy project files into the container
COPY ./AWS-showcase-backend ./AWS-showcase-backend
ENV APP_DIR /usr/local/AWS-showcase-backend/
WORKDIR ${APP_DIR}

#install packages for the application
RUN npm install --omit=dev \   
    && chmod a+rx ${APP_DIR}/*

#Cleaning
ENV APP_DIR /usr/local/AWS-showcase-backend/node_modules/ibmmq/lib
WORKDIR ${APP_DIR}
RUN rm mqidefs_aix.js \
    && rm mqidefs_darwin.js \
    && rm mqidefs_linuxPowerLE.js \
    && rm mqidefs_linuxS390.js \
    && rm mqidefs_windows.js \
    && rm mqidefs_linuxARM.js

ENV APP_DIR /usr/local/AWS-showcase-backend/node_modules/ibmmq/redist
WORKDIR ${APP_DIR}
RUN rm -r msg \
    && rm -r bin \
    && rm -r lap

ENV APP_DIR /usr/local/AWS-showcase-backend/node_modules/ibmmq/redist/lib64
WORKDIR ${APP_DIR}
RUN rm libcurl.so \
    && rm libmqz_r.so \
    # && rm libedit.so \ Does not exist 
    && rm libmqzsd_r.so \
    && rm libmqcxa64_r.so \ 
    && rm libmqcxa_r.so \
    && rm libmqdc_r.so \
    && rm libmqecs_r.so \
    && rm libmqic_r.so \
    && rm libmqiz_r.so \
    && rm libmqjx_r.so \
    && rm libmqmcs_r.so \
    && rm libmqmzse.so \
    && rm libmqxzu_r.so

###########################################################
# This starts the RUNTIME phase
###########################################################
# Now that there is a container with the compiled program we can build a smaller
# runtime image. Start from one of the smaller base container images. This container
# is an official Node image with the runtime already embedded
FROM --platform=linux/amd64 node:20-slim as backendImage

ENV APP_DIR /usr/local/AWS-showcase-backend/
WORKDIR ${APP_DIR}
# Copy over the tree containing the program and all its dependencies
COPY --from=builder ${APP_DIR}/ ${APP_DIR}

EXPOSE 8080

CMD npm start 
