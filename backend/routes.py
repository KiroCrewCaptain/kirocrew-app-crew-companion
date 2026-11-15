"""HTTP routes for Crew Companion, as an installed app's ``backend.hooks.routes``.

``register_routes(ctx)`` returns structural route records (``_host.Route``), which
the gateway's ``RouteRegistry`` serves under ``/api/apps/crew-companion/<path>``
while the app is enabled and deregisters on disable, so a disabled app answers
404 with no check here. There is no second process, no loopback port and no proxy
hop: the handlers run in the gateway process, as the built-in's did.

A runtime that has not started yet answers 503 ``runtime_not_started``, and a
store that could not save answers 503 ``store_write_failed``: both are retryable,
which a caller tells apart from a refusal.

Every route that WRITES is also wrapped in :func:`_owner_write`. The reminders,
packs and notification switches are the owner's own state, so only the dashboard
owner may change them; the host's own gate (``ctx.require_owner``) answers anyone
else, every app token included, with 403 ``owner_only``. Every real caller is the
owner's own dashboard page or desktop window, which carries the owner's session
cookie. The reads stay open to anyone the gateway lets reach the app.
"""

from __future__ import annotations

import asyncio
import logging
from functools import wraps
from typing import Any, Awaitable, Callable

from aiohttp import web

from . import _host
from ._host import Route
from .runtime import appearances_ready, get_appearances, get_store

logger = logging.getLogger(__name__)

# Upper bound for a reminder's recurrence interval. Ten years in minutes is
# far beyond any real reminder while staying tiny relative to what
# `datetime.timedelta` can represent — the point is a total-order guard that
# rejects absurd values (400-digit ints, 1e309→inf) with a 400 instead of
# letting them overflow deeper in the scheduler.
_MAX_RECURRENCE_MINUTES = 10 * 366 * 24 * 60

# A reminder is a sentence, and a fire copies its text into the persisted pending
# queue, so an unbounded text could push the store past its load cap and wedge every tick.
_MAX_TEXT_CHARS = 500

APP_NAME = "crew-companion"
Handler = Callable[[web.Request], Awaitable[web.StreamResponse]]
CtxHandler = Callable[[web.Request, Any], Awaitable[web.StreamResponse]]


def _bad_request(message: str, code: str) -> web.Response:
    """400 with a machine-readable ``code``.

    Three near-identical helpers instead of one taking ``status`` as a parameter,
    because ``test/test_error_code_contract.py`` is a STATIC scan: a computed
    ``status=status`` lands in its ``dynamic_status`` bucket, which it ratchets
    precisely so the gate cannot be sidestepped by hoisting the status into a
    variable. A literal per helper keeps every error response verifiable by
    reading it, which is the point of the gate — the alternative was raising the
    baseline, which its own docstring calls the one move it exists to prevent.

    The ``code`` matters beyond the gate: the dashboard renders ``error`` prose
    verbatim into a localized page, so English produced here would surface
    untranslated in a Chinese UI. The identifier is what a client switches on.
    """
    return web.json_response({"error": message, "code": code}, status=400)


def _forbidden(message: str, code: str) -> web.Response:
    """403 — the caller is not allowed to reach this app right now."""
    return web.json_response({"error": message, "code": code}, status=403)


def _unavailable(message: str, code: str) -> web.Response:
    """503 — the app is allowed, but its runtime is not up yet. Retryable."""
    return web.json_response({"error": message, "code": code}, status=503)


def _require_running(handler: Handler) -> CtxHandler:
    """503 before the runtime is up, 503 if the store cannot write.

    The write-failure translation lives here, in the one wrapper every route
    already goes through, rather than in each of the handlers that mutate the
    store. The store RAISES on a failed write: logging the OSError and returning
    ``{"ok": True}`` would turn a full or read-only data home into a 200, clearing
    the panel's input for a reminder that is gone after a restart. A raise that
    reached aiohttp would be a bare 500 with no machine-readable ``code``.
    Putting it here also means a route added later cannot forget it.

    The enabled check the built-in made here is the gateway's now: its route
    registry serves these routes only while the app is enabled.
    """

    @wraps(handler)
    async def _wrapped(request: web.Request, ctx: Any = None) -> web.StreamResponse:
        if get_store() is None:
            return _unavailable(
                "crew-companion runtime not started", "runtime_not_started"
            )
        try:
            return await handler(request)
        except OSError:
            return _unavailable(
                "crew-companion could not save to disk", "store_write_failed"
            )

    return _wrapped


