"""The HTTP surface and the lifecycle hooks.

The point of these tests is the thing the previous shape got wrong: that enabling
the app is sufficient to make it work. There is no separate process to launch, so
"enabled" and "working" are the same state, and these assertions are what hold
that true.

The routes are the records ``register_routes(ctx)`` hands the gateway's route
registry, mounted here on a plain aiohttp app that calls each handler as the
registry does, ``handler(request, ctx)``. The registry serves them only while the
app is enabled, so the built-in's own disabled answer (403 ``app_disabled``) is
the gateway's to give now (404); what stays here is the runtime and owner gates.
"""

from __future__ import annotations

from datetime import datetime, timedelta
from types import SimpleNamespace

import pytest
from aiohttp import web
from aiohttp.test_utils import TestClient, TestServer
from fakehost import OWNER, FakeAppearanceStore, FakeCtx

from backend import hooks, routes, runtime
from backend.reminders import parse_iso, to_iso
from backend.store import CompanionStore

BASE = "/api/apps/crew-companion"
NOW = parse_iso("2026-07-31T14:00:00")
NON_OWNER = "slack-allowlisted-2"


@pytest.fixture()
def enabled():
    """The registry serves the routes only while the app is enabled; it is, here."""


@pytest.fixture()
def store(tmp_path, monkeypatch):
    s = CompanionStore(tmp_path, rand=lambda: 0.0, now=lambda: NOW)
    s.load()
    monkeypatch.setattr(runtime, "store", s)
    return s


async def _client(ctx: FakeCtx | None = None) -> TestClient:
    @web.middleware
    async def _identity(request, handler):
        # Stand-in for token_auth: the signed claims the owner gate reads. A
        # request with no test headers is the dashboard owner.
        request["user"] = request.headers.get("X-Test-User", OWNER)
        request["app"] = request.headers.get("X-Test-App", "")
        return await handler(request)

    bound = ctx or FakeCtx(data_dir=None)
    app = web.Application(middlewares=[_identity])
    for route in routes.register_routes(bound):

        async def _dispatch(request, _handler=route.handler):
            return await _handler(request, bound)

        app.router.add_route(route.method, BASE + route.path, _dispatch)
    client = TestClient(TestServer(app))
    await client.start_server()
    return client


EVERY_ROUTE = [
    ("get", "/reminders"),
    ("get", "/stats"),
    ("get", "/pending"),
    ("post", "/reminders/add"),
    ("post", "/reminders/remove"),
    ("post", "/reminders/skip"),
    ("post", "/reminders/update"),
    ("post", "/reminders/reschedule"),
    ("post", "/reminders/config"),
    ("post", "/presence"),
    ("post", "/breathing-done"),
    ("post", "/window"),
    ("get", "/appearances"),
    ("get", "/appearances/export"),
    ("get", "/appearances/detail"),
    ("post", "/appearances/colours"),
    ("post", "/appearances/delete"),
    ("post", "/appearances/save"),
    ("post", "/appearances/import"),
    ("post", "/appearances/save-sprite"),
    ("post", "/petdex/fetch"),
]


# ── the runtime gate ────────────────────────────────────────────────────────


class TestGate:
    def test_the_route_table_is_the_built_ins(self):
        """The same methods and paths the built-in mounted, relative to its base."""
        table = sorted((r.method.lower(), r.path) for r in routes.register_routes(None))
        assert table == sorted(EVERY_ROUTE)

    @pytest.mark.asyncio
    async def test_enabled_but_not_started_answers_503_not_500(
        self, enabled, monkeypatch
    ):
        """'Not up yet' is a different answer from 'broken', and only one of them
        is worth retrying — so the runtime being absent must not read as a crash."""
        monkeypatch.setattr(runtime, "store", None)
        client = await _client()
        try:
            r = await client.get(f"{BASE}/reminders")
            assert r.status == 503
            assert (await r.json())["code"] == "runtime_not_started"
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_enabled_and_started_serves_the_payload(self, enabled, store):
        client = await _client()
        try:
            r = await client.get(f"{BASE}/reminders")
            assert r.status == 200
            body = await r.json()
            # The camelCase shape the existing renderer already expects.
            assert set(body) >= {
                "reminders",
                "breakNudgesEnabled",
                "sessionNotificationsEnabled",
                "breakReminderMins",
            }
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_every_route_is_gated(self, monkeypatch):
        """A route added without the runtime gate is the hole this pins shut."""
        monkeypatch.setattr(runtime, "store", None)
        client = await _client()
        try:
            for method, path in EVERY_ROUTE:
                r = await getattr(client, method)(BASE + path, json={})
                assert r.status == 503, f"{method.upper()} {path} was not gated"
                assert (await r.json())["code"] == "runtime_not_started"
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_a_host_without_the_avatar_library_answers_503_on_the_gallery(
        self, fake_host, store
    ):
        fake_host.without_appearances()
        client = await _client()
        try:
            r = await client.get(f"{BASE}/appearances")
            assert r.status == 503
            assert (await r.json())["code"] == "appearances_unavailable"
            # Reminders keep working without it.
            assert (await client.get(f"{BASE}/reminders")).status == 200
        finally:
            await client.close()


