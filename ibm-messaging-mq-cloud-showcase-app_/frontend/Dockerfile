
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


FROM node:16-slim as frontend
ENV APP_DIR /usr/local
WORKDIR ${APP_DIR}
RUN apt-get update \
   && npm install yarn \
   && apt-get install -y git
ENV APP_DIR /usr/local/
WORKDIR ${APP_DIR}
COPY ./AWS-MQ-showcase/ ./
#run the application
RUN yarn install

EXPOSE 3000

CMD yarn start
