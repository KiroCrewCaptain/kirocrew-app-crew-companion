"""The companion's process-wide runtime: the reminder store and the avatar store.

Its own module, not globals of ``hooks.py``, because the gateway loads each hook
entry by executing its file into a FRESH module object (``load_app_module``), so
the ``hooks`` module whose ``on_startup`` ran is not the one ``routes.py`` imported
earlier with ``from . import hooks``. A module that is never a hook entry is
imported once into the app's package and shared by both, which is what lets the
routes reach the store the startup hook built.
"""

from __future__ import annotations

from typing import Any

from .store import CompanionStore

#: The reminder store, or None while the app is not started yet.
store: CompanionStore | None = None
#: The appearance store, or None on a gateway without the avatar library.
appearances: Any | None = None


def get_appearances() -> Any:
    """The appearance store; raises when the startup hook has not built one."""
    if appearances is None:
        raise RuntimeError("crew-companion: appearance store not initialised")
    return appearances


def appearances_ready() -> bool:
    """True once the appearance store exists (the host ships its library)."""
    return appearances is not None


def get_store() -> CompanionStore | None:
    """The live runtime, or None when the app is disabled or not yet started.

    Routes use this to answer 503 rather than 500 while the hook has not run:
    "not started yet" and "broken" are different answers and the caller can
    retry only one of them.
    """
    return store


def reset_for_tests() -> None:
    """Drop the process-global runtime. Tests only."""
    global store, appearances
    if store is not None:
        store.stop()
    store = None
    # The appearance store holds no timer, so there is nothing to stop, but it is
    # cleared so a re-enable rebuilds it against the data dir it is given then.
    appearances = None
