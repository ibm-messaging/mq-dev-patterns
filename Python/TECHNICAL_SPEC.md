# Python IBM MQ Dev Patterns — Technical Specification

> Objectives · Class Diagrams · Interface Details · Test Coverage

---

## 1. Objectives

This library provides a set of self-contained Python sample applications that demonstrate core IBM MQ messaging patterns using the `ibmmq` client library. Each sample is intentionally minimal — it illustrates one pattern end-to-end so developers can extract and adapt the relevant logic for production use.

- **Demonstrate queue-based put/get** — send and receive persistent messages to/from a named queue.
- **Demonstrate publish/subscribe** — publish messages to a topic string and receive them via managed, non-durable subscriptions.
- **Demonstrate request/response** — issue a typed request message to a queue and await a correlated reply on a dynamic model queue; the responding side handles poison messages via backout queues.
- **Abstract connection configuration** — centralise all endpoint, credential, TLS, and CCDT settings behind a single `EnvStore` utility class so samples remain readable.
- **Support multi-endpoint connectivity** — `EnvStore` resolves a list of endpoints from `env.json` and builds a composite `CONNAME` string for uniform failover handling.

---

## 2. Architecture Overview

The library has two layers: a *utils* package that handles configuration and a set of *sample scripts* that each own one messaging pattern.

```
Python/
├── utils/
│   ├── __init__.py          # package marker
│   └── env.py               # EnvStore — configuration abstraction
│
├── basicput.py              # Pattern: Point-to-Point (Producer)
├── basicget.py              # Pattern: Point-to-Point (Consumer)
├── basicpublish.py          # Pattern: Pub/Sub (Publisher)
├── basicsubscribe.py        # Pattern: Pub/Sub (Subscriber)
├── basicrequest.py          # Pattern: Request/Response (Requester)
├── basicresponse.py         # Pattern: Request/Response (Responder)
│
├── pyproject.toml           # uv project manifest (ibmmq dependency + metadata)
├── uv.lock                  # Pinned dependency lock file (commit this)
│
└── services/
    └── catalog-app.yaml     # Backstage component manifest

tests/                       # Repository-level integration tests
└── test-python.sh           # Runs all six samples against a live MQ broker
```

---

## 3. Class Diagrams

### 3.1 EnvStore (`utils/env.py`)

```
┌─────────────────────────────────────────────┐
│                  EnvStore                   │
├─────────────────────────────────────────────┤
│  Class Attributes (config keys)             │
│  ─────────────────────────────────────────  │
│  MQ_ENDPOINTS, HOST, PORT, CHANNEL          │
│  QUEUE_NAME, QMGR, TOPIC_NAME               │
│  MODEL_QUEUE_NAME, DYNAMIC_QUEUE_PREFIX     │
│  BACKOUT_QUEUE, USER, PASSWORD              │
│  APP_USER, APP_PASSWORD, KEY_REPOSITORY     │
│  CCDT (MQCCDTURL), CIPHER, FILEPREFIX       │
│  env: dict  (loaded JSON config)            │
├─────────────────────────────────────────────┤
│  Instance Methods                           │
│  ─────────────────────────────────────────  │
│  __init__() → None                          │
│  is_endpoint_list() → bool                  │
│  set_env() → None                           │
│  build_connection_string(points) → str      │
│  get_endpoint_count() → int                 │
│  get_next_connection_string() → Generator   │
├─────────────────────────────────────────────┤
│  Static Methods                             │
│  ─────────────────────────────────────────  │
│  getenv_value(key, index=0) → str | None    │
│  get_connection(host, port) → str           │
│  is_ccdt_available() → bool                 │
└─────────────────────────────────────────────┘
                       ▲
                       │ loads
        ┌──────────────────────────┐
        │  env.json / JSON_CONFIG  │
        │  (external config source)│
        └──────────────────────────┘
```

### 3.2 Sample Script Module Structure (shared pattern)

Every sample script follows the same procedural module-level structure — no classes.

