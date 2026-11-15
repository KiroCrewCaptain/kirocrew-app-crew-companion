"""A stand-in for the Kiro Crew gateway, so the tests need no Kiro Crew install.

``backend/_host.py`` resolves every host module through one function,
``_host._host_attr(module, name)``. :class:`FakeHost` answers it from a table of
small, offline implementations; a test that needs a different host (one without
the appearance-pack library) edits the table through the ``fake_host`` fixture.

These fakes stand in for the host's code, they do not re-implement it: the
appearance store keeps packs in a dict, and the transfer functions record what
they were handed. What the tests check is that Crew Companion routes every
gallery call through the host and answers as the built-in did with the host's
result. The pack validation itself is tested in Kiro Crew.

:class:`FakeCtx` is the ``AppContext`` the gateway hands the hooks, with the
fields Crew Companion reads.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from pathlib import Path
from typing import Any, Callable

from aiohttp import web

OWNER = "owner-1"


class FakeAppearanceStore:
    """``kiro_crew.appearance_packs.store.AppearanceStore`` with the calls the routes make."""

    BUILTIN = "kiro-ghost"

    def __init__(self, data_dir: Path) -> None:
        self.data_dir = Path(data_dir)
        self.packs: dict[str, dict[str, Any]] = {}
        self.colour_maps: dict[str, Any] = {}
        self.loaded = False

    def load(self) -> None:
        self.loaded = True

    def list_packs(self) -> list[dict[str, Any]]:
        return [{"id": self.BUILTIN, "name": "Kiro"}] + [
            {"id": ident, "name": ident} for ident in sorted(self.packs)
        ]

    def pack_detail(self, pack_id: str) -> dict[str, Any] | None:
        if pack_id == self.BUILTIN:
            return {"id": self.BUILTIN, "animations": {}}
        return dict(self.packs[pack_id]) if pack_id in self.packs else None

    def pack_exists(self, pack_id: str) -> bool:
        return pack_id == self.BUILTIN or pack_id in self.packs

    def set_colour_map(self, pack_id: Any, colour_map: Any) -> bool:
        if not isinstance(pack_id, str) or not isinstance(colour_map, dict):
            return False
        self.colour_maps[pack_id] = colour_map
        return True

    def delete_pack(self, pack_id: Any) -> bool:
        return self.packs.pop(pack_id, None) is not None if isinstance(pack_id, str) else False

    def save_pack(self, pack_id: Any, manifest: Any, files: Any) -> bool:
        if not isinstance(pack_id, str) or not pack_id or not isinstance(manifest, dict):
            return False
        self.packs[pack_id] = {"id": pack_id, "manifest": manifest, "files": files}
        return True


@dataclass
class FakeTransfer:
    """``kiro_crew.appearance_packs.transfer``: records each call."""

    calls: list[tuple[str, Any]] = field(default_factory=list)
    petdex_answer: dict[str, Any] = field(
        default_factory=lambda: {"ok": False, "error": "offline in tests"}
    )

    def export_bundle(self, store: FakeAppearanceStore, pack_id: str) -> Any:
        self.calls.append(("export", pack_id))
        if not store.pack_exists(pack_id):
            return None
        return {"kind": "crew-companion-pack", "version": 1, "id": pack_id}

    def import_bundle(self, store: FakeAppearanceStore, bundle: Any) -> dict[str, Any]:
        self.calls.append(("import", bundle))
        if not isinstance(bundle, dict) or bundle.get("refuse"):
            return {"ok": False, "error": "refused by the host"}
        ident = str(bundle.get("id", ""))
        store.packs[ident] = {"id": ident}
        return {"ok": True, "id": ident}

    def save_sprite_pack(self, store: FakeAppearanceStore, *args: Any) -> dict[str, Any]:
        self.calls.append(("save-sprite", args))
        pack_id = args[0] if args else ""
        if not isinstance(pack_id, str) or not pack_id:
            return {"ok": False, "error": "a pack needs an id"}
        store.packs[pack_id] = {"id": pack_id}
        return {"ok": True, "packId": pack_id}

    def fetch_petdex_pet(self, user_input: Any) -> dict[str, Any]:
        self.calls.append(("petdex", user_input))
        return dict(self.petdex_answer)


class FakeHost:
    """The gateway modules ``_host`` resolves, answered from a table."""

    def __init__(self) -> None:
        self.transfer = FakeTransfer()
        self.stores: list[FakeAppearanceStore] = []

        def make_store(data_dir: Path) -> FakeAppearanceStore:
            store = FakeAppearanceStore(data_dir)
            self.stores.append(store)
            return store

        self.table: dict[tuple[str, str], Any] = {
            ("kiro_crew.appearance_packs.store", "AppearanceStore"): make_store,
        }
        for name in ("export_bundle", "import_bundle", "save_sprite_pack", "fetch_petdex_pet"):
            self.table[("kiro_crew.appearance_packs.transfer", name)] = getattr(
                self.transfer, name
            )

    def attr(self, module: str, name: str) -> Any | None:
        return self.table.get((module, name))

    def without_appearances(self) -> None:
        for key in list(self.table):
            if key[0].startswith("kiro_crew.appearance_packs"):
                del self.table[key]


class FakeBus:
    """``ctx.events``: records what the app publishes."""

    def __init__(self) -> None:
        self.published: list[str] = []

    def publish(self, event: str, data: Any = None) -> None:
        self.published.append(event)


@dataclass
class FakeCtx:
    """The ``AppContext`` fields Crew Companion reads."""

    data_dir: Path
    events: Any = None
    owner_id: str = OWNER
    denials: list[str] = field(default_factory=list)
    require_owner: Callable[..., Any] | None = None

    def __post_init__(self) -> None:
        if self.require_owner is None:
            self.require_owner = self._require_owner

    async def _require_owner(self, request: web.Request, operation: str) -> web.Response | None:
        """The host gate: the dashboard owner's own session only, never an app token."""
        if request.get("user") == self.owner_id and not request.get("app"):
            return None
        self.denials.append(operation)
        return web.json_response(
            {"error": "owner authorization required", "code": "owner_only"}, status=403
        )
