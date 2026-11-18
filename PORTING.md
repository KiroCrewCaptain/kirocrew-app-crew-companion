# Porting notes: built-in → external app

This repository was ported from Kiro Crew's built-in Crew Companion at KiroCrew
`main` `af94fac51f`. The last commits touching the app there are `b780789a2a`
(backend), `113992594f` (dashboard page and windows) and `cdf648a33a` (desktop
shell code):

- the backend, `src/kiro_crew/apps/builtins/crew_companion/` (`app.json`,
  `hooks.py`, `reminders.py`, `store.py`, `backend/routes.py`);
- the dashboard page and the three window pages, `website/src/apps/crew-companion/`,
  and its store art, `website/public/app-assets/crew-companion/`;
- the desktop shell code the windows talked to, `website/electron/crew-companion/`
  (main-process code; nothing of it is copied, see below);
- the `apps.crewCompanion.*` strings of `website/src/i18n/locales/*.json` (plus
  `en.manual.json`) and the four shared dashboard strings the companion used;
- the tests: the built-in's own `tests/test_*.py`, the companion's tests under
  `website/src/test/` (`CrewCompanion*`, `PetBridgeCoverage`, `GhostEyePoses`,
  `SpriteImporterCoverage`, `RadioChipGroup`, `dashboardTheme` and the
  `Frontend5Cc*` coverage files) and those beside the page sources.

It is current with those files up to KiroCrew `main` `5ca143070d`: "Kiro Crew
changes after the port" below lists every later change to them and where it is
here.

Paths below refer to that commit. A **gap** is something the built-in gets from
Kiro Crew that an external app has no public way to get yet; closing one is a
Kiro Crew change (a generic, app-agnostic App Kit seam), not a change here.

## What carried over unchanged

- `app.json` `name` (`crew-companion`), `version` (`1.0.0`), `author`,
  `permissions`, `platform` (including `requiresDesktopApp`),
  `defaultEnabled: false`, `tags` and every display field (`displayName`,
  `description`, `highlights`, `useCases`, `configuration`).
  `tests/test_manifest_contract.py` compares them with the built-in's manifest
  (`tests/fixtures/builtin-app.json`), because adoption refuses a manifest that
  widens a grant or forces the app off. No grant is added: the page, the windows
  and the backend reach only `/api/apps/crew-companion/*`, which the built-in
  already declared.
- Every route's method, path, validation, status codes, error `code`s and
  response shape, and the owner-only rule for every write. The handler bodies
  are the built-in's.
- The reminder store and its scheduling rules (`backend/store.py`,
  `backend/reminders.py`): the built-in's files with their imports changed.
- The data location: the gateway hands an app's hooks
  `ctx.data_dir = <data home>/apps/crew-companion/data`, the directory the
  built-in's hooks were handed. The reminders and settings
  (`crew-companion-reminders.json`), the avatar packs and their colours keep
  their paths, so a user's reminders, stats, avatar and saved position are read
  as they are. Nothing of the built-in lived beside `app.json`.
- Every component, hook and rule of the page and the windows (the avatar, the
  bubble rules, the panel, the gallery, the pack editor, the sprite importer,
  the reminder parser in every language): the built-in's files, with the import
  paths below changed.
- The event the backend rings when a reminder fires (`crew-companion:fire`,
  declared in `permissions.events`), published through `ctx.events`.

## What changed, and why