# ── the owner gate ──────────────────────────────────────────────────────────

# Every route that writes, with a body that would succeed for the owner.
MUTATING = [
    ("/reminders/add", {"text": "approve the pending tool call", "fireAt": "2026-07-31T14:01:00Z"}),
    ("/reminders/remove", {"id": "r-owner"}),
    ("/reminders/skip", {"id": "r-owner"}),
    ("/reminders/update", {"id": "r-owner", "text": "edited by someone else"}),
    ("/reminders/reschedule", {"id": "r-owner", "fireAt": "2026-07-31T14:01:00Z"}),
    ("/reminders/config", {"sessionNotificationsEnabled": False}),
    ("/presence", {}),
    ("/breathing-done", {}),
    ("/window", {"target": "panel"}),
    ("/appearances/colours", {"id": "default", "colorMap": {}}),
    ("/appearances/delete", {"id": "owner-pack"}),
    ("/appearances/save", {"id": "x", "manifest": {}, "files": {}}),
    ("/appearances/import", {"bundle": {}}),
    ("/appearances/save-sprite", {"id": "x", "manifest": {}, "spriteBase64": ""}),
    ("/petdex/fetch", {"input": "some-pet"}),
]

READS = [
    "/reminders",
    "/stats",
    "/pending",
    "/appearances",
    "/appearances/detail?id=kiro-ghost",
]


@pytest.fixture()
def gated(enabled, store, tmp_path, monkeypatch, fake_host):
    """An enabled, started companion with no network and a recorded petdex call."""
    appearances = FakeAppearanceStore(tmp_path)
    appearances.load()
    monkeypatch.setattr(runtime, "appearances", appearances)
    calls = fake_host.transfer.calls

    def petdex_calls():
        return [value for kind, value in calls if kind == "petdex"]

    return SimpleNamespace(store=store, petdex=petdex_calls, host=fake_host)


class TestOwnerGate:
    @pytest.mark.asyncio
    @pytest.mark.parametrize("path,body", MUTATING, ids=[p for p, _ in MUTATING])
    async def test_non_owner_dashboard_subject_is_refused(self, gated, path, body):
        client = await _client()
        try:
            r = await client.post(BASE + path, json=body, headers={"X-Test-User": NON_OWNER})
            assert r.status == 403, f"non-owner reached {path}: HTTP {r.status}"
            assert (await r.json())["code"] == "owner_only"
            assert gated.petdex() == []
        finally:
            await client.close()

    @pytest.mark.asyncio
    @pytest.mark.parametrize("path,body", MUTATING, ids=[p for p, _ in MUTATING])
    async def test_own_app_token_is_refused(self, gated, path, body):
        """No companion caller holds an app token, so its own is refused too."""
        client = await _client()
        try:
            r = await client.post(
                BASE + path,
                json=body,
                headers={"X-Test-User": "crew-companion", "X-Test-App": "crew-companion"},
            )
            assert r.status == 403, f"app token reached {path}: HTTP {r.status}"
            assert (await r.json())["code"] == "owner_only"
            assert gated.petdex() == []
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_non_owner_cannot_silence_session_notifications(self, gated):
        client = await _client()
        try:
            await client.post(
                f"{BASE}/reminders/config",
                json={"sessionNotificationsEnabled": False},
                headers={"X-Test-User": NON_OWNER},
            )
            assert gated.store.snapshot()["sessionNotificationsEnabled"] is True
        finally:
            await client.close()

    @pytest.mark.asyncio
    @pytest.mark.parametrize("path,body", MUTATING, ids=[p for p, _ in MUTATING])
    async def test_owner_reaches_every_mutating_route(self, gated, path, body):
        """The owner passes the gate: no route answers ``owner_only`` to them."""
        client = await _client()
        try:
            r = await client.post(BASE + path, json=body)
            assert r.status != 403, f"owner refused at {path}: HTTP {r.status}"
        finally:
            await client.close()
        if path == "/petdex/fetch":
            assert gated.petdex() == ["some-pet"]

    @pytest.mark.asyncio
    @pytest.mark.parametrize("path", READS)
    async def test_non_owner_reads_keep_working(self, gated, path):
        client = await _client()
        try:
            r = await client.get(BASE + path, headers={"X-Test-User": NON_OWNER})
            assert r.status == 200, f"read {path} changed: HTTP {r.status}"
        finally:
            await client.close()