def _require_appearances(handler: Handler) -> Handler:
    """503 ``appearances_unavailable`` on a gateway without the pack library."""

    @wraps(handler)
    async def _wrapped(request: web.Request) -> web.StreamResponse:
        if not appearances_ready():
            return _unavailable(_host.NO_APPEARANCES, "appearances_unavailable")
        return await handler(request)

    return _wrapped


def _owner_write(operation: str, handler: Handler) -> CtxHandler:
    """A mutating route: the owner gate, then the runtime gate.

    The owner gate is the host's (``ctx.require_owner``), so it follows the same
    rule, audit and 403 ``owner_only`` as every other owner-gated route.
    """
    running = _require_running(handler)

    @wraps(handler)
    async def _wrapped(request: web.Request, ctx: Any = None) -> web.StreamResponse:
        denied = await _host.require_owner(ctx, request, operation)
        if denied is not None:
            return denied
        return await running(request, ctx)

    return _wrapped


async def _body(request: web.Request) -> dict[str, Any]:
    """Parse a JSON object body, treating anything else as empty."""
    try:
        parsed = await request.json()
    except ValueError:
        return {}
    return parsed if isinstance(parsed, dict) else {}


# ── reads ───────────────────────────────────────────────────────────────────


async def _handle_reminders_get(request: web.Request) -> web.StreamResponse:
    store = get_store()
    assert store is not None  # guaranteed by _require_enabled
    return web.json_response(await asyncio.to_thread(store.snapshot))


async def _handle_stats_get(request: web.Request) -> web.StreamResponse:
    store = get_store()
    assert store is not None
    return web.json_response(await asyncio.to_thread(store.stats_payload))


async def _handle_pending_get(request: web.Request) -> web.StreamResponse:
    """What the companion should say, for the overlay to draw as bubbles.

    ``since`` is the last sequence number the caller already showed. Reading is
    non-destructive, so a lost response or a second overlay on another display
    cannot make a reminder disappear.
    """
    store = get_store()
    assert store is not None
    raw = request.query.get("since", "0")
    try:
        since = max(0, int(raw))
    except ValueError:
        return _bad_request("since must be an integer", "invalid_cursor")
    return web.json_response(await asyncio.to_thread(store.drain, since))


# ── writes ──────────────────────────────────────────────────────────────────


def _text_error(text: Any) -> web.Response | None:
    if not isinstance(text, str) or not text.strip():
        return _bad_request("text is required", "text_required")
    if len(text) > _MAX_TEXT_CHARS:
        return _bad_request("text is too long", "text_too_long")
    return None


def _schedule_error(fire_at: Any, every: Any) -> web.Response | None:
    if not isinstance(fire_at, str) or not fire_at.strip():
        return _bad_request("fireAt is required", "fire_at_required")
    # A bounded range by comparison alone, never `math.isfinite` (it raises on a
    # 400-digit int): comparisons are total over every JSON number, `inf` and NaN
    # fail them, and the cap keeps `timedelta(minutes=...)` from overflowing.
    if every is not None and not (
        isinstance(every, (int, float))
        and not isinstance(every, bool)
        and 0 < every <= _MAX_RECURRENCE_MINUTES
    ):
        return _bad_request("everyMinutes must be a positive number", "invalid_recurrence")
    return None


async def _handle_add(request: web.Request) -> web.StreamResponse:
    """Store an already-resolved reminder.

    The natural-language parsing happens in the renderer, which POSTs a concrete
    ``fireAt`` — see the note in ``store.add``. A missing or unparsable time is a
    client error rather than something to guess at, because the one rule the
    parser must never break is inventing a time the user did not give.
    """
    store = get_store()
    assert store is not None
    body = await _body(request)

    text = body.get("text")
    fire_at = body.get("fireAt")
    every = body.get("everyMinutes")
    if (bad := _text_error(text)) is not None:
        return bad
    if (bad := _schedule_error(fire_at, every)) is not None:
        return bad

    try:
        result = await asyncio.to_thread(
            store.add, str(text), str(fire_at), int(every) if every else None
        )
    except ValueError as exc:
        return _bad_request(str(exc), "invalid_reminder")
    return web.json_response(result)


async def _handle_remove(request: web.Request) -> web.StreamResponse:
    store = get_store()
    assert store is not None
    ident = (await _body(request)).get("id")
    if not isinstance(ident, str) or not ident:
        return _bad_request("id is required", "id_required")
    return web.json_response(await asyncio.to_thread(store.remove, ident))


async def _handle_update(request: web.Request) -> web.StreamResponse:
    store = get_store()
    assert store is not None
    body = await _body(request)
    ident, text = body.get("id"), body.get("text")
    if not isinstance(ident, str) or not ident:
        return _bad_request("id is required", "id_required")
    if (bad := _text_error(text)) is not None:
        return bad
    result = await asyncio.to_thread(store.update, ident, str(text))
    if not result["ok"]:
        return web.json_response({"error": "not found", "code": "reminder_not_found"}, status=404)
    return web.json_response(result)