| Built-in | Here | Why |
|---|---|---|
| `"backend": {"routes": "backend.routes:register_routes", "hooks": {...}}` (`app.json:17-23`) | `"backend": {"hooks": {"routes": ..., "on_startup": ..., "on_shutdown": ...}}` | Top-level `backend.routes` is read only by the built-in boot loop. An external app's routes go through the gateway's `RouteRegistry`, which also serves them only while the app is enabled. |
| `register_routes(app)` adding aiohttp routes under `/api/apps/crew-companion` (`backend/routes.py:446-510`) | `register_routes(ctx)` returning `Route(method, path, handler)` records relative to that base | The registry's structural route records. The table is the same, method for method (`tests/test_routes.py::TestGate::test_the_route_table_is_the_built_ins`). |
| `_require_enabled`: 403 `app_disabled` while the app is off (`backend/routes.py:96-125`) | the registry answers a disabled app's routes itself (404) | The registry deregisters the routes on disable. The 503 `runtime_not_started` and `store_write_failed` answers are kept. No page relied on the 403: a disabled app's windows are closed and its page is not served. |
| The runtime (the reminder store, the avatar store) as globals of `hooks.py` (`hooks.py:29-33`) | `backend/runtime.py`, which `hooks.py` and `routes.py` both import | The gateway executes each hook entry's file into a fresh module, so the `hooks` module whose `on_startup` ran is not the one the routes imported; a module no hook entry names is shared by both (`tests/test_hook_loading.py`). |
| `require_owner_dashboard_request` from `kiro_crew.dashboard.handlers._shared` (`backend/routes.py:45`) | `ctx.require_owner` (`backend/_host.py`) | The host's public owner gate, the same rule, audit and 403 `owner_only`. A gateway without it refuses every write. |
| `kiro_crew.appearance_packs` imported at module load (`hooks.py:24`, `backend/routes.py:37-42`) | resolved at call time in `backend/_host.py`; without it the gallery routes answer 503 `appearances_unavailable` | No App Kit seam offers the avatar library yet. It validates attacker-authored bundles and pins the host PetDex lookups may reach, so a copy here would be a second validator. **Gap.** |
| `kiro_crew.atomic_write`, `owner_only_files`, `user_json` (`store.py:69-71`) | the same functions through `backend/_host.py`, with standard-library fallbacks | The store keeps the gateway's Windows-aware replace and owner-only temp file. **Gap** (small, non-security helpers would also do). |
| The page, `/crew-companion`, compiled into the dashboard | `ui/dist/index.mjs` at `/apps/crew-companion` | An external app's page is an ES module the dashboard imports. Kiro Crew's adoption pin carries the built-in's legacy route and glyph, so an existing user keeps the sidebar entry, its place and `/crew-companion`. |
| Three standalone page entries, `pet.html`, `panel.html`, `gallery.html`, loaded by the shell's own windows | four window entries the desktop shell hosts (`desktop.windows`): `pet` (an overlay on every display), `notifier` (a background window), `panel` and `gallery` (transparent panels) | See "The desktop windows" below. Each page's `<style>` block is `ui/src/<name>.window.css`. |
| `window.crewCompanion`, the built-in's own preload (`website/electron/crew-companion/pet-preload.js`) | `ui/src/desktop/companionShell.ts`, the same surface rebuilt over the shell's `window.kirocrewDesktopWindow` (bridge level 2) | No app code runs in the desktop app's main process. The pages call the same methods as before. |
| `dashboardTheme.ts` fetched the dashboard's document to adopt its stylesheets | only the transparency guard is kept | A hosted window loads the dashboard's own document, whose stylesheets and theme are already there. |
| `import './bubble.css'` (and five more stylesheets) | the same files read as text and added once to the document (`ui/src/host/injectCss.ts`) | An app bundle is one module with no stylesheet beside it. |
| `fetch(path, {credentials: 'same-origin'})` to the app's routes | `appFetch`, the host's scoped client (`useAppApi().raw`) with `fetch`'s shape (`ui/src/host/appFetch.ts`) | The App Kit way to reach the app's own routes; a scoped refusal is turned back into the response it was, so every call site reads as before. |
| `i18nT` and the dashboard's catalogs | `ui/src/host/i18n.ts` and `ui/i18n/<locale>.json` (the same keys) | A bundle cannot read the dashboard's catalogs. The lookup follows the dashboard's rules (base language, then English; plurals; `{{productName}}`; values inserted literally). |
| Dashboard components and hooks (`SimpleSelect`, `RadioChipGroup`, `InlineStyledConfirm`, the dropdown menu, `useDialogFocusTrap`, `useMenuKeyboard`, the sprite and Lottie renderers, the appearance-pack types, four formatters) | `ErrorNotice`, `useImeGuard` and the formatters the SDK exports come from the host; the select is the host's `Select` (or a native one); the rest are copied under `ui/src/host/` | The App Kit SDK exports only part of the dashboard. The copies drop the dashboard's guide markers, which no app bundle reaches; the dropdown menu is Radix's own (bundled, see `THIRD-PARTY-NOTICES`) with the dashboard's classes; Lottie is bundled too. |
| `useLocalCrewHidden()` in the focus trap and the menu keyboard hook | `false` | A dashboard-only state (a remote Crew shown in front of this one); an app page has no way to read it. Its keys are handled as when the local Crew is in front. |
| `"license": "MIT"` (`app.json:7`) | `"license": "Apache-2.0"` | The built-in's code shipped under Kiro Crew's Apache-2.0 licence, which is this repository's `LICENSE`; the manifest now says the same. Adoption does not compare it. |
| `iconUrl`, `heroImage`, `heroImageDark` under `/app-assets/crew-companion/` (SVG) | `iconPath`, `heroImage`, `heroImageDark` under `assets/` (PNG, rendered from the same SVGs) | An external app ships its own art. |
| No `minKiroCrewVersion` | `"0.13.0"` | A host older than that cannot read the desktop block; the adoption pin's `minAppSdkLevel` (7) is what holds adoption on a host without the window seams. |
| Listing copy in the dashboard's catalogs | `l10n` in `app.json` for the 11 non-English locales | The listing copy travels with the app. It is the `apps.crewCompanion.manifest` subtree of `ui/i18n/<locale>.json`, kept equal by a test. |