```
┌──────────────────────────────────┐      ┌──────────────────────────────────┐
│     <sample>.py (module globals) │      │    ibmmq  (external library)     │
├──────────────────────────────────┤      ├──────────────────────────────────┤
│  Module-level state:             │      │  Connection:                     │
│    logger: logging.Logger        │      │    QueueManager, CSP, CD, SCO    │
│    MQDetails: dict               │ uses │                                  │
│    qmgr: QueueManager            │ ───► │  Resources:                      │
│    queue|topic|subscription      │      │    Queue, Topic, Subscription    │
│    msg_object: dict              │      │                                  │
├──────────────────────────────────┤      │  Descriptors & Options:          │
│  Functions:                      │      │    OD, MD, PMO, GMO, SD          │
│    build_mq_details() → None     │      │                                  │
│    connect() → QueueManager      │      │  Constants (CMQC / CMQXC):       │
│    get_queue() / get_topic()     │      │    MQOO_*, MQGMO_*, MQPMO_*      │
│    get_subscription()            │      │    MQMT_*, MQRO_*, MQSO_*        │
└──────────────────────────────────┘      └──────────────────────────────────┘
```

---

## 4. Messaging Patterns & Sequence Diagrams

### 4.1 Point-to-Point (Put / Get)

```
basicput.py              MQ Queue              basicget.py
     │                      │                       │
     │  queue.put(MD,PMO,msg)│                       │
     │  MQFMT_STRING         │                       │
     │  MQPMO_NO_SYNCPOINT   │                       │
     │──────────────────────►│                       │
     │                       │  queue.get(MD,GMO,buf)│
     │                       │  MQOO_INPUT_AS_Q_DEF  │
     │                       │  MQGMO_WAIT · 5s      │
     │                       │──────────────────────►│
     │                       │                       │
  MQOO_OUTPUT                                MQOO_INPUT_AS_Q_DEF
```

### 4.2 Publish / Subscribe

```
basicpublish.py           MQ Topic           basicsubscribe.py
      │                      │                       │
      │                      │    sub(SD) — subscribe│
      │                      │  MQSO_CREATE|MANAGED  │
      │                      │◄──────────────────────│
      │                      │                       │
      │  topic.pub(MD,PMO,msg)│                       │
      │  MQOO_OUTPUT          │                       │
      │  MQPMO_NO_SYNCPOINT   │                       │
      │──────────────────────►│                       │
      │                       │  message delivered    │
      │                       │  get(MD,GMO) · 5s wait│
      │                       │──────────────────────►│
```

### 4.3 Request / Response

```
basicrequest.py         Request Queue         basicresponse.py
      │                      │                       │
      │  ① open model queue  │                       │
      │  → dynamic reply Q   │                       │
      │                      │                       │
      │  put(MD:MQMT_REQUEST, MsgId)                  │
      │  ReplyToQ=dynamic_Q  │                       │
      │  MQRO_COPY_MSG_ID_   │                       │
      │    TO_CORREL_ID      │                       │
      │──────────────────────►│                       │
      │                       │  get(MD,GMO:SYNCPOINT)│
      │                       │  MQMT_REQUEST         │
      │                       │──────────────────────►│
      │                       │                       │  respond: qmgr.put1(
      │  qmgr.put1(OD:ReplyToQ, MD:MQMT_REPLY)        │    OD=ReplyToQ
      │  CorrelId=request MsgId · MQPMO_SYNCPOINT      │    CorrelId=MsgId)
      │◄──────────────────────────────────────────────│  commit()
      │                       │                       │
      │  await_response(MsgId)│                       │
      │  GMO:MQMO_MATCH_CORREL_ID · 5s wait           │
      │──┐                    │                       │
      │◄─┘                    │                       │
```

> **Poison message handling:** if `backout_counter >= 5`, `basicresponse` redirects the message to `BACKOUT_QUEUE` and commits. Otherwise it calls `qmgr.backout()`.

---

## 5. Interface Details

### 5.1 EnvStore Interface

| Method | Signature | Description |
|---|---|---|
| `__init__` | `() → None` | Loads `env.json` (path from `JSON_CONFIG` env var, or `../../env.json` by default) into `EnvStore.env`. |
| `is_endpoint_list` | `() → bool` | Returns `True` if the config contains a `MQ_ENDPOINTS` list. |
| `set_env` | `() → None` | Populates OS environment variables from config and builds the `CONNECTION_STRING`. |
| `build_connection_string` | `(points: list) → str` | Formats endpoints as `"host(port),host(port)"` for use as MQ `CONNAME`. |
| `get_endpoint_count` | `() → int` | Returns the number of endpoints; returns `1` for single-endpoint configs. |
| `get_next_connection_string` | `() → Generator[tuple[int, str]]` | Yields `(index, "host(port)")` for each endpoint; used to iterate connections. |
| `getenv_value` ★ | `(key: str, index: int = 0) → str \| None` | Retrieves a config value. Uses OS env var if `index == 0`; reads from JSON array otherwise. |
| `get_connection` ★ | `(host: str, port: str) → str` | Returns the `CONNECTION_STRING` env var or constructs it from explicit host/port. |
| `is_ccdt_available` ★ | `() → bool` | Checks whether the CCDT file referenced in config actually exists on disk. |

