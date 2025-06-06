/**
 * Copyright 2025 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/

const { NodeSDK } = require('@opentelemetry/sdk-node');

const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');

const { resourceFromAttributes } = require('@opentelemetry/resources');

const {
    ATTR_SERVICE_NAME,
    ATTR_SERVICE_VERSION,
} = require('@opentelemetry/semantic-conventions');

const debug_info = require('debug')('mq:otel:sample:app:info');
const debug_warn = require('debug')('mq:otel:sample:app::warn');

const {constants} = require('../settings/constants');

const MQ_SAMPLE_SERVICE_NAME = constants.DEFAULT_APP_NAME;
const MQ_SAMPLE_VERSION = constants.DEFAULT_APP_VERSION;