# ── the gallery goes through the host ───────────────────────────────────────


class TestAppearanceHost:
    """Every gallery call is the host's appearance-pack library, never a copy.

    The bundle checks (art the manifest names but the bundle does not carry, two
    spellings of one file name) are the host's ``import_bundle``, the same code
    the dashboard's own import runs; here the route only has to refuse what the
    host refuses, with the built-in's status and code.
    """

    @pytest.mark.asyncio
    async def test_a_bundle_the_host_refuses_is_refused_here(self, gated):
        client = await _client()
        try:
            r = await client.post(
                f"{BASE}/appearances/import", json={"bundle": {"id": "bad", "refuse": True}}
            )
            assert r.status == 400, await r.text()
            assert (await r.json())["code"] == "invalid_bundle"
        finally:
            await client.close()
        assert not hooks.get_appearances().pack_exists("bad")

    @pytest.mark.asyncio
    async def test_a_bundle_the_host_accepts_installs(self, gated):
        client = await _client()
        try:
            r = await client.post(f"{BASE}/appearances/import", json={"bundle": {"id": "good-pack"}})
            assert r.status == 200, await r.text()
            assert (await r.json())["ok"] is True
        finally:
            await client.close()
        assert hooks.get_appearances().pack_exists("good-pack")
        assert ("import", {"id": "good-pack"}) in gated.host.transfer.calls

    @pytest.mark.asyncio
    async def test_list_detail_and_export_read_the_host_store(self, gated):
        client = await _client()
        try:
            r = await client.get(f"{BASE}/appearances")
            assert [p["id"] for p in (await r.json())["packs"]] == ["kiro-ghost"]
            r = await client.get(f"{BASE}/appearances/detail?id=nope")
            assert r.status == 400 and (await r.json())["code"] == "pack_not_found"
            r = await client.get(f"{BASE}/appearances/export?id=kiro-ghost")
            assert (await r.json())["kind"] == "crew-companion-pack"
        finally:
            await client.close()


# ── reminders round trip ────────────────────────────────────────────────────