★ Static method

### 5.2 Sample Script Function Interfaces

#### `basicput.py`

| Function | Returns | Key MQ Parameters |
|---|---|---|
| `connect()` | `QueueManager` | CD, CSP, SCO (TLS optional) |
| `get_queue()` | `Queue` | `MQOO_OUTPUT` |
| `put_message()` | `None` | MD (`MQFMT_STRING`), PMO (`MQPMO_NO_SYNCPOINT`) |

#### `basicget.py`

| Function | Returns | Key MQ Parameters |
|---|---|---|
| `connect(index)` | `QueueManager` | CD, CSP, SCO; `index` selects endpoint |
| `get_queue()` | `Queue` | `MQOO_INPUT_AS_Q_DEF` |
| `get_messages()` | `None` | GMO (`MQGMO_WAIT`, 5 s), loops until `MQRC_NO_MSG_AVAILABLE` |

#### `basicpublish.py`

| Function | Returns | Key MQ Parameters |
|---|---|---|
| `connect()` | `QueueManager` | CD, CSP, SCO |
| `get_topic()` | `Topic` | `MQOO_OUTPUT`, topic_string |
| `publish_message()` | `None` | MD (`MQFMT_STRING`), PMO (`MQPMO_NO_SYNCPOINT`) |

#### `basicsubscribe.py`

| Function | Returns | Key MQ Parameters |
|---|---|---|
| `connect()` | `QueueManager` | CD, CSP, SCO |
| `get_subscription()` | `Subscription` | SD (`MQSO_CREATE \| MQSO_MANAGED \| MQSO_NON_DURABLE \| MQSO_FAIL_IF_QUIESCING`) |
| `get_messages()` | `None` | GMO (`MQGMO_WAIT`, 5 s), loops until `MQRC_NO_MSG_AVAILABLE` |

#### `basicrequest.py`

| Function | Returns | Key MQ Parameters |
|---|---|---|
| `connect()` | `QueueManager` | CD, CSP, SCO |
| `get_queue()` | `Queue` | `MQOO_OUTPUT` |
| `get_dynamic_queue()` | `tuple[Queue, str]` | Model queue → dynamic queue; `MQOO_INPUT_EXCLUSIVE` |
| `put_message()` | `str` (MsgId) | MD (`MQMT_REQUEST`, `MQRO_COPY_MSG_ID_TO_CORREL_ID`), ReplyToQ = dynamic queue |
| `await_response(msgid)` | `None` | GMO (`MQGMO_WAIT`, `MQMO_MATCH_CORREL_ID`), CorrelId = MsgId |

#### `basicresponse.py`

| Function | Returns | Key MQ Parameters |
|---|---|---|
| `connect()` | `QueueManager` | CD, CSP, SCO |
| `get_queue(queue_name)` | `Queue` | `MQOO_INPUT_AS_Q_DEF` |
| `get_messages(qmgr)` | `None` | GMO (`MQGMO_SYNCPOINT`), calls `commit()` or `backout()` |
| `respond_to_request(in_md, msg)` | `bool` | `qmgr.put1(OD: ReplyToQ)`, MD (`MQMT_REPLY`), PMO (`MQPMO_SYNCPOINT`) |
| `rollback(qmgr, md, msg, backout_counter)` | `bool` | Poison msg (counter ≥ 5): redirects to `BACKOUT_QUEUE`; else `qmgr.backout()` |

---

## 6. Configuration Schema (`env.json`)

All samples read from a shared `env.json` file. The path can be overridden via the `JSON_CONFIG` environment variable.

| Key | Type | Used by | Description |
|---|---|---|---|
| `HOST` | string | all | MQ hostname or IP |
| `PORT` | string | all | MQ listener port |
| `CHANNEL` | string | all | Client channel name |
| `QMGR` | string | all | Queue Manager name |
| `APP_USER` | string | all | Application username (CSP) |
| `APP_PASSWORD` | string | all | Application password (CSP) |
| `QUEUE_NAME` | string | put, get, request, response | Target queue name |
| `TOPIC_NAME` | string | publish, subscribe | Topic string for pub/sub |
| `MODEL_QUEUE_NAME` | string | request | Model queue for dynamic reply queue creation |
| `DYNAMIC_QUEUE_PREFIX` | string | request | Prefix for generated dynamic queue name |
| `BACKOUT_QUEUE` | string | response | Dead-letter queue for poison messages |
| `KEY_REPOSITORY` | string | all (TLS) | Path to TLS key repository (stash file) |
| `CIPHER` | string | all (TLS) | TLS cipher spec |
| `CCDT` | string | all (CCDT) | Path to CCDT file (`MQCCDTURL`) |
| `MQ_ENDPOINTS` | list | multi-endpoint | Array of `{HOST, PORT, CHANNEL}` objects for HA/failover |

