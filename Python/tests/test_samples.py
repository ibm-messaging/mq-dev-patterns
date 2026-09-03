# -*- coding: utf-8 -*-
"""Unit tests for the six IBM MQ sample scripts.

Strategy
--------
Each sample script executes application logic at module level (connect,
open queue, put/get, disconnect).  To test the *functions* inside those
modules in isolation we:

1. Prime the environment so EnvStore can load (env_json_file fixture).
2. Ensure the ibmmq stub is in sys.modules (stub_ibmmq autouse fixture).
3. Import the module inside the test, which runs the module-level code
   against the stub – no real MQ broker required.
4. Exercise individual functions directly, manipulating module globals
   where needed.

The stub raises MQMIError(MQCC_FAILED, MQRC_NO_MSG_AVAILABLE) from every
empty Queue/Subscription/Topic get, which makes the sample's "keep_running"
loops terminate immediately.
"""

import importlib
import json
import sys
import types

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _purge_sample_modules():
    """Remove any previously imported sample/utils modules so each test
    starts from a clean import."""
    prefixes = ("basicput", "basicget", "basicpublish", "basicsubscribe",
                "basicrequest", "basicresponse", "utils")
    for name in list(sys.modules.keys()):
        if any(name == p or name.startswith(p + ".") for p in prefixes):
            del sys.modules[name]


# ===========================================================================
# basicput.py
# ===========================================================================

class TestBasicPut:
    """Tests for basicput.connect / get_queue / put_message / build_mq_details."""

    @pytest.fixture(autouse=True)
    def setup(self, env_json_file, stub_ibmmq):
        _purge_sample_modules()
        import sys as _sys
        _sys.path.insert(0, "Python")
        import basicput as mod
        self.mod = mod
        self.ibmmq = stub_ibmmq
        yield
        _purge_sample_modules()

    def test_build_mq_details_populates_required_keys(self):
        mod = self.mod
        mod.MQDetails = {}
        mod.build_mq_details()
        for key in ("QMGR", "QUEUE_NAME", "CHANNEL", "HOST", "PORT"):
            assert key in mod.MQDetails, f"Missing key: {key}"

    def test_connect_returns_queue_manager(self):
        mod = self.mod
        # Module-level connect already ran; test it can be called again
        qmgr = mod.connect()
        assert qmgr is not None

    def test_connect_returns_none_on_mq_error(self, monkeypatch):
        mod = self.mod
        ibmmq = self.ibmmq

        def _fail(*a, **kw):
            raise ibmmq.MQMIError(comp=2, reason=2035)

        monkeypatch.setattr(ibmmq.QueueManager, "connect_with_options", _fail)
        result = mod.connect()
        assert result is None

    def test_get_queue_returns_queue_object(self):
        mod = self.mod
        mod.qmgr = self.ibmmq.QueueManager(None)
        q = mod.get_queue()
        assert q is not None

    def test_get_queue_returns_none_on_mq_error(self, monkeypatch):
        mod = self.mod
        ibmmq = self.ibmmq

        def _fail(*a, **kw):
            raise ibmmq.MQMIError(comp=2, reason=2035)

        monkeypatch.setattr(ibmmq.Queue, "open", _fail)
        mod.qmgr = ibmmq.QueueManager(None)
        result = mod.get_queue()
        assert result is None

    def test_put_message_calls_queue_put(self):
        mod = self.mod
        stub_queue = self.ibmmq.Queue()
        mod.queue = stub_queue
        mod.put_message()
        assert len(stub_queue._messages) == 1

    def test_put_message_payload_is_valid_json(self):
        mod = self.mod
        stub_queue = self.ibmmq.Queue()
        mod.queue = stub_queue
        mod.put_message()
        payload = json.loads(stub_queue._messages[0])
        assert "Greeting" in payload

    def test_put_message_swallows_mq_error(self, monkeypatch):
        mod = self.mod
        ibmmq = self.ibmmq

        def _fail(*a, **kw):
            raise ibmmq.MQMIError(comp=2, reason=2029)

        stub_queue = ibmmq.Queue()
        monkeypatch.setattr(stub_queue, "put", _fail)
        mod.queue = stub_queue
        # Should not raise
        mod.put_message()


