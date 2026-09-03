# -*- coding: utf-8 -*-
"""Unit tests for utils/env.py — EnvStore class.

All tests run without a real IBM MQ installation.  The ibmmq stub from
conftest.py is injected automatically via the autouse fixture.
"""

import json
import os
import sys

import pytest

# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _reset_env_store():
    """Force EnvStore to re-read its config on the next instantiation."""
    # Remove any cached module so __init__ re-runs from scratch
    for mod_name in list(sys.modules.keys()):
        if "utils" in mod_name:
            del sys.modules[mod_name]


# ---------------------------------------------------------------------------
# Tests: __init__ and config loading
# ---------------------------------------------------------------------------

class TestEnvStoreInit:
    def test_loads_config_from_json_config_env_var(self, env_json_file):
        _reset_env_store()
        from utils.env import EnvStore  # noqa: PLC0415

        store = EnvStore()
        assert EnvStore.env is not None

    def test_raises_when_file_missing(self, tmp_path, monkeypatch):
        _reset_env_store()
        monkeypatch.setenv("JSON_CONFIG", str(tmp_path / "nonexistent.json"))
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore.env = None  # force reload
        with pytest.raises(Exception):
            EnvStore()

    def test_raises_on_invalid_json(self, tmp_path, monkeypatch):
        _reset_env_store()
        bad = tmp_path / "bad.json"
        bad.write_text("{not valid json}", encoding="utf-8")
        monkeypatch.setenv("JSON_CONFIG", str(bad))
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore.env = None
        with pytest.raises(Exception):
            EnvStore()

    def test_env_is_class_variable_shared_across_instances(self, env_json_file):
        _reset_env_store()
        from utils.env import EnvStore  # noqa: PLC0415

        a = EnvStore()
        b = EnvStore()
        assert a.env is b.env


# ---------------------------------------------------------------------------
# Tests: is_endpoint_list
# ---------------------------------------------------------------------------

class TestIsEndpointList:
    def test_true_when_mq_endpoints_is_a_list(self, env_json_file):
        _reset_env_store()
        from utils.env import EnvStore  # noqa: PLC0415

        store = EnvStore()
        assert store.is_endpoint_list() is True

    def test_false_when_env_is_none(self, env_json_file):
        _reset_env_store()
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore.env = None
        store = EnvStore.__new__(EnvStore)  # skip __init__
        assert store.is_endpoint_list() is False

    def test_false_when_mq_endpoints_key_missing(self, tmp_path, monkeypatch):
        _reset_env_store()
        cfg = tmp_path / "env.json"
        cfg.write_text(json.dumps({"HOST": "localhost"}), encoding="utf-8")
        monkeypatch.setenv("JSON_CONFIG", str(cfg))
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore.env = None
        store = EnvStore()
        assert store.is_endpoint_list() is False

    def test_false_when_mq_endpoints_is_not_a_list(self, tmp_path, monkeypatch):
        _reset_env_store()
        cfg = tmp_path / "env.json"
        cfg.write_text(json.dumps({"MQ_ENDPOINTS": "not-a-list"}), encoding="utf-8")
        monkeypatch.setenv("JSON_CONFIG", str(cfg))
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore.env = None
        store = EnvStore()
        assert store.is_endpoint_list() is False


# ---------------------------------------------------------------------------
# Tests: build_connection_string
# ---------------------------------------------------------------------------

class TestBuildConnectionString:
    def _store(self, env_json_file):
        _reset_env_store()
        from utils.env import EnvStore  # noqa: PLC0415
        return EnvStore()

    def test_single_endpoint(self, env_json_file):
        store = self._store(env_json_file)
        from utils.env import EnvStore  # noqa: PLC0415

        result = store.build_connection_string([{"HOST": "host1", "PORT": "1414"}])
        assert result == "host1(1414)"

    def test_multiple_endpoints(self, env_json_file):
        store = self._store(env_json_file)
        points = [
            {"HOST": "host1", "PORT": "1414"},
            {"HOST": "host2", "PORT": "1415"},
        ]
        result = store.build_connection_string(points)
        assert result == "host1(1414),host2(1415)"

    def test_skips_entry_missing_host(self, env_json_file):
        store = self._store(env_json_file)
        points = [
            {"PORT": "1414"},                          # no HOST → skipped
            {"HOST": "host2", "PORT": "1415"},
        ]
        result = store.build_connection_string(points)
        assert result == "host2(1415)"

    def test_skips_entry_missing_port(self, env_json_file):
        store = self._store(env_json_file)
        points = [
            {"HOST": "host1"},                         # no PORT → skipped
            {"HOST": "host2", "PORT": "1415"},
        ]
        result = store.build_connection_string(points)
        assert result == "host2(1415)"

    def test_empty_list(self, env_json_file):
        store = self._store(env_json_file)
        assert store.build_connection_string([]) == ""