## The desktop windows

The built-in's main-process code (`website/electron/crew-companion/`) is not
copied. Every behaviour it gave the companion has a generic counterpart in Kiro
Crew's desktop window host (App Kit seam level 7, kirodotdev/KiroCrew#36338),
which this app declares in `desktop.windows` and reaches through the window
bridge:

| Built-in shell code | Here |
|---|---|
| One overlay per display, the avatar on one of them, the drag hand-off across display edges and the remembered display (`petOverlay.js`) | `pet`, an `overlay` with `displays: "all"`; `onActive`, `beginDrag` / `onDrag` / `endDrag`. The shell remembers the display; for an existing user it is seeded from the built-in's own record (kirodotdev/KiroCrew#37430) |
| The hidden "brain" window owning the session socket, the reminder poll and the bubble, recreated if it crashes (`petOverlay.js`) | `notifier`, a `background` window running the same component in its owner role; the shell reopens it at once if it dies |
| The bubble, bubble actions and window commands relayed between the brain and the avatar, the bubble re-sent to a newly active overlay without its reaction, commands queued until the avatar is ready, the slot replayed to a replaced brain | `companionShell.ts`, over `send` and `onMessage` |
| The cursor poll toggling click-through over the reported hitboxes | `setHitRegions` (the avatar, its bubble, an open menu) |
| Focus while the panel is open (`crew-companion:focusable`) | `setFocusable` |
| The panel opened beside the avatar, on the side with room, 12 px away (`panelWindow.js`, `panelPlacement.js`) | `panel`, `open("panel", {anchor})`, the side from `onPlaced`; the host runs the same placement maths |
| The gallery window (`galleryWindow.js`), the appearance change broadcast to the overlays, the gallery's open and close told to the avatar | `gallery`, `broadcast`, `onWindowChange` |
| "Open session" on a bubble (`crew-companion:open-session`) | `showSession`, answered only right after a press in the avatar's window |
| A link to petdex.dev opened in the browser, https only | `openExternal` |
| "Turn off companion": disable, then close everything at once | the same disable request, then `closeAll` |
| The reconcile loop on `/api/apps`, the credential chain, the error-document latch, the update-install suspend | the host's own, for every app's windows |

Two differences a user could notice, both from the seam's own rules:

- A drag starts only within 2 seconds of the press the shell saw in the avatar's
  window, so a press held still for longer before moving does not drag. A
  page's timer cannot start a drag that way.
- `panelHold` and `panelBreathing` are accepted and do nothing, as in the
  built-in, whose shell recorded them and read them nowhere.

One difference from the gateway's handling of an installed app: turning the app
off unloads its modules, so turning it on again within the same gateway run
starts the next break interval afresh, where the built-in kept its in-memory
schedule. Reminders, settings, stats and avatars are on disk and are kept.

Which desktop app draws the avatar once a gateway has adopted this app, for every
desktop app a user can have beside a newer gateway (one installed separately,
run as a service or reached over a tunnel; the desktop app's own bundled gateway
is never newer than it):

