/**
 * Copyright 2026 IBM Corp.
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

// process.env is shimmed to {} by vite.config — intentionally always returns
// undefined at runtime. Do NOT replace with import.meta.env.
declare const process: { env: Record<string, string | undefined> };

// Typed `mq-message-flow` window event (dispatched in Map/utils, consumed by the edges).
// import() type keeps this file a global script, so `process` above stays global.
interface WindowEventMap {
  'mq-message-flow': CustomEvent<import('./types').MessageFlowDetail>;
}
