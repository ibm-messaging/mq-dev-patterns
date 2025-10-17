"""Setup the environment for connections to IBM MQ"""
# -*- coding: utf-8 -*-
# Copyright 2019, 2025 IBM
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

import os
import json

import logging
from typing import Any, Generator, Union

logger = logging.getLogger(__name__)

# The env variable has an unknown structure here because it's created from JSON. So we disable some linter checks
# pylint: disable=unsubscriptable-object,unsupported-membership-test
class EnvStore():
    """
    Load configuration from local store
    """
    env = None

    MQ_ENDPOINTS = 'MQ_ENDPOINTS'
    CONNECTION_STRING = 'CONN_STRING'
    HOST = 'HOST'
    PORT = 'PORT'
    CHANNEL = 'CHANNEL'
    QUEUE_NAME = 'QUEUE_NAME'
    QMGR = 'QMGR'
    TOPIC_NAME = 'TOPIC_NAME'
    MODEL_QUEUE_NAME = 'MODEL_QUEUE_NAME'
    DYNAMIC_QUEUE_PREFIX = 'DYNAMIC_QUEUE_PREFIX'
    BACKOUT_QUEUE = 'BACKOUT_QUEUE'
    USER = 'USER'
    PASSWORD = 'PASSWORD'
    APP_USER = 'APP_USER'
    APP_PASSWORD = 'APP_PASSWORD'
    KEY_REPOSITORY = 'KEY_REPOSITORY'
    CCDT = 'MQCCDTURL'
    CIPHER = 'CIPHER'
    FILEPREFIX = "file://"

    def __init__(self):
        super().__init__()
        if EnvStore.env is None:
            module_dir = os.path.dirname(__file__)
            file_path = os.path.join(module_dir, '../../', 'env.json')
            # See if there's an override environment variable for the config file
            try:
                file_path = os.environ['JSON_CONFIG']
            except KeyError:
                # If the env variable was not set, that's OK. Use the default.
                pass

            logger.info("Looking for config file: %s", file_path)
            try:
                with open(file_path, encoding='utf-8') as f:
                    EnvStore.env = json.loads(f.read())
            except Exception:
                logger.info('Error reading/parsing file: %s', file_path)
                raise

    def is_endpoint_list(self) -> bool:
        """Do we have a list of endpoints?"""
        if EnvStore.env is not None \
                and EnvStore.MQ_ENDPOINTS in EnvStore.env \
                and isinstance(EnvStore.env[EnvStore.MQ_ENDPOINTS], list):
            return True
        return False

    def set_env(self) -> None:
        """Set the attributes from the configuration file as environment variables.
        Most values come from only the first block of details in the JSON file.
        """
        if self.is_endpoint_list():
            logger.info('Have file, so ready to set environment variables for configuration')

            for e in EnvStore.env[EnvStore.MQ_ENDPOINTS][0]:
                os.environ[e] = EnvStore.env[EnvStore.MQ_ENDPOINTS][0][e]
                if EnvStore.PASSWORD not in e:
                    logger.debug('Checking %s value is %s ', e, EnvStore.env[EnvStore.MQ_ENDPOINTS][0][e])
            # Check if there are multiple endpoints defined. If so, build a string containing all of them.
            if len(EnvStore.env[EnvStore.MQ_ENDPOINTS]) > 0:
                os.environ[EnvStore.CONNECTION_STRING] = self.build_connection_string(EnvStore.env[EnvStore.MQ_ENDPOINTS])
        else:
            logger.info('No environment variables to set')

    def build_connection_string(self, points: list) -> str:
        """Return the CONNAME string built from the configuration values"""
        logger.info('Building a connection string')
        conn_string = []
        for point in points:
            if EnvStore.HOST in point and EnvStore.PORT in point:
                p = '%s(%s)' % (point[EnvStore.HOST], point[EnvStore.PORT])
                logger.info('endpoint is %s', p)
                conn_string.append(p)
        s = ','.join(conn_string)
        logger.info('Connection string is %s', s)
        return s

    def get_endpoint_count(self) -> int:
        """How many endpoints are configured"""
        if self.is_endpoint_list():
            return len(EnvStore.env[EnvStore.MQ_ENDPOINTS])
        return 1

    def get_next_connection_string(self) -> Generator[Any, int, str]:
        """Return the next in the list"""
        for i, p in enumerate(EnvStore.env[EnvStore.MQ_ENDPOINTS]):
            info = "%s(%s)" % (p[EnvStore.HOST], p[EnvStore.PORT])
            yield i, str(info)

    # function to retrieve variable from Environment
    @staticmethod
    def getenv_value(key: str, index: int = 0) -> Union[str, None]:
        """Return the value of an attribute either from the environment variable or configuration file.
        If no index is given, the returned value comes from the first connection's entry in the JSON file.
        """
        v = os.getenv(key) if index == 0 else EnvStore.env[EnvStore.MQ_ENDPOINTS][index].get(key)
        return str(v) if v else None

    @staticmethod
    def get_connection(host: str, port: str) -> str:
        """Return the ConnName directly"""
        info = os.getenv(EnvStore.CONNECTION_STRING)
        if not info:
            info = "%s(%s)" % (os.getenv(host), os.getenv(port))
        return str(info)

    @staticmethod
    def is_ccdt_available() -> bool:
        """Is there a CCDT configured"""
        file_path = EnvStore.getenv_value(EnvStore.CCDT)
        if file_path:
            ccdt_file = file_path if not file_path.startswith(EnvStore.FILEPREFIX) else file_path[len(EnvStore.FILEPREFIX):]
            if os.path.isfile(ccdt_file):
                logger.info('CCDT file found at %s ', ccdt_file)
                return True
        return False
