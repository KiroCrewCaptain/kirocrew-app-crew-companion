"""Every place Crew Companion reaches into the Kiro Crew gateway, in one module.

An installed app's Python runs inside the gateway process. Crew Companion needs
two kinds of host surface:

1. **The App Kit context** handed to its hooks (``ctx``): the data directory,
   the owner gate (``ctx.require_owner``) and the event bus (``ctx.events``).
   These are public seams, read off the context with ``getattr``. A missing owner
   gate refuses every write; a missing event bus leaves the overlay's two-second
   poll as the only delivery, slower and never broken.

2. **Host modules with no App Kit seam yet.** The avatar gallery's packs are
   stored, exported, imported and fetched from PetDex by the gateway's own
   appearance-pack library (``kiro_crew.appearance_packs``), the same code the
   dashboard's crew appearance library runs. It validates attacker-authored
   bundles and art and pins the one host PetDex lookups may reach, so a copy here
   would be a second validator that drifts from the one the gateway enforces. The
   reminder store's file writes go through the gateway's Windows-aware replace,
   owner-only permission and JSON readers for the same reason. Each import is lazy
   and resolved at call time through :func:`_host_attr`; when the gateway does not
   provide one, the operation that needs it is refused (the gallery answers 503
   ``appearances_unavailable``) or, for the file helpers, falls back to the plain
   standard library call. ``PORTING.md`` lists each one as a gap.

``tests/test_no_host_imports.py`` pins that nothing else in ``backend/`` imports
the gateway.
"""

from __future__ import annotations

import importlib
import json
import logging
import os
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Awaitable, Callable

logger = logging.getLogger("kirocrew.app.crew-companion")

APP_NAME = "crew-companion"

#: Shown when the gateway lacks the appearance-pack library.
NO_APPEARANCES = (
    "This Kiro Crew does not provide the avatar library Crew Companion uses, "
    "so the gallery cannot list or change avatars. Update Kiro Crew."
)


# ── host resolution ─────────────────────────────────────────────────────────


def _host_attr(module: str, name: str) -> Any | None:
    """``module.name`` from the running gateway, or ``None`` when it has none.

    The one seam tests replace: a fake host answers here, so no test needs a
    Kiro Crew install.
    """
    try:
        mod = importlib.import_module(module)
    except Exception:  # noqa: BLE001 - any import failure means "not provided"
        return None
    return getattr(mod, name, None)


class HostCapabilityMissing(RuntimeError):
    """The gateway does not provide a module this operation requires."""


def _required(module: str, name: str) -> Any:
    value = _host_attr(module, name)
    if value is None:
        raise HostCapabilityMissing(f"{module}.{name}")
    return value


# ── route records ───────────────────────────────────────────────────────────


@dataclass(frozen=True)
class Route:
    """One ``hooks.routes`` record, accepted structurally by the gateway.

    ``path`` is relative to ``/api/apps/crew-companion``; ``handler`` is
    ``async (request, ctx) -> response``.
    """

    method: str
    path: str
    handler: Callable[[Any, Any], Awaitable[Any]]


# ── owner gate ──────────────────────────────────────────────────────────────


async def require_owner(ctx: Any, request: Any, operation: str) -> Any | None:
    """``None`` when the caller is the dashboard owner, else the refusal to return.

    *operation* is bare (``"reminders_add"``): the host prefixes the app name when
    it audits a denial. A gateway without the seam refuses everyone.
    """
    gate = getattr(ctx, "require_owner", None)
    if not callable(gate):
        from aiohttp import web

        return web.json_response(
            {"error": "owner authorization required", "code": "owner_only"}, status=403
        )
    return await gate(request, operation)


# ── appearance packs ────────────────────────────────────────────────────────

_APPEARANCE_STORE = ("kiro_crew.appearance_packs.store", "AppearanceStore")
_TRANSFER = "kiro_crew.appearance_packs.transfer"


def appearances_available() -> bool:
    """True when the gateway ships the appearance-pack library this app uses."""
    names = [_APPEARANCE_STORE] + [
        (_TRANSFER, n)
        for n in ("export_bundle", "fetch_petdex_pet", "import_bundle", "save_sprite_pack")
    ]
    return all(callable(_host_attr(module, name)) for module, name in names)


def appearance_store(data_dir: Path) -> Any:
    """A new appearance store over *data_dir*; raises when the host has none."""
    return _required(*_APPEARANCE_STORE)(data_dir)


def export_bundle(store: Any, pack_id: str) -> Any:
    return _required(_TRANSFER, "export_bundle")(store, pack_id)


def import_bundle(store: Any, bundle: Any) -> Any:
    return _required(_TRANSFER, "import_bundle")(store, bundle)


def save_sprite_pack(store: Any, *args: Any) -> Any:
    return _required(_TRANSFER, "save_sprite_pack")(store, *args)


def fetch_petdex_pet(user_input: Any) -> Any:
    return _required(_TRANSFER, "fetch_petdex_pet")(user_input)


# ── file helpers ────────────────────────────────────────────────────────────


def read_bytes_with_retry(path: Path) -> bytes:
    """The gateway's read, which retries a Windows sharing violation."""
    read = _host_attr("kiro_crew.atomic_write", "read_bytes_with_retry")
    if callable(read):
        return read(path)
    return Path(path).read_bytes()


def replace_with_retry(src: Path, dst: Path) -> None:
    """The gateway's rename-over, which retries a Windows sharing violation."""
    replace = _host_attr("kiro_crew.atomic_write", "replace_with_retry")
    if callable(replace):
        replace(src, dst)
        return
    os.replace(src, dst)


def restrict_file_to_owner_soft(path: Path) -> None:
    """Owner-only permissions on *path* (a DACL on Windows), best effort."""
    restrict = _host_attr("kiro_crew.owner_only_files", "restrict_file_to_owner_soft")
    if callable(restrict):
        restrict(path)
        return
    try:
        os.chmod(path, 0o600)
    except OSError:
        logger.debug("crew-companion: could not restrict %s", path, exc_info=True)


def loads_user_json(text: str) -> Any:
    """The gateway's JSON reader for a file a person may have edited."""
    loads = _host_attr("kiro_crew.user_json", "loads_user_json")
    if callable(loads):
        return loads(text)
    # A file saved by a Windows editor may start with a byte-order mark.
    return json.loads(text[1:] if text.startswith("\ufeff") else text)
