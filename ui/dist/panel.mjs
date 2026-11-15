import { C as appFetch, E as i18nT, b as SKIP_PATH, l as BREAK_PRESETS, u as BREATHING_DONE_PATH, v as REMINDERS_PATH, y as REMOVE_PATH } from "./chunks/constants-De1Fjrra.mjs";
import { a as petBridge, s as injectCss, t as WindowRoot } from "./chunks/WindowRoot-R1vuzr9j.mjs";
import { t as PetAvatar } from "./chunks/PetAvatar-B9Vtjs5N.mjs";
import { i as useDialogFocusTrap, r as useSkin, t as PANEL_FONT } from "./chunks/panelSkin-BjvlW4rb.mjs";
import { i as fmtUnit, r as fmtTime, t as fmtDateFields } from "./chunks/format-B9AOzdKC.mjs";
import { a as labelFor, c as sortedReminders, i as clampBreakMins, n as RadioChipGroup, r as radioChip, t as parseReminder } from "./chunks/reminderParse-CJkDpEbU.mjs";
import { useImeGuard } from "@kirocrew/app-sdk";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, Plus, X } from "lucide-react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
// src/panel.window.css?inline
var panel_window_default = "/* The panel window's document styles: the <style> block of the built-in's panel.html. The\n   window's own root is `.cc-window-root` (the built-in's `#root`), which the\n   entry renders over the whole window. */\n      html,\n      body {\n        margin: 0;\n        padding: 0;\n        width: 100%;\n        height: 100%;\n        background: transparent !important;\n        overflow: hidden;\n        -webkit-user-select: none;\n        user-select: none;\n      }\n      .cc-window-root {\n        position: fixed;\n        inset: 0;\n        /* = PANEL_PAD */\n        padding: 32px;\n        box-sizing: border-box;\n        width: 100%;\n        height: 100%;\n      }\n    \n";
// src/breathing.css?inline
var breathing_default = "/*\n * Styles for the breathing exercise. A real stylesheet rather than a template\n * literal in TypeScript: CSS is not program text, and keeping it here means the\n * i18n scanner never has to decide whether a declaration block is prose.\n *\n * The overlay is position:fixed so it needs no containing block from its parent —\n * that is what lets one component serve both the dashboard page and the\n * companion's own panel without either host arranging anything for it.\n *\n * Colours are dashboard CSS variables, so the exercise follows the active theme.\n */\n@keyframes ccFade { from { opacity:0 } to { opacity:1 } }\n@keyframes ccHoldPulse { 0%,100% { opacity:1 } 50% { opacity:.55 } }\n\n.cc-breathe { position:absolute; inset:0; z-index:10; display:flex; flex-direction:column;\n  align-items:center; justify-content:center; text-align:center;\n  /* The card's own surface, so the exercise is the same box as the panel rather\n     than a full-screen takeover. */\n  background:var(--card); border-radius:16px;\n  animation:ccFade .18s ease-out both; }\n\n.cc-breathe-end { position:absolute; top:10px; right:10px; width:28px; height:28px;\n  border-radius:50%; display:inline-flex; align-items:center; justify-content:center;\n  background:none; border:none; cursor:pointer; color:var(--muted); font-size:13px;\n  line-height:1; padding:0; }\n.cc-breathe-end:hover { background:var(--border); color:var(--text-strong); }\n.cc-breathe-end:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }\n\n.cc-breathe-stage { width:136px; height:136px; display:flex; align-items:center;\n  justify-content:center; position:relative; }\n.cc-breathe-ring { position:absolute; width:112px; height:112px; border-radius:50%;\n  border:1.5px solid var(--accent); opacity:.5;\n  transition:transform .6s cubic-bezier(.4,0,.2,1); }\n.cc-breathe-art { display:block; }\n.cc-breathe-glyph { display:inline-flex; transition:transform .6s cubic-bezier(.4,0,.2,1); }\n\n.cc-breathe-count { margin-top:10px; font-size:34px; font-weight:700; line-height:1;\n  color:var(--text-strong); font-variant-numeric:tabular-nums; }\n.cc-breathe-label { font-size:13px; font-weight:600; color:var(--text-strong); margin-top:8px; }\n.cc-breathe-route { color:var(--muted); font-weight:400; }\n\n.cc-breathe-dots { display:flex; gap:5px; justify-content:center; margin-top:14px; }\n.cc-breathe-dot { width:5px; height:5px; border-radius:50%; background:var(--border); }\n.cc-breathe-dot-on { background:var(--accent); }\n\n.cc-breathe-pulse { animation:ccHoldPulse 2s ease-in-out infinite; }\n\n.cc-breathe-start { display:inline-flex; align-items:center; gap:6px; margin-top:10px;\n  padding:5px 11px; border-radius:999px; border:1px solid var(--border);\n  background:transparent; color:var(--text-strong); font-size:12.5px;\n  font-weight:550; cursor:pointer; }\n.cc-breathe-start:hover { border-color:var(--accent); color:var(--accent); }\n.cc-breathe-start:focus-visible { outline:2px solid var(--accent); outline-offset:2px; }\n\n@media (prefers-reduced-motion: reduce) {\n  .cc-breathe { animation:none; }\n  .cc-breathe-ring, .cc-breathe-glyph { transition:none !important; }\n  .cc-breathe-pulse { animation:none; }\n}\n";
// src/breathing.ts
/**
* A lead-in before the first breath, so the exercise does not start mid-thought.
* Without it the first "Inhale" arrives while the user is still reading the screen,
* and the whole first cycle is spent catching up.
*/
var READY_MS = 3e3;
var READY_PHASE = {
	labelKey: "apps.crewCompanion.breathe.ready",
	ms: READY_MS,
	scale: .85
};
/** Inhale 4s, hold 7s, exhale 8s. The 1:2 inhale:exhale ratio is the active part. */
var BREATH_PHASES = [
	{
		labelKey: "apps.crewCompanion.breathe.inhale",
		ms: 4e3,
		scale: 1.18
	},
	{
		labelKey: "apps.crewCompanion.breathe.hold",
		ms: 7e3,
		scale: 1.18
	},
	{
		labelKey: "apps.crewCompanion.breathe.exhale",
		ms: 8e3,
		scale: .58
	}
];
var CYCLE_MS = BREATH_PHASES.reduce((sum, p) => sum + p.ms, 0);
READY_MS + CYCLE_MS * 4;
var secondsLeftIn = (phaseMs, within) => Math.max(1, Math.ceil((phaseMs - within) / 1e3));
/**
* Where the exercise is at `elapsedMs`.
*
* Derived from elapsed time rather than advanced by a chain of timeouts, so a
* dropped or delayed frame cannot desynchronise the label from the animation —
* both read from the same function on the same frame.
*/
function breathStateAt(elapsedMs) {
	const clamped = Math.max(0, elapsedMs);
	if (clamped < 3e3) return {
		phase: READY_PHASE,
		phaseIndex: -1,
		cycle: 0,
		ready: true,
		done: false,
		secondsLeft: secondsLeftIn(READY_MS, clamped)
	};
	const afterReady = clamped - READY_MS;
	if (afterReady >= CYCLE_MS * 4) {
		const last = BREATH_PHASES.length - 1;
		return {
			phase: BREATH_PHASES[last],
			phaseIndex: last,
			cycle: 4,
			ready: false,
			done: true,
			secondsLeft: 0
		};
	}
	const cycle = Math.floor(afterReady / CYCLE_MS);
	let within = afterReady - cycle * CYCLE_MS;
	for (let i = 0; i < BREATH_PHASES.length; i++) {
		if (within < BREATH_PHASES[i].ms) return {
			phase: BREATH_PHASES[i],
			phaseIndex: i,
			cycle: cycle + 1,
			ready: false,
			done: false,
			secondsLeft: secondsLeftIn(BREATH_PHASES[i].ms, within)
		};
		within -= BREATH_PHASES[i].ms;
	}
	const last = BREATH_PHASES.length - 1;
	return {
		phase: BREATH_PHASES[last],
		phaseIndex: last,
		cycle: cycle + 1,
		ready: false,
		done: false,
		secondsLeft: 1
	};
}
// src/BreathingOverlay.tsx
/**
* BreathingOverlay — the guided 4-7-8 exercise, layered over whatever invoked it.
*
* Progress is driven from ELAPSED TIME via `breathStateAt`, not a chain of
* timeouts, so the label, the count and the animation can never drift apart — they
* all read the same function on the same frame.
*
* Deliberately only three things on screen: the breathing companion, the count, and
* one label. An earlier version stacked a title, a technique hint, the count, the
* label, dots and a button — six elements, which both overflowed the card and gave
* the eye nowhere to settle. The nose/mouth cue is folded into the label that needs
* it.
*
* Ported from the desktop app's renderer. Two deliberate substitutions: the panel's
* own `useSkin` theme becomes the dashboard's CSS custom properties (so it inherits
* all ~36 Kiro Crew themes for free), and `useT` becomes `i18nT`. The companion glyph
* is a plain inline SVG here rather than the desktop `PetAvatar`, because appearance
* packs belong to the window layer — the motion is what carries the exercise, and
* that is fully preserved.
*/
injectCss("breathing", breathing_default);
var NO_ESCAPE = () => {};
var COMPANION_PX = 72;
function breathingAvatarState(state) {
	if (state.ready || state.done) return "idle";
	return [
		"inhale",
		"hold",
		"exhale"
	][state.phaseIndex] ?? "idle";
}
var CUSTOM_PHASE_TRANSITION = "transform 180ms ease-out";
/**
* The companion that breathes with the exercise — the user's CURRENT avatar, not a
* hardcoded ghost.
*
* This used to draw the built-in `kiro_idle.svg` directly, so the exercise showed the
* default ghost even when the user had picked a capybara. The comment justifying that
* ("appearance packs belong to the window layer") did not hold: this overlay renders
* inside `panel.tsx`, which IS a window layer, the same one that draws the live pet.
*
* `PetAvatar` is self-contained — it reads the active appearance from config, resolves
* the pack's art, and re-resolves on pack/recolour events — so no appearance data has
* to be threaded down here. It also brings the `isDefault` eye gate for free: a custom
* pack draws its own eyes, so PetAvatar suppresses the overlay eyes that only belong to
* the eyeless built-in ghost (drawing both is a two-pairs-of-eyes bug). The breathing
* scale lives on the `.cc-breathe-glyph` wrapper OUTSIDE this, so every pack breathes.
*
* `anim={null}` holds the body still — the breath IS the motion here; a pack's own idle
* fidget playing underneath would fight the scale.
*/
function CompanionGlyph({ size, state, onCustomOverrideChange }) {
	return /* @__PURE__ */ jsx("span", {
		style: {
			position: "relative",
			display: "block",
			width: size,
			height: size
		},
		children: /* @__PURE__ */ jsx(PetAvatar, {
			size,
			state,
			anim: null,
			onCustomOverrideChange
		})
	});
}
/**
* The slot marker inside the catalogue value. A PATTERN rather than a string,
* because it is punctuation the translator must keep, not text anyone reads —
* writing it as a literal would claim it is prose awaiting translation.
*/
var ROUTE_SLOT = /\{route\}/;
function BreathingOverlay({ onDone, onEnd }) {
	const [state, setState] = useState(() => breathStateAt(0));
	const startedRef = useRef(null);
	const rafRef = useRef(null);
	const doneFiredRef = useRef(false);
	useEffect(() => {
		const frame = (ts) => {
			if (startedRef.current === null) startedRef.current = ts;
			const next = breathStateAt(ts - startedRef.current);
			setState(next);
			if (next.done && !doneFiredRef.current) {
				doneFiredRef.current = true;
				onDone();
				return;
			}
			rafRef.current = requestAnimationFrame(frame);
		};
		rafRef.current = requestAnimationFrame(frame);
		return () => {
			if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
		};
	}, [onDone]);
	useEffect(() => {
		const onKey = (e) => {
			if (e.key === "Escape") onEnd();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onEnd]);
	const dialogRef = useRef(null);
	useDialogFocusTrap(dialogRef, NO_ESCAPE, { handleEscape: false });
	/**
	* The phase phrase, split so the route can be styled down while keeping the
	* translation's WORD ORDER. English puts the manner after the verb ("Inhale
	* through your nose"); Chinese puts it before ("用鼻子吸气"). Rendering the verb
	* and route as two fixed slots would force English order on every language.
	*/
	const phrase = (() => {
		if (state.ready) return [{
			text: i18nT("apps.crewCompanion.breathe.ready"),
			muted: false
		}];
		if (state.phaseIndex === 1) return [{
			text: i18nT("apps.crewCompanion.breathe.hold"),
			muted: false
		}];
		const inhaling = state.phaseIndex === 0;
		const route = inhaling ? i18nT("apps.crewCompanion.breathe.through_nose") : i18nT("apps.crewCompanion.breathe.through_mouth");
		return (inhaling ? i18nT("apps.crewCompanion.breathe.inhale_with_route") : i18nT("apps.crewCompanion.breathe.exhale_with_route")).split(ROUTE_SLOT).flatMap((part, i) => [...i > 0 ? [{
			text: route,
			muted: true
		}] : [], ...part ? [{
			text: part,
			muted: false
		}] : []]);
	})();
	const ringScale = 1 + (state.phase.scale - 1) * .9;
	const avatarState = breathingAvatarState(state);
	const [customPhase, setCustomPhase] = useState(false);
	const glyphScale = customPhase ? 1 : state.phase.scale;
	/** The hold has no scale change, so it gets an opacity pulse instead — the
	*  screen is never fully static. */
	const isHold = state.phaseIndex === 1;
	return /* @__PURE__ */ jsxs("div", {
		ref: dialogRef,
		className: "cc-breathe",
		role: "dialog",
		"aria-modal": "true",
		"aria-label": i18nT("apps.crewCompanion.breathe.start"),
		children: [
			/* @__PURE__ */ jsx("button", {
				type: "button",
				onClick: onEnd,
				className: "cc-breathe-end",
				"aria-label": i18nT("apps.crewCompanion.breathe.end"),
				children: /* @__PURE__ */ jsx(X, {
					size: 14,
					"aria-hidden": "true"
				})
			}),
			/* @__PURE__ */ jsxs("div", {
				className: "cc-breathe-stage",
				children: [/* @__PURE__ */ jsx("span", {
					className: `cc-breathe-ring${isHold ? " cc-breathe-pulse" : ""}`,
					style: {
						transform: `scale(${ringScale})`,
						transition: `transform ${state.phase.ms}ms cubic-bezier(.4,.0,.4,1)`
					}
				}), /* @__PURE__ */ jsx("span", {
					className: "cc-breathe-glyph",
					style: {
						transform: `scale(${glyphScale})`,
						transition: customPhase ? CUSTOM_PHASE_TRANSITION : `transform ${state.phase.ms}ms cubic-bezier(.4,.0,.4,1)`
					},
					children: /* @__PURE__ */ jsx(CompanionGlyph, {
						size: COMPANION_PX,
						state: avatarState,
						onCustomOverrideChange: setCustomPhase
					})
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				className: "cc-breathe-count",
				"aria-live": "off",
				children: state.secondsLeft
			}),
			/* @__PURE__ */ jsx("div", {
				className: "cc-breathe-label",
				children: phrase.map((seg, i) => /* @__PURE__ */ jsx("span", {
					className: seg.muted ? "cc-breathe-route" : void 0,
					children: seg.text
				}, i))
			}),
			/* @__PURE__ */ jsx("div", {
				className: "cc-breathe-dots",
				children: Array.from({ length: 4 }, (_, i) => /* @__PURE__ */ jsx("span", { className: `cc-breathe-dot${i < state.cycle ? " cc-breathe-dot-on" : ""}` }, i))
			})
		]
	});
}
// src/panel.css?inline
var panel_default = "/*\n * Panel design tokens.\n *\n * A real stylesheet rather than string constants in TypeScript: these are CSS\n * values, and the i18n gate cannot tell a font stack from a sentence, so holding\n * them as strings reads as untranslated user-facing text. Declaring them as custom\n * properties also makes them themeable, which string constants are not.\n */\n:root {\n  /*\n   * Rounded rather than the system default: the panel is a companion surface, not\n   * a settings dialog.\n   */\n  --cc-panel-font: ui-rounded, \"SF Pro Rounded\", -apple-system, BlinkMacSystemFont, system-ui, sans-serif;\n  --cc-panel-shadow: 0 6px 22px rgba(0, 0, 0, 0.5);\n}\n\n/*\n * Open animation (spec: option C — a spring, then a short content cascade). Ported\n * verbatim from the desktop app's panel.html; timings/easings are unchanged.\n *\n * The card owns its own background and radius, so scaling it reveals the desktop\n * rather than a window rectangle. Its transform-origin is set inline by PanelCard\n * from the side the panel opened on (`left top` / `right top`), so the card grows\n * OUT OF the companion. The cubic-bezier overshoots past scale(1); the window's\n * transparent gutter (PANEL_PAD = 32 in panelPlacement.js) is what keeps that\n * overshoot from being clipped.\n */\n.cc-card {\n  animation: ccSpring 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both;\n}\n@keyframes ccSpring {\n  from { opacity: 0; transform: scale(0.88); }\n  to   { opacity: 1; transform: scale(1); }\n}\n\n/* The four card sections rise in sequence just after the card lands. */\n.cc-cascade > * { animation: ccUp 0.2s ease-out both; }\n.cc-cascade > *:nth-child(1) { animation-delay: 0.06s; }\n.cc-cascade > *:nth-child(2) { animation-delay: 0.11s; }\n.cc-cascade > *:nth-child(3) { animation-delay: 0.15s; }\n.cc-cascade > *:nth-child(4) { animation-delay: 0.19s; }\n@keyframes ccUp {\n  from { opacity: 0; transform: translateY(6px); }\n  to   { opacity: 1; transform: translateY(0); }\n}\n\n/* Motion is decorative — never let it make the panel unusable. */\n@media (prefers-reduced-motion: reduce) {\n  .cc-card,\n  .cc-cascade > * {\n    animation: none !important;\n    opacity: 1 !important;\n    transform: none !important;\n  }\n}\n";
// src/ReminderInput.tsx
/**
* The natural-language add row — shared by the panel's main view and the full
* reminders list.
*
* Extracted rather than duplicated: it owns parsing, the ask-for-a-time fallback and
* the confirmation wording. A second copy would be a second place for "Got it —
* every 2h" to drift from what was actually saved.
*/
var FONT$1 = PANEL_FONT;
var ASK_CHOICES = [
	{
		key: "apps.crewCompanion.panel.ask.in1h",
		everyMinutes: null,
		at: (n) => new Date(n.getTime() + 36e5)
	},
	{
		key: "apps.crewCompanion.panel.ask.tomorrow",
		everyMinutes: null,
		at: (n) => {
			const d = new Date(n);
			d.setDate(d.getDate() + 1);
			d.setHours(9, 0, 0, 0);
			return d;
		}
	},
	{
		key: "apps.crewCompanion.panel.ask.daily",
		everyMinutes: 1440,
		at: (n) => new Date(n.getTime() + 864e5)
	}
];
ASK_CHOICES.map((c) => c.key);
/**
* Short confirmation of when something will fire.
*
* Separate from `labelFor` in shared/reminders: that formats a row in a list of
* pending items, whereas this reads back a just-made decision, where the repeat is
* the salient part ("every 2h" matters more than the first fire time).
*/
function confirmLabel(fireAt, everyMinutes, now) {
	const time = fmtTime(fireAt);
	if (everyMinutes) {
		if (everyMinutes === 1440) return i18nT("apps.crewCompanion.panel.confirm.daily", { time });
		const unit = everyMinutes % 1440 === 0 ? fmtUnit(everyMinutes / 1440, "day") : everyMinutes % 60 === 0 ? fmtUnit(everyMinutes / 60, "hour") : fmtUnit(everyMinutes, "minute");
		return i18nT("apps.crewCompanion.panel.confirm.every", { unit });
	}
	return fireAt.toDateString() === now.toDateString() ? time : `${fmtDateFields(fireAt, { weekday: "short" })} ${time}`;
}
var ReminderInput = ({ onAdd }) => {
	const skin = useSkin();
	const [draft, setDraft] = useState("");
	const [notice, setNotice] = useState(null);
	/**
	* Parse the draft and persist it.
	*
	* `choice` is supplied only when the user picks from the ask row — the parser
	* found no time signal, so rather than guessing we asked. The choice carries the
	* KIND too, so a one-off stays a one-off.
	*/
	const submitDraft = useCallback(async (choice) => {
		const raw = draft.trim();
		if (!raw) return;
		const now = /* @__PURE__ */ new Date();
		const parsed = parseReminder(raw, now);
		let fireAtIso = parsed.fireAt;
		let every = parsed.recurrence?.everyMinutes;
		if (choice) {
			every = choice.everyMinutes ?? void 0;
			fireAtIso = choice.at(now).toISOString();
		} else if (parsed.needsSchedule) {
			setNotice({
				kind: "ask",
				message: i18nT("apps.crewCompanion.panel.ask.when", { text: parsed.text })
			});
			return;
		}
		if (!fireAtIso) return;
		if (!await onAdd?.(parsed.text, fireAtIso, every)) {
			setNotice({
				kind: "error",
				message: i18nT("apps.crewCompanion.panel.confirm.error")
			});
			return;
		}
		setDraft("");
		setNotice({
			kind: "ok",
			message: i18nT("apps.crewCompanion.panel.confirm.ok", { when: confirmLabel(new Date(fireAtIso), every, now) })
		});
	}, [draft, onAdd]);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsxs("form", {
		onSubmit: (e) => {
			e.preventDefault();
			submitDraft();
		},
		style: {
			/**
			* Full width, no horizontal margin of its own.
			*
			* This used to carry `margin: 9px 14px`, which was right for the main
			* card (no padding on that section) and wrong inside the full list,
			* whose container already pads 12px — the composer ended up inset 26px
			* while the rows below it sat at 12px. Horizontal inset is the HOST's
			* decision; the component only owns its vertical rhythm.
			*/
			display: "flex",
			alignItems: "center",
			gap: 8,
			width: "100%",
			margin: "9px 0",
			background: skin.row,
			borderRadius: skin.rowRadius,
			padding: "9px 10px"
		},
		children: [/* @__PURE__ */ jsx("input", {
			value: draft,
			onChange: (e) => {
				setDraft(e.target.value);
				setNotice(null);
			},
			placeholder: i18nT("apps.crewCompanion.panel.add.placeholder"),
			"aria-label": i18nT("apps.crewCompanion.panel.add.aria"),
			style: {
				flex: 1,
				fontSize: 11.5,
				color: skin.ink,
				background: "none",
				border: "none",
				outline: "none",
				fontFamily: FONT$1,
				minWidth: 0
			}
		}), /* @__PURE__ */ jsx("button", {
			type: "submit",
			"aria-label": i18nT("apps.crewCompanion.panel.add.submit"),
			disabled: !draft.trim(),
			style: {
				width: 26,
				height: 26,
				borderRadius: "50%",
				background: skin.accent,
				color: skin.onAccent,
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				fontSize: 13,
				fontWeight: 700,
				border: "none",
				cursor: draft.trim() ? "pointer" : "default",
				opacity: draft.trim() ? 1 : .45,
				fontFamily: FONT$1,
				padding: 0
			},
			children: /* @__PURE__ */ jsx(Plus, {
				size: 14,
				className: "lucide-inline",
				"aria-hidden": "true"
			})
		})]
	}), notice && /* @__PURE__ */ jsxs("div", {
		role: "status",
		style: {
			display: "flex",
			alignItems: "center",
			gap: 6,
			margin: "-4px 0 6px",
			fontSize: 10.5,
			color: notice.kind === "ask" ? skin.ink : skin.accentText
		},
		children: [/* @__PURE__ */ jsx("span", {
			style: { flex: 1 },
			children: notice.message
		}), notice.kind === "ask" && /* @__PURE__ */ jsx(Fragment, { children: ASK_CHOICES.map((c) => /* @__PURE__ */ jsx("button", {
			onClick: () => submitDraft(c),
			style: {
				fontSize: 10,
				fontWeight: 700,
				color: skin.onAccent,
				background: skin.accent,
				border: "none",
				borderRadius: 5,
				padding: "2px 6px",
				cursor: "pointer",
				fontFamily: FONT$1
			},
			children: i18nT(c.key)
		}, c.key)) })]
	})] });
};
// src/PanelViews.tsx
/**
* The panel's secondary views — "All reminders" and "Settings".
*
* These render as the CARD'S OWN CONTENT, in normal flow, replacing the reminder
* list. Deliberately not `position: absolute` over the card: an overlay reads as a
* second layer stacked on the first, which is the thing to avoid. Same card, same
* chrome, different body.
*
* They also never navigate anywhere. Earlier versions sent these two links to the
* Kiro Crew dashboard — a browser tab, then an Electron window — and both were a new
* page. Everything here happens in the panel the user already has open.
*/
var api = petBridge;
/**
* Human interval for the repeat pill, e.g. 120 → "2h".
*
* Through `fmtUnit` rather than `${n}h`: the unit has to be translated and the
* digits localized, and the space (or lack of one) between number and unit is a
* per-locale decision — `2h` is right in English and wrong in several others.
*/
function repeatLabel(mins) {
	if (mins === 1440) return i18nT("apps.crewCompanion.view.daily");
	const unit = mins % 1440 === 0 ? fmtUnit(mins / 1440, "day") : mins % 60 === 0 ? fmtUnit(mins / 60, "hour") : fmtUnit(mins, "minute");
	return i18nT("apps.crewCompanion.view.every", { unit });
}
/** Back row: the only way out of a secondary view besides Escape. */
var ViewHeader = ({ title, onBack }) => {
	const skin = useSkin();
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			alignItems: "center",
			gap: 4,
			padding: "10px 14px 6px"
		},
		children: [/* @__PURE__ */ jsx("button", {
			onClick: onBack,
			"aria-label": i18nT("apps.crewCompanion.view.back"),
			title: i18nT("apps.crewCompanion.view.back"),
			style: {
				WebkitAppRegion: "no-drag",
				width: 28,
				height: 28,
				borderRadius: "50%",
				display: "inline-flex",
				alignItems: "center",
				justifyContent: "center",
				background: "none",
				border: "none",
				cursor: "pointer",
				color: skin.muted,
				fontSize: 15,
				lineHeight: 1,
				padding: 0,
				fontFamily: PANEL_FONT
			},
			onMouseEnter: (e) => {
				e.currentTarget.style.background = skin.hairline;
				e.currentTarget.style.color = skin.ink;
			},
			onMouseLeave: (e) => {
				e.currentTarget.style.background = "none";
				e.currentTarget.style.color = skin.muted;
			},
			children: /* @__PURE__ */ jsx(ArrowLeft, {
				size: 11,
				"aria-hidden": "true"
			})
		}), /* @__PURE__ */ jsx("span", {
			style: {
				flex: 1,
				fontSize: 12.5,
				fontWeight: 700,
				WebkitAppRegion: "drag",
				cursor: "grab",
				userSelect: "none",
				WebkitUserSelect: "none"
			},
			children: title
		})]
	});
};
var AllRemindersView = ({ onAdd }) => {
	const skin = useSkin();
	const [items, setItems] = useState(null);
	const refresh = useCallback(async () => {
		const list = await api?.remindersList?.().catch(() => []) ?? [];
		setItems([...list].sort((a, b) => {
			if (!!a.done !== !!b.done) return a.done ? 1 : -1;
			return Date.parse(a.fireAt) - Date.parse(b.fireAt);
		}));
	}, []);
	useEffect(() => {
		refresh();
	}, [refresh]);
	const remove = async (id) => {
		await api?.remindersRemove?.(id);
		refresh();
	};
	const now = /* @__PURE__ */ new Date();
	const composer = /* @__PURE__ */ jsx(ReminderInput, { onAdd: onAdd ? async (text, fireAtIso, everyMinutes) => {
		const ok = await onAdd(text, fireAtIso, everyMinutes);
		if (ok) refresh();
		return ok;
	} : void 0 });
	if (items === null) return /* @__PURE__ */ jsxs("div", { children: [composer, /* @__PURE__ */ jsx("div", {
		style: {
			fontSize: 11,
			color: skin.muted,
			padding: "4px 2px"
		},
		children: i18nT("apps.crewCompanion.view.loading")
	})] });
	if (items.length === 0) return /* @__PURE__ */ jsxs("div", { children: [composer, /* @__PURE__ */ jsxs("div", {
		style: {
			background: skin.row,
			borderRadius: skin.rowRadius,
			padding: "14px 10px",
			textAlign: "center"
		},
		children: [/* @__PURE__ */ jsx("div", {
			style: {
				fontSize: 11.5,
				fontWeight: 600
			},
			children: i18nT("apps.crewCompanion.panel.empty.title")
		}), /* @__PURE__ */ jsx("div", {
			style: {
				fontSize: 10,
				color: skin.muted,
				marginTop: 3
			},
			children: i18nT("apps.crewCompanion.view.emptyHint")
		})]
	})] });
	return /* @__PURE__ */ jsxs("div", { children: [composer, /* @__PURE__ */ jsx("div", {
		style: {
			background: skin.row,
			borderRadius: skin.rowRadius,
			overflow: "hidden"
		},
		children: items.map((r, i) => {
			const l = labelFor(r.fireAt, now);
			return /* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					alignItems: "center",
					gap: 7,
					padding: "8px 9px",
					borderTop: i === 0 ? "none" : `1px solid ${skin.hairline}`,
					opacity: r.done ? .55 : 1
				},
				children: [
					/* @__PURE__ */ jsx("span", {
						style: {
							fontSize: 10.5,
							fontWeight: 700,
							fontVariantNumeric: "tabular-nums",
							minWidth: 52
						},
						children: l.absLabel ?? l.relLabel
					}),
					/* @__PURE__ */ jsx("span", {
						style: {
							flex: 1,
							fontSize: 11,
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap"
						},
						children: r.text
					}),
					r.recurrence && /* @__PURE__ */ jsx("span", {
						style: {
							fontSize: 8.5,
							fontWeight: 700,
							padding: "2px 5px",
							borderRadius: 999,
							background: skin.accent,
							color: skin.onAccent,
							whiteSpace: "nowrap"
						},
						children: repeatLabel(r.recurrence.everyMinutes)
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: () => remove(r.id),
						"aria-label": i18nT("apps.crewCompanion.view.remove"),
						title: i18nT("apps.crewCompanion.view.remove"),
						style: {
							width: 24,
							height: 24,
							borderRadius: "50%",
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							background: "none",
							border: "none",
							cursor: "pointer",
							color: skin.muted,
							fontSize: 11,
							padding: 0,
							flexShrink: 0,
							fontFamily: PANEL_FONT
						},
						children: /* @__PURE__ */ jsx(X, {
							size: 11,
							"aria-hidden": "true"
						})
					})
				]
			}, r.id);
		})
	})] });
};
var Toggle = ({ on, onChange, label, hint }) => {
	const skin = useSkin();
	return /* @__PURE__ */ jsxs("label", {
		style: {
			display: "flex",
			alignItems: "flex-start",
			gap: 9,
			padding: "9px 10px",
			cursor: "pointer"
		},
		children: [/* @__PURE__ */ jsxs("span", {
			style: {
				flex: 1,
				minWidth: 0
			},
			children: [/* @__PURE__ */ jsx("span", {
				style: {
					display: "block",
					fontSize: 11.5,
					fontWeight: 600
				},
				children: label
			}), /* @__PURE__ */ jsx("span", {
				style: {
					display: "block",
					fontSize: 10,
					color: skin.muted,
					marginTop: 2,
					lineHeight: 1.35
				},
				children: hint
			})]
		}), /* @__PURE__ */ jsxs("span", {
			style: {
				position: "relative",
				flexShrink: 0,
				width: 30,
				height: 18,
				marginTop: 1
			},
			children: [
				/* @__PURE__ */ jsx("input", {
					type: "checkbox",
					role: "switch",
					"aria-label": label,
					checked: on,
					onChange: (e) => onChange(e.target.checked),
					style: {
						position: "absolute",
						inset: 0,
						width: "100%",
						height: "100%",
						margin: 0,
						opacity: 0,
						cursor: "pointer"
					}
				}),
				/* @__PURE__ */ jsx("span", {
					"aria-hidden": true,
					style: {
						display: "block",
						width: 30,
						height: 18,
						borderRadius: 999,
						background: on ? skin.accent : skin.hairline,
						transition: "background 160ms ease"
					}
				}),
				/* @__PURE__ */ jsx("span", {
					"aria-hidden": true,
					style: {
						position: "absolute",
						top: 3,
						left: on ? 15 : 3,
						width: 12,
						height: 12,
						borderRadius: "50%",
						background: on ? skin.onAccent : skin.muted,
						transition: "left 160ms cubic-bezier(.4,.0,.4,1), background 160ms ease",
						pointerEvents: "none"
					}
				})
			]
		})]
	});
};
var SettingsView = () => {
	const ime = useImeGuard();
	const skin = useSkin();
	const [breakOn, setBreakOn] = useState(true);
	const [sessionOn, setSessionOn] = useState(true);
	const [breakMins, setBreakMins] = useState(45);
	/**
	* The in-progress custom interval. `null` means "not editing" — distinct from
	* `''`, which means the user has cleared the field and is about to type. Using
	* `''` for both made the field un-editable once a non-preset value was set: the
	* fallback re-displayed the stored number on every keystroke that emptied it.
	*/
	const [customDraft, setCustomDraft] = useState(null);
	/**
	* Read once on mount, then follow `config:updated`.
	*
	* The subscription is not redundant with the mount read: the SAME settings are
	* editable on the dashboard app page, and a change made there reaches this window
	* only as a broadcast. Without it, this view kept whatever it read when it opened
	* and its pills claimed an interval that was no longer set — the footer next to it
	* already followed the broadcast, so the panel would contradict itself.
	*
	* `apply` is shared by both paths so they cannot drift in which keys they honour.
	*/
	useEffect(() => {
		const apply = (c) => {
			if (!c) return;
			if (typeof c?.breakNudgesEnabled === "boolean") setBreakOn(c.breakNudgesEnabled);
			if (typeof c?.sessionNotificationsEnabled === "boolean") setSessionOn(c.sessionNotificationsEnabled);
			if (typeof c?.breakReminderMins === "number") {
				setBreakMins(c.breakReminderMins);
				setCustomDraft(null);
			}
		};
		api?.getCrewCompanionConfig?.().then(apply).catch(() => {});
		const off = api?.onConfigUpdated?.(() => {
			api?.getCrewCompanionConfig?.().then(apply).catch(() => {});
		});
		return () => off?.();
	}, []);
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "grid",
			gap: 7
		},
		children: [
			/* @__PURE__ */ jsxs("div", {
				style: {
					background: skin.row,
					borderRadius: skin.rowRadius,
					overflow: "hidden"
				},
				children: [/* @__PURE__ */ jsx(Toggle, {
					on: breakOn,
					onChange: (v) => {
						setBreakOn(v);
						api?.updateConfig?.({ breakNudgesEnabled: v });
					},
					label: i18nT("apps.crewCompanion.view.breaksLabel"),
					hint: i18nT("apps.crewCompanion.view.breaksHint")
				}), breakOn && /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 6,
						padding: "8px 10px",
						borderTop: `1px solid ${skin.hairline}`
					},
					children: [
						/* @__PURE__ */ jsx("span", {
							id: "cc-panel-every-label",
							style: {
								flex: 1,
								fontSize: 11,
								color: skin.muted
							},
							children: i18nT("apps.crewCompanion.view.everyHowOften")
						}),
						/* @__PURE__ */ jsx(RadioChipGroup, {
							ariaLabelledBy: "cc-panel-every-label",
							style: {
								display: "flex",
								alignItems: "center",
								gap: 6
							},
							children: BREAK_PRESETS.map((m) => {
								const active = breakMins === m;
								return /* @__PURE__ */ jsx("button", {
									type: "button",
									onClick: () => {
										setBreakMins(m);
										setCustomDraft(null);
										api?.updateConfig?.({ breakReminderMins: m });
									},
									...radioChip(active),
									style: {
										minWidth: 30,
										height: 24,
										borderRadius: 999,
										border: "none",
										cursor: "pointer",
										fontFamily: "var(--cc-panel-font)",
										fontSize: 10,
										fontWeight: 700,
										background: active ? skin.accent : "transparent",
										color: active ? skin.onAccent : skin.muted
									},
									children: m
								}, m);
							})
						}),
						/* @__PURE__ */ jsx("input", {
							type: "number",
							min: 5,
							max: 480,
							"aria-label": i18nT("apps.crewCompanion.view.everyCustom"),
							placeholder: i18nT("apps.crewCompanion.view.everyMinShort"),
							value: customDraft !== null ? customDraft : BREAK_PRESETS.includes(breakMins) ? "" : String(breakMins),
							...ime.bindComposition({
								onFocus: () => setCustomDraft(BREAK_PRESETS.includes(breakMins) ? "" : String(breakMins)),
								onBlur: () => {
									const next = clampBreakMins(customDraft ?? "");
									setCustomDraft(null);
									if (next === null) return;
									setBreakMins(next);
									api?.updateConfig?.({ breakReminderMins: next });
								}
							}),
							onChange: (e) => setCustomDraft(e.target.value),
							onKeyDown: (e) => {
								if (e.key !== "Enter") return;
								if (ime.isComposing(e)) return;
								e.target.blur();
							},
							style: {
								width: 42,
								height: 24,
								borderRadius: 999,
								textAlign: "center",
								fontFamily: "var(--cc-panel-font)",
								fontSize: 10,
								fontWeight: 700,
								background: BREAK_PRESETS.includes(breakMins) ? "transparent" : skin.accent,
								color: BREAK_PRESETS.includes(breakMins) ? skin.muted : skin.onAccent,
								border: `1px solid ${skin.hairline}`,
								MozAppearance: "textfield"
							}
						})
					]
				})]
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					background: skin.row,
					borderRadius: skin.rowRadius,
					overflow: "hidden"
				},
				children: /* @__PURE__ */ jsx(Toggle, {
					on: sessionOn,
					onChange: (v) => {
						setSessionOn(v);
						api?.updateConfig?.({ sessionNotificationsEnabled: v });
					},
					label: i18nT("apps.crewCompanion.view.sessionLabel"),
					hint: i18nT("apps.crewCompanion.view.sessionHint")
				})
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					fontSize: 10,
					color: skin.faint,
					lineHeight: 1.45,
					padding: "2px 10px 0"
				},
				children: i18nT("apps.crewCompanion.view.notifyNote")
			})
		]
	});
};
/**
* Guard around a panel view.
*
* Without this, one bad render emptied #root: the window stayed open but painted
* nothing, so the panel looked gone AND the pet's click toggled an already-open
* window instead of showing it. A visible failure is far better than a blank one.
*/
var ViewBoundary = class extends React.Component {
	state = { failed: false };
	static getDerivedStateFromError() {
		return { failed: true };
	}
	componentDidCatch(err) {
		console.error("[panel] view failed to render:", err);
	}
	render() {
		if (!this.state.failed) return this.props.children;
		return /* @__PURE__ */ jsxs("div", {
			style: {
				padding: "10px 2px",
				fontSize: 11,
				lineHeight: 1.5
			},
			children: [/* @__PURE__ */ jsx("div", {
				style: {
					fontWeight: 600,
					marginBottom: 6
				},
				children: this.props.label
			}), /* @__PURE__ */ jsx("button", {
				onClick: this.props.onBack,
				style: {
					fontSize: 11,
					padding: "5px 10px",
					borderRadius: 999,
					border: "none",
					cursor: "pointer",
					fontFamily: PANEL_FONT
				},
				children: this.props.back
			})]
		});
	}
};
// src/PanelCard.tsx
/**
* PanelCard — the reminder pet's panel, built as a self-contained CARD.
*
* The design it implements was specified in the standalone Crew Companion app's
* own spec document, which did not move into this repository with the code — so
* the intent is written out here rather than cited as a path that a reader cannot
* open.
*
* This is a CARD, not a full-bleed page: it draws its own background, radius and
* shadow, and expects to sit in a TRANSPARENT window with padding around it. An
* earlier attempt retrofitted a card wrapper around the old full-bleed chat UI and
* broke its layout — hence a purpose-built component.
*
* The pet is NOT drawn here. It stays on the desktop as its own overlay, keeps its
* own notification bubbles, and is simply what you click to open this panel. Two
* earlier designs (pet inside the card, pet perched on the edge) both required
* either coupling two OS windows or concealing the real pet and duplicating it —
* and concealing it meant rebuilding notification delivery for no real gain.
*
* The skin is a FIXED warm cream palette — it intentionally does NOT follow the
* Kiro Crew dashboard theme, because the pet is its own product surface.
*/
injectCss("panel", panel_default);
var FONT = PANEL_FONT;
/**
* Floor height for the card.
*
* The breathing overlay is absolutely positioned over this card, so the card's
* height is also the overlay's. Without a floor, the short "Nothing scheduled"
* state gave the overlay less room than its content needed and clipped it top and
* bottom. Keep >= the overlay's content height.
*/
var CARD_MIN_HEIGHT = 300;
var SectionLabel = ({ children, right }) => {
	const skin = useSkin();
	return /* @__PURE__ */ jsxs("div", {
		style: {
			display: "flex",
			alignItems: "center",
			padding: "0 14px 4px"
		},
		children: [/* @__PURE__ */ jsx("span", {
			style: {
				flex: 1,
				fontSize: 10,
				fontWeight: 700,
				letterSpacing: ".05em",
				color: skin.accentText
			},
			children
		}), right]
	});
};
var Pill = ({ tone, children }) => {
	const skin = useSkin();
	return /* @__PURE__ */ jsx("span", {
		style: {
			fontSize: 9,
			padding: "2px 6px",
			borderRadius: 9,
			whiteSpace: "nowrap",
			fontWeight: 700,
			background: tone === "ok" ? skin.okInk : skin.accent,
			color: skin.onAccent
		},
		children
	});
};
var PanelCard = ({ upNext, breakMins, sessionOn, openSide = "right", onBreathe, onAdd, onSeeAll, onSettings, onClose, view = "main", onBack, onRemove, onSkip }) => {
	const skin = useSkin();
	/** Which row the cursor is on, so its ✕ can appear without a permanent one. */
	const [hoverRow, setHoverRow] = useState(null);
	const empty = upNext.length === 0;
	return /* @__PURE__ */ jsx("div", {
		className: "cc-card",
		style: {
			background: skin.card,
			color: skin.ink,
			borderRadius: skin.radius,
			boxShadow: skin.shadow,
			overflow: "hidden",
			fontFamily: FONT,
			minHeight: CARD_MIN_HEIGHT,
			transformOrigin: openSide === "left" ? "right top" : "left top"
		},
		children: view !== "main" ? /* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				flexDirection: "column",
				height: "100%"
			},
			children: [/* @__PURE__ */ jsx(ViewHeader, {
				title: view === "all" ? i18nT("apps.crewCompanion.view.allTitle") : i18nT("apps.crewCompanion.view.settingsTitle"),
				onBack: () => onBack?.()
			}), /* @__PURE__ */ jsx("div", {
				style: {
					flex: 1,
					overflowY: "auto",
					padding: "0 14px 14px"
				},
				children: /* @__PURE__ */ jsx(ViewBoundary, {
					onBack: () => onBack?.(),
					label: i18nT("apps.crewCompanion.view.failed"),
					back: i18nT("apps.crewCompanion.view.back"),
					children: view === "all" ? /* @__PURE__ */ jsx(AllRemindersView, { onAdd }) : /* @__PURE__ */ jsx(SettingsView, {})
				})
			})]
		}) : /* @__PURE__ */ jsxs("div", {
			className: "cc-cascade",
			children: [
				/* @__PURE__ */ jsxs("div", {
					style: {
						padding: "14px 14px 12px",
						position: "relative"
					},
					children: [
						onClose && /* @__PURE__ */ jsx("button", {
							onClick: onClose,
							"aria-label": i18nT("apps.crewCompanion.panel.close"),
							title: i18nT("apps.crewCompanion.panel.close"),
							style: {
								/**
								* 28px, not 20px. The glyph is small but the TARGET must not be:
								* a 20px box with a 50% radius gives a ~20px circle, so its four
								* corners fell through to the element behind (measured: 4 of 15
								* probe points inside the box missed the button) and the whole
								* thing sat under the 24px minimum target size. Growing the box
								* costs nothing visually — the background is transparent until
								* hover, so only the hit area changes.
								*/
								position: "absolute",
								top: 6,
								right: 6,
								width: 28,
								height: 28,
								borderRadius: "50%",
								display: "inline-flex",
								alignItems: "center",
								justifyContent: "center",
								background: "none",
								border: "none",
								cursor: "pointer",
								color: skin.faint,
								fontSize: 13,
								lineHeight: 1,
								padding: 0,
								WebkitAppRegion: "no-drag"
							},
							onMouseEnter: (e) => {
								e.currentTarget.style.background = skin.hairline;
								e.currentTarget.style.color = skin.ink;
							},
							onMouseLeave: (e) => {
								e.currentTarget.style.background = "none";
								e.currentTarget.style.color = skin.faint;
							},
							children: /* @__PURE__ */ jsx(X, {
								size: 12,
								"aria-hidden": "true"
							})
						}),
						/* @__PURE__ */ jsxs("div", {
							style: {
								WebkitAppRegion: "drag",
								cursor: "grab",
								userSelect: "none",
								WebkitUserSelect: "none",
								/**
								* Stop short of the ✕ so the two rectangles never overlap.
								*
								* `no-drag` on the button is not sufficient: Electron resolves drag
								* regions in the COMPOSITOR from element rectangles, and this block —
								* a full-width static sibling that paints after the absolutely
								* positioned button — covered the button's lower ~20px, swallowing
								* mouse-down over its middle while the top 8px (above this block)
								* still worked. DOM hit-testing cannot see app-region, which is why
								* an elementFromPoint probe reported the target as fully clickable.
								*
								* 34px = the button's 28px width + its 6px right offset.
								*/
								marginRight: 34
							},
							children: [/* @__PURE__ */ jsx("div", {
								style: {
									fontSize: 14,
									fontWeight: 700,
									lineHeight: 1.25,
									paddingRight: 22
								},
								children: i18nT("apps.crewCompanion.panel.breathe.title")
							}), /* @__PURE__ */ jsx("div", {
								style: {
									fontSize: 11,
									color: skin.muted,
									marginTop: 4
								},
								children: i18nT("apps.crewCompanion.panel.breathe.sub")
							})]
						}),
						/* @__PURE__ */ jsx("button", {
							onClick: onBreathe,
							style: {
								marginTop: 10,
								fontSize: 11.5,
								padding: "7px 14px",
								borderRadius: 20,
								background: skin.accent,
								color: skin.onAccent,
								fontWeight: 700,
								border: "none",
								cursor: "pointer",
								fontFamily: FONT
							},
							children: i18nT("apps.crewCompanion.panel.breathe.cta")
						})
					]
				}),
				/* @__PURE__ */ jsxs("div", { children: [/* @__PURE__ */ jsx(SectionLabel, {
					right: /* @__PURE__ */ jsx("button", {
						onClick: onSeeAll,
						style: {
							fontSize: 10,
							color: skin.accentText,
							background: "none",
							border: "none",
							/**
							* Padding + matching negative margin: a 12px-tall text link is a
							* 12px target (measured 68/113 points inside a 24px area). This
							* grows the hit area to clear the minimum while the negative margin
							* keeps the text exactly where it was, so no layout shifts.
							*/
							padding: "7px 4px",
							margin: "-7px -4px",
							cursor: "pointer",
							fontFamily: FONT
						},
						children: i18nT("apps.crewCompanion.panel.seeAll")
					}),
					children: i18nT("apps.crewCompanion.panel.upNext")
				}), empty ? /* @__PURE__ */ jsxs("div", {
					style: {
						margin: "0 14px",
						background: skin.row,
						borderRadius: skin.rowRadius,
						padding: "12px 11px",
						textAlign: "center"
					},
					children: [/* @__PURE__ */ jsx("div", {
						style: {
							fontSize: 12,
							fontWeight: 600
						},
						children: i18nT("apps.crewCompanion.panel.empty.title")
					}), /* @__PURE__ */ jsx("div", {
						style: {
							fontSize: 10.5,
							color: skin.muted,
							marginTop: 3,
							lineHeight: 1.4
						},
						children: i18nT("apps.crewCompanion.panel.empty.sub")
					})]
				}) : /* @__PURE__ */ jsx("div", {
					style: {
						margin: "0 14px",
						background: skin.row,
						borderRadius: skin.rowRadius,
						overflow: "hidden"
					},
					children: upNext.map((item, i) => /* @__PURE__ */ jsxs("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 7,
							padding: "8px 10px",
							borderTop: i === 0 ? "none" : `1px solid ${skin.hairline}`
						},
						onMouseEnter: () => setHoverRow(item.id),
						onMouseLeave: () => setHoverRow(null),
						children: [
							item.absLabel && /* @__PURE__ */ jsx("span", {
								style: {
									fontSize: 12,
									fontWeight: 700,
									fontVariantNumeric: "tabular-nums"
								},
								children: item.absLabel
							}),
							/* @__PURE__ */ jsx("span", {
								style: {
									flex: 1,
									fontSize: 12,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap"
								},
								children: item.text
							}),
							/* @__PURE__ */ jsxs("span", {
								style: {
									position: "relative",
									flexShrink: 0,
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "flex-end",
									minWidth: item.recurring ? 62 : 34,
									height: 24
								},
								children: [/* @__PURE__ */ jsx("span", {
									style: {
										opacity: hoverRow === item.id ? 0 : 1,
										transition: "opacity 120ms ease",
										pointerEvents: "none"
									},
									children: /* @__PURE__ */ jsx(Pill, {
										tone: item.tone ?? "accent",
										children: item.relLabel
									})
								}), /* @__PURE__ */ jsxs("span", {
									style: {
										position: "absolute",
										right: 0,
										top: 0,
										display: "inline-flex",
										alignItems: "center",
										gap: 2,
										opacity: hoverRow === item.id ? 1 : 0,
										transition: "opacity 120ms ease",
										pointerEvents: hoverRow === item.id ? "auto" : "none"
									},
									children: [item.recurring && /* @__PURE__ */ jsx("button", {
										onClick: () => onSkip?.(item.id),
										"aria-label": i18nT("apps.crewCompanion.view.skip"),
										title: i18nT("apps.crewCompanion.view.skip"),
										style: {
											height: 24,
											padding: "0 7px",
											borderRadius: 999,
											border: "none",
											background: skin.hairline,
											color: skin.ink,
											fontSize: 9.5,
											fontWeight: 700,
											cursor: "pointer",
											fontFamily: FONT
										},
										children: i18nT("apps.crewCompanion.view.skip")
									}), /* @__PURE__ */ jsx("button", {
										onClick: () => onRemove?.(item.id),
										"aria-label": i18nT("apps.crewCompanion.view.remove"),
										title: i18nT("apps.crewCompanion.view.remove"),
										style: {
											width: 24,
											height: 24,
											borderRadius: "50%",
											flexShrink: 0,
											display: "inline-flex",
											alignItems: "center",
											justifyContent: "center",
											background: "none",
											border: "none",
											cursor: "pointer",
											color: skin.muted,
											fontSize: 11,
											padding: 0,
											fontFamily: FONT
										},
										children: /* @__PURE__ */ jsx(X, {
											size: 11,
											"aria-hidden": "true"
										})
									})]
								})]
							})
						]
					}, item.id))
				})] }),
				/* @__PURE__ */ jsx("div", {
					style: { padding: "0 14px" },
					children: /* @__PURE__ */ jsx(ReminderInput, { onAdd })
				}),
				/* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						alignItems: "center",
						padding: "1px 14px 13px"
					},
					children: [/* @__PURE__ */ jsxs("span", {
						style: {
							flex: 1,
							fontSize: 10,
							color: skin.faint
						},
						children: [
							i18nT("apps.crewCompanion.panel.breakSummary", { mins: String(breakMins) }),
							" · ",
							i18nT(sessionOn ? "apps.crewCompanion.panel.sessionOn" : "apps.crewCompanion.panel.sessionOff")
						]
					}), /* @__PURE__ */ jsx("button", {
						onClick: onSettings,
						style: {
							fontSize: 10,
							color: skin.accentText,
							fontWeight: 600,
							background: "none",
							border: "none",
							cursor: "pointer",
							fontFamily: FONT,
							padding: "7px 4px",
							margin: "-7px -4px -7px 0"
						},
						children: i18nT("apps.crewCompanion.view.settingsTitle")
					})]
				})
			]
		})
	});
};
// src/panel.tsx
/**
* panel.tsx — the panel, in its own window.
*
* This entry exists so the panel is an OS window rather than DOM inside the
* companion's overlay, which is what makes it draggable independently: the heading
* carries `-webkit-app-region: drag`, and the operating system moves the window.
*
* It owns the data the card renders (reminders, break cadence) and reports two things
* back to the main process, because only this side knows them: whether the breathing
* exercise is running, and whether a destination view is open. Both suppress
* close-on-blur — losing a 48-second exercise or a half-read settings screen to a
* stray click elsewhere would be hostile.
*/
/** How often the list refreshes while the panel is open. */
var REFRESH_MS = 3e4;
function bridge() {
	return window.crewCompanion;
}
function Panel() {
	const [reminders, setReminders] = useState([]);
	const [breakMins, setBreakMins] = useState(45);
	const [sessionOn, setSessionOn] = useState(true);
	const [view, setView] = useState("main");
	const [breathing, setBreathing] = useState(false);
	/**
	* Which side of the companion the panel opened on. Aims the spring's transform
	* origin (see PanelCard + panel.css) so the card grows out of the companion rather
	* than away from it. The main process resolves the side from placement and sends it
	* over `crew-companion:panel-opened`.
	*/
	const [openSide, setOpenSide] = useState("right");
	const load = useCallback(async () => {
		try {
			const r = await appFetch(REMINDERS_PATH, { credentials: "same-origin" });
			if (!r.ok) return;
			const d = await r.json();
			setReminders(Array.isArray(d.reminders) ? d.reminders : []);
			if (typeof d.breakReminderMins === "number") setBreakMins(d.breakReminderMins);
			if (typeof d.sessionNotificationsEnabled === "boolean") setSessionOn(d.sessionNotificationsEnabled);
		} catch {}
	}, []);
	useEffect(() => {
		load();
		const t = window.setInterval(() => void load(), REFRESH_MS);
		return () => window.clearInterval(t);
	}, [load]);
	useEffect(() => petBridge.onConfigUpdated?.(() => void load()), [load]);
	/**
	* Aim the spring from the side the panel opened on, and start every open at the
	* glance. The window is destroyed on close, so a fresh open remounts the card and
	* replays the entrance — this just points it the right way and re-reads the list,
	* whose relative labels go stale while the window is gone.
	*/
	useEffect(() => {
		const off = bridge()?.onPanelOpened?.((side) => {
			setOpenSide(side === "left" ? "left" : "right");
			setView("main");
			load();
		});
		return () => {
			off?.();
		};
	}, [load]);
	/**
	* Tell the main process when the panel must not close on blur.
	*
	* Reported from here because only this side knows: the exercise is a commitment,
	* and a secondary view is a destination rather than a glance.
	*/
	useEffect(() => {
		bridge()?.panelBreathing?.(breathing);
	}, [breathing]);
	useEffect(() => {
		bridge()?.panelHold?.(view !== "main");
	}, [view]);
	/** Escape closes the panel — but not while the exercise is running. */
	useEffect(() => {
		const onKey = (e) => {
			if (e.key !== "Escape") return;
			if (breathing) return;
			bridge()?.panelClose?.();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [breathing]);
	const addReminder = useCallback(async (text, fireAtIso, everyMinutes) => {
		try {
			if (!(await appFetch("/api/apps/crew-companion/reminders/add", {
				method: "POST",
				credentials: "same-origin",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					text,
					fireAt: fireAtIso,
					everyMinutes
				})
			})).ok) return false;
			await load();
			return true;
		} catch {
			return false;
		}
	}, [load]);
	const mutate = useCallback(async (path, id) => {
		try {
			await appFetch(path, {
				method: "POST",
				credentials: "same-origin",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ id })
			});
			await load();
		} catch {}
	}, [load]);
	/** A completed exercise is counted; one abandoned halfway is not. */
	const finishBreathing = useCallback(async () => {
		try {
			await appFetch(BREATHING_DONE_PATH, {
				method: "POST",
				credentials: "same-origin"
			});
		} catch {}
		setBreathing(false);
	}, []);
	const now = /* @__PURE__ */ new Date();
	const upNext = sortedReminders(reminders).slice(0, 3).map((r) => {
		const l = labelFor(r.fireAt, now);
		return {
			id: r.id,
			text: r.text,
			absLabel: l.absLabel,
			relLabel: l.relLabel,
			recurring: Boolean(r.recurrence)
		};
	});
	return /* @__PURE__ */ jsxs("div", {
		style: {
			position: "relative",
			width: "100%",
			height: "100%"
		},
		children: [/* @__PURE__ */ jsx(PanelCard, {
			upNext,
			breakMins,
			sessionOn,
			view,
			openSide,
			onAdd: addReminder,
			onBreathe: () => setBreathing(true),
			onSeeAll: () => setView("all"),
			onSettings: () => setView("settings"),
			onBack: () => setView("main"),
			onRemove: (id) => void mutate(REMOVE_PATH, id),
			onSkip: (id) => void mutate(SKIP_PATH, id),
			onClose: () => bridge()?.panelClose?.()
		}), breathing ? /* @__PURE__ */ jsx(BreathingOverlay, {
			onDone: finishBreathing,
			onEnd: () => setBreathing(false)
		}) : null]
	});
}
// src/entries/panel.tsx
/** The panel window, opened beside the avatar. */
function PanelWindow() {
	return /* @__PURE__ */ jsx(WindowRoot, {
		css: panel_window_default,
		cssId: "panel-window",
		revealOnPaint: true,
		children: /* @__PURE__ */ jsx(Panel, {})
	});
}
export { PanelWindow as default };
