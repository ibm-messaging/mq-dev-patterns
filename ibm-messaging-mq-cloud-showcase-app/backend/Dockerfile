
#  Copyright 2022, 2023 IBM Corp.
#  Licensed under the Apache License, Version 2.0 (the 'License');
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
 
#  http://www.apache.org/licenses/LICENSE-2.0
 
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

FROM ubuntu:20.04 as builder

ENV NODE_VERSION 16

#get the application
ENV APP_DIR /usr/local
WORKDIR ${APP_DIR}
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl gcc g++ make git ca-certificates \    
    && curl --silent -k --location https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y  nodejs  \
    && npm install -g npm


COPY ./AWS-showcase-backend ./AWS-showcase-backend
ENV APP_DIR /usr/local/AWS-showcase-backend/
WORKDIR ${APP_DIR}
#install packages for the application
RUN npm install --only=prod \
   && apt-get autoremove -y curl make gcc g++ python3 git \
   && apt-get purge -y \   
   && chmod a+rx ${APP_DIR}/*

EXPOSE 8080

CMD npm start 