async def _handle_reschedule(request: web.Request) -> web.StreamResponse:
    """Set an existing reminder's schedule by hand; ``everyMinutes: null`` is one-time."""
    store = get_store()
    assert store is not None
    body = await _body(request)
    ident, fire_at, every = body.get("id"), body.get("fireAt"), body.get("everyMinutes")
    if not isinstance(ident, str) or not ident:
        return _bad_request("id is required", "id_required")
    if (bad := _schedule_error(fire_at, every)) is not None:
        return bad
    try:
        result = await asyncio.to_thread(
            store.reschedule, ident, str(fire_at), int(every) if every else None
        )
    except ValueError as exc:
        return _bad_request(str(exc), "invalid_reminder")
    if not result["ok"]:
        return web.json_response({"error": "not found", "code": "reminder_not_found"}, status=404)
    return web.json_response(result)


async def _handle_skip(request: web.Request) -> web.StreamResponse:
    store = get_store()
    assert store is not None
    ident = (await _body(request)).get("id")
    if not isinstance(ident, str) or not ident:
        return _bad_request("id is required", "id_required")
    return web.json_response(await asyncio.to_thread(store.skip, ident))


async def _handle_config(request: web.Request) -> web.StreamResponse:
    store = get_store()
    assert store is not None
    return web.json_response(
        await asyncio.to_thread(store.patch_config, await _body(request))
    )


async def _handle_presence(request: web.Request) -> web.StreamResponse:
    """The overlay reporting that the user is present.

    Break nudges are suppressed while nobody is there — nudging someone to
    stretch at a locked screen is pure noise. Reminders are unaffected: a time the
    user chose must still arrive, late, on their return.
    """
    store = get_store()
    assert store is not None
    return web.json_response(await asyncio.to_thread(store.note_presence))


async def _handle_breathing_done(request: web.Request) -> web.StreamResponse:
    """A guided exercise was COMPLETED — distinct from having been suggested."""
    store = get_store()
    assert store is not None
    return web.json_response(await asyncio.to_thread(store.note_breathing_session))


async def _handle_window(request: web.Request) -> web.StreamResponse:
    """Record a request to open one of the companion's windows (panel/gallery).

    The dashboard page has no preload bridge — those windows belong to the
    desktop main process and only the always-running overlay can open them. So
    the page records the intent here and the overlay carries it out when it next
    drains ``/pending``; see ``CompanionStore.queue_window_command``.
    """
    store = get_store()
    assert store is not None
    target = (await _body(request)).get("target")
    if target not in ("panel", "gallery"):
        return _bad_request("target must be 'panel' or 'gallery'", "invalid_window")
    return web.json_response(
        await asyncio.to_thread(store.queue_window_command, target)
    )


# ── Appearance packs ────────────────────────────────────────────────────────


async def _handle_appearances_get(request: web.Request) -> web.StreamResponse:
    """Every pack the gallery can offer, metadata only."""
    packs = await asyncio.to_thread(get_appearances().list_packs)
    return web.json_response({"packs": packs})


async def _handle_appearance_detail(request: web.Request) -> web.StreamResponse:
    """One pack with its art inlined, ready to render."""
    pack_id = request.query.get("id", "")
    detail = await asyncio.to_thread(get_appearances().pack_detail, pack_id)
    if detail is None:
        # Not found rather than a 400: an id that does not resolve is the normal
        # outcome of a pack the user just deleted, not a malformed request.
        return _bad_request("no such appearance pack", "pack_not_found")
    return web.json_response(detail)


async def _handle_appearance_colours(request: web.Request) -> web.StreamResponse:
    """Record a recolouring of a pack."""
    body = await _body(request)
    ok = await asyncio.to_thread(
        get_appearances().set_colour_map, body.get("id", ""), body.get("colorMap")
    )
    if not ok:
        return _bad_request("could not save those colours", "invalid_colour_map")
    return web.json_response({"ok": True})


async def _handle_appearance_delete(request: web.Request) -> web.StreamResponse:
    """Delete a custom pack. The built-in cannot be deleted."""
    body = await _body(request)
    ok = await asyncio.to_thread(get_appearances().delete_pack, body.get("id", ""))
    if not ok:
        return _bad_request("that pack cannot be deleted", "pack_not_deletable")
    return web.json_response({"ok": True})


