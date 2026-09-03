# Plan: Remove basic* Modules from Node.js Directory

## Top-Level Overview

The Node.js directory contains two parallel sets of implementations for the same six IBM MQ messaging patterns (put, get, publish, subscribe, request, response):

- **`basic*.js`** — self-contained, callback-based implementations with inline connection logic.
- **`sample*.js`** — promise-based refactors that delegate connection, auth, TLS, async control, and transaction handling to `boilerplate.js`.

Research confirmed that every `sample*.js` file already covers everything its `basic*.js` counterpart does — and adds multi-endpoint support, JWT auth, durable subscription control, and improved async/transaction handling.

A precise code-level diff across all six pairs identified **one functional gap** that must be fixed before `basicresponse.js` is deleted: the `endOfObject()` null-byte trimming logic (see Sub-Task 0 below).

**Goal:** Patch `sampleresponse.js` to close the identified gap, delete all six `basic*.js` files, migrate and expand the test suite to target `sample*.js` and `boilerplate.js`, and update the README.

**Scope:**
- Fix: `sampleresponse.js` (add null-byte buffer trimming before `JSON.parse`)
- Delete: `basicput.js`, `basicget.js`, `basicpublish.js`, `basicsubscribe.js`, `basicrequest.js`, `basicresponse.js`
- Update: `test/basicput.test.js`, `test/basicget.test.js`, `README.md`
- Add: new test files for the four currently untested patterns (publish, subscribe, request, response)

**Non-goals:**
- Do not modify `boilerplate.js`
- Do not change `package.json` dependencies

---

## Sub-Tasks

---

### Sub-Task 0 — Fix: add null-byte buffer trimming to sampleresponse.js

**Status:** [x] done

**Intent:**
Close the one functional gap identified between `basicresponse.js` and `sampleresponse.js`. When IBM MQ returns a message via a fixed-size buffer, the unwritten trailing portion is filled with null bytes (`\0`). `basicresponse.js` uses an `endOfObject()` helper to strip those bytes before calling `JSON.parse()`. `sampleresponse.js` passes the raw buffer directly to `JSON.parse()` — which will throw a `SyntaxError` on any message body that is shorter than the 1024-byte buffer. This must be fixed before the basic file is deleted.

**Expected Outcomes:**
- `sampleresponse.js` safely parses message bodies regardless of null-byte padding in the buffer.
- The fix is minimal — a targeted one-line string trim applied to the buffer string before `JSON.parse()`.
- No other behaviour in `sampleresponse.js` changes.

**Todo List:**
- [ ] In `sampleresponse.js`, in the `msgCB` function, locate the `JSON.parse(buf)` call (line 55).
- [ ] Replace the raw `JSON.parse(buf)` with a trimmed version: `JSON.parse(buf.toString().replace(/\0/g, '').trim())`.
  - The `.replace(/\0/g, '')` strips null bytes that MQ pads into fixed-size buffers.
  - The `.trim()` removes any trailing whitespace for robustness.
- [ ] Verify the fix does not affect the `poisoningMessageHandler` path — that path passes `buf` unchanged to `sendToQueue` / `replyMessage`, which is correct behaviour.

**Relevant Context:**
- `basicresponse.js` `endOfObject()` (lines 85–102): finds the closing `}` brace position and slices the buffer string at that point — equivalent in effect to null-byte stripping for JSON payloads.
- `sampleresponse.js` `msgCB` (line 55): `msgObject = JSON.parse(buf)` — this is the line to fix.
- MQ buffer allocation in boilerplate: `Buffer.alloc(1024)` — all 1024 bytes are allocated; unwritten bytes are `\0`.

---

### Sub-Task 1 — Audit coverage gaps before deletion

**Status:** [x] done

**Intent:**
Verify that every behavior exercised by the existing `basic*.test.js` tests has a corresponding path in `sample*.js` or `boilerplate.js` so no coverage is silently lost. Identify which specific helper functions currently tested on `basicput.js` / `basicget.js` exist on the boilerplate and can be retested there.

**Expected Outcomes:**
- A written list of functions-under-test in each existing test file and their equivalent in the sample/boilerplate layer.
- Confirmation that `toHexString`, `getConnection`, `ccdtCheck`, `buildMQDetails`, `initialise`, `connx`, `open`, `close`, `disconnect`, `getMessage` are all reachable via `boilerplate.js` exports.

**Todo List:**
- [ ] Read `test/basicput.test.js` and `test/basicget.test.js` and list every function under test.
- [ ] Map each function to its equivalent in `boilerplate.js` (or confirm it is absent).
- [ ] Note any behavior tested in the basic tests that has no equivalent surface in boilerplate/sample.
- [ ] Record findings as inline comments in the plan for use in Sub-Task 2.