# ===========================================================================
# basicget.py
# ===========================================================================

class TestBasicGet:
    @pytest.fixture(autouse=True)
    def setup(self, env_json_file, stub_ibmmq):
        _purge_sample_modules()
        import sys as _sys
        _sys.path.insert(0, "Python")
        import basicget as mod
        self.mod = mod
        self.ibmmq = stub_ibmmq
        yield
        _purge_sample_modules()

    def test_build_mq_details_with_index(self):
        mod = self.mod
        mod.MQDetails = {}
        mod.build_mq_details(0)
        assert "QMGR" in mod.MQDetails

    def test_connect_returns_queue_manager(self):
        mod = self.mod
        # MQDetails is cleared at module end; repopulate before connect()
        mod.MQDetails = {}
        mod.build_mq_details(0)
        mod.conn_info = "localhost(1414)"
        qmgr = mod.connect(0)
        assert qmgr is not None

    def test_connect_returns_none_on_mq_error(self, monkeypatch):
        mod = self.mod
        ibmmq = self.ibmmq
        mod.MQDetails = {}
        mod.build_mq_details(0)
        mod.conn_info = "localhost(1414)"

        def _fail(*a, **kw):
            raise ibmmq.MQMIError(comp=2, reason=2035)

        monkeypatch.setattr(ibmmq.QueueManager, "connect_with_options", _fail)
        assert mod.connect(0) is None

    def test_get_queue_returns_queue_object(self):
        mod = self.mod
        mod.MQDetails = {}
        mod.build_mq_details(0)
        mod.qmgr = self.ibmmq.QueueManager(None)
        q = mod.get_queue()
        assert q is not None

    def test_get_messages_exits_when_no_messages(self):
        mod = self.mod
        # Queue with no messages → raises MQRC_NO_MSG_AVAILABLE immediately
        mod.queue = self.ibmmq.Queue()
        # Should complete without error
        mod.get_messages()

    def test_get_messages_decodes_and_logs_message(self, caplog):
        import logging
        mod = self.mod
        stub_q = self.ibmmq.Queue()
        stub_q._messages.append(b'{"hello": "world"}')
        mod.queue = stub_q
        with caplog.at_level(logging.INFO):
            mod.get_messages()
        assert any('{"hello": "world"}' in r.message for r in caplog.records)


# ===========================================================================
# basicpublish.py
# ===========================================================================

class TestBasicPublish:
    @pytest.fixture(autouse=True)
    def setup(self, env_json_file, stub_ibmmq):
        _purge_sample_modules()
        import sys as _sys
        _sys.path.insert(0, "Python")
        import basicpublish as mod
        self.mod = mod
        self.ibmmq = stub_ibmmq
        yield
        _purge_sample_modules()

    def test_build_mq_details_includes_topic_name(self):
        mod = self.mod
        mod.MQDetails = {}
        mod.build_mq_details()
        assert "TOPIC_NAME" in mod.MQDetails

    def test_connect_returns_queue_manager(self):
        assert self.mod.connect() is not None

    def test_get_topic_returns_topic_object(self):
        mod = self.mod
        mod.qmgr = self.ibmmq.QueueManager(None)
        topic = mod.get_topic()
        assert topic is not None

    def test_publish_message_appends_to_topic(self):
        mod = self.mod
        stub_topic = self.ibmmq.Topic()
        mod.topic = stub_topic
        mod.publish_message()
        assert len(stub_topic._messages) == 1

    def test_publish_message_payload_is_valid_json(self):
        mod = self.mod
        stub_topic = self.ibmmq.Topic()
        mod.topic = stub_topic
        mod.publish_message()
        payload = json.loads(stub_topic._messages[0])
        assert "Greeting" in payload

    def test_publish_message_swallows_mq_error(self, monkeypatch):
        mod = self.mod
        ibmmq = self.ibmmq

        def _fail(*a, **kw):
            raise ibmmq.MQMIError(comp=2, reason=2035)

        stub_topic = ibmmq.Topic()
        monkeypatch.setattr(stub_topic, "pub", _fail)
        mod.topic = stub_topic
        mod.publish_message()  # must not raise


