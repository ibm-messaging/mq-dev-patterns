# -*- coding: utf-8 -*-
"""Shared pytest fixtures for the Python IBM MQ sample tests.

The ibmmq C-extension is not available in CI/unit-test environments, so every
test that exercises a sample module stubs it out via sys.modules before the
module under test is imported.
"""

import json
import os
import sys
import types

import pytest


# ---------------------------------------------------------------------------
# Minimal ibmmq stub
# ---------------------------------------------------------------------------

def _make_ibmmq_stub():
    """Build a minimal fake ibmmq module that satisfies the import-time
    attribute accesses made by the sample scripts."""

    ibmmq = types.ModuleType("ibmmq")

    # ---- constant namespaces ----
    CMQC = types.SimpleNamespace(
        MQOO_OUTPUT=0x10,
        MQOO_INPUT_AS_Q_DEF=0x01,
        MQOO_INPUT_EXCLUSIVE=0x02,
        MQFMT_STRING="MQSTR   ",
        MQPMO_NO_SYNCPOINT=0x04,
        MQPMO_SYNCPOINT=0x02,
        MQPMO_NEW_MSG_ID=0x40,
        MQGMO_WAIT=0x01,
        MQGMO_SYNCPOINT=0x02,
        MQGMO_NO_SYNCPOINT=0x04,
        MQGMO_FAIL_IF_QUIESCING=0x20,
        MQGMO_NO_PROPERTIES=0x4000,
        MQGMO_VERSION_2=2,
        MQMO_MATCH_CORREL_ID=0x01,
        MQMT_REQUEST=1,
        MQMT_REPLY=2,
        MQMT_DATAGRAM=8,
        MQRO_COPY_MSG_ID_TO_CORREL_ID=0x40000000,
        MQRO_PASS_MSG_ID=0x100,
        MQRO_PASS_CORREL_ID=0x40,
        MQRO_NEW_MSG_ID=0x80,
        MQRO_PASS_DISCARD_AND_EXPIRY=0x4000,
        MQRO_DISCARD_MSG=0x08000000,
        MQRO_NONE=0,
        MQSO_CREATE=0x02,
        MQSO_MANAGED=0x04,
        MQSO_NON_DURABLE=0x01,
        MQSO_FAIL_IF_QUIESCING=0x20,
        MQMI_NONE=b"\x00" * 24,
        MQCI_NONE=b"\x00" * 24,
        MQGI_NONE=b"\x00" * 24,
        MQCC_FAILED=2,
        MQRC_NO_MSG_AVAILABLE=2033,
        MQCD_VERSION_11=11,
    )

    CMQXC = types.SimpleNamespace(
        MQCD_VERSION_11=11,
        MQCHT_CLNTCONN=1,
        MQXPT_TCP=2,
    )

    ibmmq.CMQC = CMQC
    ibmmq.CMQXC = CMQXC

    # ---- simple descriptor / options classes ----
    class _Obj:
        def __init__(self, **kwargs):
            for k, v in kwargs.items():
                setattr(self, k, v)

    for cls_name in ("CD", "SCO", "OD", "GMO"):
        klass = type(cls_name, (_Obj,), {})
        setattr(ibmmq, cls_name, klass)

    class PMO(_Obj):
        def __init__(self, **kwargs):
            self.Options = 0
            for k, v in kwargs.items():
                setattr(self, k, v)

    ibmmq.PMO = PMO

    class SD(_Obj):
        def __init__(self, **kwargs):
            self.Options = 0
            self._vs = {}
            for k, v in kwargs.items():
                setattr(self, k, v)

        def set_vs(self, field, value):
            self._vs[field] = value
            setattr(self, field, value)

    ibmmq.SD = SD

    # MD needs default fields accessed by respond_to_request
    class MD(_Obj):
        def __init__(self, **kwargs):
            self.MsgId = CMQC.MQMI_NONE
            self.CorrelId = CMQC.MQCI_NONE
            self.GroupId = CMQC.MQGI_NONE
            self.MsgType = CMQC.MQMT_DATAGRAM
            self.Format = CMQC.MQFMT_STRING
            self.Report = 0
            self.Persistence = 0
            self.Expiry = -1
            self.BackoutCount = 0
            self.ReplyToQ = ""
            self.ReplyToQMgr = ""
            self.ReportOptions = 0
            for k, v in kwargs.items():
                setattr(self, k, v)

    ibmmq.MD = MD

    class CSP(_Obj):
        def __init__(self, **kwargs):
            self.CSPUserId = None
            self.CSPPassword = None
            for k, v in kwargs.items():
                setattr(self, k, v)

    ibmmq.CSP = CSP

    # MQMIError
    class MQMIError(Exception):
        def __init__(self, comp=0, reason=0):
            self.comp = comp
            self.reason = reason
            super().__init__(f"MQMI Error comp={comp} reason={reason}")

    ibmmq.MQMIError = MQMIError

    # QueueManager stub
    class QueueManager:
        def __init__(self, name):
            self.name = name
            self._committed = False
            self._backedout = False

        def connect_with_options(self, qmgr_name, **kwargs):
            pass

        def disconnect(self):
            pass

        def commit(self):
            self._committed = True

        def backout(self):
            self._backedout = True

        def put1(self, od_or_name, msg, md=None, pmo=None):
            pass

    ibmmq.QueueManager = QueueManager

    # Queue stub
    class Queue:
        def __init__(self, qmgr=None, od=None, open_opts=None):
            self._messages = []
            self.closed = False

        def open(self, od, open_opts):
            pass

        def put(self, msg, md=None, pmo=None):
            self._messages.append(msg)

        def get(self, buf, md=None, gmo=None):
            if not self._messages:
                err = MQMIError(comp=CMQC.MQCC_FAILED, reason=CMQC.MQRC_NO_MSG_AVAILABLE)
                raise err
            return self._messages.pop(0)

        def close(self):
            self.closed = True

        def get_name(self):
            return "FAKE.QUEUE"

    ibmmq.Queue = Queue

    # Topic stub
    class Topic:
        def __init__(self, qmgr=None, topic_string=None):
            self.topic_string = topic_string
            self._messages = []

        def open(self, open_opts=None):
            pass

        def pub(self, msg, md=None, pmo=None):
            self._messages.append(msg)

        def close(self):
            pass

    ibmmq.Topic = Topic

    # Subscription stub
    class Subscription:
        def __init__(self, qmgr=None):
            self._messages = []

        def sub(self, sub_desc=None):
            pass

        def get(self, buf, md=None, gmo=None):
            if not self._messages:
                err = MQMIError(comp=CMQC.MQCC_FAILED, reason=CMQC.MQRC_NO_MSG_AVAILABLE)
                raise err
            return self._messages.pop(0)

        def close(self, close_sub_queue=False):
            pass

    ibmmq.Subscription = Subscription

    return ibmmq


