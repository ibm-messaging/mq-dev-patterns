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

const {
    PeriodicExportingMetricReader,
    ConsoleMetricExporter,
} = require('@opentelemetry/sdk-metrics');

const { PrometheusExporter } = require('@opentelemetry/exporter-prometheus');

const { endpoint, port } = PrometheusExporter.DEFAULT_OPTIONS;

const debug_info = require('debug')('mqsample:otel:metrics:info');
const debug_warn = require('debug')('mqsample:otel:metrics::warn');

const {envSettings} = require('../settings/environment');

const USE_PROMETHEUS = envSettings.usePrometheus;

let exporter = null;

if (USE_PROMETHEUS) {
    debug_info('Creating Prometheus Exporter');
    exporter = new PrometheusExporter({}, () => {
        debug_info(
            `prometheus scrape endpoint: http://localhost:${port}${endpoint}`,
        );
    });
} else {
    debug_info('Creating Console Metric Exporter');
    cmExporter = new ConsoleMetricExporter();
    exporter =  new PeriodicExportingMetricReader({
        exporter: cmExporter,
        export_interval_millis: 10000
    }); 
}

module.exports = {exporter};