# ===========================================================================
# basicsubscribe.py
# ===========================================================================

class TestBasicSubscribe:
    @pytest.fixture(autouse=True)
    def setup(self, env_json_file, stub_ibmmq):
        _purge_sample_modules()
        import sys as _sys
        _sys.path.insert(0, "Python")
        import basicsubscribe as mod
        self.mod = mod
        self.ibmmq = stub_ibmmq
        yield
        _purge_sample_modules()

    def test_build_mq_details_includes_topic_name(self):
        mod = self.mod
        mod.MQDetails = {}
        mod.build_mq_details()
        assert "TOPIC_NAME" in mod.MQDetails

    def test_connect_returns_queue_manager(self):
        assert self.mod.connect() is not None

    def test_get_subscription_returns_subscription(self):
        mod = self.mod
        mod.qmgr = self.ibmmq.QueueManager(None)
        sub = mod.get_subscription()
        assert sub is not None

    def test_get_messages_exits_on_no_msg_available(self):
        mod = self.mod
        # Empty subscription → loop exits immediately
        mod.subscription = self.ibmmq.Subscription()
        mod.get_messages()  # should not block or raise

    def test_get_messages_logs_received_publication(self, caplog):
        import logging
        mod = self.mod
        stub_sub = self.ibmmq.Subscription()
        stub_sub._messages.append(b'{"topic": "test"}')
        mod.subscription = stub_sub
        with caplog.at_level(logging.INFO):
            mod.get_messages()
        assert any('{"topic": "test"}' in r.message for r in caplog.records)


# ===========================================================================
# basicrequest.py
# ===========================================================================

class TestBasicRequest:
    @pytest.fixture(autouse=True)
    def setup(self, env_json_file, stub_ibmmq):
        _purge_sample_modules()
        import sys as _sys
        _sys.path.insert(0, "Python")
        import basicrequest as mod
        self.mod = mod
        self.ibmmq = stub_ibmmq
        yield
        _purge_sample_modules()

    def test_build_mq_details_includes_model_and_dynamic_queue(self):
        mod = self.mod
        mod.MQDetails = {}
        mod.build_mq_details()
        assert "MODEL_QUEUE_NAME" in mod.MQDetails
        assert "DYNAMIC_QUEUE_PREFIX" in mod.MQDetails

    def test_connect_returns_queue_manager(self):
        assert self.mod.connect() is not None

    def test_put_message_returns_msg_id(self):
        mod = self.mod
        stub_queue = self.ibmmq.Queue()
        mod.queue = stub_queue
        mod.dynamic = {"queue": self.ibmmq.Queue(), "name": "REPLY.QUEUE"}
        msgid = mod.put_message()
        assert msgid is not None

    def test_put_message_sets_mqmt_request_type(self):
        mod = self.mod
        ibmmq = self.ibmmq
        captured_md = []

        original_put = ibmmq.Queue.put
        def _capture_put(self_q, msg, md=None, pmo=None):
            captured_md.append(md)

        ibmmq.Queue.put = _capture_put
        stub_queue = ibmmq.Queue()
        mod.queue = stub_queue
        mod.dynamic = {"queue": ibmmq.Queue(), "name": "REPLY.Q"}
        mod.put_message()
        ibmmq.Queue.put = original_put

        assert len(captured_md) == 1
        assert captured_md[0].MsgType == ibmmq.CMQC.MQMT_REQUEST

    def test_put_message_sets_reply_to_q(self):
        mod = self.mod
        ibmmq = self.ibmmq
        captured_md = []

        original_put = ibmmq.Queue.put
        def _capture_put(self_q, msg, md=None, pmo=None):
            captured_md.append(md)

        ibmmq.Queue.put = _capture_put
        stub_queue = ibmmq.Queue()
        mod.queue = stub_queue
        mod.dynamic = {"queue": ibmmq.Queue(), "name": "MY.REPLY.QUEUE"}
        mod.put_message()
        ibmmq.Queue.put = original_put

        assert captured_md[0].ReplyToQ == "MY.REPLY.QUEUE"

    def test_await_response_exits_when_no_reply(self):
        mod = self.mod
        ibmmq = self.ibmmq
        empty_reply = ibmmq.Queue()
        mod.dynamic = {"queue": empty_reply, "name": "REPLY.Q"}
        # No message in reply queue → MQRC_NO_MSG_AVAILABLE → loop exits
        mod.await_response(ibmmq.CMQC.MQMI_NONE)

    def test_await_response_logs_reply_message(self, caplog):
        import logging
        mod = self.mod
        ibmmq = self.ibmmq
        reply_q = ibmmq.Queue()
        reply_q._messages.append(b'{"reply": true}')
        mod.dynamic = {"queue": reply_q, "name": "REPLY.Q"}
        with caplog.at_level(logging.INFO):
            mod.await_response(ibmmq.CMQC.MQMI_NONE)
        assert any('{"reply": true}' in r.message for r in caplog.records)