**Relevant Context:**
- `test/basicput.test.js` imports: `basicput.js`, `basicget.js`, `ibmmq`
- `test/basicget.test.js` imports: `basicget.js`, `ibmmq`, `child_process`
- Boilerplate exports: `MQBoilerPlate` class with `toHexString`, `hexToBytes`, `getConnection`, `ccdtCheck`, `initialise`, `connectToMQ`, `openMQConnection`, `closeMQConnection`, `disconnectFromMQ`, `getMessage`, `getMessages`, and others.

---

### Sub-Task 2 — Rewrite test/basicput.test.js → test/sampleput.test.js

**Status:** [x] done

**Intent:**
Replace the put-pattern test file so it targets `sampleput.js` and `boilerplate.js` rather than `basicput.js`. Retain all existing coverage and add a test for multi-endpoint support.

**Expected Outcomes:**
- `test/sampleput.test.js` exists and passes with `npm test`.
- Tests cover: connection string building, CCDT detection, a full put operation (end-to-end), and multi-endpoint iteration.
- `test/basicput.test.js` is deleted.

**Todo List:**
- [ ] Create `test/sampleput.test.js`.
- [ ] Port `toHexString` test → call `MQBoilerPlate.toHexString()` (static utility).
- [ ] Port `getConnection` test → call `MQBoilerPlate.getConnection()` using the same endpoint iteration logic.
- [ ] Port `putMessage` integration test → use `sampleput.js` flow (initialise → send → teardown) or invoke boilerplate directly.
- [ ] Add a test that verifies iteration over multiple endpoints when `MQ_ENDPOINTS` has more than one entry.
- [ ] Delete `test/basicput.test.js`.

**Relevant Context:**
- `sampleput.js` calls: `bp.initialise('PUT')` → `bp.send()` → `bp.teardown()`
- Boilerplate static: `MQBoilerPlate.toHexString(buf)`, `MQBoilerPlate.getConnection(index)`
- Env fixture pattern from existing test: load `../env.json`, iterate endpoints.

---

### Sub-Task 3 — Rewrite test/basicget.test.js → test/sampleget.test.js

**Status:** [x] done

**Intent:**
Replace the get-pattern test file so it targets `sampleget.js` and `boilerplate.js`. The existing `basicget.test.js` tests individual lifecycle functions (`initialise`, `connx`, `open`, `close`, `disconnect`, `getMessage`). These should be retested at the boilerplate level using integration-style tests.

**Expected Outcomes:**
- `test/sampleget.test.js` exists and passes with `npm test`.
- Tests cover: full get lifecycle (initialise → open → get → close → disconnect), `ccdtCheck`, `buildMQDetails`-equivalent config loading, and multi-endpoint cycling.
- `test/basicget.test.js` is deleted.

**Todo List:**
- [ ] Create `test/sampleget.test.js`.
- [ ] Port `buildMQDetails` test → verify boilerplate configuration keys are set after `initialise('GET')`.
- [ ] Port `ccdtCheck` test → call `MQBoilerPlate.ccdtCheck()` directly.
- [ ] Port lifecycle tests (`initialise`, `connx`, `open`, `close`, `disconnect`) as a single integration-style test using the boilerplate promise chain.
- [ ] Port `getMessage` test — pre-populate queue via a `sampleput`-style helper, then call boilerplate get.
- [ ] Add a test that verifies the async callback receives a message body.
- [ ] Delete `test/basicget.test.js`.

**Relevant Context:**
- `sampleget.js` uses: `bp.initialise('GET')` → `bp.openMQConnection()` → `bp.startGetAsyncProcess(cb)` → `bp.checkForTermination()` → `bp.signalDone()` → `bp.teardown()`
- Existing get tests spawn `basicput.js` as a child process to populate the queue first — replace this with a direct boilerplate put call.

---

### Sub-Task 4 — Add test/samplepublish.test.js

**Status:** [x] done

**Intent:**
Create a new test file for the publish pattern. No test existed for this pattern before.

**Expected Outcomes:**
- `test/samplepublish.test.js` exists and passes with `npm test`.
- Tests cover: publish flow end-to-end, and the "no subscribers" graceful handling.

**Todo List:**
- [ ] Create `test/samplepublish.test.js`.
- [ ] Write an integration test: `initialise('PUBLISH')` → `bp.send()` → `bp.teardown()`.
- [ ] Assert the publish completes without error when no subscribers are present (`MQRC_NO_SUBS_MATCHED` should be tolerated, not thrown).
- [ ] Optionally: pair with a subscribe step to verify message delivery end-to-end.