# ---------------------------------------------------------------------------
# Tests: get_endpoint_count
# ---------------------------------------------------------------------------

class TestGetEndpointCount:
    def test_returns_number_of_endpoints(self, env_json_file):
        _reset_env_store()
        from utils.env import EnvStore  # noqa: PLC0415

        store = EnvStore()
        assert store.get_endpoint_count() == 1

    def test_returns_two_for_two_endpoints(self, tmp_path, monkeypatch):
        _reset_env_store()
        data = {
            "MQ_ENDPOINTS": [
                {"HOST": "h1", "PORT": "1414", "CHANNEL": "C", "QMGR": "QM"},
                {"HOST": "h2", "PORT": "1414", "CHANNEL": "C", "QMGR": "QM"},
            ]
        }
        cfg = tmp_path / "env.json"
        cfg.write_text(json.dumps(data), encoding="utf-8")
        monkeypatch.setenv("JSON_CONFIG", str(cfg))
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore.env = None
        store = EnvStore()
        assert store.get_endpoint_count() == 2

    def test_returns_one_when_not_endpoint_list(self, tmp_path, monkeypatch):
        _reset_env_store()
        cfg = tmp_path / "env.json"
        cfg.write_text(json.dumps({"HOST": "h"}), encoding="utf-8")
        monkeypatch.setenv("JSON_CONFIG", str(cfg))
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore.env = None
        store = EnvStore()
        assert store.get_endpoint_count() == 1


# ---------------------------------------------------------------------------
# Tests: get_next_connection_string
# ---------------------------------------------------------------------------

class TestGetNextConnectionString:
    def test_yields_index_and_connection_string(self, env_json_file):
        _reset_env_store()
        from utils.env import EnvStore  # noqa: PLC0415

        store = EnvStore()
        results = list(store.get_next_connection_string())
        assert len(results) == 1
        idx, conn = results[0]
        assert idx == 0
        assert conn == "localhost(1414)"

    def test_yields_multiple_entries(self, tmp_path, monkeypatch):
        _reset_env_store()
        data = {
            "MQ_ENDPOINTS": [
                {"HOST": "h1", "PORT": "1414"},
                {"HOST": "h2", "PORT": "1415"},
            ]
        }
        cfg = tmp_path / "env.json"
        cfg.write_text(json.dumps(data), encoding="utf-8")
        monkeypatch.setenv("JSON_CONFIG", str(cfg))
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore.env = None
        store = EnvStore()
        results = list(store.get_next_connection_string())
        assert results[0] == (0, "h1(1414)")
        assert results[1] == (1, "h2(1415)")


# ---------------------------------------------------------------------------
# Tests: set_env
# ---------------------------------------------------------------------------

class TestSetEnv:
    def test_sets_host_in_os_environ(self, env_json_file, monkeypatch):
        _reset_env_store()
        # Clear keys that will be written so the test is deterministic
        for key in ("HOST", "PORT", "CHANNEL", "QMGR", "APP_USER",
                    "QUEUE_NAME", "TOPIC_NAME", "MODEL_QUEUE_NAME",
                    "DYNAMIC_QUEUE_PREFIX", "BACKOUT_QUEUE",
                    "KEY_REPOSITORY", "CIPHER", "CONN_STRING"):
            monkeypatch.delenv(key, raising=False)

        from utils.env import EnvStore  # noqa: PLC0415

        store = EnvStore()
        store.set_env()
        assert os.environ.get("HOST") == "localhost"
        assert os.environ.get("PORT") == "1414"

    def test_builds_connection_string(self, env_json_file, monkeypatch):
        _reset_env_store()
        monkeypatch.delenv("CONN_STRING", raising=False)
        from utils.env import EnvStore  # noqa: PLC0415

        store = EnvStore()
        store.set_env()
        assert os.environ.get("CONN_STRING") == "localhost(1414)"

    def test_no_op_when_not_endpoint_list(self, tmp_path, monkeypatch):
        _reset_env_store()
        cfg = tmp_path / "env.json"
        cfg.write_text(json.dumps({"HOST": "solo"}), encoding="utf-8")
        monkeypatch.setenv("JSON_CONFIG", str(cfg))
        monkeypatch.delenv("HOST", raising=False)
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore.env = None
        store = EnvStore()
        store.set_env()
        # HOST should NOT have been written because there is no MQ_ENDPOINTS list
        assert os.environ.get("HOST") is None