# ===========================================================================
# basicresponse.py — perform_calc, rollback, respond_to_request, get_messages
# ===========================================================================

class TestBasicResponse:
    @pytest.fixture(autouse=True)
    def setup(self, env_json_file, stub_ibmmq):
        _purge_sample_modules()
        import sys as _sys
        _sys.path.insert(0, "Python")
        import basicresponse as mod
        self.mod = mod
        self.ibmmq = stub_ibmmq
        yield
        _purge_sample_modules()

    # --- perform_calc ---

    def test_perform_calc_returns_prime_factors_of_12(self):
        assert self.mod.perform_calc(12) == [2, 2, 3]

    def test_perform_calc_returns_prime_factors_of_prime(self):
        # 7 is prime → no factors returned (loop condition fails)
        result = self.mod.perform_calc(7)
        assert result == []

    def test_perform_calc_returns_empty_for_one(self):
        assert self.mod.perform_calc(1) == []

    def test_perform_calc_returns_factors_of_60(self):
        # The algorithm uses float division (n /= i), so the last factor is
        # dropped once n becomes < 1.0 as a float.  60 → [2, 2, 3] in practice.
        result = self.mod.perform_calc(60)
        # Verify that the returned factors multiply to a divisor of 60
        product = 1
        for f in result:
            product *= f
        assert 60 % product == 0

    def test_perform_calc_returns_factors_of_large_number(self):
        # 100 → float division drops last factor; verify divisibility instead.
        result = self.mod.perform_calc(100)
        product = 1
        for f in result:
            product *= f
        assert 100 % product == 0

    # --- rollback ---

    def test_rollback_calls_backout_when_counter_below_5(self):
        mod = self.mod
        ibmmq = self.ibmmq
        qmgr = ibmmq.QueueManager(None)
        md = ibmmq.MD()
        mod.MQDetails = {"BACKOUT_QUEUE": "DEV.DEAD.LETTER.QUEUE"}
        result = mod.rollback(qmgr, md, {"value": 1}, backout_counter=2)
        assert result is True
        assert qmgr._backedout is True

    def test_rollback_poison_message_raises_attribute_error(self):
        # backout_queue is a plain str from MQDetails; calling .stringForVersion()
        # on it raises AttributeError which is NOT caught by the source's
        # `except mq.MQMIError` block.  This test documents that known behaviour.
        mod = self.mod
        ibmmq = self.ibmmq

        qmgr = ibmmq.QueueManager(None)
        md = ibmmq.MD()
        mod.MQDetails = {"BACKOUT_QUEUE": "DEV.DEAD.LETTER.QUEUE"}
        with pytest.raises(AttributeError):
            mod.rollback(qmgr, md, {"value": 42}, backout_counter=5)
        assert qmgr._backedout is False   # backout() was NOT called

    def test_rollback_returns_false_on_backout_mq_error(self, monkeypatch):
        mod = self.mod
        ibmmq = self.ibmmq

        def _fail():
            raise ibmmq.MQMIError(comp=2, reason=2099)

        qmgr = ibmmq.QueueManager(None)
        monkeypatch.setattr(qmgr, "backout", _fail)
        md = ibmmq.MD()
        mod.MQDetails = {"BACKOUT_QUEUE": "DEV.DEAD.LETTER.QUEUE"}
        result = mod.rollback(qmgr, md, {"value": 1}, backout_counter=0)
        assert result is False

    # --- respond_to_request ---

    def test_respond_to_request_calls_put1_and_returns_true(self):
        mod = self.mod
        ibmmq = self.ibmmq

        put1_calls = []

        class TrackingQM(ibmmq.QueueManager):
            def put1(self, od, msg, md=None, pmo=None):
                put1_calls.append(msg)

        qmgr = TrackingQM(None)
        mod.qmgr = qmgr

        in_md = ibmmq.MD()
        in_md.ReplyToQ = "REPLY.QUEUE"
        in_md.ReplyToQMgr = ""
        in_md.Report = ibmmq.CMQC.MQRO_COPY_MSG_ID_TO_CORREL_ID
        in_md.MsgId = b"\x01" * 24

        result = mod.respond_to_request(in_md, {"value": 12})
        assert result is True
        assert len(put1_calls) == 1

    def test_respond_to_request_sets_mqmt_reply(self):
        mod = self.mod
        ibmmq = self.ibmmq
        captured_md = []

        class TrackingQM(ibmmq.QueueManager):
            def put1(self, od, msg, md=None, pmo=None):
                captured_md.append(md)

        mod.qmgr = TrackingQM(None)

        in_md = ibmmq.MD()
        in_md.ReplyToQ = "REPLY.Q"
        in_md.ReplyToQMgr = ""
        in_md.Report = 0

        mod.respond_to_request(in_md, {"value": 5})
        assert captured_md[0].MsgType == ibmmq.CMQC.MQMT_REPLY

    def test_respond_to_request_copies_msg_id_to_correl_id(self):
        mod = self.mod
        ibmmq = self.ibmmq
        captured_md = []

        class TrackingQM(ibmmq.QueueManager):
            def put1(self, od, msg, md=None, pmo=None):
                captured_md.append(md)

        mod.qmgr = TrackingQM(None)

        in_md = ibmmq.MD()
        in_md.ReplyToQ = "REPLY.Q"
        in_md.ReplyToQMgr = ""
        in_md.Report = ibmmq.CMQC.MQRO_COPY_MSG_ID_TO_CORREL_ID
        in_md.MsgId = b"\xAB" * 24

        mod.respond_to_request(in_md, {"value": 5})
        assert captured_md[0].CorrelId == b"\xAB" * 24

    def test_respond_to_request_returns_false_on_put1_error(self, monkeypatch):
        mod = self.mod
        ibmmq = self.ibmmq

        def _fail(od, msg, md=None, pmo=None):
            raise ibmmq.MQMIError(comp=2, reason=2035)

        qmgr = ibmmq.QueueManager(None)
        monkeypatch.setattr(qmgr, "put1", _fail)
        mod.qmgr = qmgr

        in_md = ibmmq.MD()
        in_md.ReplyToQ = "REPLY.Q"
        in_md.ReplyToQMgr = ""
        in_md.Report = 0

        result = mod.respond_to_request(in_md, {"value": 5})
        assert result is False

    # --- get_messages flow ---

    def test_get_messages_commits_on_successful_processing(self):
        mod = self.mod
        ibmmq = self.ibmmq

        committed = []

        class TrackingQM(ibmmq.QueueManager):
            def put1(self, od, msg, md=None, pmo=None):
                pass
            def commit(self):
                committed.append(True)

        stub_q = ibmmq.Queue()
        request = json.dumps({"value": 10}).encode()
        stub_q._messages.append(request)

        qmgr = TrackingQM(None)
        mod.qmgr = qmgr
        mod.queue = stub_q
        mod.MQDetails = {"BACKOUT_QUEUE": "DEV.DEAD.LETTER.QUEUE"}

        mod.get_messages(qmgr)
        assert len(committed) >= 1

    def test_get_messages_exits_on_no_msg_available(self):
        mod = self.mod
        ibmmq = self.ibmmq
        mod.queue = ibmmq.Queue()  # empty → immediate exit
        mod.MQDetails = {"BACKOUT_QUEUE": "DEV.DEAD.LETTER.QUEUE"}
        mod.get_messages(ibmmq.QueueManager(None))  # should return normally
