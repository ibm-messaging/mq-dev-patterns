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

const opentelemetry = require('@opentelemetry/api');

const debug_info = require('debug')('mqsample:otel:objects:info');
const debug_warn = require('debug')('mqsample:otel:objects:warn');

class OtelObjects {
    constructor() {
    }

    getTracer(name, version) {
        debug_info("Obtaining tracer");
        return opentelemetry.trace.getTracer(name,version);
    }

    getMeter(name, version) {
        debug_info('Obtaining meter');
        return opentelemetry.metrics.getMeter(name,version);
    }
}  

const otelObjects = new OtelObjects();

module.exports = {otelObjects};