**Relevant Context:**
- `samplepublish.js` calls: `bp.initialise('PUBLISH')` → `bp.send()` → `bp.teardown()`
- Boilerplate: `isPublishNoSubscriptions(err)` is the helper that detects MQRC_NO_SUBS_MATCHED = 2550.

---

### Sub-Task 5 — Add test/samplesubscribe.test.js

**Status:** [x] done

**Intent:**
Create a new test file for the subscribe pattern. No test existed for this pattern before. Specifically add coverage for the durable subscription env var (`DURABLE`) which is unique to `samplesubscribe.js`.

**Expected Outcomes:**
- `test/samplesubscribe.test.js` exists and passes with `npm test`.
- Tests cover: non-durable subscription receives a published message, and the `DURABLE` environment variable is respected.

**Todo List:**
- [ ] Create `test/samplesubscribe.test.js`.
- [ ] Write an integration test: subscribe (`initialise('SUBSCRIBE')`) then publish a message, then assert message is received via the async callback.
- [ ] Add a test that sets `process.env.DURABLE = true` and verifies the subscription descriptor uses `MQSO_DURABLE` (check via boilerplate state or by inspecting SD options).
- [ ] Clean up durable subscription after the test.

**Relevant Context:**
- `samplesubscribe.js` reads `process.env.DURABLE` and passes it to `bp.initialise('SUBSCRIBE', false, index, durableFlag)`.
- Boilerplate handles `MQSO_DURABLE` vs `MQSO_NON_DURABLE` based on that flag.

---

### Sub-Task 6 — Add test/samplerequest.test.js (end-to-end)

**Status:** [x] done

**Intent:**
Create a full end-to-end test for the request/response pattern from the *requester* perspective. The test starts `sampleresponse.js` as a background child process acting as the live responder, then drives the requester side via the boilerplate API directly. This validates the complete correlated message round-trip against a real MQ broker.

**Expected Outcomes:**
- `test/samplerequest.test.js` exists and passes with `npm test`.
- Tests cover: dynamic reply queue creation, sending a request with `MsgType=MQMT_REQUEST`, and receiving a correlated reply whose `CorrelId` matches the request `MsgId`.
- The background responder process is cleanly terminated after each test.

**Todo List:**
- [ ] Create `test/samplerequest.test.js`.
- [ ] In a `before()` hook, spawn `sampleresponse.js` as a child process (`child_process.spawn`) and wait until its stdout signals it is listening (e.g. the "waiting for messages" log line).
- [ ] Instantiate a `MQBoilerPlate` requester: `initialise('GET')` → `openMQDynamicConnection()` → `openMQConnection()` (request queue) → `putRequest()`.
- [ ] Register a `msgCB` callback that captures the received reply message and calls `signalDone()`.
- [ ] Start `startGetAsyncProcess(msgCB)` and `await checkForTermination()`.
- [ ] Assert that the captured reply's `CorrelId` matches the request `MsgId`.
- [ ] Assert that the reply body is valid JSON containing a `value` field.
- [ ] In an `after()` hook, call `teardown()` on the boilerplate instance and kill the responder child process.

**Relevant Context:**
- `samplerequest.js` flow: `bp.initialise('GET')` → `bp.openMQDynamicConnection()` → `bp.openMQConnection()` → `bp.putRequest()` → `bp.startGetAsyncProcess(cb)` → `bp.checkForTermination()`
- Boilerplate `putRequest()` sets `MsgType=MQMT_REQUEST`, `ReplyToQ`, `ReportOptions=MQRO_COPY_MSG_ID_TO_CORREL_ID`.
- `sampleresponse.js` logs a recognisable startup message that can be used as the readiness signal for the `before()` hook.
- The existing `basicget.test.js` uses `child_process.exec` to spawn `basicput.js` as a helper — use the same pattern here for the responder.

---

### Sub-Task 7 — Add test/sampleresponse.test.js (end-to-end)

**Status:** [x] done

**Intent:**
Create a full end-to-end test for the request/response pattern from the *responder* perspective. The test starts `sampleresponse.js` as the system-under-test and drives it by putting a crafted `MQMT_REQUEST` message onto the request queue, then reads the reply from the dynamic reply queue. Also adds unit-level tests for the exported `performCalc()` function and verifies the poison-message backout path.

**Expected Outcomes:**
- `test/sampleresponse.test.js` exists and passes with `npm test`.
- Tests cover: end-to-end request→reply round-trip with `sampleresponse.js` as the live responder, `performCalc()` unit tests, and the commit path verified by asserting the reply message arrives on the reply queue (proof the transaction was committed).

