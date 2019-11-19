# -*- coding: utf-8 -*-
# Copyright 2019 IBM
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
import sys

import logging
logger = logging.getLogger(__name__)


class EnvStore(object):
    """
      Load Envrionment Exports from local store
    """
    env = None

    def __init__(self):
        super(EnvStore, self).__init__()
        if EnvStore.env is None:
            module_dir = os.path.dirname(__file__)
            file_path = os.path.join(module_dir, '../../', 'env.json')
            logger.info(
                "Looking for file %s for envrionment variables" % file_path)
            try:
                with open(file_path) as f:
                    EnvStore.env = json.loads(f.read())
            # Python 2
            except IOError as e:
                logger.info(
                    'I/O error reading file ({0}): {1}' % (e.errno, e.strerror))
            except ValueError:
                logger.info('Parsing error')
            except:
                logger.info('Unexpected error:')
            # Python 3
            # except FileNotFoundError:
            # logger.info("Envrionment File was not found")

    def checkEndPointIsList(self):
        if (EnvStore.env
             and 'MQ_ENDPOINTS' in EnvStore.env
             and isinstance( EnvStore.env['MQ_ENDPOINTS'], list)):
               return True
        return False

    def setEnv(self):
        if self.checkEndPointIsList():
            logger.info('Have File so ready to set envrionment variables')

            for e in EnvStore.env['MQ_ENDPOINTS'][0]:
                os.environ[e] = EnvStore.env['MQ_ENDPOINTS'][0][e]
                if 'PASSWORD' not in e:
                    logger.info('Checking %s value is %s ' % (e, EnvStore.env['MQ_ENDPOINTS'][0][e]))
            # Check if there are multiple endpoints defined
            if len(EnvStore.env['MQ_ENDPOINTS']) > 0:
               os.environ['CONN_STRING'] = self.buildConnectionString(EnvStore.env['MQ_ENDPOINTS'])
        else:
            logger.info('No envrionment variables to set')

    def buildConnectionString(self, points):
        logger.info('Building a connection string')
        l = []
        for point in points:
            if 'HOST' in point and 'PORT' in point:
                p = '%s(%s)' % (point['HOST'], point['PORT'])
                logger.info('endpoint is %s' % p)
                l.append(p)
        s = ','.join(l)
        logger.info('Connection string is %s' % s)
        return s

    def getEndpointCount(self):
        if self.checkEndPointIsList():
            return len(EnvStore.env['MQ_ENDPOINTS'])
        return 1

    def getNextConnectionString(self):
        for p in EnvStore.env['MQ_ENDPOINTS']:
            info =  "%s(%s)" % (p['HOST'], p['PORT'])
            if sys.version_info[0] < 3:
                yield str(info)
            else:
                yield bytes(info, 'utf-8')


    # function to retrieve variable from Envrionment
    @staticmethod
    def getEnvValue(key):
        if sys.version_info[0] < 3:
            return str(os.getenv(key)) if os.getenv(key) else None
        else:
            return bytes(os.getenv(key), 'utf-8') if os.getenv(key) else None

    @staticmethod
    def getConnection(host, port):
        info = os.getenv('CONN_STRING')
        if not info:
            info =  "%s(%s)" % (os.getenv(host), os.getenv(port))
        if sys.version_info[0] < 3:
            return str(info)
        else:
            return bytes(info, 'utf-8')

    @staticmethod
    def stringForVersion(data):
        if sys.version_info[0] < 3:
            return str(data)
        else:
            return bytes(data, 'utf-8')
