"""Test session setup: the app root on ``sys.path``, and a fake gateway.

The gateway loads hook files into a synthetic package named after the app, so
the backend never needs to be on ``sys.path`` there. A plain pytest run has no
such loader, so the app root is put on the path for the test session only.

Every test runs against :class:`fakehost.FakeHost` (the host modules
``backend/_host.py`` resolves), so none needs Kiro Crew installed, and the
process-wide runtime the hooks keep is reset around each test.
"""

from __future__ import annotations

import sys
from pathlib import Path
from typing import Iterator

import pytest

TESTS = Path(__file__).resolve().parent
APP_ROOT = TESTS.parent
for entry in (str(APP_ROOT), str(TESTS)):
    if entry not in sys.path:
        sys.path.insert(0, entry)

from backend import _host, hooks  # noqa: E402
from fakehost import FakeHost  # noqa: E402


@pytest.fixture(autouse=True)
def fake_host(monkeypatch: pytest.MonkeyPatch) -> FakeHost:
    """The fake gateway every ``_host`` lookup answers from."""
    host = FakeHost()
    monkeypatch.setattr(_host, "_host_attr", host.attr)
    return host


@pytest.fixture(autouse=True)
def _clean_runtime() -> Iterator[None]:
    """No test may inherit another's process-global runtime."""
    hooks._reset_for_tests()
    yield
    hooks._reset_for_tests()
