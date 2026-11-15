"""What an existing user's copy of the built-in needs from this repository.

Kiro Crew adopts a user's built-in record onto this repository in place, at a
pinned commit, with no consent dialog, so the tree must be something it can take
over unchanged:

- the same name, permissions, platform and ``defaultEnabled`` as the built-in
  (``tests/fixtures/builtin-app.json`` is its manifest at the commit this was
  ported from). A widened grant would be held back or force the app off, and
  adoption refuses that. The version may move forward, never back: adoption reads
  the manifest at the commit Kiro Crew pins, and a later release here reaches the
  adopted record as an update;
- the desktop windows the built-in's main-process code drew, declared for the
  desktop shell to host: the avatar on every display, the hidden notification
  owner, the panel and the gallery, at the built-in's sizes;
- nothing that needs a build at install time, and no symlinks or file names a
  Windows checkout cannot hold;
- committed UI bundles that import only the seven modules the dashboard provides
  and their own chunks, and from the two SDK modules only names every supported
  host exports (a named import of a missing export fails the whole bundle at load).
"""

from __future__ import annotations

import json
import os
import re
import unittest
from pathlib import Path

APP_ROOT = Path(__file__).resolve().parents[1]
DIST = APP_ROOT / "ui" / "dist"

HOST_MODULES = {
    "react",
    "react-dom",
    "react/jsx-runtime",
    "lucide-react",
    "@tanstack/react-query",
    "@kirocrew/app-sdk",
    "@kirocrew/app-sdk/ui",
}

# What a host BEFORE App Kit level 1 exports from each SDK module (its
# public/vendor/*.mjs stubs). A named import from these modules must stay in this
# set; a newer name is read off a namespace import behind an `in` check.
LEVEL0_EXPORTS = {
    "@kirocrew/app-sdk": {
        "useAppApi",
        "useAppEvents",
        "useTheme",
        "useAppInfo",
        "useNavigate",
        "useNotify",
        "useNavBadge",
        "useChatLauncher",
        "AppApiProvider",
        "useImeGuard",
        "useLanguageGeneration",
        "activeLocale",
        "fmtNumber",
        "fmtDate",
        "fmtTime",
        "fmtDateTime",
        "fmtRelative",
        "compareText",
    },
    "@kirocrew/app-sdk/ui": {
        "Card",
        "CardTitle",
        "Btn",
        "SendBtn",
        "Input",
        "SearchInput",
        "Badge",
        "SourceBadge",
        "StatCard",
        "Skeleton",
        "ContentSkeleton",
        "EmptyState",
        "PageHeader",
        "Toggle",
        "InfoTip",
        "SegmentedControl",
        "MarkdownRenderer",
        "Clickable",
        "Modal",
        "ErrorNotice",
        "SettingsSection",
        "SettingsCard",
        "SettingsInput",
        "SettingsToggle",
        "SettingsSelect",
    },
}

# The built-in's windows (website/electron/crew-companion/ in Kiro Crew): the
# panel card is 320x340 inside a 32 px transparent margin, the gallery 760x560
# inside 24 px.
EXPECTED_WINDOWS = [
    {"id": "pet", "entry": "dist/pet.mjs", "kind": "overlay", "displays": "all", "openOnEnable": True},
    {"id": "notifier", "entry": "dist/notifier.mjs", "kind": "background", "openOnEnable": True},
    {
        "id": "panel",
        "entry": "dist/panel.mjs",
        "kind": "panel",
        "width": 320 + 2 * 32,
        "height": 340 + 2 * 32,
        "position": "bottom-right",
        "transparent": True,
        "gutter": 32,
    },
    {
        "id": "gallery",
        "entry": "dist/gallery.mjs",
        "kind": "panel",
        "width": 760 + 2 * 24,
        "height": 560 + 2 * 24,
        "position": "center",
        "transparent": True,
        "gutter": 24,
    },
]

