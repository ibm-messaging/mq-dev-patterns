FROM ubuntu:18.04 as builder

ENV NODE_VERSION 14

ENV APP_DIR /usr/local
WORKDIR ${APP_DIR}
RUN apt-get update \
    && apt-get install -y --no-install-recommends curl gcc g++ make git ca-certificates \
    && curl --silent -k --location https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y  nodejs  \
    && npm install -g npm


COPY . ./clientapp
ENV APP_DIR /usr/local/clientapp/
WORKDIR ${APP_DIR}

#install packages for the application
RUN npm install --only=prod \
   && apt-get autoremove -y curl make gcc g++ python3 git \
   && apt-get purge -y \
   && rm -rf /var/lib/apt/lists/* \
   && chmod a+rx ${APP_DIR}/*

#Cleaning...
ENV APP_DIR /usr/local/clientapp/node_modules/ibmmq/lib
 WORKDIR ${APP_DIR}
 RUN rm mqidefs_aix.js \
     && rm mqidefs_darwin.js \
     && rm mqidefs_linuxPowerLE.js \
     && rm mqidefs_linuxS390.js \
     && rm mqidefs_windows.js

 ENV APP_DIR /usr/local/clientapp/node_modules/ibmmq/redist
 WORKDIR ${APP_DIR}
 RUN rm -r msg \
     && rm -r bin \
     && rm -r lap

 ENV APP_DIR /usr/local/clientapp/node_modules/ibmmq/redist/lib64
 WORKDIR ${APP_DIR}
 RUN rm libmqiz.so \
     && rm libmqiz_r.so \
     && rm libmqmcs.so \
     && rm libmqe.so \
     && rm libmqmcs_r.so \
     && rm libcurl.so \
     && rm libmqxzu.so \
     && rm libmqxzu_r.so \
     && rm libmqdc_r.so \
     && rm libmqdc.so \
     && rm amqmxmsstd.dll \
     && rm amqmdnetstd.dll

FROM node:16-slim as clientAppImage

ENV APP_DIR    /usr/local/clientapp
WORKDIR ${APP_DIR}

COPY --from=builder ${APP_DIR}/ ${APP_DIR}
EXPOSE 8080
CMD npm start
