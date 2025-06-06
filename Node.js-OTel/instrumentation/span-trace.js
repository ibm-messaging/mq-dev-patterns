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

// Tracing (spans) requirements
const {ConsoleSpanExporter} = require('@opentelemetry/sdk-trace-node');
const {OTLPTraceExporter} = require('@opentelemetry/exporter-trace-otlp-proto');
const {envSettings} = require('../settings/environment');

const debug_info = require('debug')('mqsample:otel:metrics:info');
const debug_warn = require('debug')('mqsample:otel:metrics::warn');

const USE_JAEGER = envSettings.useJaeger;

debug_info(`Will ${USE_JAEGER ? '' : 'not'} be exporting to Jaeger`);

// Construct Tracer
const traceExporter = USE_JAEGER 
                    ? new OTLPTraceExporter({url: 'http://jaeger:4318/v1/traces'})
                    : new ConsoleSpanExporter() ;

module.exports = {traceExporter};