@pytest.fixture(autouse=True)
def stub_ibmmq():
    """Replace the real ibmmq with the in-process stub for every test."""
    ibmmq = _make_ibmmq_stub()
    sys.modules["ibmmq"] = ibmmq
    yield ibmmq
    # Clean up so the stub does not bleed across test files
    sys.modules.pop("ibmmq", None)


@pytest.fixture()
def env_json_file(tmp_path):
    """Write a minimal env.json and set JSON_CONFIG to point at it."""
    data = {
        "MQ_ENDPOINTS": [
            {
                "HOST": "localhost",
                "PORT": "1414",
                "CHANNEL": "DEV.APP.SVRCONN",
                "QMGR": "QM1",
                "APP_USER": "app",
                "APP_PASSWORD": "passw0rd",
                "QUEUE_NAME": "DEV.QUEUE.1",
                "TOPIC_NAME": "dev/",
                "MODEL_QUEUE_NAME": "DEV.APP.MODEL.QUEUE",
                "DYNAMIC_QUEUE_PREFIX": "APP.REPLY.*",
                "BACKOUT_QUEUE": "DEV.DEAD.LETTER.QUEUE",
                "KEY_REPOSITORY": "",
                "CIPHER": "",
            }
        ]
    }
    config = tmp_path / "env.json"
    config.write_text(json.dumps(data), encoding="utf-8")
    os.environ["JSON_CONFIG"] = str(config)
    yield config, data["MQ_ENDPOINTS"][0]
    os.environ.pop("JSON_CONFIG", None)
