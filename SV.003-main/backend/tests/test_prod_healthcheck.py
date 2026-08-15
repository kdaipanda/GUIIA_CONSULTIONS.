"""Tests for production healthcheck orchestration."""
from __future__ import annotations

import importlib.util
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch


SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "prod_healthcheck.py"


def load_prod_healthcheck():
    spec = importlib.util.spec_from_file_location("prod_healthcheck", SCRIPT)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


def test_ui_smoke_invokes_node_with_script_path():
    module = load_prod_healthcheck()

    completed = SimpleNamespace(returncode=0, stdout="UI smoke: OK\n", stderr="")
    with patch.object(module.subprocess, "run", return_value=completed) as run_mock:
        ok, elapsed, output = module.run_ui_smoke()

    assert ok is True
    assert elapsed >= 0
    assert "UI smoke: OK" in output
    args, kwargs = run_mock.call_args
    command = args[0]
    assert command[0] == "node"
    assert command[1].endswith("scripts/prod_ui_smoke.mjs")
    assert kwargs.get("shell") is not True