**Todo List:**
- [ ] Create `test/sampleresponse.test.js`.
- [ ] **Unit tests for `performCalc()`:** import it from `sampleresponse.js` and assert:
  - `performCalc(12)` → `[2, 2, 3]`
  - `performCalc(7)` → `[]` (prime has no factors below sqrt)
  - `performCalc(1)` → `[]`
  - `performCalc(60)` → result whose product divides 60 (float division caveat — same as Python)
- [ ] **End-to-end integration test:**
  - In `before()`: spawn `sampleresponse.js` as a child process; wait for its readiness log line.
  - Create a requester boilerplate instance: `initialise('GET')` → `openMQDynamicConnection()` → `openMQConnection()` (request queue) → `putRequest()`.
  - Register a `msgCB` that captures the reply and calls `signalDone()`.
  - `startGetAsyncProcess(msgCB)` → `checkForTermination()`.
  - Assert reply `CorrelId` matches request `MsgId`.
  - Assert reply body contains a `value` field (result of `performCalc`).
  - In `after()`: `teardown()` requester, kill responder child process.
- [ ] **Commit-path assertion:** The presence of the reply on the reply queue is proof the transaction was committed. Add an explicit assertion that the reply queue depth increases by 1 after the round-trip (use `mq.Inq` on the queue handle).
- [ ] **Poison-message path:** Put a message with `BackoutCount` set to 5 directly onto the request queue using boilerplate `put`, then start `sampleresponse.js` and assert the message appears on `BACKOUT_QUEUE` rather than triggering a reply.
- [ ] **Null-byte trimming regression test (Sub-Task 0 fix):** Put a short JSON payload (e.g. 30 bytes) onto the request queue so the 1024-byte buffer is largely null-padded. Assert that `sampleresponse.js` parses it correctly and sends a valid reply rather than throwing a JSON parse error. This directly validates the Sub-Task 0 fix.

**Relevant Context:**
- `sampleresponse.js` exports `performCalc()` and `MSG_TRESHOLD = 5`.
- `sampleresponse.js` flow: `bp.initialise('GET', true)` (syncpoint) → `bp.openMQReplyToConnection()` → `bp.replyMessage()` → `bp.commit()` / `bp.rollback()`.
- The poison-message path in `sampleresponse.js` calls `bp.rollback()` and redirects to `MQDetails['BACKOUT_QUEUE']` when `BackoutCount >= MSG_TRESHOLD`.
- Setting `BackoutCount` directly on an `MD` object before a test `put` is how the poison-message scenario is simulated without actually cycling the message five times.

---

### Sub-Task 8 — Delete all six basic*.js files

**Status:** [x] done

**Intent:**
Remove the six legacy files from the repository now that all tests have been migrated to the sample/boilerplate layer.

**Expected Outcomes:**
- `basicput.js`, `basicget.js`, `basicpublish.js`, `basicsubscribe.js`, `basicrequest.js`, `basicresponse.js` no longer exist in `Node.js/`.
- `npm test` still passes after deletion.

**Todo List:**
- [ ] Confirm `npm test` is green before deletion.
- [ ] Delete `basicput.js`.
- [ ] Delete `basicget.js`.
- [ ] Delete `basicpublish.js`.
- [ ] Delete `basicsubscribe.js`.
- [ ] Delete `basicrequest.js`.
- [ ] Delete `basicresponse.js`.
- [ ] Run `npm test` again to confirm nothing broke.

**Relevant Context:**
- No `sample*.js` or `boilerplate.js` imports any `basic*.js` file.
- After Sub-Tasks 2–7, no test file will reference any `basic*.js` file.

---

### Sub-Task 9 — Update README.md

**Status:** [x] done

**Intent:**
Remove all references to `basic*.js` files from the Node.js README and ensure the documented run commands, file descriptions, and test instructions reflect the new state.

**Expected Outcomes:**
- `Node.js/README.md` contains no references to any `basic*.js` file.
- Run commands point to `sample*.js` files.
- The test section reflects the new test file names.

**Todo List:**
- [ ] Read the current `Node.js/README.md`.
- [ ] Remove or replace every reference to `basicput.js`, `basicget.js`, `basicpublish.js`, `basicsubscribe.js`, `basicrequest.js`, `basicresponse.js`.
- [ ] Update run command examples to use `node sampleput.js`, `node sampleget.js`, etc.
- [ ] Update the test section to reference the new test file names.
- [ ] Verify no dead links or broken instructions remain.

**Relevant Context:**
- `Node.js/README.md` — full file must be read before editing.