# Directories git ignores here (see .gitignore): never part of a clone.
_UNTRACKED_DIRS = {".git", "node_modules", "__pycache__", ".pytest_cache", ".venv"}
_WINDOWS_RESERVED = re.compile(r"^(con|prn|aux|nul|com[1-9]|lpt[1-9])$", re.IGNORECASE)
_STATIC_IMPORT = re.compile(
    r"^(?:import|export)\s+(?:(?P<clause>[^'\"]+?)\s+from\s+)?[\"'](?P<spec>[^\"']+)[\"'];?\s*$",
    re.MULTILINE,
)


def _manifest() -> dict:
    return json.loads((APP_ROOT / "app.json").read_text(encoding="utf-8"))


def _builtin() -> dict:
    return json.loads((APP_ROOT / "tests" / "fixtures" / "builtin-app.json").read_text("utf-8"))


def _bundles() -> list[Path]:
    return sorted(DIST.rglob("*.mjs"))


def _imports(path: Path) -> list[tuple[str, str]]:
    text = path.read_text(encoding="utf-8")
    return [(m["spec"], (m["clause"] or "").strip()) for m in _STATIC_IMPORT.finditer(text)]


def _named(clause: str) -> set[str]:
    """The imported names of ``{ a, b as c }``; empty for a namespace import."""
    match = re.search(r"\{([^}]*)\}", clause)
    if not match:
        return set()
    return {part.split(" as ")[0].strip() for part in match.group(1).split(",") if part.strip()}


def _tree() -> list[Path]:
    files: list[Path] = []
    for dirpath, dirnames, filenames in os.walk(APP_ROOT):
        dirnames[:] = [d for d in dirnames if d not in _UNTRACKED_DIRS]
        files += [Path(dirpath) / name for name in filenames]
        files += [Path(dirpath) / d for d in dirnames if (Path(dirpath) / d).is_symlink()]
    return files


class TestTheBundles(unittest.TestCase):
    def test_every_entry_the_manifest_names_is_committed(self) -> None:
        manifest = _manifest()
        entries = [manifest["ui"]["entry"]] + [w["entry"] for w in manifest["desktop"]["windows"]]
        for entry in entries:
            with self.subTest(entry=entry):
                # Both are relative to ui/.
                self.assertTrue((APP_ROOT / "ui" / entry).is_file(), "run `npm run build` in ui/")

    def test_they_import_only_the_host_and_their_own_chunks(self) -> None:
        self.assertTrue(_bundles(), "no bundles found; run `npm run build` in ui/")
        for bundle in _bundles():
            text = bundle.read_text(encoding="utf-8")
            imports = _imports(bundle)
            with self.subTest(bundle=bundle.relative_to(DIST).as_posix()):
                starts = re.findall(r"^(?:import|export)\b[^\n]*\bfrom\b", text, re.MULTILINE)
                self.assertEqual(len(starts), len(imports), "an import the scan could not parse")
                for spec, _ in imports:
                    if spec.startswith("./"):
                        target = (bundle.parent / spec).resolve()
                        self.assertTrue(target.is_file(), spec)
                        self.assertTrue(target.is_relative_to(DIST.resolve()), spec)
                    else:
                        self.assertIn(spec, HOST_MODULES)
                self.assertNotRegex(text, r"\bimport\s*\(", "a dynamic import")

    def test_named_sdk_imports_exist_on_every_supported_host(self) -> None:
        for bundle in _bundles():
            for spec, clause in _imports(bundle):
                if spec in LEVEL0_EXPORTS:
                    with self.subTest(bundle=bundle.name, module=spec):
                        self.assertLessEqual(_named(clause), LEVEL0_EXPORTS[spec])

    def test_the_newer_select_is_feature_detected(self) -> None:
        text = "\n".join(b.read_text(encoding="utf-8") for b in _bundles())
        self.assertIn('"Select" in ', text)

    def test_no_build_machine_path_is_baked_in(self) -> None:
        for bundle in _bundles():
            with self.subTest(bundle=bundle.name):
                self.assertNotRegex(
                    bundle.read_text(encoding="utf-8"), r"/(?:home|Users|workplace)/|[A-Za-z]:\\\\"
                )