# ---------------------------------------------------------------------------
# Tests: getenv_value (static)
# ---------------------------------------------------------------------------

class TestGetenvValue:
    def test_reads_from_os_environ_when_index_zero(self, env_json_file, monkeypatch):
        _reset_env_store()
        monkeypatch.setenv("MY_KEY", "my_value")
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore()
        assert EnvStore.getenv_value("MY_KEY", 0) == "my_value"

    def test_returns_none_when_key_absent_and_index_zero(self, env_json_file, monkeypatch):
        _reset_env_store()
        monkeypatch.delenv("ABSENT_KEY", raising=False)
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore()
        assert EnvStore.getenv_value("ABSENT_KEY", 0) is None

    def test_reads_from_json_when_index_nonzero(self, tmp_path, monkeypatch):
        _reset_env_store()
        data = {
            "MQ_ENDPOINTS": [
                {"HOST": "h0", "PORT": "1414"},
                {"HOST": "h1", "PORT": "1415"},
            ]
        }
        cfg = tmp_path / "env.json"
        cfg.write_text(json.dumps(data), encoding="utf-8")
        monkeypatch.setenv("JSON_CONFIG", str(cfg))
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore.env = None
        EnvStore()
        assert EnvStore.getenv_value("HOST", 1) == "h1"


# ---------------------------------------------------------------------------
# Tests: get_connection (static)
# ---------------------------------------------------------------------------

class TestGetConnection:
    def test_returns_conn_string_env_var_when_set(self, env_json_file, monkeypatch):
        _reset_env_store()
        monkeypatch.setenv("CONN_STRING", "myhost(9999)")
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore()
        result = EnvStore.get_connection("HOST", "PORT")
        assert result == "myhost(9999)"

    def test_builds_from_host_port_when_conn_string_absent(self, env_json_file, monkeypatch):
        _reset_env_store()
        monkeypatch.delenv("CONN_STRING", raising=False)
        monkeypatch.setenv("HOST", "fallback-host")
        monkeypatch.setenv("PORT", "1414")
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore()
        result = EnvStore.get_connection("HOST", "PORT")
        assert result == "fallback-host(1414)"


# ---------------------------------------------------------------------------
# Tests: is_ccdt_available (static)
# ---------------------------------------------------------------------------

class TestIsCcdtAvailable:
    def test_false_when_env_var_not_set(self, env_json_file, monkeypatch):
        _reset_env_store()
        monkeypatch.delenv("MQCCDTURL", raising=False)
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore()
        assert EnvStore.is_ccdt_available() is False

    def test_false_when_file_does_not_exist(self, env_json_file, monkeypatch, tmp_path):
        _reset_env_store()
        monkeypatch.setenv("MQCCDTURL", str(tmp_path / "no_ccdt.json"))
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore()
        assert EnvStore.is_ccdt_available() is False

    def test_true_when_file_exists(self, env_json_file, monkeypatch, tmp_path):
        _reset_env_store()
        ccdt = tmp_path / "ccdt.json"
        ccdt.write_text("{}", encoding="utf-8")
        monkeypatch.setenv("MQCCDTURL", str(ccdt))
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore()
        assert EnvStore.is_ccdt_available() is True

    def test_true_with_file_prefix(self, env_json_file, monkeypatch, tmp_path):
        _reset_env_store()
        ccdt = tmp_path / "ccdt.json"
        ccdt.write_text("{}", encoding="utf-8")
        monkeypatch.setenv("MQCCDTURL", "file://" + str(ccdt))
        from utils.env import EnvStore  # noqa: PLC0415

        EnvStore()
        assert EnvStore.is_ccdt_available() is True