---

## 7. IBM MQ Object Reference

### Connection Objects

| Object | Purpose |
|---|---|
| `QueueManager` | Session with the MQ broker |
| `CSP` | Credentials (user/password) |
| `CD` | Channel definition (host, port, TLS cipher) |
| `SCO` | SSL/TLS configuration object (key repository) |

### Resource Handles

| Object | Purpose |
|---|---|
| `Queue` | Point-to-point messaging |
| `Topic` | Pub/sub publishing |
| `Subscription` | Pub/sub consuming |
| Dynamic queue | Created from a model queue open |

### Descriptors & Options

| Object | Purpose |
|---|---|
| `OD` | Object Descriptor — queue/topic name |
| `MD` | Message Descriptor — type, format, IDs |
| `PMO` | Put Message Options — sync/async |
| `GMO` | Get Message Options — wait, match |
| `SD` | Subscription Descriptor |

### Transaction Control

| Call | Purpose |
|---|---|
| `qmgr.commit()` | Commit unit of work |
| `qmgr.backout()` | Roll back unit of work |
| `MQGMO_SYNCPOINT` | Read message under syncpoint |
| `MQPMO_SYNCPOINT` | Write message under syncpoint |

---

## 8. Error Handling Strategy

| Exception / Condition | Handling | Applies to |
|---|---|---|
| `mq.MQMIError` | Caught at all operation sites; reason code inspected | all |
| `MQRC_NO_MSG_AVAILABLE` | Normal exit from get loop (not an error) | get, subscribe |
| `MQCC_FAILED` | Logged and surfaced; connection/resource cleanup | all |
| `UnicodeDecodeError` | Message body decode falls back or logs warning | get, subscribe, response |
| `ValueError` | JSON parse errors on message body | get, subscribe, response |
| `KeyboardInterrupt` | Clean disconnect and resource close | all |
| Poison messages (backout_counter ≥ 5) | Put to `BACKOUT_QUEUE`; transaction committed | response |

---

## 9. Testing

Integration tests are provided by `tests/test-python.sh` in the repository root. The script runs all six sample scripts as real processes against a live IBM MQ queue manager and verifies each one exits cleanly.

### 9.1 Prerequisites

- A running IBM MQ queue manager reachable at the host/port configured in `env.json`
- `uv` installed (the script installs it automatically if absent)
- The MQ C client libraries available on the library path (see Section 1 of `README.md`)

### 9.2 What the script does

```
tests/test-python.sh
```

| Step | Detail |
|---|---|
| **1. Ensure uv** | Checks for `uv` on `PATH`; installs it via the official installer if missing |
| **2. `uv sync --upgrade`** | Creates/updates `.venv` in `Python/` from `pyproject.toml` + `uv.lock`; upgrades `ibmmq` to the latest matching version |
| **3. Print ibmmq version** | `uv run pip show ibmmq` — records the active package version in the log |
| **4. PUT / GET** | Runs `basicput.py` then `basicget.py` sequentially; each must exit 0 |
| **5. PUB / SUB** | Starts `basicsubscribe.py` in the background, waits 1 s, runs `basicpublish.py`; both must exit 0 |
| **6. REQ / RES** | Starts `basicresponse.py` in the background, waits 1 s, runs `basicrequest.py`; both must exit 0 |
| **7. Count successes** | Greps the log for `"ended OK"`; fails if the count is not exactly 6 |

### 9.3 Running the tests

From the `tests/` directory (or any directory — the script uses relative paths):

```bash
cd tests
bash test-python.sh
```

Logs are written to `tests/logs/testpython.log`. The script exits 0 on full success, 1 on any failure.

### 9.4 Known limitation

> **Poison-message path in `basicresponse.rollback()`**
>
> When `backout_counter >= 5`, the code calls `backout_queue.stringForVersion(...)` on a plain `str` value obtained from `MQDetails`. This raises an `AttributeError` which is not caught by the surrounding `except mq.MQMIError` block, causing the exception to propagate. The integration test will surface this as a non-zero exit code from `basicresponse.py`.
