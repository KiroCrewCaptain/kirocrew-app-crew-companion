import { C as appFetch, E as i18nT, _ as PRESENCE_PATH, m as PENDING_PATH } from "./constants-De1Fjrra.mjs";
import { n as IDLE_FIDGET_ANIMS, r as activeAnimFor, t as PetAvatar } from "./PetAvatar-B9Vtjs5N.mjs";
import { C as randomCelebrateProp, a as petBridge, i as hasCompanionBridge, n as useDocumentImeLatch, s as injectCss, t as WindowRoot } from "./WindowRoot-R1vuzr9j.mjs";
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, X } from "lucide-react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
// src/pet.window.css?inline
var pet_window_default = "/* The pet window's document styles: the <style> block of the built-in's pet.html. The\n   window's own root is `.cc-window-root` (the built-in's `#companion-root`), which the\n   entry renders over the whole window. */\n      html,\n      body {\n        margin: 0;\n        padding: 0;\n        width: 100%;\n        height: 100%;\n        background: transparent !important;\n        overflow: hidden;\n        /* The window is click-through except over the companion itself, which\n           re-enables pointer events on its own element. */\n        pointer-events: none;\n        -webkit-user-select: none;\n        user-select: none;\n      }\n      .cc-window-root {\n        position: fixed;\n        inset: 0;\n        width: 100%;\n        height: 100%;\n      }\n\n      /*\n        The companion sits bottom-right by default, clear of the macOS Dock. The\n        layer fills the display (it IS the display) and stays click-through; only\n        the companion and its bubble opt back in to pointer events, and the\n        Electron side is told separately via the preload bridge — CSS alone cannot\n        make a click-through window accept input.\n      */\n      /*\n        A positioning context, not a layout. The companion is placed from its saved\n        coordinates so it stays where the user dragged it, and the panel and bubble\n        are positioned relative to it.\n      */\n      .cc-pet-layer {\n        position: absolute;\n        inset: 0;\n      }\n\n\n      /*\n        The panel sits beside the companion inside this same overlay, per the v1.0\n        spec — not in a second window, because two OS windows cannot be kept\n        reliably in step and the panel has to stay next to a companion that moves.\n\n        It accepts pointer events (it is a real UI); the rest of the display stays\n        click-through, and the Electron side is told separately.\n      */\n\n      /* The menu and the exercise are real UI, so they accept input; the rest of\n         the display stays click-through. */\n      .cc-menu-host,\n      .cc-breathe-host {\n        pointer-events: auto;\n      }\n\n      /*\n       * The context menu's dismissal backdrop: a transparent, full-viewport catcher\n       * rendered UNDER the menu while it is open.\n       *\n       * The window's html and body are `pointer-events: none` so the desktop shows\n       * through, which means a click on an empty region hits no element and fires no\n       * DOM event — the menu's \"click outside closes me\" listener could never see it.\n       * This backdrop opts back in to pointer events so an outside click lands on a\n       * real element and dismisses the menu. It paints nothing (transparent) and only\n       * exists while the menu is open.\n       */\n      .cc-menu-backdrop {\n        pointer-events: auto;\n      }\n\n      .cc-panel-slot {\n        pointer-events: auto;\n        align-self: flex-end;\n        margin-bottom: 6px;\n      }\n\n      .cc-pet-art {\n        width: 76px;\n        height: 76px;\n        display: block;\n      }\n\n      .cc-pet {\n        pointer-events: auto;\n        cursor: pointer;\n        line-height: 0;\n        /* Lifts the companion off whatever is behind it without a hard edge. */\n        filter: drop-shadow(0 3px 7px rgba(0, 0, 0, 0.28));\n        /*\n         * DELIBERATELY no animation here.\n         *\n         * This element carries the inline transform React computes: the mirror\n         * (scaleX(-1)) when the companion faces the other way, and the dock offset plus\n         * 25 degree lean when it is parked against a screen edge.\n         *\n         * A CSS animation OVERRIDES inline styles for whatever property it animates, so\n         * the `infinite` bob that used to live here silently replaced that entire\n         * transform every frame — the mirror and the dock were computed correctly and\n         * never had a chance to show. The idle bob belongs to usePlayfulMotion, which\n         * drives .cc-pet-art (the inner wrapper), so nothing fights over one property.\n         */\n      }\n\n      /*\n       * The bubble host: re-enable input on the ONE element that carries a bubble.\n       *\n       * The class name must match what pet.tsx actually renders. It did not: the rule\n       * here was `.cc-pet-bubble` while the component renders `cc-bubble-host`, so the\n       * host inherited `pointer-events: none` from the body and every click and hover\n       * passed straight THROUGH the bubble. That failed in the most misleading way\n       * available — the OS-level hitbox was correct and the window did accept the\n       * click, the ✕ was in the DOM, and React's dismiss handler worked in tests; the\n       * one thing missing was the element's ability to receive the event at all. So\n       * the bubble simply could not be closed, and nothing anywhere reported an error.\n       *\n       * `.cc-pet` above is the same mechanism and its name always matched, which is\n       * why the companion itself was always clickable while its bubble was not.\n       *\n       * Visual styling deliberately NOT restored here: the old rule also carried\n       * max-width, padding, radius, background, shadow and an entry animation, all of\n       * which `bubble.css` now owns for `.cc-bubble` / `.cc-bubble-wrap`. Reinstating\n       * them under the corrected name would put two stylesheets in competition over\n       * one element — the same fight the `.cc-pet` comment above documents. The host\n       * is a positioning shell; it needs exactly this one property.\n       */\n      .cc-bubble-host {\n        pointer-events: auto;\n      }\n    \n";
// src/nudgeKeys.ts
/**
* Turn a break-nudge key from the backend into the sentence the companion says.
*
* The backend picks a nudge and returns a KEY (`break.water.3`), never English, so
* the phrasing can be translated here and read naturally in every language.
*
* WHY A SWITCH OF LITERAL CALLS, and not the tidier lookup table you would reach for
* first — both tidier shapes are wrong for this codebase:
*
*   * `` i18nT(`apps.crewCompanion.${key}`) `` assembles the key at runtime, so it
*     appears nowhere in the source: extraction and dead-key tooling cannot see it,
*     and a missing entry shows the user the raw string instead of failing in CI.
*   * A `const KEYS = { … } as const` map of key strings puts those strings in value
*     position, where the i18n lint reads them as untranslated user-facing text.
*
* A literal passed directly to `i18nT` is the one shape that is both statically
* visible to the key checker and exempt from the string lint — so every key below is
* written out at its call site. Verbose, and verbose is the point: this list is the
* contract with the backend, and a reader can see all of it at once.
*
* Keep in sync with `BREAK_NUDGES` in
* `src/kiro_crew/apps/builtins/crew_companion/reminders.py` — four kinds, five
* phrasings each. The variety is deliberate: one fixed sentence per kind becomes
* wallpaper within a day, so the backend rotates and avoids the previous one.
*/
/**
* @returns the translated nudge, or null when the key is not one we ship.
*
* Null rather than a fallback: a nudge nobody can read is worse than no nudge, so the
* companion stays quiet instead of announcing "break.water.3" — and a null is
* something a test can catch, which a silent fallback string is not.
*/
function nudgeTextFor(backendKey) {
	switch (backendKey) {
		case "break.water.1": return i18nT("apps.crewCompanion.break.water.1");
		case "break.water.2": return i18nT("apps.crewCompanion.break.water.2");
		case "break.water.3": return i18nT("apps.crewCompanion.break.water.3");
		case "break.water.4": return i18nT("apps.crewCompanion.break.water.4");
		case "break.water.5": return i18nT("apps.crewCompanion.break.water.5");
		case "break.stretch.1": return i18nT("apps.crewCompanion.break.stretch.1");
		case "break.stretch.2": return i18nT("apps.crewCompanion.break.stretch.2");
		case "break.stretch.3": return i18nT("apps.crewCompanion.break.stretch.3");
		case "break.stretch.4": return i18nT("apps.crewCompanion.break.stretch.4");
		case "break.stretch.5": return i18nT("apps.crewCompanion.break.stretch.5");
		case "break.distance.1": return i18nT("apps.crewCompanion.break.distance.1");
		case "break.distance.2": return i18nT("apps.crewCompanion.break.distance.2");
		case "break.distance.3": return i18nT("apps.crewCompanion.break.distance.3");
		case "break.distance.4": return i18nT("apps.crewCompanion.break.distance.4");
		case "break.distance.5": return i18nT("apps.crewCompanion.break.distance.5");
		case "break.breathe.1": return i18nT("apps.crewCompanion.break.breathe.1");
		case "break.breathe.2": return i18nT("apps.crewCompanion.break.breathe.2");
		case "break.breathe.3": return i18nT("apps.crewCompanion.break.breathe.3");
		case "break.breathe.4": return i18nT("apps.crewCompanion.break.breathe.4");
		case "break.breathe.5": return i18nT("apps.crewCompanion.break.breathe.5");
		default: return null;
	}
}
// src/usePlayfulMotion.ts
/**
* usePlayfulMotion — makes the ghost feel alive/pokeable. A single rAF loop
* drives three subtle motions on the art wrapper (transform, no React re-renders):
*   • idle bob   — gentle vertical float while idle
*   • cursor lean — the body drifts a few px toward the cursor
*   • click nod  — poke() kicks a small downward nod that eases back (no scale/squish)
* Gated by `activeRef` (false while dragging/peeking so it stays put).
*
* Ported verbatim from the desktop app's src/renderer/hooks/usePlayfulMotion.ts —
* every timing, amplitude and easing constant is unchanged. The one addition is a
* `prefers-reduced-motion` guard on the CONTINUOUS idle bob (the source has none):
* the bob amplitude is forced to 0 when the user asks for reduced motion, while the
* interaction-driven lean and nod are left intact.
*/
function usePlayfulMotion(ref, activeRef, enabledRef, flipXRef) {
	const s = useRef({
		t: 0,
		last: 0,
		bob: 0,
		amp: 0,
		leanX: 0,
		leanY: 0,
		tgX: 0,
		tgY: 0,
		nod: 0,
		vnod: 0
	});
	const poke = useCallback(() => {
		if (enabledRef && !enabledRef.current) return;
		s.current.nod = 5;
		s.current.vnod = 0;
	}, [enabledRef]);
	useEffect(() => {
		const reduceMq = window.matchMedia("(prefers-reduced-motion: reduce)");
		let reduce = reduceMq.matches;
		const onReduceChange = () => {
			reduce = reduceMq.matches;
		};
		reduceMq.addEventListener("change", onReduceChange);
		let raf = 0;
		const step = (now) => {
			const st = s.current;
			const dt = st.last ? Math.min(.05, (now - st.last) / 1e3) : .016;
			st.last = now;
			st.t += dt;
			if (enabledRef && !enabledRef.current) {
				const el = ref.current;
				if (el && el.style.transform !== "none") el.style.transform = "none";
				raf = requestAnimationFrame(step);
				return;
			}
			const targetAmp = activeRef.current && !reduce ? 3.5 : 0;
			st.amp += (targetAmp - st.amp) * .06;
			st.bob = Math.sin(st.t * 1.9) * st.amp;
			st.leanX += (st.tgX - st.leanX) * .08;
			st.leanY += (st.tgY - st.leanY) * .08;
			st.vnod += (0 - st.nod) * .14 - st.vnod * .5;
			st.nod += st.vnod;
			const el = ref.current;
			if (el) {
				const leanX = flipXRef?.current ? -st.leanX : st.leanX;
				el.style.transform = `translate(${leanX.toFixed(2)}px, ${(st.bob + st.leanY + st.nod).toFixed(2)}px)`;
			}
			raf = requestAnimationFrame(step);
		};
		raf = requestAnimationFrame(step);
		const onMove = (e) => {
			if (enabledRef && !enabledRef.current) return;
			const el = ref.current;
			if (!el) return;
			const r = el.getBoundingClientRect();
			const cx = r.left + r.width / 2;
			const cy = r.top + r.height / 2;
			const dx = e.clientX - cx;
			const dy = e.clientY - cy;
			const n = Math.hypot(dx, dy) || 1;
			const mag = Math.min(1, n / 220);
			s.current.tgX = dx / n * mag * 3.5;
			s.current.tgY = dy / n * mag * 2.5;
		};
		window.addEventListener("mousemove", onMove);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("mousemove", onMove);
			reduceMq.removeEventListener("change", onReduceChange);
		};
	}, [
		ref,
		activeRef,
		enabledRef,
		flipXRef
	]);
	return { poke };
}
// src/host/chunkScopeCapability.ts
/** A bundle that declares this in `/api/ws?caps=` sends `chunk_watch` and
*  handles `chat_phase`, `tool_status` and `chunk_watch_ack` (see
*  `hooks/websocket/chunkWatch.ts`). A wire token, not copy. Its own module so the Mochi panel
*  and the Crew Companion declare it without loading the dashboard store. */
var chunkScopeCapability = "chunk_scope.1";
/** True for the companion's own housekeeping agent slots (they never notify). */
function isOwnBackgroundAgent(slotKey) {
	return slotKey === "crew-companion-bg" || slotKey.startsWith("crew-companion-bg");
}
/**
* Decide what to do when a slot transitions running → idle.
*
* Order matters: the excluded/never-seen/opted-out skips come before any elapsed
* arithmetic, and the assumed-start `verify` deferral comes before the too-short
* threshold — otherwise a restart-shortened elapsed would be dropped as "too
* short" instead of being recovered from history.
*/
function evaluateCompletion(input) {
	const { slotKey, startedAt, now, assumedStart, silent } = input;
	if (isOwnBackgroundAgent(slotKey)) return {
		action: "skip",
		reason: "own-background-agent"
	};
	if (startedAt === void 0) return {
		action: "skip",
		reason: "never-running"
	};
	if (silent) return {
		action: "skip",
		reason: "user-opted-out"
	};
	const elapsedMs = now - startedAt;
	if (assumedStart) return {
		action: "verify",
		elapsedMs
	};
	if (elapsedMs < 1e4) return {
		action: "skip",
		reason: "too-short"
	};
	return {
		action: "notify",
		elapsedMs
	};
}
/**
* Second half of the `verify` path: apply the threshold against the real start
* recovered from slot history, now that the assumed start has been replaced by a
* trustworthy one.
*
* @param realStart ms epoch of the turn's actual first user message, or 0 when
*                  history was unavailable (then we fall back to `fallbackElapsedMs`,
*                  the assumed elapsed — better than dropping a real completion).
* @param now       ms epoch.
* @param fallbackElapsedMs elapsed to use when `realStart` could not be recovered.
*/
function confirmAssumedStart(realStart, now, fallbackElapsedMs) {
	const elapsedMs = realStart > 0 ? now - realStart : fallbackElapsedMs;
	if (elapsedMs < 1e4) return {
		action: "skip",
		reason: "too-short-after-recovery"
	};
	return {
		action: "notify",
		elapsedMs
	};
}
// src/host/socketSilenceWatchdog.ts
/**
* Silence watchdog for a `/api/ws` socket that stays OPEN but stops delivering.
*
* A browser can keep a WebSocket whose transport is gone -- a phone that changed
* networks, or a tab resumed after the OS froze it -- without ever firing
* `onclose`. Nothing else notices: a reconnect catch-up only runs on close, and a
* health probe only polls while the connection is believed down. Every one-shot
* frame is then lost until a manual reload. The gateway pushes a `dashboard`
* status frame on every socket every 5s (`_WS_STATUS_INTERVAL` in
* `dashboard/ws.py`), so a socket silent for longer than the window, while its
* page is visible, is treated as dead and replaced.
*
* This is the ONE implementation of that rule. The dashboard's own socket
* (`useWebSocket`) and the two app sockets (`apps/mochi/panel/panelBridge`,
* `apps/crew-companion/sessionWatch`) all drive it, so the three cannot drift in
* their timing constants or their hidden-time bookkeeping. The host supplies only
* the two things that differ per socket: how to read whether the socket is
* currently OPEN (`isOpen`), and how to replace it (`onDead`).
*
* Silence is measured in VISIBLE time only. Hidden pages are skipped (timers are
* throttled there, and a suspended tab processed nothing); on the return every
* stamp moves past the hidden interval, so silence adds up across tab switches
* while a frame that arrived in the background counts as arriving at the return.
* A thawed socket then gets two checks to deliver its next status frame before it
* can be replaced -- unless its visible silence had already passed the window
* when the page came back, in which case the first check replaces it, so a dead
* socket cannot outlive a run of glances each shorter than that grace. Each
* consecutive silent replacement doubles the window up to WS_SILENCE_MAX_MS, so a
* gateway that stopped sending status on a live socket costs one reconnect per
* window rather than one every 20s; a socket observed live for a whole window of
* visible time since it opened resets the count.
*/
/** A socket that has delivered nothing for this long while the page is visible
*  is treated as dead, even when its `readyState` still reads OPEN. The gateway
*  pushes a `dashboard` status frame on every socket every 5s
*  (`_WS_STATUS_INTERVAL` in `dashboard/ws.py`), so this is four missed ticks. */
var WS_SILENCE_MS = 2e4;
/** How often the silence check runs: the status frame's own cadence. */
var WS_SILENCE_CHECK_MS = 5e3;
/** Ceiling for the silence window after repeated silent reconnects. */
var WS_SILENCE_MAX_MS = 3e5;
/**
* Framework-agnostic silence watchdog. Construct one per logical socket
* connection (the thing that survives individual socket replacements), call
* `markOpen` whenever a fresh socket opens and `markFrame` on every delivered
* frame, and `start()` to arm the interval + visibility listener. `stop()`
* detaches both. The timing state lives here, not in the host, so every socket
* that uses it shares one contract.
*/
var SilenceWatchdog = class {
	host;
	now;
	/** When the current socket last delivered a frame, in visible time. */
	lastFrameAt = 0;
	/** When the current socket's silence clock started (at open), in visible time. */
	silenceClockStartedAt = 0;
	/** When the page was hidden (0 while visible). */
	hiddenAt = 0;
	/** Until when a socket thawed by a return is spared. */
	graceUntil = 0;
	/** How many silent sockets in a row the watchdog has replaced. */
	silentReconnects = 0;
	timer = null;
	onVisibility;
	constructor(host) {
		this.host = host;
		this.now = host.now ?? (() => Date.now());
		this.onVisibility = () => this.handleVisibility();
	}
	/** A fresh socket just opened: start its silence clock from now. */
	markOpen() {
		this.silenceClockStartedAt = this.now();
		this.lastFrameAt = this.silenceClockStartedAt;
	}
	/** The watched socket delivered a frame: it is alive as of now. */
	markFrame() {
		this.lastFrameAt = this.now();
	}
	/** Arm the interval and the visibility listener. Idempotent. */
	start() {
		if (this.timer !== null) return;
		this.timer = setInterval(() => this.check(), WS_SILENCE_CHECK_MS);
		document.addEventListener("visibilitychange", this.onVisibility);
	}
	/** Detach the interval and the visibility listener. Idempotent. */
	stop() {
		if (this.timer !== null) {
			clearInterval(this.timer);
			this.timer = null;
		}
		document.removeEventListener("visibilitychange", this.onVisibility);
	}
	silenceWindowMs() {
		return Math.min(WS_SILENCE_MS * 2 ** this.silentReconnects, WS_SILENCE_MAX_MS);
	}
	check() {
		if (document.hidden) return;
		if (!this.host.isOpen()) return;
		const now = this.now();
		const silenceMs = this.silenceWindowMs();
		if (now - this.lastFrameAt <= silenceMs) {
			if (now - this.silenceClockStartedAt > silenceMs) this.silentReconnects = 0;
			return;
		}
		if (now < this.graceUntil) return;
		this.silentReconnects += 1;
		this.host.onDead();
	}
	handleVisibility() {
		const now = this.now();
		if (document.hidden) {
			this.hiddenAt = now;
			return;
		}
		const skipHidden = (stamp) => stamp + now - Math.max(this.hiddenAt, stamp);
		this.lastFrameAt = skipHidden(this.lastFrameAt);
		this.silenceClockStartedAt = skipHidden(this.silenceClockStartedAt);
		this.hiddenAt = 0;
		this.graceUntil = now - this.lastFrameAt > this.silenceWindowMs() ? 0 : now + WS_SILENCE_CHECK_MS * 2;
	}
};
/** `delay` less a random part of up to half of it. */
function jittered(delay) {
	return delay - Math.floor(Math.random() * (delay / 2));
}
/** True when a socket opened at `openedAt` (null: it never opened) and closing
*  at `now` stayed open long enough to start the backoff over. */
function provedHealthy(openedAt, now) {
	return openedAt !== null && now - openedAt >= 1e4;
}
// src/sessionWatch.ts
/**
* Watch the gateway for a chat session's turn ending, so the companion can say so.
*
* ## Why a WebSocket and not the companion's own backend
*
* The rest of the companion learns things by polling its own backend, which owns
* reminders and break nudges. Session completion is different: the backend has no
* knowledge of it. There is no `session_done` event and nothing enqueues a
* session-shaped fire — the whole producing half was missing, so the panel's "Tell me
* when sessions are done" switch saved a value that nothing read.
*
* The signal already exists, one layer up: the gateway broadcasts turn lifecycle over
* the dashboard WebSocket to EVERY connected client, and an app-window page is such a
* client — same origin, authenticated by the same session cookie. Mochi's panel
* already consumes it exactly this way (`apps/mochi/panel/panelBridge.ts`), which is
* the precedent this module follows rather than inventing a backend producer.
*
* ## The event names matter, because the obvious guess is wrong
*
*   `chat_status` → a turn STARTED (the model stream opened)
*   `chat_done`   → that turn FINISHED. This is the session-done signal.
*   `slots`       → the full slot list, each with `running` and `title`
*   `subagent_done` → a spawned background agent ended. A DIFFERENT thing, ignored.
*
* ## The one thing the gateway does not tell us
*
* No payload carries a turn's start time or elapsed duration. So "was this turn long
* enough to be worth interrupting for" can only be answered by having WATCHED the
* start. A page that connects mid-turn cannot recover when that turn began, which is
* exactly the `assumedStart` case the ported gate already reasons about: the desktop
* app hit the same wall and treated an unobserved start as unknown rather than as
* zero, because measuring from "when I first noticed" silently swallowed every
* notification after a restart.
*/
/** The gateway's socket, same origin as this page. */
function defaultConnect() {
	const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
	return new WebSocket(`${proto}//${window.location.host}/api/ws?caps=${chunkScopeCapability}`);
}
/** Backoff bounds for reconnection. */
var RECONNECT_MIN_MS = 1e3;
var RECONNECT_MAX_MS = 3e4;
/**
* Start watching. Returns a stop function.
*
* Deliberately not a React hook: it owns a socket and a table of start times, and
* both must survive re-renders of the companion. The caller holds the stop function.
*/
function watchSessions(opts) {
	const now = opts.now ?? (() => Date.now());
	const connect = opts.connect ?? defaultConnect;
	/** slot -> when we SAW it start. Absent means we never saw this turn begin. */
	const startedAt = /* @__PURE__ */ new Map();
	/** slot -> turn identity from its latest running snapshot, when known. */
	const turnIdentities = /* @__PURE__ */ new Map();
	/**
	* Slots whose start we only assumed — they were already running the first time we
	* heard about them, so their real start is unknown and the duration rule cannot be
	* applied to them fairly.
	*/
	const assumed = /* @__PURE__ */ new Set();
	/** slot -> last known title, for the bubble's words. */
	const titles = /* @__PURE__ */ new Map();
	/** Slots that emitted an error message during the current turn. */
	const failedSlots = /* @__PURE__ */ new Set();
	/**
	* Slots the USER deliberately stopped mid-turn.
	*
	* The backend broadcasts `chat_done` for a stopped turn exactly as it does for a
	* finished one — the frame is `{slot}` either way — so without this the companion
	* celebrated an interruption as a success. The stop itself never arrives as a
	* `chat_message` (the stop card is appended without a broadcast), but the `slots`
	* frames this watcher already consumes carry `stopping: true` while the cancel is
	* in flight; that is the signal recorded here. A stopped turn is neither a success
	* nor a failure — the user chose to end it — so `finish()` drops it silently:
	* no hop, no bubble, no error shake.
	*/
	const stoppedSlots = /* @__PURE__ */ new Set();
	const surfacedApprovals = /* @__PURE__ */ new Set();
	let socket = null;
	let stopped = false;
	let retryMs = RECONNECT_MIN_MS;
	let retryTimer = null;
	/** When the live socket opened; null while none is open. */
	let openedAt = null;
	/**
	* True from a watchdog replacement until the fresh socket's first `slots` frame.
	*
	* A silent socket means the SOCKET died, not the gateway, so the turns in flight
	* are usually still running. Failing them at the replacement would raise a
	* "failed" bubble (never silenced) and then, when the turn really finishes on the
	* new socket, a second "done" bubble for the same turn. Instead the first `slots`
	* frame after the reopen keeps a running slot's start and flags unless both turn
	* identities are known and differ; a successor starts fresh as an assumed start.
	* An absent or replaced turn is reported as failed exactly as a dropped socket
	* reports it. A close before that frame arrives falls back to `failInFlight`.
	*/
	let settleOnSlots = false;
	/**
	* Replace a socket that stays OPEN but has stopped delivering frames -- a phone
	* off-network, an OS-frozen tab. Same silence rule as the dashboard socket,
	* through the one shared helper so the three cannot drift. `isOpen` reads this
	* watcher's live socket; `onDead` drops the approval dedupe, leaves the in-flight
	* turns for the fresh socket's first `slots` frame to settle (`settleOnSlots`),
	* and reopens at once. Uses the injected clock so tests drive the window.
	*/
	const silence = new SilenceWatchdog({
		now: opts.now,
		isOpen: () => socket?.readyState === WebSocket.OPEN,
		onDead: () => {
			const dead = socket;
			socket = null;
			if (provedHealthy(openedAt, now())) retryMs = RECONNECT_MIN_MS;
			openedAt = null;
			if (dead) {
				dead.onclose = null;
				try {
					dead.close();
				} catch {}
			}
			surfacedApprovals.clear();
			settleOnSlots = true;
			open();
		}
	});
	const markStart = (slot, wasAssumed) => {
		if (startedAt.has(slot)) return;
		startedAt.set(slot, now());
		if (wasAssumed) assumed.add(slot);
	};
	const finish = (slot) => {
		const started = startedAt.get(slot);
		const wasAssumed = assumed.has(slot);
		const failed = failedSlots.has(slot);
		const userStopped = stoppedSlots.has(slot);
		startedAt.delete(slot);
		turnIdentities.delete(slot);
		assumed.delete(slot);
		failedSlots.delete(slot);
		stoppedSlots.delete(slot);
		if (userStopped) return;
		let decision = evaluateCompletion({
			slotKey: slot,
			startedAt: started,
			now: now(),
			assumedStart: wasAssumed,
			silent: failed ? false : opts.isSilent()
		});
		if (decision.action === "verify") decision = confirmAssumedStart(0, now(), decision.elapsedMs);
		if (decision.action !== "notify") return;
		opts.onDone({
			slot,
			title: titles.get(slot) ?? "",
			elapsedMs: decision.elapsedMs,
			failed
		});
	};
	const handle = (raw) => {
		let msg;
		try {
			msg = JSON.parse(raw);
		} catch {
			return;
		}
		const data = msg.data ?? {};
		switch (msg.type) {
			case "chat_status":
				if (typeof data.slot === "string") markStart(data.slot, false);
				break;
			case "slots": {
				const list = Array.isArray(data) ? data : data.slots ?? [];
				for (const entry of list) {
					const s = entry;
					if (typeof s.key !== "string") continue;
					if (typeof s.title === "string") titles.set(s.key, s.title);
					if (s.running === true) {
						const identity = typeof s.turn === "number" && typeof s.turn_gen === "string" ? `${s.turn_gen}:${s.turn}` : void 0;
						const previous = turnIdentities.get(s.key);
						if (settleOnSlots && previous !== void 0 && identity !== void 0 && previous !== identity) {
							failedSlots.add(s.key);
							finish(s.key);
						}
						markStart(s.key, true);
						if (identity !== void 0) turnIdentities.set(s.key, identity);
						else turnIdentities.delete(s.key);
					}
					if (s.stopping === true) stoppedSlots.add(s.key);
					if (s.pending_approval === true) {
						if (!surfacedApprovals.has(s.key)) {
							surfacedApprovals.add(s.key);
							opts.onApproval?.({
								slot: s.key,
								title: titles.get(s.key) ?? ""
							});
						}
					} else if (s.pending_approval === false) surfacedApprovals.delete(s.key);
				}
				if (settleOnSlots) {
					settleOnSlots = false;
					const running = /* @__PURE__ */ new Set();
					for (const entry of list) {
						const s = entry;
						if (typeof s.key === "string" && s.running === true) running.add(s.key);
					}
					for (const slot of [...startedAt.keys()]) {
						if (running.has(slot)) continue;
						failedSlots.add(slot);
						finish(slot);
					}
				}
				break;
			}
			case "chat_done":
				if (typeof data.slot === "string") finish(data.slot);
				break;
			case "chat_message":
				if (typeof data.slot === "string" && data.role === "error") failedSlots.add(data.slot);
				break;
			case "approval":
				if (typeof data.slot === "string") {
					surfacedApprovals.add(data.slot);
					opts.onApproval?.({
						slot: data.slot,
						title: titles.get(data.slot) ?? ""
					});
				}
				break;
			case "approval_resolved":
				opts.onApprovalResolved?.();
				break;
			case "app_event": {
				const inner = data;
				if (inner.app === "crew-companion" && inner.event === "crew-companion:fire") opts.onFireQueued?.();
				break;
			}
		}
	};
	/**
	* The socket dropped while turns were in flight — report each as a FAILURE.
	*
	* A gateway restart or a network drop means no `chat_done` will ever arrive for
	* those slots, so without this they sat in `startedAt` forever: no notification (the
	* user is never told the work died) AND a stale start time, so the NEXT turn on that
	* slot measured its duration from the old start and could report a three-second turn
	* as a long one.
	*
	* Reported as failed, not silently dropped, because that is what it is: the work
	* stopped without finishing and the user did not ask for that. It goes through the
	* same `finish(failed)` path as an error row — which also means it is never silenced
	* by the session-notifications preference, matching the existing rule that bad news
	* always gets through.
	*
	* A deliberate Stop is excluded: `finish()` returns early for a slot in
	* `stoppedSlots`, so a stop that happens to be followed by a disconnect stays quiet.
	*/
	const failInFlight = () => {
		for (const slot of [...startedAt.keys()]) {
			failedSlots.add(slot);
			finish(slot);
		}
	};
	const open = () => {
		if (stopped) return;
		let ws;
		try {
			ws = connect();
		} catch {
			schedule();
			return;
		}
		socket = ws;
		ws.onopen = () => {
			openedAt = now();
			ws.send(JSON.stringify({
				type: "chunk_watch",
				slots: []
			}));
			silence.markOpen();
			silence.start();
		};
		ws.onmessage = (ev) => {
			silence.markFrame();
			handle(String(ev.data));
		};
		ws.onclose = () => {
			socket = null;
			surfacedApprovals.clear();
			settleOnSlots = false;
			failInFlight();
			if (provedHealthy(openedAt, now())) retryMs = RECONNECT_MIN_MS;
			openedAt = null;
			schedule();
		};
		ws.onerror = () => {
			try {
				ws.close();
			} catch {}
		};
	};
	function schedule() {
		if (stopped || retryTimer !== null) return;
		retryTimer = window.setTimeout(() => {
			retryTimer = null;
			retryMs = Math.min(retryMs * 2, RECONNECT_MAX_MS);
			open();
		}, jittered(retryMs));
	}
	open();
	return () => {
		stopped = true;
		silence.stop();
		if (retryTimer !== null) window.clearTimeout(retryTimer);
		retryTimer = null;
		if (socket) {
			socket.onclose = null;
			try {
				socket.close();
			} catch {}
			socket = null;
		}
	};
}
// src/host/editableTarget.ts
/** `Node.ELEMENT_NODE`, spelled out so a predicate stays usable for a plain
*  object stand-in and never depends on a live `Node` binding. */
var ELEMENT_NODE = 1;
/** Narrow a node to an element without requiring a live `Element` binding. */
function asElement(node) {
	const el = node;
	if (!el || el.nodeType !== ELEMENT_NODE || typeof el.tagName !== "string") return null;
	return el;
}
/** True when this element consumes a printable keystroke, so a global hotkey
*  must not claim it. `SELECT` counts: a printable key there is option
*  typeahead, which the user is relying on. */
function isEditableElement(node) {
	const el = asElement(node);
	if (!el) return false;
	const tag = el.tagName;
	if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
	return el.isContentEditable === true;
}
/**
* The element that really holds focus, descending through every open shadow
* root.
*
* `document.activeElement` stops at the outermost boundary: with the caret in
* the code editor it reports the editor's shadow HOST, not the editable node
* inside — the same blindness `editableEventTarget` fixes for events. Each
* shadow root keeps its own `activeElement`, so the real one is found by
* following that chain down.
*/
function deepActiveElement() {
	let active = asElement(document.activeElement);
	while (active?.shadowRoot?.activeElement) {
		const inner = asElement(active.shadowRoot.activeElement);
		if (!inner || inner === active) break;
		active = inner;
	}
	return active;
}
// src/host/useMenuKeyboard.ts
/**
* Shared keyboard contract for `role="menu"` surfaces (WAI-ARIA menu pattern):
* ArrowDown/ArrowUp move real DOM focus between the enabled items and wrap at
* both ends, Home/End jump to the boundary items, and Tab/Shift-Tab are
* contained within the enabled items (#2533) — a Tab out of a still-open menu
* would drop a keyboard user behind it with no obvious way back. Escape is
* deliberately NOT handled here: every host already owns its own dismissal
* (and what "close" means — restore focus, toggle state — differs per host).
*
* This is the extraction of `MenuBtn`'s roving-focus keydown logic
* (DevFleetPageMenus.tsx, landed via #6226) so the sibling `role="menu"` surfaces
* can honour the same contract without a per-surface re-spelling (#6231).
* `MenuBtn` itself consumes `handleMenuKeydown` from its existing
* document-level listener; popover-style hosts use the `useMenuKeyboard` hook.
*
* Not `useListboxKeyboard`: that hook closes on Tab (`closeToTrigger`), clamps
* instead of wrapping (`els[i+1] ?? els[els.length-1]`), and scopes its IME
* guard to a filter input — all three are the LISTBOX/combobox side of the
* pattern. The menu contract wraps, contains Tab, and needs a document-level
* composition latch because a menu has no editable target to anchor one to.
*/
/**
* The enabled, keyboard-reachable rows of a menu container. Menus in this
* repo mark rows as `role="menuitem"` / `role="menuitemradio"` /
* `role="menuitemcheckbox"`, native `<button>`s, or `Clickable`
* (`role="button"`) — match all of them so a host's action rows are never
* stranded outside the arrow/Tab cycle. Disabled rows (native `disabled` or
* `aria-disabled`, the `Clickable` spelling) are skipped the same way
* `MenuBtn` skips them.
*/
function menuItemsOf(container) {
	if (!container) return [];
	return Array.from(container.querySelectorAll("[role=\"menuitem\"],[role=\"menuitemradio\"],[role=\"menuitemcheckbox\"],[role=\"button\"],button")).filter((el) => !el.hasAttribute("disabled") && el.getAttribute("aria-disabled") !== "true");
}
/**
* Handle one keydown against the menu contract. Returns true when the key was
* consumed (or claimed by the IME latch), false when it is not the menu's key
* and should fall through to the host's other handling.
*
* Framework-free on purpose (same reasoning as `createImeLatch`): document-
* level native listeners (`MenuBtn`) and React `onKeyDown` handlers (via
* `e.nativeEvent`) share ONE spelling of the contract.
*/
function handleMenuKeydown(e, getItems, imeLatch) {
	if (e.key === "ArrowDown" || e.key === "ArrowUp" || e.key === "Home" || e.key === "End") {
		if (e.altKey || e.ctrlKey || e.metaKey) return false;
		const focusable = getItems();
		if (focusable.length === 0) return false;
		if (!imeLatch.claimKey(e)) return true;
		e.preventDefault();
		if (e.key === "Home") {
			focusable[0].focus();
			return true;
		}
		if (e.key === "End") {
			focusable[focusable.length - 1].focus();
			return true;
		}
		const idx = focusable.indexOf(document.activeElement);
		focusable[idx === -1 ? e.key === "ArrowDown" ? 0 : focusable.length - 1 : (idx + (e.key === "ArrowDown" ? 1 : -1) + focusable.length) % focusable.length].focus();
		return true;
	}
	if (e.key !== "Tab") return false;
	const focusable = getItems();
	if (focusable.length === 0) return false;
	const first = focusable[0];
	const last = focusable[focusable.length - 1];
	if (e.shiftKey && document.activeElement === first) {
		if (!imeLatch.claimKey(e)) return true;
		e.preventDefault();
		last.focus();
		return true;
	}
	if (!e.shiftKey && document.activeElement === last) {
		if (!imeLatch.claimKey(e)) return true;
		e.preventDefault();
		first.focus();
		return true;
	}
	return false;
}
/**
* Wire an open `role="menu"` container onto the shared menu keyboard
* contract. While `enabled`:
*
*  - a DOCUMENT-level keydown listener drives `handleMenuKeydown` (same shape
*    as `MenuBtn`): arrows work even while focus still sits on the trigger —
*    the first arrow ENTERS the item list — and portaled menus need no React
*    bubbling path;
*  - focus moves onto the first enabled item when the menu opens
*    (`focusFirstOnOpen`, default true): role="menu" tells assistive
*    technology that focus is managed here, so a keyboard user lands inside
*    the menu they were just told is open. Hosts that already own focus entry
*    (Pierre's tree menu) pass false;
*  - a shared document IME latch keeps composition keys out of the contract
*    (see `useDocumentImeLatch`).
*
* One guard `MenuBtn` does not need but a document-level contract here does:
* when focus sits in an EDITABLE element outside the menu (the composer
* textarea under `MicSourceMenu`), the keys belong to the editor — an open
* menu must not hijack a caret's arrows. `MenuBtn` closes on any outside
* click, so its menu and an outside caret cannot coexist; these popovers can.
*
* PRECONDITION: at most one hook-driven menu open at a time. Each instance
* installs its own document listener and treats focus-outside-the-list as
* "enter the list", so two open menus would both act on the same arrow and
* the unfocused one would steal focus. Every current host already guarantees
* this (all dismiss on outside pointerdown/mousedown, and Tab containment
* keeps the keyboard from reaching a second trigger while one is open) — a
* new consumer must keep that dismissal shape or add arbitration here first.
*
* Focus RESTORE on close is the HOST's job, and there are two sanctioned
* postures — pick one on purpose: restore-on-every-unmount, guarded by
* "focus is still inside the menu" (mochi ContextMenu — covers host-driven
* unmounts too), or restore-only-on-explicit-dismissal, leaving outside-
* pointer dismissal alone (SlotPopover/MenuBtn — the browser routes focus
* per the click target, #2533). Focus entry without a matching restore
* strands a keyboard user on <body> when the focused item unmounts.
*
* Item discovery is `menuItemsOf(containerRef.current)`.
*/
function useMenuKeyboard(opts) {
	const { enabled, containerRef, focusFirstOnOpen = true } = opts;
	const imeLatch = useDocumentImeLatch(enabled);
	const crewHidden = false;
	useEffect(() => {
		if (!enabled || crewHidden) return;
		const items = () => menuItemsOf(containerRef.current);
		if (focusFirstOnOpen) items()[0]?.focus();
		const onKey = (e) => {
			const active = deepActiveElement();
			if (active && !containerRef.current?.contains(active)) {
				if (isEditableElement(active)) return;
			}
			handleMenuKeydown(e, items, imeLatch);
		};
		document.addEventListener("keydown", onKey);
		return () => document.removeEventListener("keydown", onKey);
	}, [
		enabled,
		crewHidden,
		focusFirstOnOpen,
		containerRef,
		imeLatch
	]);
}
// src/ContextMenu.tsx
var api$2 = petBridge;
var MENU_MIN_W = 160;
function ContextMenu({ x, y, items, reportHitbox, onAction, onClose }) {
	const menuRef = useRef(null);
	useMenuKeyboard({
		enabled: true,
		containerRef: menuRef
	});
	const opener = useRef(void 0);
	if (opener.current === void 0) opener.current = document.activeElement;
	useLayoutEffect(() => {
		const menu = menuRef.current;
		return () => {
			if (menu?.contains(document.activeElement)) opener.current?.focus?.();
		};
	}, []);
	const [clampedX, setClampedX] = React.useState(x);
	const [clampedY, setClampedY] = React.useState(y);
	useEffect(() => {
		const el = menuRef.current;
		if (!el) return;
		const rect = el.getBoundingClientRect();
		const newX = x + rect.width > window.innerWidth ? Math.max(0, x - rect.width) : x;
		const newY = y + rect.height > window.innerHeight ? Math.max(0, y - rect.height) : y;
		setClampedX(newX);
		setClampedY(newY);
	}, [x, y]);
	useEffect(() => {
		if (!reportHitbox) return;
		api$2?.setMenuHitbox?.({
			x: 0,
			y: 0,
			w: window.innerWidth,
			h: window.innerHeight
		});
		return () => {
			api$2?.setMenuHitbox?.(null);
		};
	}, [reportHitbox]);
	useEffect(() => {
		const handleClick = (e) => {
			if (menuRef.current && !menuRef.current.contains(e.target)) onClose();
		};
		const handleKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		const handleBlur = () => onClose();
		const timer = setTimeout(() => {
			window.addEventListener("mousedown", handleClick, true);
			window.addEventListener("keydown", handleKey, true);
			window.addEventListener("blur", handleBlur);
		}, 50);
		return () => {
			clearTimeout(timer);
			window.removeEventListener("mousedown", handleClick, true);
			window.removeEventListener("keydown", handleKey, true);
			window.removeEventListener("blur", handleBlur);
		};
	}, [onClose]);
	const handleAction = useCallback((action) => {
		onClose();
		onAction(action);
	}, [onClose, onAction]);
	return /* @__PURE__ */ jsxs(Fragment, { children: [reportHitbox ? /* @__PURE__ */ jsx("div", {
		className: "cc-menu-backdrop",
		role: "presentation",
		onMouseDown: onClose,
		style: {
			position: "fixed",
			inset: 0,
			zIndex: 99998,
			pointerEvents: "auto",
			background: "transparent"
		}
	}) : null, /* @__PURE__ */ jsx("div", {
		ref: menuRef,
		role: "menu",
		style: {
			position: "fixed",
			left: clampedX,
			top: clampedY,
			zIndex: 99999,
			background: "var(--bg-elevated, #2a2a2a)",
			border: "1px solid var(--border, rgba(255,255,255,0.15))",
			borderRadius: 6,
			padding: "4px 0",
			boxShadow: "0 4px 12px var(--shadow, rgba(0,0,0,0.5))",
			minWidth: MENU_MIN_W
		},
		children: items.map((entry, i) => {
			if ("separator" in entry && entry.separator) return /* @__PURE__ */ jsx("div", {
				role: "separator",
				style: {
					height: 1,
					background: "var(--border, rgba(255,255,255,0.15))",
					margin: "2px 0"
				}
			}, `sep-${i}`);
			const item = entry;
			return /* @__PURE__ */ jsx("div", {
				role: "menuitem",
				tabIndex: 0,
				onKeyDown: (e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						e.stopPropagation();
						handleAction(item.action);
					}
				},
				onClick: (e) => {
					e.stopPropagation();
					handleAction(item.action);
				},
				style: {
					padding: "6px 16px",
					fontSize: 12,
					cursor: "pointer",
					color: item.danger ? "var(--danger, #f38ba8)" : "var(--text, #e0e0e0)"
				},
				onMouseEnter: (e) => {
					e.currentTarget.style.background = "var(--bg-hover, rgba(255,255,255,0.1))";
				},
				onMouseLeave: (e) => {
					e.currentTarget.style.background = "transparent";
				},
				children: item.label
			}, item.action);
		})
	})] });
}
// src/PetContextMenu.tsx
/**
* Pet overlay context menu — uses the shared ContextMenu component.
* Provides pet-specific menu items with i18n.
*/
var api$1 = petBridge;
function PetContextMenu({ x, y, onClose }) {
	const items = useMemo(() => {
		return [
			{
				label: i18nT("apps.crewCompanion.menu.change_avatar"),
				action: "gallery"
			},
			{ separator: true },
			{
				label: i18nT("apps.crewCompanion.menu.quit"),
				action: "quit",
				danger: true
			}
		];
	}, []);
	const handleAction = useCallback((action) => {
		api$1?.contextMenuAction?.(action);
	}, []);
	return /* @__PURE__ */ jsx(ContextMenu, {
		x,
		y,
		items,
		reportHitbox: true,
		onAction: handleAction,
		onClose
	});
}
// src/dragGrip.ts
/**
* Where the cursor grips the pet while dragging: dead centre, always.
*
* This used to be an art-relative offset near the ghost's front, mirrored with the
* body — which meant the pet hung off the pointer at an angle that changed with
* facing, and the drag needed its own "held" drawing to look deliberate. With one
* body and a centred grip the ghost simply follows the cursor, which is also the
* only sane answer for a custom pack whose art we know nothing about.
*/
function dragGrip(_opts = {}) {
	return {
		x: 64,
		y: 64
	};
}
// src/useDrag.ts
/**
* useDrag — Handles all drag behavior including cross-display drag support.
* Manages pet position state, mousedown/mousemove/mouseup handlers,
* position clamping, edge snap detection, and main-process drag polling
* for cross-display transfers.
*/
var api = petBridge;
/** Vertical grip and the horizontal inset now live in shared/dragGrip.ts, which
*  mirrors the grip with the art and centres it for custom packs. */
function useDrag(initialPos, options) {
	const [pos, setPos] = useState(initialPos);
	const [posReady, setPosReady] = useState(false);
	const [isDragging, setIsDragging] = useState(false);
	const dragging = useRef(false);
	const dragOffset = useRef({
		x: 0,
		y: 0
	});
	const dragPollingStarted = useRef(false);
	const posRef = useRef(pos);
	posRef.current = pos;
	const dragStartPt = useRef({
		x: 0,
		y: 0
	});
	const dragEnteredRef = useRef(false);
	const optionsRef = useRef(options);
	optionsRef.current = options;
	useEffect(() => {
		setTimeout(() => {
			api?.getWindowPosition?.().then((p) => {
				if (p) {
					const x = Math.max(0, Math.min(window.innerWidth - 128, p.x));
					const y = Math.max(0, Math.min(window.innerHeight - 128, p.y));
					setPos({
						x,
						y
					});
					setPosReady(true);
					const edgeThreshold = 40;
					if (optionsRef.current.allowPeek) {
						if (x <= edgeThreshold) {
							optionsRef.current.setHideEdge("left");
							optionsRef.current.setIsPeeking(true);
						} else if (x >= window.innerWidth - 128 - edgeThreshold) {
							optionsRef.current.setHideEdge("right");
							optionsRef.current.setIsPeeking(true);
						}
					}
				} else {
					setPos({
						x: 0,
						y: Math.floor(window.innerHeight - 128 - 80)
					});
					if (optionsRef.current.allowPeek) {
						optionsRef.current.setHideEdge("left");
						optionsRef.current.setIsPeeking(true);
					}
					setPosReady(true);
				}
			}).catch(() => {
				setPos({
					x: 0,
					y: Math.floor(window.innerHeight - 128 - 80)
				});
				if (optionsRef.current.allowPeek) {
					optionsRef.current.setHideEdge("left");
					optionsRef.current.setIsPeeking(true);
				}
				setPosReady(true);
			});
		}, 300);
	}, []);
	const onMouseDown = useCallback((e) => {
		if (e.button !== 0) return;
		dragging.current = true;
		dragEnteredRef.current = false;
		dragStartPt.current = {
			x: e.clientX,
			y: e.clientY
		};
		dragOffset.current = {
			x: e.clientX - posRef.current.x,
			y: e.clientY - posRef.current.y
		};
		dragPollingStarted.current = false;
		optionsRef.current.clearPersistentMood();
		if (optionsRef.current.displayState === "offline") optionsRef.current.setDisplayState("idle");
		e.preventDefault();
	}, []);
	useEffect(() => {
		const off = api?.onDragUpdate?.((x, y) => {
			if (!dragging.current) return;
			if (optionsRef.current.isPeekingRef.current) {
				optionsRef.current.setIsPeeking(false);
				optionsRef.current.setHideEdge(null);
			}
			setPos({
				x,
				y
			});
		});
		return () => {
			off?.();
		};
	}, []);
	useEffect(() => {
		const off = api?.onDragEnded?.((x, y) => {
			dragging.current = false;
			setIsDragging(false);
			dragEnteredRef.current = false;
			const edgeThreshold = 40;
			let fx = Math.max(-64, Math.min(window.innerWidth - 64, x));
			const fy = Math.max(0, Math.min(window.innerHeight - 128, y));
			const atLeft = fx <= edgeThreshold;
			const atRight = fx >= window.innerWidth - 128 - edgeThreshold;
			if (atLeft) fx = 0;
			if (atRight) fx = window.innerWidth - 128;
			setPos({
				x: fx,
				y: fy
			});
			api?.savePosition?.(fx, fy);
			if (optionsRef.current.allowPeek && (atLeft || atRight)) {
				optionsRef.current.setHideEdge(atLeft ? "left" : "right");
				optionsRef.current.setIsPeeking(true);
			} else if (optionsRef.current.isPeekingRef.current) {
				optionsRef.current.setIsPeeking(false);
				optionsRef.current.setHideEdge(null);
			}
		});
		return () => {
			off?.();
		};
	}, []);
	useEffect(() => {
		let dragStuckTimer = null;
		const resetStuckTimer = () => {
			if (dragStuckTimer) clearTimeout(dragStuckTimer);
			if (dragging.current) dragStuckTimer = setTimeout(() => {
				if (dragging.current) onUp();
			}, 2e3);
		};
		const onMove = (e) => {
			if (!dragging.current) return;
			resetStuckTimer();
			if (!dragEnteredRef.current) {
				const dx = e.clientX - dragStartPt.current.x;
				const dy = e.clientY - dragStartPt.current.y;
				if (Math.hypot(dx, dy) < 6) return;
				dragEnteredRef.current = true;
				setIsDragging(true);
				dragOffset.current = optionsRef.current.getGrip();
			}
			if (!dragPollingStarted.current) {
				dragPollingStarted.current = true;
				api?.dragStart?.(dragOffset.current.x, dragOffset.current.y);
			}
			const rawX = e.clientX - dragOffset.current.x;
			const rawY = e.clientY - dragOffset.current.y;
			const x = Math.max(-64, Math.min(window.innerWidth - 64, rawX));
			const y = Math.max(0, Math.min(window.innerHeight - 128, rawY));
			setPos({
				x,
				y
			});
		};
		const onUp = () => {
			if (dragStuckTimer) {
				clearTimeout(dragStuckTimer);
				dragStuckTimer = null;
			}
			if (dragPollingStarted.current) {
				api?.dragEnd?.();
				dragPollingStarted.current = false;
			}
			if (!dragging.current) return;
			dragging.current = false;
			setIsDragging(false);
			dragEnteredRef.current = false;
			setPos((p) => {
				const edgeThreshold = 40;
				let x = Math.max(-64, Math.min(window.innerWidth - 64, p.x));
				const y = Math.max(0, Math.min(window.innerHeight - 128, p.y));
				const atLeft = x <= edgeThreshold;
				const atRight = x >= window.innerWidth - 128 - edgeThreshold;
				if (atLeft) x = 0;
				if (atRight) x = window.innerWidth - 128;
				const newPos = {
					x,
					y
				};
				api?.savePosition?.(x, y);
				if (optionsRef.current.allowPeek && (atLeft || atRight)) {
					optionsRef.current.setHideEdge(atLeft ? "left" : "right");
					optionsRef.current.setIsPeeking(true);
				} else if (optionsRef.current.isPeekingRef.current) {
					optionsRef.current.setIsPeeking(false);
					optionsRef.current.setHideEdge(null);
				}
				return newPos;
			});
		};
		window.addEventListener("mousemove", onMove);
		window.addEventListener("mouseup", onUp);
		return () => {
			window.removeEventListener("mousemove", onMove);
			window.removeEventListener("mouseup", onUp);
			if (dragStuckTimer) clearTimeout(dragStuckTimer);
		};
	}, []);
	return {
		pos,
		setPos,
		onMouseDown,
		dragging,
		dragPollingStarted,
		posReady,
		isDragging
	};
}
/** The companion's own rect, from its rendered position and shared size. */
function petHitbox(pos) {
	return {
		x: pos.x,
		y: pos.y,
		w: 128,
		h: 128
	};
}
/**
* The bubble's rect, from the measured placement rectangle, or null when no
* bubble is showing. The tail padding is folded into the height.
*/
function bubbleHitbox(rect) {
	if (!rect) return null;
	return {
		x: rect.left,
		y: rect.top,
		w: rect.right - rect.left,
		h: rect.bottom - rect.top + 12
	};
}
// src/useMouseForward.ts
/**
* useMouseForward — reports the companion's and bubble's hitboxes to the main
* process, which polls the cursor at ~60fps and toggles ignore-mouse itself.
*
* Ported from the desktop app's `src/renderer/hooks/useMouseForward.ts`. The
* header there says it plainly: sending the hitbox rects and letting the main
* process do the hit-test "eliminates the IPC round-trip delay that caused clicks
* on the pet body to pass through to windows behind." That round-trip is exactly
* the bug this fixes — the old pointer-enter/leave `setInteractive` call had to
* make it to the main process and back before the window accepted input, so a
* fast click landed while the window was still click-through.
*
* Adapted to this build's single-active-overlay model:
*   - The main process picks ONE active display and signals each overlay
*     (onSetActive), so only the active overlay describes a companion. When
*     inactive this hook clears its hitbox once (updateHitbox(null, null)) and goes
*     silent, so a background display never claims cursor input — that is the
*     `isActive` gating restored here, which the earlier single-display port had
*     dropped.
*   - The source SKIPS sending while dragging because its main process runs a
*     separate drag poll that owns ignore-mouse during a drag. This build has no
*     such poll, so we do the opposite and keep sending: the companion's rect
*     tracks the cursor during a drag (the grab offset is constant, so the cursor
*     stays within the 128px box), which keeps the window interactive for the
*     whole gesture and lets mouseup land.
*   - The menu rect is reported separately via `petBridge.setMenuHitbox` from the
*     context-menu component, so it is not a parameter here.
*/
function useMouseForward({ pos, bubbleRect, dragging, isActive }) {
	const lastPet = useRef("");
	const lastBubble = useRef("");
	const clearedInactive = useRef(false);
	const [tick, setTick] = useState(0);
	useEffect(() => {
		if (!isActive) {
			if (!clearedInactive.current) {
				clearedInactive.current = true;
				lastPet.current = "";
				lastBubble.current = "";
				petBridge.updateHitbox?.(null, null);
			}
			return;
		}
		clearedInactive.current = false;
		const pet = petHitbox(pos);
		const bubble = bubbleHitbox(bubbleRect);
		const petKey = `${pet.x},${pet.y},${tick}`;
		const bubbleKey = bubble ? `${bubble.x},${bubble.y},${bubble.w},${bubble.h}` : "";
		if (petKey === lastPet.current && bubbleKey === lastBubble.current) return;
		lastPet.current = petKey;
		lastBubble.current = bubbleKey;
		petBridge.updateHitbox?.(pet, bubble);
	}, [
		pos,
		bubbleRect,
		tick,
		isActive
	]);
	useEffect(() => {
		if (!bubbleRect) return;
		const id = window.setInterval(() => setTick((t) => t + 1), 2e3);
		return () => window.clearInterval(id);
	}, [bubbleRect]);
	useEffect(() => {
		if (!isActive) return;
		const onUp = () => {
			requestAnimationFrame(() => {
				if (dragging.current) return;
				lastPet.current = "";
				lastBubble.current = "";
				petBridge.updateHitbox?.(petHitbox(pos), bubbleHitbox(bubbleRect));
			});
		};
		window.addEventListener("mouseup", onUp);
		return () => window.removeEventListener("mouseup", onUp);
	}, [
		pos,
		bubbleRect,
		dragging,
		isActive
	]);
}
// src/bubble.css?inline
var bubble_default = "/*\n * The companion's speech bubble.\n *\n * Extracted from the desktop app's `BubbleOverlay` inside PetWidget, where it lived\n * as a local component. The rules it renders come from `notificationPolicy`: how long\n * the bubble stays, whether it shows a depleting countdown, and whether it offers a\n * call to action.\n *\n * Kept as its own stylesheet rather than inline strings because the i18n gate reads\n * CSS held in TypeScript as untranslated prose.\n */\n\n@keyframes ccBubbleCountdown {\n  from { transform: scaleX(1); }\n  to { transform: scaleX(0); }\n}\n\n@keyframes ccBubbleIn {\n  from { opacity: 0; transform: translateY(8px); }\n  to { opacity: 1; transform: translateY(0); }\n}\n\n@keyframes ccBubbleOut {\n  from { opacity: 1; transform: translateY(0); }\n  to { opacity: 0; transform: translateY(-8px); }\n}\n\n.cc-bubble-wrap {\n  /* Holds the bubble box and its arrow together, and carries the entry/exit\n     animation so the two move as one. No overflow clip here, so the arrow — which\n     sits half a step below the box — is never cut off. */\n  position: relative;\n  width: fit-content;\n  animation: ccBubbleIn 0.3s ease-out;\n}\n\n.cc-bubble-wrap.cc-bubble-out {\n  animation: ccBubbleOut 0.3s ease-in forwards;\n}\n\n.cc-bubble {\n  /* 240px cap, from BUBBLE_W. Narrower than the panel on purpose: a bubble is a\n     glance, and a wide one beside the companion reads as a dialog. */\n  max-width: 240px;\n  width: fit-content;\n  box-sizing: border-box;\n  /* A column keeps the message and action together while giving the footer a full-width divider. */\n  display: flex;\n  flex-direction: column;\n  border-radius: 14px;\n  /* Joins the dashboard's SURFACE language instead of reading as a paper note. The\n     hairline is what makes the divided footer legible; `--card` alone had no edge. */\n  background: var(--bg-elevated, var(--card, #22222a));\n  border: 1px solid var(--border, rgba(255, 255, 255, 0.10));\n  color: var(--text, var(--card-fg, #e8e8ea));\n  font: 13px/1.5 var(--cc-panel-font);\n  text-align: left;\n  cursor: pointer;\n  box-shadow: 0 6px 20px var(--shadow, rgba(0, 0, 0, 0.45));\n  position: relative;\n  overflow: hidden;\n}\n\n/* The message row owns the countdown's positioning context. */\n.cc-bubble-body-row {\n  display: flex;\n  align-items: flex-start;\n  gap: 8px;\n  padding: 10px 14px 13px;\n  position: relative;\n}\n\n/* The full-width action stays visibly attached to the notification it resolves. */\n.cc-bubble-foot {\n  display: flex;\n}\n\n/*\n * No arrow.\n *\n * There used to be a small triangle under the bubble pointing at the companion. It\n * is gone by design decision, not by accident: the bubble already sits directly\n * above the companion, so the pointer added a second, fussier shape to read without\n * telling the user anything the position did not.\n *\n * Worth knowing if anyone reinstates it: the selector was once declared TWICE — a\n * rotated square and a border-drawn triangle — and CSS merged them per-property\n * instead of picking one, leaving a stray white rectangle hanging under the bubble.\n * Same failure shape as a duplicate key in an object literal: no error, just the\n * wrong hybrid. If it comes back, it gets exactly one declaration.\n */\n\n.cc-bubble-arrow-out {\n  animation: ccBubbleOut 0.22s ease-in forwards;\n}\n\n/*\n * The dismiss affordance appears on hover only.\n *\n * An always-visible ✕ reads as a task waiting to be cleared, which is the opposite\n * of what an ambient companion should feel like. A bubble that never times out\n * (a reminder, or blocked work) shows none at all — it is resolved through its CTA\n * or by being dealt with, not by being tidied away.\n */\n.cc-bubble-x {\n  /* A flex child, not an absolutely-positioned overlay: it reserves its own space\n     so a narrow bubble's text is pushed aside rather than covered. */\n  flex-shrink: 0;\n  width: 18px;\n  height: 18px;\n  margin-top: -1px;\n  /* Hidden until the pointer is on the bubble: an always-visible ✕ on an ambient\n     companion reads as clutter, and the bubble body is clickable to dismiss anyway.\n\n     No keyboard path is being given up here. This component renders only in the pet\n     overlay, whose window is created with `setFocusable(false)`, so that window never\n     takes keyboard focus and nothing in it was ever tab-reachable — an always-visible\n     ✕ was a visible affordance, not an accessible one. The `:focus-visible` rule below\n     is kept for the day this renders somewhere focusable; it cannot fire in the\n     overlay. */\n  opacity: 0;\n  transition: opacity 0.12s ease-out;\n  display: inline-flex;\n  align-items: center;\n  justify-content: center;\n  border: none;\n  background: none;\n  /* The bubble's own text colour at low opacity, brightening on hover — a fixed\n     grey neither matches the bubble nor acknowledges the pointer. */\n  color: var(--card-fg, #e8e8ea);\n  font-size: 11px;\n  line-height: 1;\n  padding: 0;\n  cursor: pointer;\n}\n\n/* Takes the remaining width so the ✕ never sits on the words. */\n.cc-bubble-text {\n  flex: 1;\n  min-width: 0;\n  /* A session title can carry a URL or a token. Without this the box's own\n     overflow:hidden clips it at the 240px cap instead of wrapping it. */\n  overflow-wrap: anywhere;\n}\n\n/*\n * The kicker: a small upper-case label above the body.\n *\n * Its whole job is to be subordinate — read as context, not as the message. Hence\n * 10px/800 with letter-spacing and reduced opacity, and a heavier body beneath it so\n * the two do not compete.\n */\n.cc-bubble-kicker {\n  font: 800 10px/1.3 var(--cc-panel-font);\n  letter-spacing: 0.05em;\n  text-transform: uppercase;\n  opacity: 0.75;\n  margin-bottom: 2px;\n}\n\n.cc-bubble-body {\n  font: 600 13px/1.4 var(--cc-panel-font);\n}\n\n/* Brighten on bubble hover so the pointer path still gets its acknowledgement. */\n.cc-bubble-wrap:hover .cc-bubble-x {\n  opacity: 0.8;\n}\n\n.cc-bubble-x:hover {\n  opacity: 1;\n}\n\n/* Keyboard path: a visible ring only for keyboard focus (not mouse clicks). */\n.cc-bubble-x:focus-visible {\n  opacity: 1;\n  outline: 2px solid var(--card-fg, #e8e8ea);\n  outline-offset: 1px;\n  border-radius: 4px;\n}\n\n.cc-bubble-cta {\n  /* The full-width row is both the visual footer and the interaction target. */\n  flex: 1;\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 8px;\n  background: none;\n  border: none;\n  border-top: 1px solid var(--border, rgba(255, 255, 255, 0.10));\n  padding: 9px 14px;\n  color: var(--text, var(--card-fg, #e8e8ea));\n  font: 600 12px/1 var(--cc-panel-font);\n  text-align: left;\n  cursor: pointer;\n}\n\n.cc-bubble-cta .lucide-inline {\n  width: 13px;\n  height: 13px;\n  flex-shrink: 0;\n}\n\n.cc-bubble-cta:hover {\n  /* The row is the target, so the row is what responds. */\n  background: color-mix(in srgb, var(--text, #e8e8ea) 7%, transparent);\n}\n\n.cc-bubble-cta:focus-visible {\n  outline: 2px solid var(--text, var(--card-fg, #e8e8ea));\n  outline-offset: -2px;\n}\n\n/*\n * The depleting bar: how long is left before the bubble goes.\n *\n * Only for bubbles that DO time out. Showing one on a bubble that waits for the user\n * would promise it is about to leave, and it is not.\n */\n.cc-bubble-countdown {\n  /* Pinned to the MESSAGE ROW's bottom edge, inside the card.\n\n     Its positioning parent is `.cc-bubble-body-row`, not the card. That distinction is\n     load-bearing now the card has a footer: anchored to the card it would slide down\n     under the divider and sit on top of the action row.\n\n     It used to be a block element below the box, and there it was invisible: these\n     colours are mixed from `--card-fg`, the bubble's dark ink, which only reads\n     against the bubble's light surface. Below the box there is no surface — just the\n     transparent overlay over the user's desktop — so a dark bar at 18%/55% over a\n     dark desktop showed as nothing.\n\n     Inset from both sides so the 14px corner radius never clips it, which is the\n     reason it was moved out of the card in the first place. */\n  position: absolute;\n  left: 14px;\n  right: 14px;\n  bottom: 5px;\n  height: 3px;\n  border-radius: 999px;\n  background: color-mix(in srgb, var(--card-fg, #e8e8ea) 18%, transparent);\n  overflow: hidden;\n  transform-origin: left center;\n}\n\n.cc-bubble-countdown::after {\n  content: '';\n  display: block;\n  height: 100%;\n  border-radius: inherit;\n  background: color-mix(in srgb, var(--card-fg, #e8e8ea) 55%, transparent);\n  transform-origin: left center;\n  animation: inherit;\n}\n\n/* Hovering holds both the dismissal and the bar, so reading it cannot lose it. */\n.cc-bubble-wrap:hover .cc-bubble-countdown {\n  animation-play-state: paused;\n}\n\n@media (prefers-reduced-motion: reduce) {\n  .cc-bubble-wrap,\n  .cc-bubble-wrap.cc-bubble-out { animation: none; }\n  .cc-bubble-countdown { animation: none; opacity: 0.3; }\n}\n";
// src/notificationPolicy.ts
/**
* "Session done" is a glance — 6s, unchanged from the desktop app because nothing
* about it needed fixing.
*/
var SESSION_DONE_MS = 6e3;
/**
* A break nudge lives far longer than a session notification: it is asking you to
* change what you are doing, which takes longer to register than "your task
* finished". Long enough to notice mid-sentence, short enough that an ignored nudge
* clears itself rather than becoming another thing to dismiss.
*/
var BREAK_MS = 45e3;
function policyFor(kind) {
	switch (kind) {
		case "break": return {
			dismissMs: BREAK_MS,
			countdown: true,
			ctaKey: null,
			action: null
		};
		case "break-breathe": return {
			dismissMs: BREAK_MS,
			countdown: true,
			ctaKey: "apps.crewCompanion.breathe.start",
			action: "breathe"
		};
		case "reminder": return {
			dismissMs: null,
			countdown: false,
			ctaKey: null,
			action: null
		};
		case "session-input":
		case "session-error":
		case "approval": return {
			dismissMs: null,
			countdown: false,
			ctaKey: "apps.crewCompanion.notif.open_session",
			action: "open-session"
		};
		default: return {
			dismissMs: SESSION_DONE_MS,
			countdown: false,
			ctaKey: null,
			action: null
		};
	}
}
/**
* True when this kind holds the slot and offers NO ✕ — it leaves by being resolved.
*
* Deliberately NOT the same predicate as `isPersistent`, though the two are easy to
* confuse and conflating them is a real bug this file has already caused: a reminder
* is persistent (it never auto-dismisses, because a time you chose must not expire
* unseen) but it is NOT sticky, so it must still offer the hover ✕. Gating the ✕ on
* persistence instead of stickiness left a fired reminder on screen with no way to
* close it — the bubble simply could not be got rid of.
*
* Sticky is about UNRESOLVED WORK: blocked, needs input, needs approval. Offering a
* tidy-away button there invites dismissing the thing you still have to do, so those
* are cleared through their CTA. One definition, exported, because the slot logic and
* the bubble UI must agree on it.
*/
function isSticky(kind) {
	return kind === "approval" || kind === "session-input";
}
// src/Bubble.tsx
/**
* The companion's speech bubble, with the timing and affordances each kind of
* notification actually warrants.
*
* Ported from `BubbleOverlay` in the desktop app's PetWidget. What matters here is
* that the bubble is NOT one uniform toast: `notificationPolicy` decides how long it
* stays, whether a depleting bar shows that time passing, and whether there is a way
* to act on it. A reminder the user set waits indefinitely; a break nudge clears
* itself; blocked work offers a route in and never expires.
*
* Hovering pauses both the dismissal and the bar — reading a bubble must not be the
* thing that loses it.
*/
injectCss("bubble", bubble_default);
/** Exit animation duration; the unmount waits exactly this long. */
var EXIT_MS = 300;
/** True for a value that reports its outcome later. */
function isThenable(v) {
	return typeof v?.then === "function";
}
function Bubble({ text, kind, onDismiss, onAction }) {
	const policy = policyFor(kind);
	const [leaving, setLeaving] = useState(false);
	const [paused, setPaused] = useState(false);
	const timer = useRef(null);
	/**
	* The dismissal timer, held while the pointer is over the bubble.
	*
	* Restarted rather than resumed on leave: the remaining time is not worth tracking
	* precisely, and a full window after the user looks away is the friendlier error.
	*/
	useEffect(() => {
		if (policy.dismissMs === null || paused) return;
		timer.current = window.setTimeout(() => setLeaving(true), policy.dismissMs);
		return () => {
			if (timer.current !== null) window.clearTimeout(timer.current);
		};
	}, [policy.dismissMs, paused]);
	useEffect(() => {
		if (!leaving) return;
		const t = window.setTimeout(onDismiss, EXIT_MS);
		return () => window.clearTimeout(t);
	}, [leaving, onDismiss]);
	const nl = text.indexOf("\n");
	const kicker = nl > 0 && nl <= 40 ? text.slice(0, nl).trim() : "";
	const body = kicker ? text.slice(nl + 1).trim() : text;
	return /* @__PURE__ */ jsx("div", {
		role: "presentation",
		className: `cc-bubble-wrap${leaving ? " cc-bubble-out" : ""}`,
		onClick: isSticky(kind) ? void 0 : () => setLeaving(true),
		onMouseEnter: () => setPaused(true),
		onMouseLeave: () => setPaused(false),
		children: /* @__PURE__ */ jsxs("div", {
			className: "cc-bubble",
			role: "status",
			"data-kind": kind,
			children: [/* @__PURE__ */ jsxs("div", {
				className: "cc-bubble-body-row",
				children: [
					/* @__PURE__ */ jsxs("div", {
						className: "cc-bubble-text",
						children: [kicker ? /* @__PURE__ */ jsx("div", {
							className: "cc-bubble-kicker",
							children: kicker
						}) : null, /* @__PURE__ */ jsx("div", {
							className: kicker ? "cc-bubble-body" : void 0,
							children: body
						})]
					}),
					!isSticky(kind) ? /* @__PURE__ */ jsx("button", {
						type: "button",
						className: "cc-bubble-x",
						"aria-label": i18nT("apps.crewCompanion.panel.close"),
						onClick: (e) => {
							e.stopPropagation();
							setLeaving(true);
						},
						children: /* @__PURE__ */ jsx(X, {
							size: 12,
							"aria-hidden": "true"
						})
					}) : null,
					policy.countdown && policy.dismissMs !== null ? /* @__PURE__ */ jsx("span", {
						className: "cc-bubble-countdown",
						style: { animation: `ccBubbleCountdown ${policy.dismissMs}ms linear forwards` },
						"aria-hidden": "true"
					}) : null
				]
			}), policy.ctaKey ? /* @__PURE__ */ jsx("div", {
				className: "cc-bubble-foot",
				children: /* @__PURE__ */ jsxs("button", {
					type: "button",
					className: "cc-bubble-cta",
					onClick: (e) => {
						e.stopPropagation();
						if (!policy.action) {
							setLeaving(true);
							return;
						}
						const outcome = onAction?.(policy.action);
						if (isThenable(outcome)) {
							outcome.then((ok) => {
								if (ok !== false) setLeaving(true);
							}, () => {});
							return;
						}
						if (outcome !== false) setLeaving(true);
					},
					children: [/* @__PURE__ */ jsx("span", { children: i18nT(policy.ctaKey) }), /* @__PURE__ */ jsx(ArrowRight, {
						className: "lucide-inline",
						"aria-hidden": "true"
					})]
				})
			}) : null]
		})
	});
}
// src/bubbleLayout.ts
/** Default configuration constants. */
var BUBBLE_LAYOUT_DEFAULTS = {
	margin: 12,
	gap: 20,
	minGap: 10,
	maxGap: 20,
	petPadding: 10,
	jitterX: 24,
	jitterY: 14,
	minWidth: 180,
	maxWidth: 280,
	widthStep: 24,
	gapGrowthFactor: .1
};
/** Clamp value into [min, max]; when max < min, return min. */
function clamp(value, min, max) {
	if (max < min) return min;
	return Math.max(min, Math.min(max, value));
}
/** Expand a rectangle by padding pixels on all four sides. */
function expandRect(rect, padding) {
	return {
		left: rect.left - padding,
		top: rect.top - padding,
		right: rect.right + padding,
		bottom: rect.bottom + padding
	};
}
/** Overlap area of two rectangles; 0 when they do not overlap. */
function rectOverlapArea(a, b) {
	return Math.max(0, Math.min(a.right, b.right) - Math.max(a.left, b.left)) * Math.max(0, Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top));
}
/** Dynamically compute the gap between bubble and companion from the bubble's height. */
function resolveBubbleGap(anchorRect, bubbleHeight, options) {
	const minGap = options?.minGap ?? BUBBLE_LAYOUT_DEFAULTS.minGap;
	const maxGap = options?.maxGap ?? BUBBLE_LAYOUT_DEFAULTS.maxGap;
	const gapGrowthFactor = options?.gapGrowthFactor ?? BUBBLE_LAYOUT_DEFAULTS.gapGrowthFactor;
	const heightThreshold = options?.heightThreshold ?? anchorRect.height * .5;
	const heightOffset = Math.max(0, bubbleHeight - heightThreshold);
	return clamp(Math.round(minGap + heightOffset * gapGrowthFactor), minGap, maxGap);
}
/** Build three candidate placements above the companion. */
function buildBubbleCandidates(anchorRect, bubbleWidth, bubbleHeight, jitterX, jitterY, gap) {
	const cx = anchorRect.left + anchorRect.width / 2;
	return [
		{
			name: "top",
			left: cx - bubbleWidth / 2 + jitterX,
			top: anchorRect.top - bubbleHeight - gap + jitterY,
			targetX: cx,
			targetY: anchorRect.top,
			arrowSide: "bottom",
			bias: 0
		},
		{
			name: "top-right",
			left: anchorRect.right - 36 + jitterX,
			top: anchorRect.top - bubbleHeight - gap + jitterY,
			targetX: anchorRect.right - anchorRect.width * .24,
			targetY: anchorRect.top,
			arrowSide: "bottom",
			bias: 2
		},
		{
			name: "top-left",
			left: anchorRect.left - bubbleWidth + 36 + jitterX,
			top: anchorRect.top - bubbleHeight - gap + jitterY,
			targetX: anchorRect.left + anchorRect.width * .24,
			targetY: anchorRect.top,
			arrowSide: "bottom",
			bias: 2
		}
	];
}
/** Clamp a candidate placement within the screen bounds and return the final rectangle. */
function resolveBubbleRectWithinBounds(candidate, bubbleWidth, bubbleHeight, boundsRect, margin) {
	const minLeft = boundsRect.left + margin;
	const maxLeft = boundsRect.right - bubbleWidth - margin;
	const minTop = boundsRect.top + margin;
	const maxTop = boundsRect.bottom - bubbleHeight - margin;
	const left = clamp(candidate.left, minLeft, maxLeft);
	const top = clamp(candidate.top, minTop, maxTop);
	return {
		left,
		top,
		right: left + bubbleWidth,
		bottom: top + bubbleHeight
	};
}
/** Convenience version with the origin (0,0) as the top-left corner. */
function resolveBubbleRect(candidate, bubbleWidth, bubbleHeight, boundsWidth, boundsHeight, margin) {
	return resolveBubbleRectWithinBounds(candidate, bubbleWidth, bubbleHeight, {
		left: 0,
		top: 0,
		right: boundsWidth,
		bottom: boundsHeight
	}, margin);
}
/** Score a candidate placement (lower is better). */
function scoreBubblePlacementWithinBounds(candidate, bubbleWidth, bubbleHeight, boundsRect, avoidRect, margin) {
	const bubbleRect = resolveBubbleRectWithinBounds(candidate, bubbleWidth, bubbleHeight, boundsRect, margin);
	const overlapArea = rectOverlapArea(bubbleRect, avoidRect);
	const clampPenalty = Math.abs(bubbleRect.left - candidate.left) + Math.abs(bubbleRect.top - candidate.top);
	return (candidate.bias || 0) + clampPenalty * 2 + (overlapArea > 0 ? 1e5 + overlapArea : 0);
}
/** Pick the best bubble placement (combines all the steps). */
function pickBubblePlacementWithinBounds(anchorRect, bubbleWidth, bubbleHeight, boundsRect, options) {
	const margin = options?.margin || BUBBLE_LAYOUT_DEFAULTS.margin;
	const petPadding = options?.petPadding || BUBBLE_LAYOUT_DEFAULTS.petPadding;
	const jitterXRange = options?.jitterX || BUBBLE_LAYOUT_DEFAULTS.jitterX;
	const jitterYRange = options?.jitterY || BUBBLE_LAYOUT_DEFAULTS.jitterY;
	const random = options?.random || Math.random;
	let gap = options?.gap;
	if (gap == null) gap = resolveBubbleGap(anchorRect, bubbleHeight, options);
	const jitterX = Math.round((random() - .5) * jitterXRange);
	const jitterY = Math.round((random() - .5) * jitterYRange);
	const avoidRect = expandRect(anchorRect, petPadding);
	const candidates = buildBubbleCandidates(anchorRect, bubbleWidth, bubbleHeight, jitterX, jitterY, gap);
	candidates.sort((a, b) => scoreBubblePlacementWithinBounds(a, bubbleWidth, bubbleHeight, boundsRect, avoidRect, margin) - scoreBubblePlacementWithinBounds(b, bubbleWidth, bubbleHeight, boundsRect, avoidRect, margin));
	const bestScore = scoreBubblePlacementWithinBounds(candidates[0], bubbleWidth, bubbleHeight, boundsRect, avoidRect, margin);
	const viable = candidates.filter((candidate) => scoreBubblePlacementWithinBounds(candidate, bubbleWidth, bubbleHeight, boundsRect, avoidRect, margin) <= bestScore + 6);
	return viable[Math.floor(random() * viable.length)];
}
/** Convenience wrapper with the origin (0,0) as the top-left corner. */
function pickBubblePlacement(anchorRect, bubbleWidth, bubbleHeight, boundsWidth, boundsHeight, options) {
	return pickBubblePlacementWithinBounds(anchorRect, bubbleWidth, bubbleHeight, {
		left: 0,
		top: 0,
		right: boundsWidth,
		bottom: boundsHeight
	}, options);
}
/** Copy for N collapsed completions, translated with a {{count}} placeholder. */
function collapsedText(count) {
	return i18nT("apps.crewCompanion.notif.jobs_finished", { count });
}
/**
* Decide the slot's next state when a bubble arrives.
*
* @param current  What currently occupies the slot (null when free).
* @param incoming The arriving bubble.
* @param now      ms epoch.
*/
function nextBubble(current, incoming, now) {
	if (!!incoming.sticky) {
		const pending = {
			text: incoming.text,
			sticky: true,
			count: 1,
			at: now,
			kind: incoming.kind
		};
		return {
			pending,
			show: pending.text
		};
	}
	if (current && !current.sticky) {
		const count = current.count + 1;
		const pending = {
			text: collapsedText(count),
			sticky: false,
			count,
			at: now
		};
		return {
			pending,
			show: pending.text
		};
	}
	if (current?.sticky && now - current.at < 9e4) return {
		pending: current,
		show: null
	};
	const pending = {
		text: incoming.text,
		sticky: false,
		count: 1,
		at: now
	};
	return {
		pending,
		show: pending.text
	};
}
// src/useMood.ts
/**
* useMood — pet mood state with transient/persistent switching and an auto-reset
* timer for transient moods.
*
* Ported verbatim from the desktop app's src/renderer/hooks/useMood.ts — the
* 3-second transient duration and the transient-mood set are unchanged. The only
* adaptation is the import path for PetMood (./types here, ../../shared/types there).
*/
var MOOD_DURATION_MS = 3e3;
var TRANSIENT_MOODS = /* @__PURE__ */ new Set([
	"happy",
	"scared",
	"curious"
]);
function useMood() {
	const [mood, setMoodState] = useState("neutral");
	const moodRef = useRef("neutral");
	const moodTimerRef = useRef(null);
	const setMood = useCallback((m) => {
		moodRef.current = m;
		setMoodState(m);
		if (moodTimerRef.current) {
			clearTimeout(moodTimerRef.current);
			moodTimerRef.current = null;
		}
		if (m !== "neutral" && TRANSIENT_MOODS.has(m)) moodTimerRef.current = setTimeout(() => {
			moodRef.current = "neutral";
			setMoodState("neutral");
		}, MOOD_DURATION_MS);
	}, []);
	const clearPersistentMood = useCallback(() => {
		setMoodState((prev) => {
			if (prev !== "neutral" && !TRANSIENT_MOODS.has(prev)) {
				moodRef.current = "neutral";
				return "neutral";
			}
			return prev;
		});
	}, []);
	useEffect(() => () => {
		if (moodTimerRef.current) clearTimeout(moodTimerRef.current);
	}, []);
	return {
		mood,
		moodRef,
		clearPersistentMood,
		setMood
	};
}
// src/useEdgeHide.ts
/**
* useEdgeHide — Manages edge hide/peek state for the companion.
*
* Tracks whether the companion is tucked at a screen edge (`hideEdge`) and whether
* it is peeking (`isPeeking`), and exposes a mirror `isPeekingRef` that `setIsPeeking`
* updates SYNCHRONOUSLY. That synchronous update is the point of the hook: `useDrag`
* reads `isPeekingRef.current` inside its imperative mouse handlers to decide whether
* to un-dock as a drag begins, so the ref has to be current the instant the state is
* set — not one render later. The overlay used to assign the ref at render time
* (`isPeekingRef.current = isPeeking`), which lagged those imperative reads and left
* the dock state inconsistent.
*
* Ported from the desktop app's src/renderer/hooks/useEdgeHide.ts. Two adaptations
* for this build: there is no separate SVG ref (the avatar reads `docked` from
* `hideEdge` directly), and there is no `crewCompanion.setPeeking` bridge on the
* overlay window, so neither the `isPeekingForSvgRef` parameter nor the bridge call
* is carried over.
*/
function useEdgeHide() {
	const [hideEdge, setHideEdge] = useState(null);
	const [isPeeking, setIsPeekingState] = useState(false);
	const isPeekingRef = useRef(false);
	const setIsPeeking = (v) => {
		isPeekingRef.current = v;
		setIsPeekingState(v);
	};
	return {
		hideEdge,
		isPeeking,
		setIsPeeking,
		setHideEdge,
		isPeekingRef
	};
}
// src/walkMath.ts
/** Which way the art faces for a leg from `fromX` to `toX` (−1 = left, 1 = right). */
function walkDirFor(fromX, toX) {
	return toX < fromX ? -1 : 1;
}
/**
* Body tilt in degrees for a walk leg, clamped to ±6. Only diagonal legs tilt; a
* straight horizontal or vertical leg stays upright — the desktop app treats the
* 30–60° and 120–150° bands as diagonal.
*/
function walkTiltFor(fromX, fromY, toX, toY) {
	const angle = Math.atan2(toY - fromY, toX - fromX) * (180 / Math.PI);
	const absDeg = Math.abs(angle);
	return absDeg > 30 && absDeg < 60 || absDeg > 120 && absDeg < 150 ? Math.max(-6, Math.min(6, angle * .07)) : 0;
}
/** Walk duration in ms: 6ms per pixel of travel, never below 800ms. */
function walkDurationMs(fromX, fromY, toX, toY) {
	const dist = Math.hypot(toX - fromX, toY - fromY);
	return Math.max(800, dist * 6);
}
// src/useWalking.ts
/**
* useWalking — the companion's walk animation, ported from the desktop app and
* adapted to this build's architecture.
*
* ARCHITECTURE DIFFERENCE. In the standalone app the pet was its OWN small window,
* and the MAIN PROCESS moved that window and pushed `onWalk` / `onHide` IPC events
* into the renderer. Here the companion is a DOM element inside one full-display
* transparent overlay, so there is no window to move and no main-process push
* channel: walking instead animates the element's `pos` within the overlay via
* `setPos`, and persistence goes through `petBridge.savePosition` (petX / petY on the
* gateway config) from the caller's `onWalkEnd`.
*
* The MECHANISM changed; the BEHAVIOUR did not. The rAF interpolation, the
* 6ms-per-pixel duration (see walkMath), the diagonal tilt and the waypoint queue are
* all exactly as they shipped, so a hop looks the same as it did in the window model.
* `walkPath` is what the idle fidget drives — a small hop out and straight back home.
*/
function useWalking(pos, setPos, onWalkEnd, setIsPeeking, setHideEdge) {
	const [walkTarget, setWalkTarget] = useState(null);
	const [walkDir, setWalkDir] = useState(1);
	const [walkTilt, setWalkTilt] = useState(0);
	const walkingRef = useRef(false);
	const walkQueueRef = useRef([]);
	const walkRafRef = useRef(0);
	const onWalkEndRef = useRef(onWalkEnd);
	onWalkEndRef.current = onWalkEnd;
	const setIsPeekingRef = useRef(setIsPeeking);
	setIsPeekingRef.current = setIsPeeking;
	const setHideEdgeRef = useRef(setHideEdge);
	setHideEdgeRef.current = setHideEdge;
	const posRef = useRef(pos);
	posRef.current = pos;
	const startWalkTo = (x, y) => {
		walkingRef.current = true;
		setIsPeekingRef.current(false);
		setHideEdgeRef.current(null);
		setPos((cur) => {
			setWalkDir(walkDirFor(cur.x, x));
			setWalkTilt(walkTiltFor(cur.x, cur.y, x, y));
			return cur;
		});
		setWalkTarget({
			x,
			y
		});
	};
	const cancelWalk = () => {
		cancelAnimationFrame(walkRafRef.current);
		walkQueueRef.current = [];
		walkingRef.current = false;
		setWalkTarget(null);
	};
	const walkPath = (points) => {
		if (!points.length) return;
		cancelWalk();
		walkQueueRef.current = points.slice(1);
		startWalkTo(points[0].x, points[0].y);
	};
	useEffect(() => {
		if (!walkTarget) return;
		const startX = posRef.current.x;
		const startY = posRef.current.y;
		const dx = walkTarget.x - startX;
		const dy = walkTarget.y - startY;
		if (Math.hypot(dx, dy) < 5) {
			walkingRef.current = false;
			setWalkTarget(null);
			return;
		}
		const dur = walkDurationMs(startX, startY, walkTarget.x, walkTarget.y);
		const startTime = performance.now();
		const animate = (now) => {
			const t = Math.min(1, (now - startTime) / dur);
			setPos({
				x: startX + dx * t,
				y: startY + dy * t
			});
			if (t < 1) {
				walkRafRef.current = requestAnimationFrame(animate);
				return;
			}
			setPos(walkTarget);
			const next = walkQueueRef.current.shift();
			if (next) startWalkTo(next.x, next.y);
			else {
				walkingRef.current = false;
				const final = walkTarget;
				setWalkTarget(null);
				onWalkEndRef.current(final);
			}
		};
		walkRafRef.current = requestAnimationFrame(animate);
		return () => cancelAnimationFrame(walkRafRef.current);
	}, [walkTarget]);
	return {
		isWalking: walkTarget !== null,
		walkDir,
		walkTilt,
		cancelWalk,
		walkTo: startWalkTo,
		walkPath
	};
}
// src/useIdleFidget.ts
/**
* useIdleFidget — calm, non-intrusive "aliveness".
*
* The ghost stays put at its home spot. On a gentle timer it does a SMALL nearby
* fidget — a little hop a few dozen pixels away and right back home — or a brief
* mood flicker. It never roams across the screen and always returns to where the
* user left it, so it feels alive without being annoying (matches the calm
* desktop-pet convention: subtle in-place motion, not wandering).
*
* Fully local — never touches Kiro Crew — so it keeps working when offline.
* Caller gates it via `enabled` (off while dragging, walking, peeking, focusing,
* or when the quick-menu is open). Much rarer overnight.
*
* Ported verbatim from the desktop app's src/renderer/hooks/useIdleFidget.ts —
* every timing, distance, probability and the overnight rarity is unchanged. The
* only adaptation is the two import paths (PetMood from ./types, PET_W/PET_H from
* ./constants; ../../shared/* there).
*/
var AMBIENT_MOODS = ["curious", "happy"];
/**
* At night the expression is sleepiness rather than curiosity. This is the only
* thing that sets `sleepy`, and it is what makes the sleeping body reachable —
* otherwise that art is wired up and never shown.
*
* `sleepy` is a PERSISTENT mood (not in TRANSIENT_MOODS), so unlike the daytime
* flickers it stays until the user interacts — the ghost dozes off and wakes when
* touched, which is the behaviour we want overnight.
*/
var NIGHT_MOODS = ["sleepy"];
var HOP_MIN = 30;
function useIdleFidget(opts) {
	const enabledRef = useRef(opts.enabled);
	enabledRef.current = opts.enabled;
	const getPosRef = useRef(opts.getPos);
	getPosRef.current = opts.getPos;
	const walkPathRef = useRef(opts.walkPath);
	walkPathRef.current = opts.walkPath;
	const setMoodRef = useRef(opts.setMood);
	setMoodRef.current = opts.setMood;
	const allowMoodRef = useRef(opts.allowMood !== false);
	allowMoodRef.current = opts.allowMood !== false;
	const playFidgetRef = useRef(opts.playFidget);
	playFidgetRef.current = opts.playFidget;
	useEffect(() => {
		let timer;
		const schedule = () => {
			const hour = (/* @__PURE__ */ new Date()).getHours();
			const night = hour >= 23 || hour < 7;
			const base = night ? 6e5 : 15e4;
			const jitter = Math.random() * (night ? 6e5 : 15e4);
			timer = setTimeout(tick, base + jitter);
		};
		/** Change expression: a brief flicker by day, dozing off at night. */
		const flickerMood = (night) => {
			const pool = night ? NIGHT_MOODS : AMBIENT_MOODS;
			setMoodRef.current(pool[Math.floor(Math.random() * pool.length)]);
		};
		/** Hop a few dozen px away, then straight back to where the user left it. */
		const smallHop = () => {
			const home = getPosRef.current();
			const angle = Math.random() * Math.PI * 2;
			const dist = HOP_MIN + Math.random() * 40;
			const maxX = window.innerWidth - 128;
			const maxY = window.innerHeight - 128 - 40;
			const ox = Math.max(0, Math.min(maxX, Math.round(home.x + Math.cos(angle) * dist)));
			const oy = Math.max(0, Math.min(maxY, Math.round(home.y + Math.sin(angle) * dist)));
			walkPathRef.current([{
				x: ox,
				y: oy
			}, {
				x: home.x,
				y: home.y
			}]);
		};
		const tick = () => {
			if (enabledRef.current) {
				const hour = (/* @__PURE__ */ new Date()).getHours();
				const night = hour >= 23 || hour < 7;
				const actions = [smallHop];
				if (allowMoodRef.current) actions.unshift(() => flickerMood(night));
				if (!night) for (const { anim, holdMs } of IDLE_FIDGET_ANIMS) actions.push(() => playFidgetRef.current(anim, holdMs));
				actions[Math.floor(Math.random() * actions.length)]();
			}
			schedule();
		};
		schedule();
		return () => clearTimeout(timer);
	}, []);
}
// src/useRandomClips.ts
/**
* Custom appearance packs replace Kiro's idle-motion pool only when they provide
* random moments of their own. The replacement pool is flat and uniform: Idle plus
* every uploaded moment, so one uploaded clip produces [Idle, clip].
*/
/** `null` is the explicit Idle entry; duplicate names must not gain extra weight. */
function customRandomPool(clips) {
	return [null, ...new Set(clips)];
}
function normaliseCustomRandomNames(animations, randomNames) {
	const listed = Array.isArray(randomNames) ? randomNames.filter((name) => typeof name === "string" && name in animations) : [];
	return [.../* @__PURE__ */ new Set([...animations.walking ? ["walking"] : [], ...listed])];
}
function useRandomClips(opts) {
	const enabledRef = useRef(opts.enabled);
	enabledRef.current = opts.enabled;
	const getClipsRef = useRef(opts.getClips);
	getClipsRef.current = opts.getClips;
	const getPosRef = useRef(opts.getPos);
	getPosRef.current = opts.getPos;
	const walkPathRef = useRef(opts.walkPath);
	walkPathRef.current = opts.walkPath;
	const showIdleRef = useRef(opts.showIdle);
	showIdleRef.current = opts.showIdle;
	const playClipRef = useRef(opts.playClip);
	playClipRef.current = opts.playClip;
	useEffect(() => {
		let timer;
		const schedule = () => {
			const hour = (/* @__PURE__ */ new Date()).getHours();
			const night = hour >= 23 || hour < 7;
			const base = night ? 6e5 : 15e4;
			const jitter = Math.random() * (night ? 6e5 : 15e4);
			timer = setTimeout(tick, base + jitter);
		};
		const tick = () => {
			if (enabledRef.current) {
				const pool = customRandomPool(getClipsRef.current());
				const selected = pool[Math.floor(Math.random() * pool.length)];
				if (selected === null) showIdleRef.current();
				else if (selected === "walking") {
					const home = getPosRef.current();
					const angle = Math.random() * Math.PI * 2;
					const dist = 30 + Math.random() * 40;
					const maxX = window.innerWidth - 128;
					const maxY = window.innerHeight - 128 - 40;
					const ox = Math.max(0, Math.min(maxX, Math.round(home.x + Math.cos(angle) * dist)));
					const oy = Math.max(0, Math.min(maxY, Math.round(home.y + Math.sin(angle) * dist)));
					walkPathRef.current([{
						x: ox,
						y: oy
					}, {
						x: home.x,
						y: home.y
					}]);
				} else playClipRef.current(selected);
			}
			schedule();
		};
		schedule();
		return () => clearTimeout(timer);
	}, []);
}
// src/pet.tsx
/**
* pet.tsx — the companion drawn into its transparent full-screen overlay.
*
* The window is click-through everywhere except the companion itself: the whole
* display is covered, so a window that swallowed clicks would make the desktop
* unusable. `pointer-events: none` on the body plus `auto` on the companion is the
* DOM half of that; the Electron half is `setIgnoreMouseEvents(true, { forward:
* true })` with a hit-test that re-enables input only over the sprite.
*
* Two jobs, both polled because the gateway offers no server-push channel to an
* app's own windows:
*
*   * **presence** — tell the backend someone is here, or break nudges are
*     suppressed. Must be more often than the 90s TTL in store.py.
*   * **pending** — collect what fired and draw it as a bubble, obeying the
*     per-kind rules the desktop app used (a break nudge clears itself, a reminder
*     the user set waits for them).
*/
/** Well inside the backend's 90s presence TTL, so one dropped request is harmless. */
/**
* The companion's rendered size, from PET_W/PET_H in the desktop app's
* shared/constants.ts. Not a free choice: the drag grip centres on it and the
* bubble is positioned from it, so a different number here desynchronises both.
*/
var PET_PX = 128;
/** Tilt when docked at a screen edge, from DOCK_ROTATE in PetWidget. */
/**
* How far the pointer may travel and still count as a tap rather than a drag.
* From PetWidget's `moved > 6` check.
*/
var CLICK_SLOP = 6;
var DOCK_ROTATE = 25;
var PRESENCE_MS = 3e4;
/** Reminders are minute-grained; two seconds is imperceptible and cheap on loopback. */
var PENDING_MS = 2e3;
/**
* A window command (open panel / gallery) older than this is ignored. The page
* records these in the backend and this overlay carries them out on its poll; on
* a relaunch the overlay drains the whole backlog from cursor 0, and popping a
* window open from a click made minutes ago is intrusive in a way a stale nudge
* is not — so a command only acts while it is fresh.
*/
var COMMAND_FRESH_MS = 15e3;
/**
* Where the pending-fire cursor is kept across reloads.
*
* localStorage rather than the backend: the cursor describes what THIS overlay has
* drawn, which is a renderer concern. Putting it in the store would make the read
* destructive again and break the "two displays each get the bubble" property the
* cursor design exists to protect.
*/
var CURSOR_KEY = "cc:pendingCursor";
/** The persisted cursor, or 0 the first time this overlay ever runs. */
function readStoredCursor() {
	try {
		const n = Number(window.localStorage.getItem(CURSOR_KEY));
		return Number.isFinite(n) && n > 0 ? n : 0;
	} catch {
		return 0;
	}
}
/** Remember it, so a restart resumes instead of replaying the history. */
function writeStoredCursor(n) {
	try {
		window.localStorage.setItem(CURSOR_KEY, String(n));
	} catch {}
}
/** Same-origin: the window is loaded from the gateway, so its cookie is present. */
async function post(path) {
	try {
		await appFetch(path, {
			method: "POST",
			credentials: "same-origin"
		});
	} catch {}
}
/**
* The main process refuses mouse input for this window by default, because the
* window covers the entire display. CSS `pointer-events` cannot override that —
* it governs which ELEMENT receives an event the window has already accepted.
*
* Rather than toggle input on pointer enter/leave over each element — which needed
* an IPC round-trip and let a fast click fall through — the renderer reports the
* companion's, bubble's and menu's rects and the main process polls the cursor and
* toggles ignore-mouse itself. `useMouseForward` sends the companion and bubble
* rects; the context-menu component sends its own via `petBridge.setMenuHitbox`.
*/
function Companion() {
	const [bubble, setBubble] = useState(null);
	/**
	* The single notification slot, driven by `bubbleSlot`. It is a ref, not state,
	* because the poll below reads and rewrites it synchronously; the visible bubble
	* is the separate `bubble` state.
	*/
	const slotRef = useRef(null);
	/**
	* Where the bubble is drawn, plus the arrow's x inside it. Computed from the REAL
	* placement algorithm once the bubble is measured, so it sits directly above the
	* companion instead of the old hand-rolled offset that pushed it up-and-left.
	*/
	const [placement, setPlacement] = useState(null);
	const bubbleHostRef = useRef(null);
	/**
	* The panel opens on a click of the companion, per the v1.0 spec: it renders
	* INSIDE this full-display overlay as DOM, beside the companion, rather than in a
	* second window. Two OS windows cannot be kept reliably in step, and the panel has
	* to sit next to a companion that moves.
	*/
	/** Where the press began, for the tap-vs-drag test in onClick. */
	const clickDownPt = useRef(null);
	const [panelOpen, setPanelOpen] = useState(false);
	const [isActive, setIsActive] = useState(() => !hasCompanionBridge());
	const isActiveRef = useRef(isActive);
	isActiveRef.current = isActive;
	const [isOwner, setIsOwner] = useState(() => !hasCompanionBridge());
	const isOwnerRef = useRef(isOwner);
	isOwnerRef.current = isOwner;
	const emitBubble = useCallback((next) => {
		petBridge.reportBubbleState?.(next, slotRef.current, localSeqRef.current);
	}, []);
	const { hideEdge, isPeeking, setIsPeeking, setHideEdge, isPeekingRef } = useEdgeHide();
	/**
	* Drag, from the desktop app's own hook — its maths, thresholds and
	* click-vs-drag disambiguation unchanged. Movement is pure DOM within this
	* overlay, which is what keeps it smooth.
	*/
	/**
	* Mood state, ported from the desktop app. The autonomous wander flickers it
	* (curious/happy by day, sleepy at night); `clearPersistentMood` is handed to the
	* drag hook so grabbing the companion wakes it. Declared before `useDrag` because
	* that hook takes `clearPersistentMood` as an option.
	*/
	const { mood, setMood, clearPersistentMood } = useMood();
	const { pos, setPos, onMouseDown, dragging, dragPollingStarted, posReady, isDragging } = useDrag({
		x: Math.max(0, window.innerWidth - PET_PX - 28),
		y: Math.max(0, window.innerHeight - PET_PX - 96)
	}, {
		clearPersistentMood,
		displayState: "idle",
		setDisplayState: () => {},
		isPeekingRef,
		setIsPeeking,
		setHideEdge,
		allowPeek: true,
		getGrip: () => dragGrip({})
	});
	useEffect(() => {
		const off = petBridge.onSetActive?.((active, x, y, isDragging) => {
			if (!active) isActiveRef.current = false;
			setIsActive(active);
			if (active) {
				if (isDragging && typeof x === "number" && typeof y === "number") {
					dragging.current = true;
					dragPollingStarted.current = true;
					setPos({
						x,
						y
					});
				}
			} else {
				dragging.current = false;
				dragPollingStarted.current = false;
			}
		});
		petBridge.petReady?.();
		return off;
	}, [
		dragging,
		dragPollingStarted,
		setPos
	]);
	useEffect(() => {
		let onUp = null;
		const detach = () => {
			if (onUp) {
				window.removeEventListener("mouseup", onUp);
				onUp = null;
			}
		};
		const off = petBridge.onDragListenMouseUp?.(() => {
			detach();
			onUp = () => {
				petBridge.dragMouseUp?.();
				detach();
			};
			window.addEventListener("mouseup", onUp);
		});
		return () => {
			off?.();
			detach();
		};
	}, []);
	/**
	* Playful idle motion — the ported `usePlayfulMotion` hook. ONE rAF loop mutates
	* the art wrapper's transform directly (no per-frame React state): a gentle idle
	* bob, a few-px lean toward the cursor, and a downward nod on a poke. Gated so it
	* holds still while the companion is dragged or docked at a screen edge.
	*/
	const artRef = useRef(null);
	const playActiveRef = useRef(false);
	/**
	* Only the built-in ghost gets the bob/lean/nod (and the cursor-tracking eyes) —
	* a custom pack bakes its own motion and eyes, so it stays still, exactly as the
	* desktop app gates it.
	*/
	const [isDefaultPack, setIsDefaultPack] = useState(true);
	/** Uploaded random moments replace only Kiro's idle-motion pool. */
	const [customRandomNames, setCustomRandomNames] = useState([]);
	const hasCustomRandomPool = !isDefaultPack && customRandomNames.length > 0;
	const motionEnabledRef = useRef(true);
	motionEnabledRef.current = isDefaultPack || !hasCustomRandomPool;
	useEffect(() => {
		const release = () => window.crewCompanion?.panelHold?.(false);
		window.addEventListener("mouseup", release);
		return () => window.removeEventListener("mouseup", release);
	}, []);
	const facingRightRef = useRef(false);
	const { poke } = usePlayfulMotion(artRef, playActiveRef, motionEnabledRef, facingRightRef);
	/**
	* The avatar gallery is its own window with no reliable close signal to this
	* overlay, so the main process broadcasts open/close and we mirror it here — the
	* companion must not wander off while the user is picking an avatar.
	*/
	const galleryOpenRef = useRef(false);
	useEffect(() => {
		const offOpen = window.crewCompanion?.onGalleryOpened?.(() => {
			galleryOpenRef.current = true;
		});
		const offClose = window.crewCompanion?.onGalleryClosed?.(() => {
			galleryOpenRef.current = false;
		});
		return () => {
			offOpen?.();
			offClose?.();
		};
	}, []);
	useEffect(() => {
		let alive = true;
		const read = () => {
			petBridge.getCrewCompanionConfig?.().then(async (c) => {
				if (!alive) return;
				sessionAlertsRef.current = c?.sessionNotificationsEnabled !== false;
				const worn = c?.kiro?.accessory;
				setSavedProp(typeof worn === "string" ? worn : "none");
				const packId = c?.activeAppearance || "kiro-ghost";
				const isDefault = packId === "kiro-ghost";
				setIsDefaultPack(isDefault);
				if (isDefault) {
					setCustomRandomNames([]);
					return;
				}
				const detail = await petBridge.galleryGetPackDetail?.(packId).catch(() => null);
				if (!alive) return;
				const anims = detail?.animations ?? {};
				setCustomRandomNames(normaliseCustomRandomNames(anims, detail?.randomNames));
			}).catch(() => {});
		};
		read();
		const off = petBridge.onGalleryActiveChanged?.(read);
		return () => {
			alive = false;
			off?.();
		};
	}, []);
	/** Right-click menu position, or null when closed. */
	const [menuAt, setMenuAt] = useState(null);
	/**
	* What the companion is reacting to — chooses both the pack's art slot and the
	* motion. In the desktop app a state manager in the main process broadcast this;
	* here the same information already arrives on the fire queue the pet polls, so the
	* kind of what just fired sets the state and it settles back to idle afterwards.
	*/
	const [petState, setPetState] = useState("idle");
	const stateTimer = useRef(null);
	/**
	* A per-reaction counter, bumped every time a fresh reaction is triggered.
	*
	* Handed to PetAvatar, which folds it into the animated span's React key. Without
	* it the span is keyed only on the motion NAME, so a reaction that repeats the same
	* motion — a second completion is `celebrate` again, and a `happy` mood already
	* resolves to `celebrate` — reuses the same DOM node and never re-fires the CSS
	* keyframes, so the hop is silently skipped. Bumping this forces the remount that
	* replays the keyframes on every finish (and every error shake).
	*/
	const [reactionEpoch, setReactionEpoch] = useState(0);
	const bumpReaction = useCallback(() => setReactionEpoch((n) => n + 1), []);
	/** Show a reaction, then return to idle. */
	const react = useCallback((next, holdMs) => {
		if (stateTimer.current !== null) window.clearTimeout(stateTimer.current);
		setReactionEpoch((n) => n + 1);
		setPetState(next);
		stateTimer.current = window.setTimeout(() => setPetState("idle"), holdMs);
	}, []);
	/**
	* The last fire sequence this overlay has already shown, PERSISTED.
	*
	* Reading `/pending` is deliberately non-destructive on the backend, so that a
	* lost response or a second overlay on another display cannot make a reminder
	* vanish. The cost is that the queue outlives this page: starting from 0 on every
	* load re-delivered the whole history, so every restart of the desktop shell
	* replayed a reminder that had already fired and already been seen — a bubble that
	* came back no matter how many times it was closed.
	*
	* The desktop app this was ported from never hit this: its queue lived in the
	* Electron main process and died with the app. Here the queue is in the gateway
	* store and survives, so the cursor has to survive with it.
	*
	* Persisting rather than "start at the current cursor and ignore the backlog":
	* a reminder that fired while the companion was off must still arrive late — the
	* backend says so out loud ("a time the user chose must still arrive, late, on
	* their return"). Skipping the backlog would silently drop exactly that.
	*
	* KNOWN LIMIT: one key for the whole origin, so two overlays on two displays share
	* a cursor and the second may not redraw a fire the first already advanced past.
	* A per-display key needs a display id the renderer is not given today; a bubble
	* appearing on one screen instead of both is a far smaller fault than one that
	* cannot be dismissed.
	*/
	const cursorRef = useRef(readStoredCursor());
	/**
	* The live "tell me when sessions are done" preference.
	*
	* A ref, not state: the session watcher below owns a socket that must outlive
	* re-renders, so it reads the answer at completion time rather than capturing a
	* value at subscribe time. Capturing would mean the switch only took effect after a
	* restart — and this is the switch that spent this whole port controlling nothing.
	*/
	const sessionAlertsRef = useRef(true);
	/**
	* The dress-up prop the user picked, and a transient one worn only for a
	* celebration.
	*
	* Two values rather than one, because the celebrate prop must OVERLAY the saved
	* choice and then give it back — it never writes to config. `celebrateProp ??
	* savedProp` is the single answer both the art layer and the eye-suppression rule
	* read, so they cannot disagree about what is being worn.
	*/
	/** Bubble identity for locally-raised bubbles; see the session watcher below. */
	const localSeqRef = useRef(0);
	/** The prop the user picked in the gallery. */
	const [savedProp, setSavedProp] = useState("none");
	/** A prop worn only for the length of a celebration; overlays the saved one. */
	const [celebrateProp, setCelebrateProp] = useState(null);
	const celebrateTimerRef = useRef(null);
	/**
	* The live poll, exposed so the backend's fire doorbell can run it at once.
	*
	* A ref rather than lifting `poll` out of its effect: it closes over the cursor
	* and the slot bookkeeping, and duplicating that for a second caller is how two
	* drains end up disagreeing about what has been shown.
	*/
	const pollNowRef = useRef(null);
	const openPanel = useCallback(() => {
		setPanelOpen(true);
		window.crewCompanion?.panelOpen?.({
			x: Math.round(window.screenX + pos.x),
			y: Math.round(window.screenY + pos.y),
			width: PET_PX,
			height: PET_PX
		});
		window.crewCompanion?.setFocusable(true);
	}, [pos.x, pos.y]);
	/**
	* The pending poll below is armed once in a mount-time effect, so referencing
	* `openPanel` there directly would freeze it at the first render — including
	* the companion's start position, so a command arriving after the user has
	* dragged the companion would open the panel at the wrong place. A ref keeps it
	* current without re-arming the poll.
	*/
	const openPanelRef = useRef(openPanel);
	openPanelRef.current = openPanel;
	/**
	* Take the user to the work a waiting-on-you notification is about.
	*
	* Handed to the main process rather than done here, for the reason `openPanel`
	* is: this overlay is a non-focusable full-display window with no handle on the
	* dashboard, so raising and routing it is not something the renderer can do.
	*
	* The answer is returned to the bubble, which clears itself only on a success —
	* an approval bubble has no ✕ and ignores body clicks, so a CTA that dismissed
	* on a failed open would destroy the user's only pointer back to the blocked
	* session. No bridge means no main process to ask (this page also opens in an
	* ordinary browser), which is a refusal, not a quiet success.
	*/
	const openSession = useCallback(async (slot) => {
		const bridge = window.crewCompanion;
		if (!bridge?.openSession) return false;
		try {
			return await bridge.openSession(slot ?? "");
		} catch {
			return false;
		}
	}, []);
	/**
	* Follow the panel window's own lifecycle.
	*
	* It closes on click-away, Escape and its ✕ without going through `closePanel`, so
	* without this the companion keeps believing the panel is open: the next click reads
	* as "close" and nothing appears, and the overlay stays focusable — a full-display
	* always-on-top window that can take focus and swallow clicks meant for other apps.
	*/
	useEffect(() => {
		return window.crewCompanion?.onPanelClosed?.(() => {
			setPanelOpen(false);
			window.crewCompanion?.setFocusable(false);
		});
	}, []);
	const closePanel = useCallback(() => {
		setPanelOpen(false);
		window.crewCompanion?.panelClose?.();
		window.crewCompanion?.setFocusable(false);
	}, []);
	const dismiss = useCallback(() => {
		setBubble(null);
		setPlacement(null);
		petBridge.bubbleAction?.("dismiss");
	}, []);
	/**
	* Place the bubble directly above the companion using the ported algorithm.
	*
	* Measured, not estimated: the bubble is `width: fit-content`, so its real box is
	* known only after it renders. This runs in a layout effect (before paint, so no
	* flash), feeds the measured size to `pickBubblePlacement`, and clamps the result
	* with `resolveBubbleRect`. The three `random()` reads inside the picker are, in
	* order, jitterX, jitterY and the candidate choice — returning 0.5 twice zeroes the
	* jitter and 0 then selects the best-scoring (centred 'top') candidate, so the
	* bubble is reliably centred above the companion rather than randomly offset.
	*/
	useLayoutEffect(() => {
		if (!bubble) return;
		const el = bubbleHostRef.current;
		if (!el) return;
		const box = el.getBoundingClientRect();
		const width = box.width || BUBBLE_LAYOUT_DEFAULTS.maxWidth;
		const height = box.height || 44;
		const anchor = {
			left: pos.x,
			top: pos.y,
			right: pos.x + PET_PX,
			bottom: pos.y + PET_PX,
			width: PET_PX,
			height: PET_PX
		};
		let call = 0;
		const random = () => call++ < 2 ? .5 : 0;
		const candidate = pickBubblePlacement(anchor, width, height, window.innerWidth, window.innerHeight, { random });
		const rect = resolveBubbleRect(candidate, width, height, window.innerWidth, window.innerHeight, BUBBLE_LAYOUT_DEFAULTS.margin);
		const arrowInset = BUBBLE_LAYOUT_DEFAULTS.margin;
		const rawArrowX = candidate.targetX - rect.left;
		const span = rect.right - rect.left;
		const arrowX = Math.max(arrowInset, Math.min(span - arrowInset, rawArrowX));
		setPlacement({
			rect,
			arrowX
		});
	}, [
		bubble,
		pos.x,
		pos.y
	]);
	const celebrateWithProp = useCallback(() => {
		if (celebrateTimerRef.current !== null) window.clearTimeout(celebrateTimerRef.current);
		setCelebrateProp(randomCelebrateProp());
		celebrateTimerRef.current = window.setTimeout(() => {
			setCelebrateProp(null);
			celebrateTimerRef.current = null;
		}, 1350);
	}, []);
	useEffect(() => petBridge.onSetOwner?.(setIsOwner) ?? void 0, []);
	useEffect(() => petBridge.onRehydrateSlot?.((recovery) => {
		const r = recovery ?? {};
		slotRef.current = r.slot ?? null;
		if (typeof r.seq === "number") localSeqRef.current = r.seq;
	}) ?? void 0, []);
	useEffect(() => petBridge.onWindowCommand?.((cmd) => {
		if (cmd === "panel") openPanelRef.current();
		else if (cmd === "gallery") window.crewCompanion?.galleryOpen?.();
	}) ?? void 0, []);
	useEffect(() => petBridge.onBubbleAction?.((action) => {
		if (action === "dismiss") {
			slotRef.current = null;
			emitBubble(null);
		}
	}) ?? void 0, [emitBubble]);
	useEffect(() => petBridge.onRenderBubble?.((b, playReaction) => {
		const next = b;
		setBubble(next);
		if (!next) {
			setPlacement(null);
			return;
		}
		if (!playReaction) return;
		const k = next.kind;
		if (k === "session-error") {
			react("error", 2e3);
			setMood("scared");
		} else if (k === "approval" || k === "session-input") {
			bumpReaction();
			setMood("curious");
		} else if (k === "break" || k === "break-breathe" || k === "reminder") {} else if (k === "session-done") {
			react("done", 2400);
			setMood("neutral");
			celebrateWithProp();
		} else {
			react("done", 2400);
			setMood("happy");
			celebrateWithProp();
		}
	}) ?? void 0, [
		react,
		setMood,
		bumpReaction,
		celebrateWithProp
	]);
	useEffect(() => {
		if (!isOwner) return;
		return watchSessions({
			isSilent: () => sessionAlertsRef.current === false,
			onFireQueued: () => pollNowRef.current?.(),
			onDone: ({ slot, title, failed }) => {
				const kind = failed ? "session-error" : "session-done";
				const named = title.trim();
				const text = failed ? named ? i18nT("apps.crewCompanion.notif.stoppedNamed", { name: named }) : i18nT("apps.crewCompanion.notif.taskStopped") : named || i18nT("apps.crewCompanion.notif.finishedTask");
				const now = Date.now();
				const held = slotRef.current;
				if (held?.sticky && now - held.at < 9e4) return;
				const result = nextBubble(slotRef.current, {
					text,
					sticky: isSticky(kind),
					kind
				}, now);
				slotRef.current = result.pending;
				if (result.show === null) return;
				localSeqRef.current -= 1;
				emitBubble({
					seq: localSeqRef.current,
					kind: result.pending?.kind ?? kind,
					text: result.show,
					slot
				});
			},
			onApproval: ({ slot, title }) => {
				const kind = "approval";
				const label = i18nT("apps.crewCompanion.state.approval_pending");
				const named = title.trim();
				const text = named ? `${label}\n${named}` : label;
				const now = Date.now();
				const held = slotRef.current;
				if (held?.sticky && now - held.at < 9e4) return;
				const result = nextBubble(slotRef.current, {
					text,
					sticky: isSticky(kind),
					kind
				}, now);
				slotRef.current = result.pending;
				if (result.show === null) return;
				localSeqRef.current -= 1;
				emitBubble({
					seq: localSeqRef.current,
					kind: result.pending?.kind ?? kind,
					text: result.show,
					slot
				});
			},
			onApprovalResolved: () => {
				if (slotRef.current?.sticky) {
					slotRef.current = null;
					emitBubble(null);
				}
			}
		});
	}, [emitBubble, isOwner]);
	/** Presence: silence is read as "nobody is there", so this must not stop. */ useEffect(() => {
		post(PRESENCE_PATH);
		const t = window.setInterval(() => void post(PRESENCE_PATH), PRESENCE_MS);
		return () => window.clearInterval(t);
	}, []);
	/** Collect what fired. Cursor-based, so a dropped response loses nothing. */
	useEffect(() => {
		let stopped = false;
		const poll = async () => {
			if (!isOwnerRef.current) return;
			try {
				const since = cursorRef.current;
				const r = await appFetch(`${PENDING_PATH}?since=${since}`, { credentials: "same-origin" });
				if (!r.ok) return;
				let data = await r.json();
				if (stopped) return;
				if (data.cursor < since) {
					const again = await appFetch(`${PENDING_PATH}?since=0`, { credentials: "same-origin" });
					if (!again.ok) return;
					data = await again.json();
					if (stopped) return;
				}
				if (!isOwnerRef.current || readStoredCursor() > since) return;
				for (const f of data.fires) {
					if (f.kind !== "command") continue;
					const ts = Date.parse(f.at);
					if (Number.isFinite(ts) && Date.now() - ts > COMMAND_FRESH_MS) continue;
					petBridge.reportWindowCommand?.(f.text);
				}
				const speakable = data.fires.filter((f) => f.kind !== "command");
				const commitCursor = (seq) => {
					cursorRef.current = seq;
					writeStoredCursor(seq);
				};
				if (speakable.length === 0) {
					commitCursor(data.cursor);
					return;
				}
				const latest = speakable[0];
				const kind = latest.kind || "other";
				let text = latest.text;
				if (latest.key) {
					const phrase = nudgeTextFor(latest.key);
					if (!phrase) {
						commitCursor(latest.seq);
						return;
					}
					text = phrase;
				}
				const now = Date.now();
				if (kind === "break" || kind === "break-breathe" || kind === "reminder") {
					const held = slotRef.current;
					if (held?.sticky && now - held.at < 9e4) return;
					commitCursor(latest.seq);
					slotRef.current = {
						text,
						sticky: false,
						count: 1,
						at: now,
						kind
					};
					emitBubble({
						seq: latest.seq,
						kind,
						text
					});
					return;
				}
				const sticky = isSticky(kind);
				const result = nextBubble(slotRef.current, {
					text,
					sticky,
					kind
				}, now);
				if (result.show === null) return;
				commitCursor(latest.seq);
				slotRef.current = result.pending;
				const shownKind = result.pending?.kind ?? kind;
				emitBubble({
					seq: latest.seq,
					kind: shownKind,
					text: result.show
				});
			} catch {}
		};
		poll();
		pollNowRef.current = () => void poll();
		const t = window.setInterval(() => void poll(), PENDING_MS);
		return () => {
			pollNowRef.current = null;
			stopped = true;
			window.clearInterval(t);
		};
	}, []);
	useEffect(() => {
		if (isOwner) {
			cursorRef.current = readStoredCursor();
			pollNowRef.current?.();
		}
	}, [isOwner]);
	const { isWalking, walkDir, walkTilt, cancelWalk, walkPath } = useWalking(pos, setPos, useCallback((finalPos) => {
		const edgeThreshold = 40;
		const atLeft = finalPos.x <= edgeThreshold;
		const atRight = finalPos.x >= window.innerWidth - PET_PX - edgeThreshold;
		if (atLeft || atRight) {
			setHideEdge(atLeft ? "left" : "right");
			setIsPeeking(true);
		} else {
			setIsPeeking(false);
			setHideEdge(null);
		}
		if (isActiveRef.current) petBridge.savePosition?.(finalPos.x, finalPos.y);
	}, [setHideEdge, setIsPeeking]), setIsPeeking, setHideEdge);
	/**
	* Everything that must be quiet for the companion to move on its own, evaluated at
	* render (each is state-backed, so a change re-renders and refreshes the gate). A
	* fidget never begins while the user is dragging, the companion is walking or
	* docked, the quick-menu is up, or the OS asks for reduced motion — matching how
	* the desktop app gated useIdleFidget, plus the reduced-motion honour.
	*/
	const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
	const settled = isActive && posReady && !dragging.current && !isWalking && !isPeeking && menuAt === null && !reducedMotion;
	const [idleAnim, setIdleAnim] = useState(null);
	const idleAnimTimer = useRef(null);
	const playFidget = useCallback((anim, holdMs) => {
		if (idleAnimTimer.current !== null) window.clearTimeout(idleAnimTimer.current);
		bumpReaction();
		setIdleAnim(anim);
		idleAnimTimer.current = window.setTimeout(() => setIdleAnim(null), holdMs);
	}, [bumpReaction]);
	useEffect(() => () => {
		if (idleAnimTimer.current !== null) window.clearTimeout(idleAnimTimer.current);
	}, []);
	const [activeClip, setActiveClip] = useState(void 0);
	const clipTimer = useRef(null);
	const CLIP_HOLD_MS = 3e3;
	const showIdleClip = useCallback(() => {
		if (clipTimer.current !== null) window.clearTimeout(clipTimer.current);
		clipTimer.current = null;
		setActiveClip(void 0);
	}, []);
	const playExtraClip = useCallback((name) => {
		if (clipTimer.current !== null) window.clearTimeout(clipTimer.current);
		bumpReaction();
		setActiveClip(name);
		clipTimer.current = window.setTimeout(() => setActiveClip(void 0), CLIP_HOLD_MS);
	}, [bumpReaction]);
	useEffect(() => () => {
		if (clipTimer.current !== null) window.clearTimeout(clipTimer.current);
	}, []);
	useIdleFidget({
		enabled: settled && !hasCustomRandomPool,
		getPos: () => pos,
		walkPath,
		setMood,
		allowMood: isDefaultPack,
		playFidget
	});
	useRandomClips({
		enabled: settled && hasCustomRandomPool,
		getClips: () => customRandomNames,
		getPos: () => pos,
		walkPath,
		showIdle: showIdleClip,
		playClip: playExtraClip
	});
	useMouseForward({
		pos,
		bubbleRect: placement?.rect ?? null,
		dragging,
		isActive
	});
	playActiveRef.current = !dragging.current && !isPeeking && !isWalking;
	const facingRight = isWalking && walkDir < 0 || !isWalking && hideEdge === "right" || !isWalking && !hideEdge && pos.x > window.innerWidth / 2;
	facingRightRef.current = facingRight;
	/**
	* Which body motion is playing, by the desktop app's own precedence:
	* error > celebrate > curious > fly > ponder (see petAnim). Only the live pet can
	* decide this — the choice depends on travelling, mood and docking, none of which a
	* bare state expresses, which is why it is computed here and handed to PetAvatar.
	*/
	const activeAnim = activeAnimFor({
		state: petState,
		mood,
		docked: hideEdge !== null,
		walking: isWalking,
		idleAnim
	});
	return /* @__PURE__ */ jsxs("div", {
		className: "cc-pet-layer",
		children: [
			isActive && menuAt ? /* @__PURE__ */ jsx("div", {
				className: "cc-menu-host",
				children: /* @__PURE__ */ jsx(PetContextMenu, {
					x: menuAt.x,
					y: menuAt.y,
					isHidden: isPeeking,
					onClose: () => setMenuAt(null)
				})
			}) : null,
			isActive && bubble ? /* @__PURE__ */ jsx("div", {
				ref: bubbleHostRef,
				className: "cc-bubble-host",
				style: placement ? {
					position: "absolute",
					left: placement.rect.left,
					top: placement.rect.top
				} : {
					position: "absolute",
					left: -9999,
					top: -9999,
					visibility: "hidden"
				},
				children: /* @__PURE__ */ jsx(Bubble, {
					text: bubble.text,
					kind: bubble.kind,
					onDismiss: dismiss,
					onAction: (action) => {
						if (action === "breathe") {
							openPanel();
							return;
						}
						return openSession(bubble.slot);
					}
				}, bubble.seq)
			}) : null,
			isActive ? /* @__PURE__ */ jsx("div", {
				className: "cc-pet",
				onMouseDown: (e) => {
					clickDownPt.current = {
						x: e.clientX,
						y: e.clientY
					};
					window.crewCompanion?.panelHold?.(true);
					if (isWalking) cancelWalk();
					onMouseDown(e);
				},
				onContextMenu: (e) => {
					e.preventDefault();
					setMenuAt({
						x: e.clientX,
						y: e.clientY
					});
				},
				style: {
					position: "absolute",
					left: pos.x,
					top: pos.y,
					width: PET_PX,
					height: PET_PX,
					cursor: dragging.current ? "grabbing" : "grab",
					opacity: posReady ? 1 : 0,
					transition: isDragging ? "none" : "opacity .4s ease, transform .3s ease",
					transform: (() => {
						const parts = [];
						if (facingRight) parts.push("scaleX(-1)");
						if (isWalking && walkTilt !== 0) parts.push(`rotate(${walkTilt}deg)`);
						if (isPeeking && hideEdge) {
							const dockScreenDx = hideEdge === "left" ? -64 : PET_PX / 2;
							parts.push(`translateX(${facingRight ? -dockScreenDx : dockScreenDx}px)`);
							parts.push(`rotate(${DOCK_ROTATE}deg)`);
						}
						return parts.length ? parts.join(" ") : void 0;
					})()
				},
				role: "button",
				tabIndex: 0,
				"aria-label": i18nT("apps.crewCompanion.panel.breathe.title"),
				onClick: (e) => {
					const down = clickDownPt.current;
					if ((down ? Math.hypot(e.clientX - down.x, e.clientY - down.y) : 999) > CLICK_SLOP) return;
					poke();
					if (panelOpen) closePanel();
					else openPanel();
				},
				onKeyDown: (e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						if (panelOpen) closePanel();
						else openPanel();
					}
				},
				children: /* @__PURE__ */ jsx("div", {
					ref: artRef,
					style: {
						transformOrigin: "50% 82%",
						willChange: "transform",
						width: PET_PX,
						height: PET_PX
					},
					children: /* @__PURE__ */ jsx(PetAvatar, {
						size: PET_PX,
						state: petState,
						mood,
						docked: hideEdge !== null,
						anim: activeAnim,
						animEpoch: reactionEpoch,
						clipName: petState === "idle" ? activeClip : void 0,
						trackCursor: true,
						flipX: facingRight,
						accessory: celebrateProp ?? savedProp
					})
				})
			}) : null
		]
	});
}
// src/entries/pet.tsx
/**
* The avatar window (`pet`): one copy on every display, the avatar on one of them.
* The hidden owner (`notifier`) runs the same component in its owner role.
*/
function PetWindow() {
	return /* @__PURE__ */ jsx(WindowRoot, {
		css: pet_window_default,
		cssId: "pet-window",
		revealOnPaint: false,
		children: /* @__PURE__ */ jsx(Companion, {})
	});
}
export { PetWindow as t };