async def _handle_appearance_save(request: web.Request) -> web.StreamResponse:
    """Create or replace a custom pack."""
    body = await _body(request)
    ok = await asyncio.to_thread(
        get_appearances().save_pack,
        body.get("id", ""),
        body.get("manifest"),
        body.get("files"),
    )
    if not ok:
        return _bad_request("could not save that pack", "invalid_pack")
    return web.json_response({"ok": True})


async def _handle_appearance_export(request: web.Request) -> web.StreamResponse:
    """Hand back a portable bundle for one pack."""
    pack_id = request.query.get("id", "")
    bundle = await asyncio.to_thread(_host.export_bundle, get_appearances(), pack_id)
    if bundle is None:
        return _bad_request("no such appearance pack", "pack_not_found")
    return web.json_response(bundle)


async def _handle_appearance_import(request: web.Request) -> web.StreamResponse:
    """Install a pack from an exported bundle."""
    body = await _body(request)
    result = await asyncio.to_thread(_host.import_bundle, get_appearances(), body.get("bundle"))
    if not result.get("ok"):
        return _bad_request(str(result.get("error", "import failed")), "invalid_bundle")
    return web.json_response(result)


async def _handle_appearance_save_sprite(request: web.Request) -> web.StreamResponse:
    """Save a pack whose art is a single sprite sheet."""
    body = await _body(request)
    result = await asyncio.to_thread(
        _host.save_sprite_pack,
        get_appearances(),
        body.get("id", ""),
        body.get("manifest"),
        body.get("spriteBase64"),
        body.get("filename", "sprites.png"),
    )
    if not result.get("ok"):
        return _bad_request(str(result.get("error", "save failed")), "invalid_pack")
    return web.json_response(result)


async def _handle_petdex_fetch(request: web.Request) -> web.StreamResponse:
    """Look a pet up on PetDex.

    Reaches the public internet, which nothing else in this app does — so it stays
    behind the same enable gate as every other route, and the host it may contact is
    pinned in ``pack_transfer``.
    """
    body = await _body(request)
    result = await asyncio.to_thread(_host.fetch_petdex_pet, body.get("input", ""))
    if not result.get("ok"):
        # A miss or an unreachable registry is an expected outcome the dialog shows,
        # not a client error, so this is a 200 carrying ok:false.
        return web.json_response(result)
    return web.json_response(result)


def _read(handler: Handler) -> CtxHandler:
    return _require_running(handler)


def register_routes(ctx: Any) -> list[Route]:
    """The routes the gateway's ``RouteRegistry`` serves under ``/api/apps/crew-companion``."""
    gallery = _require_appearances
    return [
        Route("GET", "/reminders", _read(_handle_reminders_get)),
        Route("POST", "/reminders/add", _owner_write("reminders_add", _handle_add)),
        Route("POST", "/reminders/remove", _owner_write("reminders_remove", _handle_remove)),
        Route("POST", "/reminders/skip", _owner_write("reminders_skip", _handle_skip)),
        Route("POST", "/reminders/update", _owner_write("reminders_update", _handle_update)),
        Route(
            "POST",
            "/reminders/reschedule",
            _owner_write("reminders_reschedule", _handle_reschedule),
        ),
        Route("POST", "/reminders/config", _owner_write("reminders_config", _handle_config)),
        Route("GET", "/stats", _read(_handle_stats_get)),
        Route("GET", "/pending", _read(_handle_pending_get)),
        Route("POST", "/presence", _owner_write("presence", _handle_presence)),
        Route("GET", "/appearances", _read(gallery(_handle_appearances_get))),
        Route("GET", "/appearances/export", _read(gallery(_handle_appearance_export))),
        Route(
            "POST",
            "/appearances/import",
            _owner_write("appearances_import", gallery(_handle_appearance_import)),
        ),
        Route(
            "POST",
            "/appearances/save-sprite",
            _owner_write("appearances_save_sprite", gallery(_handle_appearance_save_sprite)),
        ),
        Route("POST", "/petdex/fetch", _owner_write("petdex_fetch", gallery(_handle_petdex_fetch))),
        Route("GET", "/appearances/detail", _read(gallery(_handle_appearance_detail))),
        Route(
            "POST",
            "/appearances/colours",
            _owner_write("appearances_colours", gallery(_handle_appearance_colours)),
        ),
        Route(
            "POST",
            "/appearances/delete",
            _owner_write("appearances_delete", gallery(_handle_appearance_delete)),
        ),
        Route(
            "POST",
            "/appearances/save",
            _owner_write("appearances_save", gallery(_handle_appearance_save)),
        ),
        Route("POST", "/breathing-done", _owner_write("breathing_done", _handle_breathing_done)),
        Route("POST", "/window", _owner_write("window", _handle_window)),
    ]