class TestTheManifest(unittest.TestCase):
    def test_declares_a_minimum_kiro_crew(self) -> None:
        self.assertRegex(_manifest().get("minKiroCrewVersion", ""), r"^\d+\.\d+\.\d+$")

    def test_what_adoption_compares_is_the_builtins(self) -> None:
        manifest, builtin = _manifest(), _builtin()
        for key in ("name", "author", "permissions", "defaultEnabled", "platform", "tags"):
            with self.subTest(field=key):
                self.assertEqual(manifest[key], builtin[key])

    def test_the_license_is_the_repositorys(self) -> None:
        """The code is Kiro Crew's, which is Apache-2.0; the built-in's manifest said MIT."""
        self.assertEqual(_manifest()["license"], "Apache-2.0")
        self.assertIn("Apache License", (APP_ROOT / "LICENSE").read_text(encoding="utf-8"))

    def test_the_version_is_the_builtins_until_a_release_here(self) -> None:
        def parts(version: str) -> tuple[int, ...]:
            self.assertRegex(version, r"^\d+\.\d+\.\d+$")
            return tuple(int(p) for p in version.split("."))

        self.assertGreaterEqual(parts(_manifest()["version"]), parts(_builtin()["version"]))

    def test_declares_nothing_adoption_cannot_carry(self) -> None:
        manifest = _manifest()
        self.assertNotIn("mcpServers", manifest)
        self.assertNotIn("overlays", manifest["ui"])
        self.assertNotIn("sessionApproval", manifest["permissions"])
        self.assertNotIn("desktopCapabilities", manifest["permissions"])
        self.assertIs(manifest["defaultEnabled"], False)

    def test_the_desktop_windows_are_the_builtins(self) -> None:
        desktop = _manifest()["desktop"]
        self.assertEqual(desktop["windows"], EXPECTED_WINDOWS)
        self.assertNotIn("shortcuts", desktop)

    def test_the_page_carries_no_glyph_of_its_own(self) -> None:
        """The legacy route and sidebar glyph come from Kiro Crew's pin, not from here."""
        pages = _manifest()["ui"]["pages"]
        self.assertEqual(pages, [{"route": "/apps/crew-companion", "label": "Crew Companion"}])

    def test_the_backend_hooks_are_the_builtins(self) -> None:
        hooks = _manifest()["backend"]["hooks"]
        builtin = _builtin()["backend"]
        self.assertEqual(hooks["on_startup"], "backend." + builtin["hooks"]["on_startup"])
        self.assertEqual(hooks["on_shutdown"], "backend." + builtin["hooks"]["on_shutdown"])
        self.assertEqual(hooks["routes"], builtin["routes"])

    def test_listing_copy_matches_the_bundled_catalogs(self) -> None:
        """One source per string: the l10n block is the catalogs' ``manifest`` subtree,
        and the English fields are the built-in's own."""
        manifest, builtin = _manifest(), _builtin()
        catalogs = {
            p.stem: json.loads(p.read_text(encoding="utf-8"))["apps"]["crewCompanion"]["manifest"]
            for p in sorted((APP_ROOT / "ui" / "i18n").glob("*.json"))
        }
        english = catalogs.pop("en")
        for key in ("displayName", "description", "highlights", "useCases", "configuration"):
            with self.subTest(field=key):
                self.assertEqual(manifest[key], builtin[key])
        self.assertEqual(manifest["displayName"], english["display_name"])
        self.assertEqual(manifest["description"], english["description"])
        self.assertEqual(manifest["ui"]["pages"][0]["label"], english["page_label"])
        count = len(manifest["highlights"])
        self.assertEqual(manifest["highlights"], [english[f"highlight_{i}"] for i in range(1, count + 1)])
        self.assertEqual(set(manifest["l10n"]), set(catalogs))
        for locale, strings in catalogs.items():
            with self.subTest(locale=locale):
                self.assertEqual(
                    manifest["l10n"][locale],
                    {
                        "displayName": strings["display_name"],
                        "description": strings["description"],
                        "pageLabel": strings["page_label"],
                        "highlights": [strings[f"highlight_{i}"] for i in range(1, count + 1)],
                    },
                )

    def test_l10n_is_within_the_host_parser_limits(self) -> None:
        """A locale over a limit is dropped by the host, silently for the reader."""
        l10n = _manifest()["l10n"]
        self.assertLessEqual(len(l10n), 32)
        for locale, entry in l10n.items():
            with self.subTest(locale=locale):
                self.assertRegex(locale, r"^[a-z]{2,3}(?:-[A-Za-z0-9]{2,8})?$")
                self.assertLessEqual(set(entry), {"displayName", "description", "pageLabel", "highlights"})
                self.assertLessEqual(len(entry["displayName"]), 120)
                self.assertLessEqual(len(entry["description"]), 1000)
                self.assertLessEqual(len(entry["pageLabel"]), 60)
                self.assertLessEqual(len(entry["highlights"]), 12)
                self.assertTrue(all(len(h) <= 300 for h in entry["highlights"]))

    def test_art_is_repo_relative_png(self) -> None:
        manifest = _manifest()
        for key in ("iconPath", "heroImage", "heroImageDark"):
            with self.subTest(field=key):
                self.assertRegex(manifest[key], r"^assets/[a-z0-9-]+\.png$")
                self.assertTrue((APP_ROOT / manifest[key]).is_file())
        for shot in manifest["screenshots"]:
            self.assertTrue((APP_ROOT / shot).is_file(), shot)

    def test_hooks_name_callables(self) -> None:
        import importlib

        for hook, target in _manifest()["backend"]["hooks"].items():
            with self.subTest(hook=hook):
                module, _, attr = target.partition(":")
                self.assertTrue(callable(getattr(importlib.import_module(module), attr)))