class TestReminderRoundTrip:
    @pytest.mark.asyncio
    async def test_add_then_list_then_remove(self, enabled, store):
        client = await _client()
        try:
            fire_at = to_iso(NOW + timedelta(hours=1))
            r = await client.post(
                f"{BASE}/reminders/add", json={"text": "drink water", "fireAt": fire_at}
            )
            assert r.status == 200
            ident = (await r.json())["id"]

            rows = (await (await client.get(f"{BASE}/reminders")).json())["reminders"]
            assert [x["text"] for x in rows] == ["drink water"]

            r = await client.post(f"{BASE}/reminders/remove", json={"id": ident})
            assert (await r.json())["ok"] is True
            rows = (await (await client.get(f"{BASE}/reminders")).json())["reminders"]
            assert rows == []
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_update_changes_only_the_text(self, enabled, store):
        client = await _client()
        try:
            fire_at = to_iso(NOW + timedelta(hours=1))
            r = await client.post(
                f"{BASE}/reminders/add",
                json={"text": "drink watr", "fireAt": fire_at, "everyMinutes": 60},
            )
            ident = (await r.json())["id"]

            r = await client.post(
                f"{BASE}/reminders/update", json={"id": ident, "text": "  drink water "}
            )
            assert r.status == 200
            assert (await r.json())["ok"] is True
            [row] = (await (await client.get(f"{BASE}/reminders")).json())["reminders"]
            assert row["text"] == "drink water"
            assert row["fireAt"] == fire_at
            assert row["recurrence"] == {"everyMinutes": 60}
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_update_rejects_empty_text_and_unknown_ids(self, enabled, store):
        client = await _client()
        try:
            r = await client.post(f"{BASE}/reminders/add", json={"text": "a", "fireAt": to_iso(NOW)})
            ident = (await r.json())["id"]
            r = await client.post(f"{BASE}/reminders/update", json={"id": ident, "text": " "})
            assert r.status == 400
            assert (await r.json())["code"] == "text_required"
            r = await client.post(
                f"{BASE}/reminders/update", json={"id": ident, "text": "x" * 501}
            )
            assert (await r.json())["code"] == "text_too_long"
            r = await client.post(f"{BASE}/reminders/update", json={"text": "b"})
            assert (await r.json())["code"] == "id_required"
            r = await client.post(f"{BASE}/reminders/update", json={"id": "nope", "text": "b"})
            assert r.status == 404
            assert (await r.json())["code"] == "reminder_not_found"
            rows = (await (await client.get(f"{BASE}/reminders")).json())["reminders"]
            assert [x["text"] for x in rows] == ["a"]
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_reschedule_keeps_the_reminder_and_replaces_its_schedule(
        self, enabled, store
    ):
        client = await _client()
        try:
            r = await client.post(
                f"{BASE}/reminders/add",
                json={"text": "draw", "fireAt": to_iso(NOW), "everyMinutes": 60},
            )
            ident = (await r.json())["id"]
            daily_at = "2026-08-01T07:30:00.000Z"

            r = await client.post(
                f"{BASE}/reminders/reschedule",
                json={"id": ident, "fireAt": daily_at, "everyMinutes": 1440},
            )
            assert r.status == 200
            [row] = (await (await client.get(f"{BASE}/reminders")).json())["reminders"]
            assert (row["id"], row["text"], row["fireAt"]) == (ident, "draw", daily_at)
            assert row["recurrence"] == {"everyMinutes": 1440}

            r = await client.post(
                f"{BASE}/reminders/reschedule",
                json={"id": ident, "fireAt": daily_at, "everyMinutes": None},
            )
            [row] = (await (await client.get(f"{BASE}/reminders")).json())["reminders"]
            assert row["recurrence"] is None

            r = await client.post(
                f"{BASE}/reminders/reschedule", json={"id": "nope", "fireAt": daily_at}
            )
            assert r.status == 404
            r = await client.post(f"{BASE}/reminders/reschedule", json={"id": ident})
            assert (await r.json())["code"] == "fire_at_required"
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_a_recurring_reminder_can_be_skipped(self, enabled, store):
        client = await _client()
        try:
            fire_at = to_iso(NOW + timedelta(minutes=30))
            ident = (
                await (
                    await client.post(
                        f"{BASE}/reminders/add",
                        json={"text": "stretch", "fireAt": fire_at, "everyMinutes": 60},
                    )
                ).json()
            )["id"]

            r = await client.post(f"{BASE}/reminders/skip", json={"id": ident})
            body = await r.json()
            assert body["ok"] is True
            assert parse_iso(body["fireAt"]) > NOW + timedelta(minutes=30)
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_skipping_a_one_time_reminder_is_refused_not_silently_ignored(
        self, enabled, store
    ):
        client = await _client()
        try:
            ident = (
                await (
                    await client.post(
                        f"{BASE}/reminders/add",
                        json={"text": "once", "fireAt": to_iso(NOW + timedelta(hours=2))},
                    )
                ).json()
            )["id"]
            body = await (
                await client.post(f"{BASE}/reminders/skip", json={"id": ident})
            ).json()
            assert body == {"ok": False, "reason": "not-recurring"}
        finally:
            await client.close()


# ── input validation ────────────────────────────────────────────────────────


class TestValidation:
    @pytest.mark.asyncio
    async def test_a_missing_time_is_rejected_rather_than_guessed(self, enabled, store):
        """The one rule the parser must never break is inventing a time the user
        did not give. The backend holds the same line rather than defaulting."""
        client = await _client()
        try:
            r = await client.post(f"{BASE}/reminders/add", json={"text": "no time"})
            assert r.status == 400
            assert (await r.json())["code"] == "fire_at_required"
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_empty_text_is_rejected(self, enabled, store):
        client = await _client()
        try:
            r = await client.post(
                f"{BASE}/reminders/add", json={"text": "   ", "fireAt": to_iso(NOW)}
            )
            assert r.status == 400
            assert (await r.json())["code"] == "text_required"
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_a_nonsense_recurrence_is_rejected(self, enabled, store):
        client = await _client()
        try:
            r = await client.post(
                f"{BASE}/reminders/add",
                json={"text": "x", "fireAt": to_iso(NOW), "everyMinutes": -5},
            )
            assert r.status == 400
            assert (await r.json())["code"] == "invalid_recurrence"
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_a_non_finite_recurrence_is_rejected_not_a_500(self, enabled, store):
        """Infinity passes `> 0`, and `int(inf)` then raised an uncaught
        OverflowError — a crafted 1e309 crashed the request with a 500
        instead of a validation reply. JSON has no literal Infinity, but
        1e309 parses to it."""
        client = await _client()
        try:
            r = await client.post(
                f"{BASE}/reminders/add",
                data=b'{"text": "x", "fireAt": "%s", "everyMinutes": 1e309}'
                % to_iso(NOW).encode(),
                headers={"Content-Type": "application/json"},
            )
            assert r.status == 400
            assert (await r.json())["code"] == "invalid_recurrence"
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_a_huge_integer_recurrence_is_rejected_not_a_500(self, enabled, store):
        """A 400-digit integer parses as an exact Python int — it is positive
        and finite, but `math.isfinite` itself raises OverflowError on an int
        too large for a float, so the previous guard crashed on exactly the
        input it was added to reject. The bounded range check rejects it with
        a clean 400."""
        client = await _client()
        try:
            r = await client.post(
                f"{BASE}/reminders/add",
                data=b'{"text": "x", "fireAt": "%s", "everyMinutes": %s}'
                % (to_iso(NOW).encode(), b"9" * 400),
                headers={"Content-Type": "application/json"},
            )
            assert r.status == 400
            assert (await r.json())["code"] == "invalid_recurrence"
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_a_bad_cursor_is_rejected(self, enabled, store):
        client = await _client()
        try:
            r = await client.get(f"{BASE}/pending?since=abc")
            assert r.status == 400
            assert (await r.json())["code"] == "invalid_cursor"
        finally:
            await client.close()

    @pytest.mark.asyncio
    async def test_malformed_json_does_not_500(self, enabled, store):
        client = await _client()
        try:
            r = await client.post(
                f"{BASE}/reminders/add",
                data="{not json",
                headers={"Content-Type": "application/json"},
            )
            assert r.status == 400
        finally:
            await client.close()


