"""The routes reach the store the startup hook built, however the gateway loads them.

The gateway loads every hook entry (``backend.hooks:on_startup``,
``backend.routes:register_routes``, ``backend.hooks:on_shutdown``) by executing
its file into a FRESH module object under the app's synthetic package
(``kiro_crew.apps.module_loader.load_app_module``). The ``hooks`` module whose
``on_startup`` ran is therefore not the one ``routes.py`` imported when its own
file was executed, so a store kept as a global of ``hooks.py`` was invisible to
the routes, and every request answered 503 ``runtime_not_started`` on an enabled
app. The runtime lives in ``runtime.py``, which no hook entry names.
"""

from __future__ import annotations

import importlib.util
import json
import sys
from pathlib import Path

import pytest
from aiohttp.test_utils import make_mocked_request
from fakehost import FakeCtx

from backend import routes, runtime

APP_ROOT = Path(__file__).resolve().parents[1]


def _fresh(module: str) -> object:
    """Execute *module*'s file into a new module object, as ``load_app_module`` does."""
    spec = importlib.util.spec_from_file_location(module, APP_ROOT / (module.replace(".", "/") + ".py"))
    assert spec is not None and spec.loader is not None
    fresh = importlib.util.module_from_spec(spec)
    sys.modules[module] = fresh
    spec.loader.exec_module(fresh)
    return fresh


@pytest.fixture()
def gateway_loader():
    """Restore the test session's own modules after the loader replaced them."""
    saved = {name: sys.modules.get(name) for name in ("backend.hooks", "backend.routes")}
    yield _fresh
    for name, module in saved.items():
        if module is not None:
            sys.modules[name] = module


def _reminders_handler(module: object):
    table = {(r.method, r.path): r.handler for r in module.register_routes(None)}  # type: ignore[attr-defined]
    return table[("GET", "/reminders")]


@pytest.mark.asyncio
async def test_routes_loaded_first_see_the_store_a_fresh_hooks_module_built(gateway_loader, tmp_path):
    loaded_routes = gateway_loader("backend.routes")
    hooks = gateway_loader("backend.hooks")
    ctx = FakeCtx(data_dir=tmp_path)
    await hooks.on_startup(ctx)  # type: ignore[attr-defined]
    try:
        response = await _reminders_handler(loaded_routes)(make_mocked_request("GET", "/"), ctx)
        assert response.status == 200, response.text
        assert "reminders" in json.loads(response.text)
    finally:
        await gateway_loader("backend.hooks").on_shutdown(ctx)  # type: ignore[attr-defined]


@pytest.mark.asyncio
async def test_a_fresh_hooks_module_for_shutdown_stops_the_running_store(gateway_loader, tmp_path):
    ctx = FakeCtx(data_dir=tmp_path)
    await gateway_loader("backend.hooks").on_startup(ctx)  # type: ignore[attr-defined]
    store = runtime.get_store()
    assert store is not None
    await gateway_loader("backend.hooks").on_shutdown(ctx)  # type: ignore[attr-defined]
    # Stopped, not dropped: the same instance resumes on a re-enable in this process.
    assert runtime.get_store() is store
    assert routes.get_store() is store
