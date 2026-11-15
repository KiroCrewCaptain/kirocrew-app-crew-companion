import { n as useDocumentImeLatch } from "./WindowRoot-R1vuzr9j.mjs";
import { createContext, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
// src/host/useDialogFocusTrap.ts
/** Focusable descendants of a dialog, in DOM order, skipping disabled ones. */
var FOCUSABLE = "a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex=\"-1\"])";
/**
* Mount order of every trap whose Tab handling is armed. Only the newest
* MOUNTED one moves focus on Tab.
*
* `enabled` covers a dialog that knows it opened an inner one. This covers the
* one that does not: the image viewer opens from a document-level event, over
* whichever Modal holds the markdown. Two armed traps would each pull focus
* back inside themselves on every Tab, so focus could never leave the newer
* dialog's first control. The order is the mount order, not the arm order, so
* an outer dialog re-arming on a re-render does not jump back in front.
* Escape is not gated here: its owners already consume it in order (see
* `handleEscape`).
*/
var nextTrapOrder = 0;
var armedTabTraps = /* @__PURE__ */ new Set();
var newestArmedTrap = () => Math.max(-1, ...armedTabTraps);
function useDialogFocusTrap(containerRef, onEscape, { enabled = true, handleEscape = true, restoreFocus = true } = {}) {
	const [opener] = useState(() => document.activeElement);
	useEffect(() => {
		const active = document.activeElement;
		const target = containerRef.current?.contains(active) ? opener : active;
		const restoreTo = restoreFocus ? target : null;
		(Array.from(containerRef.current?.querySelectorAll("a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), summary, [tabindex]:not([tabindex=\"-1\"])") ?? []).find((el) => el.tabIndex >= 0) ?? containerRef.current)?.focus({ preventScroll: true });
		return () => restoreTo?.focus?.({ preventScroll: true });
	}, [
		containerRef,
		restoreFocus,
		opener
	]);
	const imeLatch = useDocumentImeLatch(enabled);
	const crewHidden = false;
	const mountOrderRef = useRef(0);
	useLayoutEffect(() => {
		mountOrderRef.current = ++nextTrapOrder;
	}, []);
	useLayoutEffect(() => {
		if (!enabled || crewHidden) return;
		const order = mountOrderRef.current;
		armedTabTraps.add(order);
		const onKey = (e) => {
			if (e.key === "Escape" && handleEscape) {
				if (!imeLatch.claimKey(e)) return;
				onEscape();
				return;
			}
			const container = containerRef.current;
			if (e.key !== "Tab" || !container) return;
			if (newestArmedTrap() !== order) return;
			const items = Array.from(container.querySelectorAll(FOCUSABLE)).filter((el) => el.offsetParent !== null && el.tabIndex >= 0);
			if (!items.length) return;
			const firstEl = items[0];
			const lastEl = items[items.length - 1];
			const active = document.activeElement;
			const wrapsForward = !e.shiftKey && active === lastEl;
			const wrapsBackward = e.shiftKey && (active === firstEl || active === container);
			const refocuses = !wrapsForward && !wrapsBackward && !container.contains(active);
			if (!wrapsForward && !wrapsBackward && !refocuses) return;
			if (!imeLatch.claimKey(e)) return;
			e.preventDefault();
			(wrapsBackward ? lastEl : firstEl).focus();
		};
		window.addEventListener("keydown", onKey, true);
		return () => {
			window.removeEventListener("keydown", onKey, true);
			armedTabTraps.delete(order);
		};
	}, [
		containerRef,
		onEscape,
		enabled,
		handleEscape,
		imeLatch,
		crewHidden
	]);
}
// src/panelSkin.ts
/**
* Panel palette — derived from the Kiro Crew theme the user actually picked.
*
* This file previously held two hand-written palettes (a cream light one and a dark
* one) selected by `mode`. That was wrong: `src/shared/themes.ts` already links the
* dashboard's own stylesheet, sets `data-theme`, and aliases this app's older
* variable names onto Kiro Crew's — so every other window follows all ~36 themes,
* and only the panel ignored the user's colour choice.
*
* So the values here are CSS custom properties, not hex. Each carries the
* `kiro-dark` fallback as its default, which matters twice: before the dashboard
* stylesheet loads, and permanently if the gateway is unreachable.
*
* TRADEOFF, stated plainly: following an arbitrary user theme means the panel's
* contrast can no longer be proven at build time the way two fixed palettes could.
* The fallback palette IS still asserted (see panelContrast.test.ts); the other 35
* themes are the dashboard's own designed palettes, and we inherit their choices
* rather than second-guessing them per surface.
*/
/**
* The pet's typeface. Rounded rather than the system default: the panel is a
* companion surface, not a settings dialog. Shared so the avatar collection matches.
*/
var PANEL_FONT = "var(--cc-panel-font)";
/** Shape language shared by the panel and the avatar collection. */
var PANEL_RADIUS = {
	card: 16,
	row: 11,
	pill: 999,
	thumb: 11
};
/**
* The active skin, shared by the card and the breathing overlay.
*
* A context rather than a prop chain because the overlay is a SIBLING of the card
* in panelEntry, and the small pieces (SectionLabel, Pill) are module-level
* components — threading a skin prop through all of them would be noise.
*/
var SkinContext = createContext({
	card: "var(--card, var(--bg-elevated, #211d25))",
	ink: "var(--card-fg, var(--text, #dcdadf))",
	muted: "var(--muted, #938f9b)",
	faint: "var(--muted, #938f9b)",
	row: "var(--bg-hover, var(--bg-input, #28242e))",
	hairline: "var(--border, #352f3d)",
	accent: "var(--accent, #8e48ff)",
	accentText: "var(--cc-accent-text, var(--card-fg, var(--text, #dcdadf)))",
	accentSoft: "var(--accent-subtle, rgba(178,127,255,0.18))",
	accentInk: "var(--accent, #8e48ff)",
	onAccent: "var(--accent-fg, #ffffff)",
	okSoft: "var(--ok-subtle, rgba(0,133,67,0.18))",
	okInk: "var(--ok, #008543)",
	shadow: "var(--cc-panel-shadow)",
	radius: 16,
	rowRadius: 11
});
var useSkin = () => useContext(SkinContext);
export { useDialogFocusTrap as i, PANEL_RADIUS as n, useSkin as r, PANEL_FONT as t };