# ── the delivery endpoint the overlay polls ─────────────────────────────────


class TestPending:
    @pytest.mark.asyncio
    async def test_a_fired_reminder_appears_and_the_cursor_advances(
        self, enabled, store
    ):
        client = await _client()
        try:
            await client.post(
                f"{BASE}/reminders/add",
                json={"text": "water", "fireAt": to_iso(NOW - timedelta(minutes=1))},
            )
            store.tick()

            body = await (await client.get(f"{BASE}/pending?since=0")).json()
            assert [f["kind"] for f in body["fires"]] == ["reminder"]
            assert body["cursor"] >= 1

            # Past the cursor there is nothing new — but the item was not consumed.
            after = await (
                await client.get(f"{BASE}/pending?since={body['cursor']}")
            ).json()
            assert after["fires"] == []
            again = await (await client.get(f"{BASE}/pending?since=0")).json()
            assert len(again["fires"]) == 1
        finally:
            await client.close()


# ── lifecycle hooks ─────────────────────────────────────────────────────────


class TestHooks:
    @pytest.mark.asyncio
    async def test_startup_builds_a_runtime_and_shutdown_stops_it(self, tmp_path):
        ctx = SimpleNamespace(data_dir=str(tmp_path))
        assert hooks.get_store() is None
        await hooks.on_startup(ctx)
        assert hooks.get_store() is not None
        await hooks.on_shutdown(ctx)
        # Deliberately KEPT, so a re-enable resumes with accumulated stats rather
        # than starting from zero.
        assert hooks.get_store() is not None

    @pytest.mark.asyncio
    async def test_startup_is_idempotent_and_does_not_build_a_second_runtime(
        self, tmp_path
    ):
        """Two runtimes would double-fire every reminder."""
        ctx = SimpleNamespace(data_dir=str(tmp_path))
        await hooks.on_startup(ctx)
        first = hooks.get_store()
        await hooks.on_startup(ctx)
        assert hooks.get_store() is first
        await hooks.on_shutdown(ctx)

    @pytest.mark.asyncio
    async def test_shutdown_before_startup_is_harmless(self, tmp_path):
        await hooks.on_shutdown(SimpleNamespace(data_dir=str(tmp_path)))

    @pytest.mark.asyncio
    async def test_a_reminder_added_before_disable_survives_re_enable(self, tmp_path):
        ctx = SimpleNamespace(data_dir=str(tmp_path))
        await hooks.on_startup(ctx)
        store = hooks.get_store()
        assert store is not None
        # Anchored to the REAL clock, not the frozen NOW literal: unlike the
        # `store` fixture, the store `on_startup` builds gets the default
        # real-time clock, and its 1s tick fires anything already due. An
        # instant relative to NOW is in the past, so the reminder would be
        # fired and dropped whenever the tick beat the snapshot below.
        future = datetime.now().astimezone() + timedelta(hours=3)
        store.add("persisted", to_iso(future))

        await hooks.on_shutdown(ctx)
        await hooks.on_startup(ctx)

        rows = hooks.get_store().snapshot()["reminders"]  # type: ignore[union-attr]
        assert [r["text"] for r in rows] == ["persisted"]
        await hooks.on_shutdown(ctx)