class TestTheTreeIsAdoptable(unittest.TestCase):
    def test_no_root_build_file(self) -> None:
        for name in ("package.json", "pyproject.toml", "setup.py", "requirements.txt", ".gitattributes"):
            with self.subTest(name=name):
                self.assertFalse((APP_ROOT / name).exists())

    def test_nothing_at_the_root_beside_the_manifest_that_adoption_would_refuse(self) -> None:
        """The swap keeps ``data/`` and rebuilds the gateway's own entries; the rest is the tree's."""
        for name in ("data", ".app_secret", "installed.json", "app-crons.json"):
            with self.subTest(name=name):
                self.assertFalse((APP_ROOT / name).exists())

    def test_no_link_and_no_unportable_name(self) -> None:
        seen: dict[str, str] = {}
        for path in _tree():
            rel = path.relative_to(APP_ROOT).as_posix()
            with self.subTest(path=rel):
                self.assertFalse(path.is_symlink(), "a link is refused by adoption")
                self.assertTrue(path.is_file(), "only regular files")
                self.assertNotRegex(rel, r"[\\:]")
                for part in rel.split("/"):
                    self.assertFalse(part.endswith((".", " ")), part)
                    self.assertIsNone(_WINDOWS_RESERVED.match(part.split(".")[0]), part)
                self.assertNotIn(rel.lower(), seen, f"differs only in case from {seen.get(rel.lower())}")
                seen[rel.lower()] = rel

    def test_the_tree_is_within_the_adoption_caps(self) -> None:
        files = _tree()
        self.assertLessEqual(len(files), 5000)
        self.assertLessEqual(sum(p.stat().st_size for p in files), 64 * 1024 * 1024)


if __name__ == "__main__":
    unittest.main()