| Desktop app | Draws |
|---|---|
| 0.12 and earlier (no window host) | its built-in windows, from the pages the gateway still ships at `/app-windows/crew-companion/`, over this app's routes |
| 0.13.0-rc.1 (a window host that refuses `displays`, `background` and `gutter`, so it hosts nothing for this app) | its built-in windows, as above |
| 0.13.0-rc.2 and later | this app's windows, through the window host; the built-in code stands down because the record's `origin` is not `builtin` (kirodotdev/KiroCrew#37430), and, from kirodotdev/KiroCrew#37454, also because the record declares a `desktop` block |

No desktop app draws both, and none draws anything while the app is off.

## Kiro Crew changes after the port

Every change to the built-in's files in Kiro Crew after `af94fac51f`, up to
`main` `5ca143070d`, and where it is here:

| Kiro Crew change | What it changed in the built-in | Here |
|---|---|---|
| kirodotdev/KiroCrew#34653, a Scheduled theme (light from one local time, dark from another) | `dashboardTheme.ts`: `applyThemeId` resolves `mc-theme` = `schedule` on the device clock, and `watchThemeChanges` repaints on the schedule's key and when the shell re-pins the appearance; two tests in `dashboardTheme.test.ts` | Nothing to carry. Neither function is here: a hosted window loads the dashboard's own document (see "What changed, and why"), whose theme provider resolves Scheduled and follows the shell's appearance for every app window, and the page runs inside the dashboard, which does the same. |
| kirodotdev/KiroCrew#37430, the companion's windows handed to its installed copy | The built-in's shell code closes its windows for a record whose `origin` is not `builtin`, and copies the display its avatar was last on into the window host's record for `crew-companion/pet` | Nothing to carry: main-process code, which this repository does not have. It is why an existing user sees one avatar after adoption, on the display it was on. |
| kirodotdev/KiroCrew#37454, built-in shell code steps aside for the window host | The same shell code also closes its windows for a record that declares a manifest `desktop` block, on or off | Nothing to carry, for the same reason. This app's record declares the block, so a desktop app with this rule stands the built-in down on either check. |

No later change touched the backend, the page's catalogs, the shared strings or
the store art.

## Gaps (what blocks deleting the wheel copy, not adopting it)

- The avatar library (`kiro_crew.appearance_packs`) and the store's file helpers
  are host modules no App Kit seam offers (see the table above). The gateway's
  own appearance library is a core feature the dashboard's crew avatars use too,
  so it stays in Kiro Crew; a seam would publish it.
- The session watcher (`ui/src/sessionWatch.ts`) reads every session's events
  from the dashboard's own socket (`/api/ws`) with the owner's session, as the
  built-in did. The SDK's `useAppEvents` does not deliver socket events to an app
  bundle yet, and an app token's stream is scoped to the app's own slots, which
  is not what a companion that tells you when any session finishes needs.
- The built-in's window pages (`/app-windows/crew-companion/pet.html`,
  `panel.html`, `gallery.html`) are what a desktop app without a window host, or
  with 0.13.0-rc.1's, still draws (the table above). Deleting them leaves such a
  desktop app with no companion.

## Tests

| Built-in | Here | Notes |
|---|---|---|
| `src/kiro_crew/apps/builtins/crew_companion/tests/test_*.py` | `tests/test_*.py` | Imports changed; the route harness mounts the registry's records and calls each handler as the registry does. The bundle-import checks the dashboard route adds are the host's `import_bundle`, tested in Kiro Crew; here the routes are held to refuse what the host refuses. The manifest's own tests are `tests/test_manifest_contract.py`. |
| `website/src/test/CrewCompanion*.test.ts(x)` and the rest listed above | `ui/tests/` | Run under happy-dom with the polyfills Kiro Crew's suite installs for them. The window-entry tests mount the exported components (`Companion`, `Panel`) instead of importing a page that mounts itself. The mochi half of the context-menu file stays in Kiro Crew. |
| (none) | `ui/tests/companionShell.test.ts`, `ui/tests/windowRoot.test.tsx`, `ui/tests/catalogs.test.ts`, `tests/test_no_host_imports.py` | The relay between the windows over a fake shell, the window roots, the bundled catalogs, and that only `_host.py` reaches `kiro_crew`. |
| `website/electron/crew-companion/test/*.test.js` | (none) | Main-process code; its behaviour is the window host's, tested in Kiro Crew (`website/electron/test/app-window-host*.test.js`). |
