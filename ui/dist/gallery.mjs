import { i as useDialogFocusTrap, n as PANEL_RADIUS, t as PANEL_FONT } from "./chunks/panelSkin-BjvlW4rb.mjs";
import { E as i18nT } from "./chunks/constants-De1Fjrra.mjs";
import { O as ghostPoseForKey, _ as OPTIONAL_STATES, a as petBridge, b as STATUS_STATES, c as toDataUri, d as isValidHexColor, f as SpriteRenderer, g as LEGACY_STATES, h as BREATHING_STATES, l as applySvgColorMap, m as ALL_MOODS, n as useDocumentImeLatch, o as kiro_idle_default, p as LottieRenderer, r as galleryApi, s as injectCss, t as WindowRoot, u as extractSvgColors, v as RANDOM_STATES, w as GhostEyeOverlay, x as GHOST_ACCESSORIES, y as REQUIRED_STATES } from "./chunks/WindowRoot-R1vuzr9j.mjs";
import { n as fmtList } from "./chunks/format-DYyEE5ak.mjs";
import { n as errorText, t as Select } from "./chunks/Select-DskXH9SX.mjs";
import { useImeGuard } from "@kirocrew/app-sdk";
import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, CornerDownRight, Film, FolderOpen, Loader2, MoreHorizontal, Plus, X } from "lucide-react";
import { Fragment, jsx, jsxs } from "react/jsx-runtime";
import { ErrorNotice } from "@kirocrew/app-sdk/ui";
// src/gallery.window.css?inline
var gallery_window_default = "/* The gallery window's document styles: the <style> block of the built-in's gallery.html. The\n   window's own root is `.cc-window-root` (the built-in's `#root`), which the\n   entry renders over the whole window. */\n      html,\n      body {\n        margin: 0;\n        padding: 0;\n        width: 100%;\n        height: 100%;\n        background: transparent !important;\n        overflow: hidden;\n        -webkit-user-select: none;\n        user-select: none;\n      }\n      .cc-window-root {\n        position: fixed;\n        inset: 0;\n        /* = GALLERY_PAD */\n        padding: 24px;\n        box-sizing: border-box;\n        width: 100%;\n        height: 100%;\n      }\n    \n";
// src/host/InlineStyledConfirm.tsx
/**
* Mochi filters dashboard component CSS, while Crew Companion loads it.
* Inline theme tokens let both galleries share one confirmation surface.
*/
var NO_ESCAPE = () => {};
var btn = {
	padding: "6px 12px",
	borderRadius: 6,
	font: "inherit",
	fontSize: 13,
	cursor: "pointer"
};
function InlineConfirmDialog({ question, settle }) {
	const ref = useRef(null);
	const titleId = useId();
	const ime = useDocumentImeLatch(true);
	useDialogFocusTrap(ref, NO_ESCAPE, { handleEscape: false });
	useLayoutEffect(() => {
		const onKey = (e) => {
			if (e.key !== "Escape" || !ime.claimKey(e)) return;
			e.preventDefault();
			settle(false);
		};
		window.addEventListener("keydown", onKey, true);
		return () => window.removeEventListener("keydown", onKey, true);
	}, [ime, settle]);
	useEffect(() => {
		ref.current?.focus({ preventScroll: true });
	}, [question]);
	return /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
		role: "presentation",
		"aria-hidden": "true",
		style: {
			position: "fixed",
			inset: question.backdropInset ?? 0,
			borderRadius: question.backdropRadius,
			zIndex: 1e3,
			background: "color-mix(in srgb, var(--bg) 60%, transparent)"
		},
		onClick: () => settle(false)
	}), /* @__PURE__ */ jsx("div", {
		style: {
			position: "fixed",
			inset: 0,
			zIndex: 1001,
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			pointerEvents: "none"
		},
		children: /* @__PURE__ */ jsxs("div", {
			ref,
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": titleId,
			tabIndex: -1,
			style: {
				pointerEvents: "auto",
				outline: "none",
				background: "var(--bg)",
				borderRadius: 10,
				padding: "16px 20px",
				width: 300,
				maxWidth: "calc(100vw - 32px)",
				border: "1px solid var(--border)",
				boxShadow: "var(--shadow-lg)"
			},
			children: [/* @__PURE__ */ jsx("div", {
				id: titleId,
				style: {
					fontSize: 13,
					fontWeight: 600,
					color: "var(--text)",
					marginBottom: 12,
					overflowWrap: "anywhere"
				},
				children: question.title
			}), /* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					gap: 8,
					justifyContent: "flex-end"
				},
				children: [/* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => settle(false),
					style: {
						...btn,
						border: "1px solid var(--border)",
						background: "transparent",
						color: "var(--text)"
					},
					children: i18nT("components.confirmDialog.cancel")
				}), /* @__PURE__ */ jsx("button", {
					type: "button",
					onClick: () => settle(true),
					style: {
						...btn,
						border: "1px solid var(--danger)",
						background: "var(--danger-subtle)",
						color: "var(--danger-text)",
						fontWeight: 600
					},
					children: question.confirmLabel
				})]
			})]
		})
	})] });
}
function useInlineStyledConfirm() {
	const [question, setQuestion] = useState(null);
	const pending = useRef(null);
	const settle = useCallback((ok) => {
		pending.current?.resolve(ok);
		pending.current = null;
		setQuestion(null);
	}, []);
	const confirm = useCallback((opts) => new Promise((resolve) => {
		pending.current?.resolve(false);
		const next = {
			...opts,
			resolve
		};
		pending.current = next;
		setQuestion(next);
	}), []);
	useEffect(() => () => {
		pending.current?.resolve(false);
		pending.current = null;
	}, []);
	return {
		confirm,
		confirmDialog: question ? /* @__PURE__ */ jsx(InlineConfirmDialog, {
			question,
			settle
		}) : null
	};
}
// src/PackInfoHeader.tsx
var S$3 = {
	header: {
		padding: "14px 20px",
		borderBottom: "1px solid var(--border)",
		background: "var(--header-bg)",
		flexShrink: 0
	},
	title: {
		fontSize: 15,
		fontWeight: 600,
		marginBottom: 10
	},
	row: {
		display: "flex",
		gap: 10,
		marginBottom: 6
	},
	group: {
		flex: 1,
		display: "flex",
		flexDirection: "column",
		gap: 2
	},
	label: {
		fontSize: 11,
		color: "var(--text-muted)"
	},
	input: {
		background: "var(--cc-input-bg)",
		border: "1px solid var(--border)",
		borderRadius: 6,
		padding: "4px 8px",
		color: "var(--text)",
		fontSize: 12,
		outline: "none",
		width: "100%"
	}
};
var PackInfoHeader = ({ title, name, author, description, flipX, onNameChange, onAuthorChange, onDescriptionChange, onFlipXChange }) => /* @__PURE__ */ jsxs("div", {
	style: S$3.header,
	children: [
		/* @__PURE__ */ jsx("div", {
			style: S$3.title,
			children: title
		}),
		/* @__PURE__ */ jsxs("div", {
			style: S$3.row,
			children: [/* @__PURE__ */ jsxs("div", {
				style: S$3.group,
				children: [/* @__PURE__ */ jsx("span", {
					style: S$3.label,
					children: i18nT("apps.crewCompanion.editor.name")
				}), /* @__PURE__ */ jsx("input", {
					style: S$3.input,
					value: name,
					onChange: (e) => onNameChange(e.target.value),
					placeholder: i18nT("apps.crewCompanion.editor.namePlaceholder"),
					"aria-label": i18nT("apps.crewCompanion.editor.name")
				})]
			}), /* @__PURE__ */ jsxs("div", {
				style: S$3.group,
				children: [/* @__PURE__ */ jsx("span", {
					style: S$3.label,
					children: i18nT("apps.crewCompanion.editor.author")
				}), /* @__PURE__ */ jsx("input", {
					style: S$3.input,
					value: author,
					onChange: (e) => onAuthorChange(e.target.value),
					placeholder: i18nT("apps.crewCompanion.editor.authorPlaceholder"),
					"aria-label": i18nT("apps.crewCompanion.editor.author")
				})]
			})]
		}),
		/* @__PURE__ */ jsxs("div", {
			style: { marginBottom: 6 },
			children: [/* @__PURE__ */ jsx("span", {
				style: S$3.label,
				children: i18nT("apps.crewCompanion.editor.description")
			}), /* @__PURE__ */ jsx("input", {
				style: S$3.input,
				value: description,
				onChange: (e) => onDescriptionChange(e.target.value),
				placeholder: i18nT("apps.crewCompanion.editor.descPlaceholder"),
				"aria-label": i18nT("apps.crewCompanion.editor.description")
			})]
		}),
		/* @__PURE__ */ jsxs("div", {
			style: {
				display: "flex",
				alignItems: "center",
				gap: 8,
				marginTop: 2
			},
			children: [/* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 12,
					color: "var(--text)"
				},
				children: i18nT("apps.crewCompanion.editor.flipX")
			}), /* @__PURE__ */ jsx("div", {
				role: "switch",
				"aria-checked": flipX,
				"aria-label": i18nT("apps.crewCompanion.editor.flipX"),
				tabIndex: 0,
				onKeyDown: (e) => {
					if (e.key === "Enter" || e.key === " ") {
						e.preventDefault();
						onFlipXChange(!flipX);
					}
				},
				onClick: () => onFlipXChange(!flipX),
				style: {
					width: 34,
					height: 20,
					borderRadius: 10,
					cursor: "pointer",
					background: flipX ? "var(--accent)" : "var(--border)",
					position: "relative",
					transition: "background 200ms"
				},
				children: /* @__PURE__ */ jsx("div", { style: {
					width: 16,
					height: 16,
					borderRadius: 8,
					background: "#fff",
					boxShadow: "0 1px 3px rgba(0,0,0,0.3)",
					position: "absolute",
					top: 2,
					left: flipX ? 16 : 2,
					transition: "left 200ms"
				} })
			})]
		})
	]
});
// src/SaveDialog.tsx
var SaveDialog = ({ visible, onOverwrite, onSaveNew, onCancel, i18nT }) => {
	if (!visible) return null;
	return /* @__PURE__ */ jsx("div", {
		style: {
			position: "fixed",
			inset: 24,
			borderRadius: PANEL_RADIUS.card,
			zIndex: 1e3,
			background: "rgba(0,0,0,0.5)",
			display: "flex",
			alignItems: "center",
			justifyContent: "center"
		},
		children: /* @__PURE__ */ jsxs("div", {
			style: {
				background: "var(--bg)",
				borderRadius: 10,
				padding: "16px 20px",
				width: 280,
				border: "1px solid var(--border)",
				boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
			},
			children: [/* @__PURE__ */ jsx("div", {
				style: {
					fontSize: 13,
					fontWeight: 600,
					color: "var(--text)",
					marginBottom: 12
				},
				children: i18nT("apps.crewCompanion.editor.saveAs")
			}), /* @__PURE__ */ jsxs("div", {
				style: {
					display: "flex",
					gap: 8,
					justifyContent: "flex-end"
				},
				children: [
					/* @__PURE__ */ jsx("button", {
						onClick: onCancel,
						style: {
							padding: "6px 12px",
							borderRadius: 6,
							border: "1px solid var(--border)",
							background: "transparent",
							color: "var(--text)",
							fontSize: 12,
							cursor: "pointer"
						},
						children: i18nT("apps.crewCompanion.editor.cancel")
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: onOverwrite,
						style: {
							padding: "6px 12px",
							borderRadius: 6,
							border: "none",
							background: "var(--accent)",
							color: "var(--cc-accent-text)",
							fontSize: 12,
							fontWeight: 600,
							cursor: "pointer"
						},
						children: i18nT("apps.crewCompanion.editor.overwrite")
					}),
					/* @__PURE__ */ jsx("button", {
						onClick: onSaveNew,
						style: {
							padding: "6px 12px",
							borderRadius: 6,
							border: "1px solid var(--accent)",
							background: "transparent",
							color: "var(--accent)",
							fontSize: 12,
							cursor: "pointer"
						},
						children: i18nT("apps.crewCompanion.editor.saveNew")
					})
				]
			})]
		})
	});
};
// src/slotLabel.ts
/**
* A slot's display name.
*
* The keys live in a FILE-SCOPE map indexed inside the `i18nT(...)` call, rather
* than being assembled as `` `apps.crewCompanion.state.${slot}` ``. The template
* form reads better but is invisible to the tooling: the key appears nowhere in
* the source, so `deadKeys.test.ts` reports every state string as unreferenced
* and `check-i18n-keys.mjs` cannot verify the entry exists. It also made this
* file's only proof of the `walking` key a doc comment that happened to quote it
* — delete the comment and the gate's verdict changes, which is not a contract.
* The map must stay at file scope and be indexed in place: the key checker
* resolves file-scope bindings only, so a function-local intermediate would make
* the call site unresolvable again.
*
* A pack may declare a slot this build never enters, so an unknown id is normal
* and returns the raw slot name. Mapping first means the fallback is a plain
* lookup miss; the previous version had to detect i18next echoing the key back,
* because a missing string renders as `apps.crewCompanion.state.walking` on
* screen rather than as an empty value.
*/
/** Slot id → catalog key, for the states this build ships. */
var STATE_LABEL_KEY = {
	approval_pending: "apps.crewCompanion.state.approval_pending",
	done: "apps.crewCompanion.state.done",
	error: "apps.crewCompanion.state.error",
	hiding: "apps.crewCompanion.state.hiding",
	idle: "apps.crewCompanion.state.idle",
	listening: "apps.crewCompanion.state.listening",
	offline: "apps.crewCompanion.state.offline",
	peekThinking: "apps.crewCompanion.state.peekThinking",
	peeking: "apps.crewCompanion.state.peeking",
	thinking: "apps.crewCompanion.state.thinking",
	walking: "apps.crewCompanion.state.walking",
	working: "apps.crewCompanion.state.working"
};
function slotLabel(slot) {
	const k = slot;
	return STATE_LABEL_KEY[k] ? i18nT(STATE_LABEL_KEY[k]) : slot;
}
// src/EditorFooter.tsx
var S$2 = {
	footer: {
		padding: "12px 20px",
		borderTop: "1px solid var(--border)",
		display: "flex",
		alignItems: "center",
		gap: 12,
		flexShrink: 0
	},
	cancelBtn: {
		padding: "8px 20px",
		borderRadius: 8,
		border: "1px solid var(--border)",
		background: "transparent",
		color: "var(--text)",
		fontSize: 12,
		cursor: "pointer"
	}
};
var EditorFooter = ({ missingStates, canSave, saving, onCancel, onSave }) => {
	const disabled = !canSave || !!saving;
	return /* @__PURE__ */ jsxs("div", {
		style: S$2.footer,
		children: [
			missingStates.length > 0 && /* @__PURE__ */ jsx("span", {
				style: {
					fontSize: 11,
					color: "var(--danger)",
					flex: 1
				},
				children: i18nT("apps.crewCompanion.editor.missing", { slots: fmtList(missingStates.map((s) => slotLabel(s))) })
			}),
			/* @__PURE__ */ jsx("div", { style: { flex: missingStates.length > 0 ? void 0 : 1 } }),
			/* @__PURE__ */ jsx("button", {
				style: S$2.cancelBtn,
				onClick: onCancel,
				children: i18nT("apps.crewCompanion.editor.cancel")
			}),
			/* @__PURE__ */ jsx("button", {
				disabled,
				onClick: onSave,
				style: {
					padding: "8px 20px",
					borderRadius: 8,
					border: "none",
					fontSize: 12,
					fontWeight: 600,
					cursor: disabled ? "default" : "pointer",
					background: disabled ? "var(--cc-input-bg)" : "var(--accent)",
					color: disabled ? "var(--text-muted)" : "var(--cc-accent-text)",
					opacity: disabled ? .5 : 1
				},
				children: saving ? i18nT("apps.crewCompanion.editor.saving") : i18nT("apps.crewCompanion.editor.save")
			})
		]
	});
};
// src/editorHooks.ts
/**
* Shared hooks for pack editors.
*/
var api$4 = galleryApi;
/** Hook: fetch language from config */
function useLang() {
	const [lang, setLang] = useState("en");
	useState(() => {
		api$4?.getCrewCompanionConfig?.().then((c) => {
			if (c?.language) setLang(c.language);
		});
	});
	return {
		i18nT,
		lang
	};
}
/** Hook: save-with-dialog logic for editing existing packs.
*  Only shows dialog when isDirty is true and editing an existing pack.
*  If not dirty, saves directly (overwrite). */
function useSaveWithDialog(existingPack, isDirty) {
	const [showSaveDialog, setShowSaveDialog] = useState(false);
	return {
		showSaveDialog,
		triggerSave: useCallback((doSave) => {
			if (existingPack && isDirty) setShowSaveDialog(true);
			else doSave(false);
		}, [existingPack, isDirty]),
		confirmOverwrite: useCallback((doSave) => {
			setShowSaveDialog(false);
			doSave(false);
		}, []),
		confirmSaveNew: useCallback((doSave) => {
			setShowSaveDialog(false);
			doSave(true);
		}, []),
		cancelDialog: useCallback(() => setShowSaveDialog(false), [])
	};
}
// src/packAnimation.ts
/** The entry's content, or an empty string when it declares none. */
function entryContent(entry) {
	if (typeof entry === "string") return entry;
	return entry?.content ?? "";
}
/**
* The entry's format.
*
* Falls back to inspecting the content: a bare filename carries no format, and Lottie
* is JSON while everything else the editor writes is markup.
*/
function entryFormat(entry) {
	if (entry && typeof entry !== "string" && entry.format) return entry.format;
	return entryContent(entry).trimStart().startsWith("{") ? "lottie" : "svg";
}
// src/appRegion.ts
/**
* Marks a surface as the window's drag handle.
*
* Spread it rather than assigning, so it composes with the element's own styles
* instead of replacing them — which is precisely how the dropped-attribute bug
* happened.
*/
var DRAG_REGION = { WebkitAppRegion: "drag" };
/**
* Opts an interactive element OUT of an enclosing drag region.
*
* Required on every control inside a draggable header: without it the drag handler
* swallows the click and the button silently stops working.
*/
var NO_DRAG_REGION = { WebkitAppRegion: "no-drag" };
// src/gallery.css?inline
var gallery_default = "/* Gallery and editor chrome.\n *\n * These live here rather than in a TypeScript style object because a shadow held in a\n * string is indistinguishable from a sentence to the translation checker — and it is\n * styling, so a stylesheet is where it belongs.\n */\n:root {\n  --cc-card-shadow: 0 6px 18px rgba(0, 0, 0, 0.45);\n  --cc-modal-shadow: 0 12px 34px rgba(0, 0, 0, 0.45);\n\n  /*\n   * Two variables the desktop app relied on that this dashboard's theme does not\n   * define. Left undefined, the accent foreground fell back to the inherited colour —\n   * dark text on the purple accent fill, which is what looked wrong on the light\n   * theme — and the input background resolved to nothing, so the secondary button\n   * lost its fill entirely.\n   *\n   * The input fill points at an existing theme variable rather than a literal, so it\n   * follows a theme change. The accent foreground is a literal because the accent\n   * fill is the same purple in light and dark, so white reads correctly on both —\n   * which is also what the desktop app drew.\n   */\n  --cc-accent-text: #ffffff;\n  --cc-input-bg: var(--bg-elevated);\n}\n";
// src/PackEditor.tsx
/**
* CrewCompanion - Pack Editor
*
* WYSIWYG editor for creating and editing custom SVG/Lottie appearance packs.
*/
injectCss("gallery", gallery_default);
var api$3 = galleryApi;
var STATE_KEYS = [...REQUIRED_STATES];
var OPTIONAL_KEYS = [...OPTIONAL_STATES];
var MOOD_KEYS = [...ALL_MOODS];
var ALL_SLOT_KEYS = [
	...STATE_KEYS,
	...OPTIONAL_KEYS,
	...MOOD_KEYS
];
var STATUS_DISPLAY = [...STATUS_STATES];
/** Slot-id prefix for extra clips. An identifier, not display text. */
var EXTRA_SLOT_PREFIX = "extra_load_";
var RANDOM_FIXED = [...RANDOM_STATES];
var BREATHING_DISPLAY = [...BREATHING_STATES];
/**
* Slot display names, translated.
*
* The desktop app kept an English map here in front of the `state.*` keys; keys alone
* are translatable, so the map is gone and the lookup is the single source. Falls back
* to the raw slot id, which is how a pack declaring a mood the build does not know
* still shows something meaningful.
*/
var S$1 = {
	titleBar: {
		display: "flex",
		alignItems: "center",
		gap: 8,
		padding: "8px 10px",
		borderBottom: "1px solid var(--border)",
		flexShrink: 0,
		...DRAG_REGION
	},
	backBtn: {
		background: "none",
		border: "none",
		color: "var(--text-muted)",
		cursor: "pointer",
		fontSize: 12,
		padding: "5px 8px",
		borderRadius: 6,
		...NO_DRAG_REGION
	},
	root: {
		width: "100%",
		height: "100%",
		display: "flex",
		flexDirection: "column",
		borderRadius: PANEL_RADIUS.card,
		overflow: "hidden",
		boxShadow: "var(--cc-card-shadow)",
		background: "var(--bg)",
		color: "var(--text)",
		fontFamily: "var(--cc-font)"
	},
	body: {
		flex: 1,
		overflowY: "auto",
		padding: 20
	},
	sectionLabel: {
		fontSize: 11,
		color: "var(--text-muted)",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 8,
		marginTop: 4
	},
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
		gap: 10,
		marginBottom: 16
	},
	slot: (filled) => ({
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: 4,
		padding: 8,
		borderRadius: 10,
		border: `1px dashed ${filled ? "var(--accent)" : "var(--border)"}`,
		background: filled ? "var(--bg-elevated)" : "var(--cc-input-bg)",
		cursor: "pointer",
		transition: "border-color 150ms, background 150ms",
		position: "relative",
		minHeight: 100
	}),
	slotThumb: {
		width: 56,
		height: 56,
		objectFit: "contain",
		borderRadius: 6
	},
	slotPlaceholder: {
		width: 56,
		height: 56,
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		borderRadius: 6,
		background: "var(--bg)",
		color: "var(--text-faint)",
		fontSize: 20,
		border: "1px solid var(--border)"
	},
	slotLabel: {
		fontSize: 10,
		color: "var(--text-muted)",
		textAlign: "center",
		fontWeight: 500
	},
	optionalTag: {
		fontSize: 9,
		color: "var(--text-faint)",
		background: "var(--bg)",
		borderRadius: 4,
		padding: "1px 5px",
		border: "1px solid var(--border)"
	},
	popover: {
		position: "fixed",
		zIndex: 1e3,
		background: "var(--bg-elevated)",
		border: "1px solid var(--border)",
		borderRadius: 8,
		boxShadow: "0 4px 16px var(--shadow)",
		minWidth: 180,
		padding: 4,
		whiteSpace: "nowrap"
	},
	popoverItem: {
		display: "block",
		width: "100%",
		padding: "6px 12px",
		border: "none",
		background: "transparent",
		color: "var(--text)",
		fontSize: 12,
		textAlign: "left",
		cursor: "pointer",
		borderRadius: 4
	},
	popoverDivider: {
		height: 1,
		background: "var(--border)",
		margin: "4px 0"
	},
	popoverSub: {
		padding: "4px 12px",
		fontSize: 10,
		color: "var(--text-faint)"
	},
	error: {
		padding: "10px 14px",
		borderRadius: 8,
		background: "rgba(239,83,80,0.1)",
		border: "1px solid rgba(239,83,80,0.3)",
		color: "var(--danger)",
		fontSize: 12,
		marginBottom: 12
	}
};
function SlotThumbnail({ data }) {
	if (!data) return /* @__PURE__ */ jsx("div", {
		style: S$1.slotPlaceholder,
		children: /* @__PURE__ */ jsx(Plus, {
			size: 20,
			"aria-hidden": "true"
		})
	});
	if (entryFormat(data) === "svg") return /* @__PURE__ */ jsx("img", {
		src: toDataUri(entryContent(data)),
		alt: "",
		style: S$1.slotThumb
	});
	return /* @__PURE__ */ jsx("div", {
		style: {
			...S$1.slotPlaceholder,
			background: "var(--bg-elevated)",
			fontSize: 16
		},
		children: /* @__PURE__ */ jsx(Film, {
			className: "lucide-inline",
			"aria-hidden": "true"
		})
	});
}
function SlotPopover({ slotKey, slots, filled, anchorRect, onSelectFile, onUseSameAs, onClear, onClose, i18nT }) {
	const popoverRef = useRef(null);
	useEffect(() => {
		const handler = (e) => {
			if (popoverRef.current && !popoverRef.current.contains(e.target)) onClose();
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, [onClose]);
	const filledOthers = ALL_SLOT_KEYS.filter((k) => k !== slotKey && slots[k] !== null);
	const flipUp = window.innerHeight - (anchorRect.top + anchorRect.height) < 200;
	const popW = 180;
	let left = anchorRect.left + anchorRect.width / 2 - popW / 2;
	left = Math.max(4, Math.min(left, window.innerWidth - popW - 4));
	const popStyle = {
		...S$1.popover,
		top: flipUp ? void 0 : anchorRect.top + anchorRect.height + 4,
		bottom: flipUp ? window.innerHeight - anchorRect.top + 4 : void 0,
		left
	};
	return /* @__PURE__ */ jsxs("div", {
		role: "presentation",
		ref: popoverRef,
		style: popStyle,
		onClick: (e) => e.stopPropagation(),
		children: [
			/* @__PURE__ */ jsxs("button", {
				style: S$1.popoverItem,
				onMouseEnter: (e) => {
					e.target.style.background = "var(--cc-input-bg)";
				},
				onMouseLeave: (e) => {
					e.target.style.background = "transparent";
				},
				onClick: () => {
					onSelectFile();
					onClose();
				},
				children: [
					/* @__PURE__ */ jsx(FolderOpen, {
						className: "lucide-inline",
						"aria-hidden": "true"
					}),
					" ",
					i18nT("apps.crewCompanion.editor.selectFile")
				]
			}),
			filledOthers.length > 0 && /* @__PURE__ */ jsxs(Fragment, { children: [
				/* @__PURE__ */ jsx("div", { style: S$1.popoverDivider }),
				/* @__PURE__ */ jsx("div", {
					style: S$1.popoverSub,
					children: i18nT("apps.crewCompanion.editor.useSameAs")
				}),
				filledOthers.map((k) => /* @__PURE__ */ jsxs("button", {
					style: S$1.popoverItem,
					onMouseEnter: (e) => {
						e.target.style.background = "var(--cc-input-bg)";
					},
					onMouseLeave: (e) => {
						e.target.style.background = "transparent";
					},
					onClick: () => {
						onUseSameAs(k);
						onClose();
					},
					children: [
						/* @__PURE__ */ jsx(CornerDownRight, {
							size: 11,
							className: "lucide-inline",
							"aria-hidden": "true"
						}),
						" ",
						slotLabel(k)
					]
				}, k))
			] }),
			filled && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", { style: S$1.popoverDivider }), /* @__PURE__ */ jsx("button", {
				style: {
					...S$1.popoverItem,
					color: "var(--danger)"
				},
				onMouseEnter: (e) => {
					e.target.style.background = "var(--cc-input-bg)";
				},
				onMouseLeave: (e) => {
					e.target.style.background = "transparent";
				},
				onClick: () => {
					onClear();
					onClose();
				},
				children: i18nT("apps.crewCompanion.editor.clear")
			})] })
		]
	});
}
var PackEditor = ({ existingPack, onSave, onCancel }) => {
	const [name, setName] = useState(existingPack?.name ?? "");
	const [author, setAuthor] = useState(existingPack?.author ?? "");
	const [description, setDescription] = useState(existingPack?.description ?? "");
	const [flipX, setFlipX] = useState(false);
	useLang();
	const [slots, setSlots] = useState(() => {
		const init = {};
		for (const k of ALL_SLOT_KEYS) init[k] = null;
		return init;
	});
	const [extras, setExtras] = useState([]);
	const originalSnapshot = useRef(null);
	const slotSnap = () => JSON.stringify({
		name,
		author,
		description,
		flipX,
		slots,
		extras
	});
	const isDirty = !existingPack || originalSnapshot.current === null || slotSnap() !== originalSnapshot.current;
	const { showSaveDialog, triggerSave, confirmOverwrite, confirmSaveNew, cancelDialog } = useSaveWithDialog(existingPack, isDirty);
	const addExtra = () => setExtras((xs) => [...xs, {
		id: `extra_${Date.now()}_${xs.length}`,
		name: ""
	}]);
	const renameExtra = (id, nm) => setExtras((xs) => xs.map((x) => x.id === id ? {
		...x,
		name: nm
	} : x));
	const removeExtra = (id) => {
		setExtras((xs) => xs.filter((x) => x.id !== id));
		setSlots((s) => {
			const n = { ...s };
			delete n[id];
			return n;
		});
	};
	const [activePopover, setActivePopover] = useState(null);
	const [popoverAnchor, setPopoverAnchor] = useState(null);
	const [saving, setSaving] = useState(false);
	const [error, setError] = useState(null);
	const [loadingSlot, setLoadingSlot] = useState(null);
	useEffect(() => {
		if (!existingPack) return;
		let cancelled = false;
		(async () => {
			try {
				const detail = await api$3.galleryGetPackDetail(existingPack.id);
				if (cancelled || !detail?.animations) return;
				const animations = detail.animations;
				const filled = {};
				for (const k of ALL_SLOT_KEYS) {
					const anim = detail.animations[k];
					if (anim) filled[k] = {
						content: entryContent(anim),
						format: entryFormat(anim),
						filename: `${k}.${entryFormat(anim) === "lottie" ? "json" : entryFormat(anim) === "sprite" ? "png" : "svg"}`
					};
					else filled[k] = null;
				}
				const loadedExtras = [];
				(Array.isArray(detail.randomNames) ? detail.randomNames : []).forEach((nm, i) => {
					const anim = animations[nm];
					if (anim) {
						const id = EXTRA_SLOT_PREFIX + i;
						filled[id] = {
							content: entryContent(anim),
							format: entryFormat(anim),
							filename: `${id}.${entryFormat(anim) === "lottie" ? "json" : entryFormat(anim) === "sprite" ? "png" : "svg"}`
						};
						loadedExtras.push({
							id,
							name: nm
						});
					}
				});
				setSlots(filled);
				setExtras(loadedExtras);
				originalSnapshot.current = JSON.stringify({
					name: existingPack.name ?? "",
					author: existingPack.author ?? "",
					description: existingPack.description ?? "",
					flipX: false,
					slots: filled,
					extras: loadedExtras
				});
			} catch (err) {
				setError(errorText(err) || i18nT("apps.crewCompanion.editor.loadDataFailed"));
			}
		})();
		return () => {
			cancelled = true;
		};
	}, [existingPack]);
	const handleSlotClick = useCallback((key, e) => {
		if (activePopover === key) {
			setActivePopover(null);
			setPopoverAnchor(null);
		} else {
			const rect = e.currentTarget.getBoundingClientRect();
			setPopoverAnchor({
				top: rect.top,
				left: rect.left,
				width: rect.width,
				height: rect.height
			});
			setActivePopover(key);
		}
	}, [activePopover]);
	const handleSelectFile = useCallback(async (key) => {
		setLoadingSlot(key);
		setError(null);
		try {
			const result = await api$3.galleryImportFile();
			if (!result) {
				setLoadingSlot(null);
				return;
			}
			if (result.ok === false) {
				setError(result.error || i18nT("apps.crewCompanion.editor.invalidFile"));
				setLoadingSlot(null);
				return;
			}
			const { content, filename, format } = result.value ?? result;
			setSlots((prev) => ({
				...prev,
				[key]: {
					content,
					filename,
					format
				}
			}));
		} catch (err) {
			setError(errorText(err) || i18nT("apps.crewCompanion.editor.importFileFailed"));
		}
		setLoadingSlot(null);
	}, []);
	const handleUseSameAs = useCallback((targetKey, sourceKey) => {
		setSlots((prev) => {
			const source = prev[sourceKey];
			if (!source) return prev;
			return {
				...prev,
				[targetKey]: { ...source }
			};
		});
	}, []);
	const handleClear = useCallback((key) => {
		setSlots((prev) => ({
			...prev,
			[key]: null
		}));
	}, []);
	const missingStates = STATE_KEYS.filter((k) => !slots[k]);
	const canSave = missingStates.length === 0 && name.trim().length > 0 && isDirty;
	const doSave = useCallback(async (asNew) => {
		if (!canSave || saving) return;
		setSaving(true);
		setError(null);
		try {
			const statesData = {};
			const moodsData = {};
			for (const k of STATE_KEYS) {
				const slot = slots[k];
				if (slot) statesData[k] = entryContent(slot);
			}
			for (const k of OPTIONAL_KEYS) {
				const slot = slots[k];
				if (slot) statesData[k] = entryContent(slot);
			}
			for (const k of MOOD_KEYS) {
				const slot = slots[k];
				if (slot) moodsData[k] = entryContent(slot);
			}
			const randomData = {};
			for (const x of extras) {
				const nm = x.name.trim();
				const slot = slots[x.id];
				if (!nm || !slot?.content) continue;
				if (nm in randomData) {
					setError(i18nT("apps.crewCompanion.editor.duplicateExtraName", { name: nm }));
					setSaving(false);
					return;
				}
				if (ALL_SLOT_KEYS.includes(nm)) {
					setError(i18nT("apps.crewCompanion.editor.reservedExtraName", { name: nm }));
					setSaving(false);
					return;
				}
				randomData[nm] = entryContent(slot);
			}
			const format = slots["idle"]?.format ?? "svg";
			const packData = {
				meta: {
					id: asNew || !existingPack ? crypto.randomUUID() : existingPack.id,
					name: name.trim(),
					author: author.trim() || i18nT("apps.crewCompanion.editor.unknownAuthor"),
					description: description.trim(),
					format
				},
				states: statesData,
				moods: moodsData,
				random: randomData
			};
			const result = await api$3.gallerySavePack(packData);
			if (result && result.ok === false) {
				setError(result.error || i18nT("apps.crewCompanion.editor.saveFailed"));
				setSaving(false);
				return;
			}
			onSave(result?.value ?? result);
		} catch (err) {
			setError(errorText(err) || i18nT("apps.crewCompanion.editor.saveFailed"));
		}
		setSaving(false);
	}, [
		canSave,
		saving,
		slots,
		name,
		author,
		description,
		existingPack,
		onSave,
		extras
	]);
	return /* @__PURE__ */ jsxs("div", {
		style: S$1.root,
		children: [
			/* @__PURE__ */ jsx("div", {
				style: S$1.titleBar,
				children: /* @__PURE__ */ jsxs("button", {
					style: S$1.backBtn,
					onClick: onCancel,
					title: i18nT("apps.crewCompanion.editor.back"),
					"aria-label": i18nT("apps.crewCompanion.editor.back"),
					children: [
						/* @__PURE__ */ jsx(ArrowLeft, {
							size: 12,
							className: "lucide-inline",
							"aria-hidden": "true"
						}),
						" ",
						i18nT("apps.crewCompanion.editor.back")
					]
				})
			}),
			/* @__PURE__ */ jsx(PackInfoHeader, {
				title: existingPack ? i18nT("apps.crewCompanion.editor.editTitle") : i18nT("apps.crewCompanion.editor.createTitle"),
				name,
				author,
				description,
				flipX,
				onNameChange: setName,
				onAuthorChange: setAuthor,
				onDescriptionChange: setDescription,
				onFlipXChange: setFlipX,
				tt: i18nT
			}),
			/* @__PURE__ */ jsxs("div", {
				style: S$1.body,
				children: [
					error && /* @__PURE__ */ jsxs("div", {
						style: S$1.error,
						children: [error, /* @__PURE__ */ jsx("button", {
							onClick: () => setError(null),
							style: {
								float: "right",
								background: "none",
								border: "none",
								color: "var(--danger)",
								cursor: "pointer",
								fontSize: 14
							},
							"aria-label": i18nT("apps.crewCompanion.panel.close"),
							children: /* @__PURE__ */ jsx(X, {
								size: 14,
								"aria-hidden": "true"
							})
						})]
					}),
					/* @__PURE__ */ jsx("div", {
						style: S$1.sectionLabel,
						children: i18nT("apps.crewCompanion.editor.requiredStates")
					}),
					/* @__PURE__ */ jsx("div", {
						style: {
							fontSize: 10,
							color: "var(--text-muted)",
							marginBottom: 6,
							marginTop: -4
						},
						children: i18nT("apps.crewCompanion.editor.sizeHint")
					}),
					/* @__PURE__ */ jsx("div", {
						style: S$1.grid,
						children: STATE_KEYS.map((key) => /* @__PURE__ */ jsxs("div", {
							role: "button",
							tabIndex: 0,
							onKeyDown: (e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleSlotClick(key, e);
								}
							},
							style: S$1.slot(!!slots[key]),
							onClick: (e) => handleSlotClick(key, e),
							children: [loadingSlot === key ? /* @__PURE__ */ jsx("div", {
								style: S$1.slotPlaceholder,
								children: /* @__PURE__ */ jsx(Loader2, {
									className: "lucide-inline animate-spin",
									"aria-hidden": "true"
								})
							}) : /* @__PURE__ */ jsx(SlotThumbnail, { data: slots[key] }), /* @__PURE__ */ jsx("div", {
								style: S$1.slotLabel,
								children: slotLabel(key)
							})]
						}, key))
					}),
					/* @__PURE__ */ jsxs("div", {
						style: S$1.sectionLabel,
						children: [
							i18nT("apps.crewCompanion.state.groupStatus"),
							" ",
							/* @__PURE__ */ jsx("span", {
								style: S$1.optionalTag,
								children: i18nT("apps.crewCompanion.editor.optional")
							})
						]
					}),
					/* @__PURE__ */ jsx("div", {
						style: {
							fontSize: 10,
							color: "var(--text-muted)",
							marginBottom: 6,
							marginTop: -4
						},
						children: i18nT("apps.crewCompanion.editor.statusHint")
					}),
					/* @__PURE__ */ jsx("div", {
						style: S$1.grid,
						children: STATUS_DISPLAY.map((key) => /* @__PURE__ */ jsxs("div", {
							role: "button",
							tabIndex: 0,
							onKeyDown: (e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleSlotClick(key, e);
								}
							},
							style: S$1.slot(!!slots[key]),
							onClick: (e) => handleSlotClick(key, e),
							children: [loadingSlot === key ? /* @__PURE__ */ jsx("div", {
								style: S$1.slotPlaceholder,
								children: /* @__PURE__ */ jsx(Loader2, {
									className: "lucide-inline animate-spin",
									"aria-hidden": "true"
								})
							}) : /* @__PURE__ */ jsx(SlotThumbnail, { data: slots[key] }), /* @__PURE__ */ jsxs("div", {
								style: S$1.slotLabel,
								children: [
									slotLabel(key),
									" ",
									/* @__PURE__ */ jsx("span", {
										style: S$1.optionalTag,
										children: i18nT("apps.crewCompanion.editor.optional")
									})
								]
							})]
						}, key))
					}),
					/* @__PURE__ */ jsxs("div", {
						style: S$1.sectionLabel,
						children: [
							i18nT("apps.crewCompanion.state.groupBreathing"),
							" ",
							/* @__PURE__ */ jsx("span", {
								style: S$1.optionalTag,
								children: i18nT("apps.crewCompanion.editor.optional")
							})
						]
					}),
					/* @__PURE__ */ jsx("div", {
						style: {
							fontSize: 10,
							color: "var(--text-muted)",
							marginBottom: 6,
							marginTop: -4
						},
						children: i18nT("apps.crewCompanion.editor.breathingHint")
					}),
					/* @__PURE__ */ jsx("div", {
						style: S$1.grid,
						children: BREATHING_DISPLAY.map((key) => /* @__PURE__ */ jsxs("div", {
							role: "button",
							tabIndex: 0,
							onKeyDown: (e) => {
								if (e.key === "Enter" || e.key === " ") {
									e.preventDefault();
									handleSlotClick(key, e);
								}
							},
							style: S$1.slot(!!slots[key]),
							onClick: (e) => handleSlotClick(key, e),
							children: [loadingSlot === key ? /* @__PURE__ */ jsx("div", {
								style: S$1.slotPlaceholder,
								children: /* @__PURE__ */ jsx(Loader2, {
									className: "lucide-inline animate-spin",
									"aria-hidden": "true"
								})
							}) : /* @__PURE__ */ jsx(SlotThumbnail, { data: slots[key] }), /* @__PURE__ */ jsxs("div", {
								style: S$1.slotLabel,
								children: [
									slotLabel(key) || key,
									" ",
									/* @__PURE__ */ jsx("span", {
										style: S$1.optionalTag,
										children: i18nT("apps.crewCompanion.editor.optional")
									})
								]
							})]
						}, key))
					}),
					/* @__PURE__ */ jsxs("div", {
						style: S$1.sectionLabel,
						children: [
							i18nT("apps.crewCompanion.state.groupRandom"),
							" ",
							/* @__PURE__ */ jsx("span", {
								style: S$1.optionalTag,
								children: i18nT("apps.crewCompanion.editor.optional")
							})
						]
					}),
					/* @__PURE__ */ jsx("div", {
						style: {
							fontSize: 10,
							color: "var(--text-muted)",
							marginBottom: 6,
							marginTop: -4
						},
						children: i18nT("apps.crewCompanion.editor.hint8152")
					}),
					/* @__PURE__ */ jsxs("div", {
						style: S$1.grid,
						children: [
							RANDOM_FIXED.map((key) => /* @__PURE__ */ jsxs("div", {
								role: "button",
								tabIndex: 0,
								onKeyDown: (e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										handleSlotClick(key, e);
									}
								},
								style: S$1.slot(!!slots[key]),
								onClick: (e) => handleSlotClick(key, e),
								children: [loadingSlot === key ? /* @__PURE__ */ jsx("div", {
									style: S$1.slotPlaceholder,
									children: /* @__PURE__ */ jsx(Loader2, {
										className: "lucide-inline animate-spin",
										"aria-hidden": "true"
									})
								}) : /* @__PURE__ */ jsx(SlotThumbnail, { data: slots[key] }), /* @__PURE__ */ jsxs("div", {
									style: S$1.slotLabel,
									children: [
										slotLabel(key),
										" ",
										/* @__PURE__ */ jsx("span", {
											style: S$1.optionalTag,
											children: i18nT("apps.crewCompanion.editor.optional")
										})
									]
								})]
							}, key)),
							extras.map((x) => /* @__PURE__ */ jsxs("div", {
								style: {
									...S$1.slot(!!slots[x.id]),
									position: "relative"
								},
								children: [
									/* @__PURE__ */ jsx("button", {
										onClick: (e) => {
											e.stopPropagation();
											removeExtra(x.id);
										},
										"aria-label": i18nT("apps.crewCompanion.editor.remove"),
										title: i18nT("apps.crewCompanion.editor.remove"),
										style: {
											position: "absolute",
											top: 2,
											right: 4,
											background: "none",
											border: "none",
											color: "var(--text-muted)",
											cursor: "pointer",
											fontSize: 12,
											lineHeight: 1,
											padding: 0,
											zIndex: 1
										},
										children: /* @__PURE__ */ jsx(X, {
											size: 12,
											"aria-hidden": "true"
										})
									}),
									/* @__PURE__ */ jsx("div", {
										role: "button",
										tabIndex: 0,
										onKeyDown: (e) => {
											if (e.key === "Enter" || e.key === " ") {
												e.preventDefault();
												handleSlotClick(x.id, e);
											}
										},
										onClick: (e) => handleSlotClick(x.id, e),
										style: { cursor: "pointer" },
										children: loadingSlot === x.id ? /* @__PURE__ */ jsx("div", {
											style: S$1.slotPlaceholder,
											children: /* @__PURE__ */ jsx(Loader2, {
												className: "lucide-inline animate-spin",
												"aria-hidden": "true"
											})
										}) : /* @__PURE__ */ jsx(SlotThumbnail, { data: slots[x.id] })
									}),
									/* @__PURE__ */ jsx("input", {
										value: x.name,
										onChange: (e) => renameExtra(x.id, e.target.value),
										onClick: (e) => e.stopPropagation(),
										placeholder: "name",
										"aria-label": i18nT("apps.crewCompanion.editor.name"),
										style: {
											width: "100%",
											boxSizing: "border-box",
											marginTop: 4,
											background: "var(--cc-input-bg)",
											border: "1px solid var(--border)",
											borderRadius: 4,
											color: "var(--text)",
											fontSize: 10,
											padding: "2px 4px",
											textAlign: "center",
											outline: "none"
										}
									})
								]
							}, x.id)),
							/* @__PURE__ */ jsxs("div", {
								role: "button",
								tabIndex: 0,
								onKeyDown: (e) => {
									if (e.key === "Enter" || e.key === " ") {
										e.preventDefault();
										addExtra();
									}
								},
								onClick: addExtra,
								style: {
									...S$1.slot(false),
									cursor: "pointer",
									display: "flex",
									flexDirection: "column",
									justifyContent: "center",
									alignItems: "center"
								},
								children: [/* @__PURE__ */ jsx(Plus, {
									size: 20,
									"aria-hidden": "true",
									style: { color: "var(--text-muted)" }
								}), /* @__PURE__ */ jsx("div", {
									style: S$1.slotLabel,
									children: i18nT("apps.crewCompanion.editor.addClip")
								})]
							})
						]
					})
				]
			}),
			activePopover && popoverAnchor && /* @__PURE__ */ jsx(SlotPopover, {
				slotKey: activePopover,
				slots,
				filled: !!slots[activePopover],
				anchorRect: popoverAnchor,
				onSelectFile: () => handleSelectFile(activePopover),
				onUseSameAs: (src) => handleUseSameAs(activePopover, src),
				onClear: () => handleClear(activePopover),
				onClose: () => {
					setActivePopover(null);
					setPopoverAnchor(null);
				},
				i18nT
			}),
			/* @__PURE__ */ jsx(EditorFooter, {
				missingStates,
				canSave,
				saving,
				onCancel,
				onSave: () => triggerSave(doSave),
				tt: i18nT
			}),
			/* @__PURE__ */ jsx(SaveDialog, {
				visible: showSaveDialog,
				onOverwrite: () => confirmOverwrite(doSave),
				onSaveNew: () => confirmSaveNew(doSave),
				onCancel: cancelDialog,
				i18nT
			})
		]
	});
};
// src/NumberField.tsx
/**
* NumberField — Shared number input with string state to avoid leading zeros,
* clamp on blur, optional label.
*/
var inputStyle = {
	background: "var(--cc-input-bg)",
	border: "1px solid var(--border)",
	borderRadius: 6,
	padding: "4px 8px",
	color: "var(--text)",
	fontSize: 12,
	outline: "none"
};
var NumberField = ({ label, value, min, max, onChange, width = 60, style }) => {
	const [text, setText] = useState(String(value));
	useEffect(() => {
		setText(String(value));
	}, [value]);
	return /* @__PURE__ */ jsxs("div", {
		style,
		children: [label && /* @__PURE__ */ jsx("span", {
			style: {
				fontSize: 11,
				color: "var(--text-muted)",
				marginBottom: 2,
				display: "block"
			},
			children: label
		}), /* @__PURE__ */ jsx("input", {
			type: "number",
			value: text,
			min,
			max,
			"aria-label": label,
			onChange: (e) => {
				setText(e.target.value);
				const n = Number(e.target.value);
				if (!isNaN(n)) onChange(n);
			},
			onBlur: () => {
				const c = Math.max(min ?? -Infinity, Math.min(max ?? Infinity, value));
				onChange(c);
				setText(String(c));
			},
			style: {
				...inputStyle,
				width
			}
		})]
	});
};
// src/spriteDetect.ts
/**
* Auto-detect sprite frame dimensions by finding repeating transparent grid lines.
* Scans alpha channel for fully transparent columns/rows, then finds the most
* common spacing interval.
*/
/** Find the most common interval between sorted positions */
function bestInterval(positions, totalSize) {
	if (positions.length === 0) return totalSize;
	const gaps = [];
	let prev = 0;
	for (const p of positions) {
		if (p > prev) gaps.push(p - prev);
		prev = p + 1;
	}
	if (prev < totalSize) gaps.push(totalSize - prev);
	const freq = /* @__PURE__ */ new Map();
	for (const g of gaps) {
		const key = g;
		freq.set(key, (freq.get(key) || 0) + 1);
	}
	let best = totalSize;
	let bestCount = 0;
	for (const [size, count] of freq) if (count > bestCount || count === bestCount && size < best) {
		best = size;
		bestCount = count;
	}
	return best;
}
function detectFrameSize(imageData) {
	const { width, height, data } = imageData;
	const transparentCols = [];
	for (let x = 0; x < width; x++) {
		let allTransparent = true;
		for (let y = 0; y < height; y++) if (data[(y * width + x) * 4 + 3] > 10) {
			allTransparent = false;
			break;
		}
		if (allTransparent) transparentCols.push(x);
	}
	const transparentRows = [];
	for (let y = 0; y < height; y++) {
		let allTransparent = true;
		for (let x = 0; x < width; x++) if (data[(y * width + x) * 4 + 3] > 10) {
			allTransparent = false;
			break;
		}
		if (allTransparent) transparentRows.push(y);
	}
	const colLines = findGridLines(transparentCols);
	const rowLines = findGridLines(transparentRows);
	const frameWidth = bestInterval(colLines, width);
	const frameHeight = bestInterval(rowLines, height);
	let offsetY = 0;
	for (let y = 0; y < height; y++) {
		if (!transparentRows.includes(y)) break;
		offsetY = y + 1;
	}
	return {
		frameWidth,
		frameHeight,
		offsetY
	};
}
/** Collapse contiguous transparent pixel positions into center points of each band */
function findGridLines(positions) {
	if (positions.length === 0) return [];
	const lines = [];
	let start = positions[0];
	let end = positions[0];
	for (let i = 1; i < positions.length; i++) if (positions[i] === end + 1) end = positions[i];
	else {
		lines.push(Math.floor((start + end) / 2));
		start = positions[i];
		end = positions[i];
	}
	lines.push(Math.floor((start + end) / 2));
	return lines;
}
// src/SpriteImporter.tsx
/**
* SpriteImporter — Import a sprite sheet and assign rows to pet states/moods.
*/
injectCss("gallery", gallery_default);
var api$2 = galleryApi;
var SpriteImporter = ({ existingPack, onDone, onCancel, saveError }) => {
	const { i18nT } = useLang();
	const [imgSrc, setImgSrc] = useState(null);
	const [imgW, setImgW] = useState(0);
	const [imgH, setImgH] = useState(0);
	const [frameW, setFrameW] = useState(32);
	const [frameH, setFrameH] = useState(32);
	const [fps, setFps] = useState(8);
	const [flipX, setFlipX] = useState(false);
	const [offsetY, setOffsetY] = useState(0);
	const [rows, setRows] = useState([]);
	const [assignments, setAssignments] = useState(() => {
		const init = {};
		for (const s of REQUIRED_STATES) init[s] = null;
		for (const s of OPTIONAL_STATES) init[s] = null;
		return init;
	});
	const [name, setName] = useState(existingPack?.name || "");
	const [author, setAuthor] = useState(existingPack?.author || "");
	const [description, setDescription] = useState(existingPack?.description || "");
	const pendingAssignments = useRef(null);
	const originalSnapshot = useRef(null);
	/** Open-ended random clip names from the loaded pack (PetDex custom clips). */
	const randomNamesRef = useRef(/* @__PURE__ */ new Set());
	const snap = () => JSON.stringify({
		name,
		author,
		description,
		flipX,
		frameW,
		frameH,
		fps,
		offsetY,
		assignments
	});
	const isDirty = !existingPack || originalSnapshot.current === null || snap() !== originalSnapshot.current;
	useEffect(() => {
		if (!existingPack) return;
		api$2?.galleryGetPackDetail?.(existingPack.id).then(async (d) => {
			if (!d?.sprite) return;
			randomNamesRef.current = new Set(d.randomNames ?? []);
			setFrameW(d.sprite.frameWidth || 32);
			setFrameH(d.sprite.frameHeight || 32);
			setFps(d.sprite.fps || 8);
			if (d.sprite.flipX) setFlipX(true);
			if (d.sprite.offsetY) setOffsetY(d.sprite.offsetY);
			const loadedAssignments = {};
			for (const s of REQUIRED_STATES) loadedAssignments[s] = null;
			for (const s of OPTIONAL_STATES) loadedAssignments[s] = null;
			if (d.sprite.rowAssignments) {
				const ra = d.sprite.rowAssignments;
				for (const [k, v] of Object.entries(ra)) loadedAssignments[k] = v;
			}
			pendingAssignments.current = loadedAssignments;
			originalSnapshot.current = JSON.stringify({
				name: existingPack.name || "",
				author: existingPack.author || "",
				description: existingPack.description || "",
				flipX: !!d.sprite.flipX,
				frameW: d.sprite.frameWidth || 32,
				frameH: d.sprite.frameHeight || 32,
				fps: d.sprite.fps || 8,
				offsetY: d.sprite.offsetY || 0,
				assignments: loadedAssignments
			});
			let sourceLoaded = false;
			if (d.sprite.source) {
				const b64 = await api$2?.galleryReadPackFile?.(existingPack.id, d.sprite.source);
				if (b64) {
					setImgSrc(`data:image/png;base64,${b64}`);
					sourceLoaded = true;
				}
			}
			if (!sourceLoaded) {
				const anims = d.animations;
				const rowMap = /* @__PURE__ */ new Map();
				const fallbackRows = [];
				const fa = {};
				for (const s of REQUIRED_STATES) fa[s] = null;
				for (const s of OPTIONAL_STATES) fa[s] = null;
				for (const [key, anim] of Object.entries(anims)) {
					const uri = entryContent(anim).startsWith("data:") ? entryContent(anim) : `data:image/png;base64,${entryContent(anim)}`;
					if (!rowMap.has(uri)) {
						rowMap.set(uri, fallbackRows.length);
						fallbackRows.push({
							index: fallbackRows.length,
							dataUri: uri,
							frameCount: 0
						});
					}
					fa[key] = rowMap.get(uri);
				}
				setRows(fallbackRows);
				setAssignments(fa);
				pendingAssignments.current = null;
				originalSnapshot.current = JSON.stringify({
					name: existingPack.name || "",
					author: existingPack.author || "",
					description: existingPack.description || "",
					flipX: !!d.sprite.flipX,
					frameW: d.sprite.frameWidth || 32,
					frameH: d.sprite.frameHeight || 32,
					fps: d.sprite.fps || 8,
					offsetY: d.sprite.offsetY || 0,
					assignments: fa
				});
			}
		});
	}, []);
	const handleSelectFile = useCallback(async () => {
		const result = await api$2?.importSpriteFile?.();
		if (!result || result.ok === false) return;
		const content = result.value?.content ?? "";
		if (!content) return;
		const uri = `data:image/png;base64,${content}`;
		const img = new Image();
		img.onload = () => {
			const canvas = document.createElement("canvas");
			canvas.width = img.naturalWidth;
			canvas.height = img.naturalHeight;
			const ctx = canvas.getContext("2d");
			ctx.drawImage(img, 0, 0);
			const detected = detectFrameSize(ctx.getImageData(0, 0, canvas.width, canvas.height));
			if (detected.frameWidth > 0 && detected.frameWidth < img.naturalWidth) setFrameW(detected.frameWidth);
			if (detected.frameHeight > 0 && detected.frameHeight < img.naturalHeight) setFrameH(detected.frameHeight);
			if (detected.offsetY > 0) setOffsetY(detected.offsetY);
			setImgSrc(uri);
		};
		img.src = uri;
	}, []);
	useEffect(() => {
		if (!imgSrc) return;
		const img = new Image();
		const onLoad = () => {
			const iw = img.naturalWidth;
			const ih = img.naturalHeight;
			setImgW(iw);
			setImgH(ih);
			const fw = frameW || 32;
			const fh = frameH || 32;
			const effectiveH = ih - offsetY;
			const numRows = Math.ceil(effectiveH / fh);
			const cols = Math.floor(iw / fw);
			const newRows = [];
			const canvas = document.createElement("canvas");
			const ctx = canvas.getContext("2d");
			for (let r = 0; r < numRows; r++) {
				const srcY = offsetY + r * fh;
				const rowH = Math.min(fh, ih - srcY);
				if (rowH <= 0) break;
				canvas.width = cols * fw;
				canvas.height = rowH;
				ctx.clearRect(0, 0, canvas.width, rowH);
				ctx.drawImage(img, 0, srcY, cols * fw, rowH, 0, 0, cols * fw, rowH);
				newRows.push({
					index: r,
					dataUri: canvas.toDataURL("image/png"),
					frameCount: cols
				});
			}
			setRows(newRows);
			if (pendingAssignments.current) {
				setAssignments(pendingAssignments.current);
				pendingAssignments.current = null;
			}
		};
		img.addEventListener("load", onLoad);
		img.src = imgSrc;
		return () => img.removeEventListener("load", onLoad);
	}, [
		imgSrc,
		frameW,
		frameH,
		offsetY
	]);
	const missingStates = REQUIRED_STATES.filter((s) => assignments[s] == null);
	const canSave = missingStates.length === 0 && name.trim().length > 0 && isDirty;
	const { showSaveDialog, triggerSave, confirmOverwrite, confirmSaveNew, cancelDialog } = useSaveWithDialog(existingPack, isDirty);
	const doSave = useCallback((asNew) => {
		const result = {};
		const randomResult = {};
		const rowAssignments = {};
		const isRandom = (k) => RANDOM_STATES.includes(k) || randomNamesRef.current.has(k);
		for (const [key, rowIdx] of Object.entries(assignments)) if (rowIdx != null && rows[rowIdx]) {
			if (isRandom(key)) randomResult[key] = rows[rowIdx].dataUri;
			else result[key] = rows[rowIdx].dataUri;
			rowAssignments[key] = rowIdx;
		}
		const data = {
			name,
			author,
			description,
			frameWidth: frameW,
			frameHeight: frameH,
			fps,
			flipX,
			offsetY,
			sourceImage: imgSrc || void 0,
			assignments: result,
			rowAssignments
		};
		if (Object.keys(randomResult).length > 0) data.randomAssignments = randomResult;
		if (!asNew && existingPack) data.overwriteId = existingPack.id;
		onDone(data);
	}, [
		name,
		author,
		description,
		frameW,
		frameH,
		fps,
		flipX,
		offsetY,
		imgSrc,
		assignments,
		rows,
		existingPack,
		onDone
	]);
	const S = {
		container: {
			display: "flex",
			flexDirection: "column",
			height: "100%",
			color: "var(--text)",
			background: "var(--bg)"
		},
		body: {
			flex: 1,
			overflowY: "auto",
			padding: "12px 20px"
		},
		section: { marginBottom: 12 },
		sectionLabel: {
			fontSize: 11,
			color: "var(--text-muted)",
			textTransform: "uppercase",
			letterSpacing: 1,
			marginBottom: 6
		}
	};
	return /* @__PURE__ */ jsxs("div", {
		style: S.container,
		children: [
			/* @__PURE__ */ jsx(PackInfoHeader, {
				title: existingPack ? i18nT("apps.crewCompanion.sprite.editTitle") : i18nT("apps.crewCompanion.sprite.title"),
				name,
				author,
				description,
				flipX,
				onNameChange: setName,
				onAuthorChange: setAuthor,
				onDescriptionChange: setDescription,
				onFlipXChange: setFlipX,
				tt: i18nT
			}),
			/* @__PURE__ */ jsxs("div", {
				style: S.body,
				children: [
					/* @__PURE__ */ jsxs("div", {
						style: {
							...S.section,
							display: "flex",
							gap: 12,
							alignItems: "flex-end",
							flexWrap: "wrap"
						},
						children: [
							/* @__PURE__ */ jsxs("button", {
								onClick: handleSelectFile,
								style: {
									padding: "6px 14px",
									borderRadius: 6,
									fontSize: 12,
									cursor: "pointer",
									border: "1px solid var(--border)",
									background: "var(--cc-input-bg)",
									color: "var(--text)"
								},
								children: [
									/* @__PURE__ */ jsx(FolderOpen, {
										className: "lucide-inline",
										"aria-hidden": "true"
									}),
									" ",
									imgSrc ? i18nT("apps.crewCompanion.sprite.changeFile") : i18nT("apps.crewCompanion.sprite.selectFile")
								]
							}),
							/* @__PURE__ */ jsx(NumberField, {
								label: i18nT("apps.crewCompanion.sprite.frameWidth"),
								value: frameW,
								min: 8,
								max: 512,
								onChange: setFrameW
							}),
							/* @__PURE__ */ jsx(NumberField, {
								label: i18nT("apps.crewCompanion.sprite.frameHeight"),
								value: frameH,
								min: 8,
								max: 512,
								onChange: setFrameH
							}),
							/* @__PURE__ */ jsx(NumberField, {
								label: "FPS",
								value: fps,
								min: 1,
								max: 60,
								onChange: setFps
							}),
							/* @__PURE__ */ jsx(NumberField, {
								label: i18nT("apps.crewCompanion.sprite.offsetY"),
								value: offsetY,
								onChange: setOffsetY
							})
						]
					}),
					imgSrc && /* @__PURE__ */ jsxs("div", {
						style: S.section,
						children: [/* @__PURE__ */ jsx("div", {
							style: S.sectionLabel,
							children: i18nT("apps.crewCompanion.sprite.previewDims", {
								w: imgW,
								h: imgH,
								cols: Math.floor(imgW / (frameW || 1)),
								rows: Math.floor(imgH / (frameH || 1))
							})
						}), /* @__PURE__ */ jsx("div", {
							style: {
								background: "var(--cc-input-bg)",
								borderRadius: 8,
								padding: 8,
								overflow: "auto",
								maxHeight: 250,
								position: "relative"
							},
							children: /* @__PURE__ */ jsxs("div", {
								style: {
									position: "relative",
									display: "inline-block"
								},
								children: [
									/* @__PURE__ */ jsx("img", {
										src: imgSrc,
										alt: "",
										style: {
											imageRendering: "pixelated",
											display: "block",
											maxWidth: "none",
											minWidth: 400
										}
									}),
									frameH > 0 && Array.from({ length: Math.ceil(imgH / frameH) }, (_, i) => i > 0 && /* @__PURE__ */ jsx("div", { style: {
										position: "absolute",
										left: 0,
										right: 0,
										top: `${(i * frameH + offsetY) / imgH * 100}%`,
										height: 1,
										background: "var(--accent)"
									} }, `h${i}`)),
									frameW > 0 && Array.from({ length: Math.floor(imgW / frameW) }, (_, i) => i > 0 && /* @__PURE__ */ jsx("div", { style: {
										position: "absolute",
										top: 0,
										bottom: 0,
										left: `${i * frameW / imgW * 100}%`,
										width: 1,
										background: "var(--accent)"
									} }, `v${i}`))
								]
							})
						})]
					}),
					rows.length > 0 && /* @__PURE__ */ jsxs("div", {
						style: S.section,
						children: [
							/* @__PURE__ */ jsxs("div", {
								style: S.sectionLabel,
								children: [
									i18nT("apps.crewCompanion.sprite.rows"),
									" (",
									rows.length,
									")"
								]
							}),
							/* @__PURE__ */ jsx("div", {
								style: {
									fontSize: 10,
									color: "var(--text-muted)",
									marginBottom: 6,
									marginTop: -4
								},
								children: i18nT("apps.crewCompanion.sprite.assignHint")
							}),
							/* @__PURE__ */ jsx("div", {
								style: {
									display: "grid",
									gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
									gap: 8
								},
								children: rows.map((row) => /* @__PURE__ */ jsxs("div", {
									style: {
										background: "var(--cc-input-bg)",
										borderRadius: 8,
										padding: 8,
										display: "flex",
										flexDirection: "column",
										alignItems: "center",
										gap: 4
									},
									children: [
										/* @__PURE__ */ jsx("div", {
											style: {
												width: 80,
												height: 80,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												overflow: "hidden",
												transform: flipX ? "scaleX(-1)" : "none"
											},
											children: /* @__PURE__ */ jsx(SpriteRenderer, {
												src: row.dataUri,
												frameWidth: frameW,
												frameHeight: frameH,
												fps
											})
										}),
										/* @__PURE__ */ jsx("span", {
											style: {
												fontSize: 11,
												color: "var(--text)",
												fontWeight: 600
											},
											children: i18nT("apps.crewCompanion.sprite.row", { n: row.index + 1 })
										}),
										/* @__PURE__ */ jsxs("span", {
											style: {
												fontSize: 10,
												color: "var(--text-faint)"
											},
											children: [row.frameCount, "f"]
										})
									]
								}, row.index))
							})
						]
					}),
					rows.length > 0 && /* @__PURE__ */ jsxs("div", {
						style: S.section,
						children: [
							/* @__PURE__ */ jsx("div", {
								style: S.sectionLabel,
								children: i18nT("apps.crewCompanion.editor.requiredStates")
							}),
							/* @__PURE__ */ jsx("div", {
								style: {
									display: "grid",
									gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
									gap: 8
								},
								children: REQUIRED_STATES.map((s) => {
									const rowIdx = assignments[s];
									const row = rowIdx != null ? rows[rowIdx] : null;
									return /* @__PURE__ */ jsxs("div", {
										style: {
											background: "var(--cc-input-bg)",
											borderRadius: 8,
											padding: 8,
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											gap: 4,
											border: row ? "1.5px solid var(--accent)" : "1.5px dashed var(--border)"
										},
										children: [
											/* @__PURE__ */ jsx("div", {
												style: {
													width: 64,
													height: 64,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													overflow: "hidden",
													transform: flipX ? "scaleX(-1)" : "none"
												},
												children: row ? /* @__PURE__ */ jsx(SpriteRenderer, {
													src: row.dataUri,
													frameWidth: frameW,
													frameHeight: frameH,
													fps,
													displaySize: 64
												}) : /* @__PURE__ */ jsx(Plus, {
													size: 24,
													className: "lucide-inline",
													"aria-hidden": "true",
													style: { color: "var(--text-faint)" }
												})
											}),
											/* @__PURE__ */ jsxs("span", {
												style: {
													fontSize: 11,
													fontWeight: 600,
													color: "var(--text)"
												},
												children: [s, " *"]
											}),
											/* @__PURE__ */ jsx(Select, {
												options: rows.map((r) => String(r.index)),
												optionLabels: rows.map((r) => i18nT("apps.crewCompanion.sprite.row", { n: r.index + 1 })),
												value: rowIdx == null ? "" : String(rowIdx),
												onChange: (v) => setAssignments((prev) => ({
													...prev,
													[s]: v === "" ? null : Number(v)
												})),
												clearLabel: "—",
												"aria-label": s,
												style: { width: "100%" },
												className: "px-2 py-1 text-[10px]"
											})
										]
									}, s);
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								style: {
									...S.sectionLabel,
									marginTop: 12
								},
								children: [
									i18nT("apps.crewCompanion.state.groupStatus"),
									" ",
									/* @__PURE__ */ jsx("span", {
										style: {
											fontSize: 10,
											color: "var(--text-faint)"
										},
										children: "(optional)"
									})
								]
							}),
							/* @__PURE__ */ jsx("div", {
								style: {
									display: "grid",
									gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
									gap: 8
								},
								children: [...STATUS_STATES].map((s) => {
									const rowIdx = assignments[s];
									const row = rowIdx != null ? rows[rowIdx] : null;
									return /* @__PURE__ */ jsxs("div", {
										style: {
											background: "var(--cc-input-bg)",
											borderRadius: 8,
											padding: 8,
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											gap: 4,
											border: row ? "1px solid var(--border)" : "1px dashed var(--border)"
										},
										children: [
											/* @__PURE__ */ jsx("div", {
												style: {
													width: 64,
													height: 64,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													overflow: "hidden",
													transform: flipX ? "scaleX(-1)" : "none"
												},
												children: row ? /* @__PURE__ */ jsx(SpriteRenderer, {
													src: row.dataUri,
													frameWidth: frameW,
													frameHeight: frameH,
													fps,
													displaySize: 64
												}) : /* @__PURE__ */ jsx(Plus, {
													size: 24,
													className: "lucide-inline",
													"aria-hidden": "true",
													style: { color: "var(--text-faint)" }
												})
											}),
											/* @__PURE__ */ jsx("span", {
												style: {
													fontSize: 11,
													color: "var(--text-muted)"
												},
												children: s
											}),
											/* @__PURE__ */ jsx(Select, {
												options: rows.map((r) => String(r.index)),
												optionLabels: rows.map((r) => i18nT("apps.crewCompanion.sprite.row", { n: r.index + 1 })),
												value: rowIdx == null ? "" : String(rowIdx),
												onChange: (v) => setAssignments((prev) => ({
													...prev,
													[s]: v === "" ? null : Number(v)
												})),
												clearLabel: "—",
												"aria-label": s,
												style: { width: "100%" },
												className: "px-2 py-1 text-[10px]"
											})
										]
									}, s);
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								style: {
									...S.sectionLabel,
									marginTop: 12
								},
								children: [
									i18nT("apps.crewCompanion.state.groupBreathing"),
									" ",
									/* @__PURE__ */ jsx("span", {
										style: {
											fontSize: 10,
											color: "var(--text-faint)"
										},
										children: "(optional)"
									})
								]
							}),
							/* @__PURE__ */ jsx("div", {
								style: {
									display: "grid",
									gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
									gap: 8
								},
								children: [...BREATHING_STATES].map((s) => {
									const rowIdx = assignments[s];
									const row = rowIdx != null ? rows[rowIdx] : null;
									return /* @__PURE__ */ jsxs("div", {
										style: {
											background: "var(--cc-input-bg)",
											borderRadius: 8,
											padding: 8,
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											gap: 4,
											border: row ? "1px solid var(--border)" : "1px dashed var(--border)"
										},
										children: [
											/* @__PURE__ */ jsx("div", {
												style: {
													width: 64,
													height: 64,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													overflow: "hidden",
													transform: flipX ? "scaleX(-1)" : "none"
												},
												children: row ? /* @__PURE__ */ jsx(SpriteRenderer, {
													src: row.dataUri,
													frameWidth: frameW,
													frameHeight: frameH,
													fps,
													displaySize: 64
												}) : /* @__PURE__ */ jsx(Plus, {
													size: 24,
													className: "lucide-inline",
													"aria-hidden": "true",
													style: { color: "var(--text-faint)" }
												})
											}),
											/* @__PURE__ */ jsx("span", {
												style: {
													fontSize: 11,
													color: "var(--text-muted)"
												},
												children: s
											}),
											/* @__PURE__ */ jsx(Select, {
												options: rows.map((r) => String(r.index)),
												optionLabels: rows.map((r) => i18nT("apps.crewCompanion.sprite.row", { n: r.index + 1 })),
												value: rowIdx == null ? "" : String(rowIdx),
												onChange: (v) => setAssignments((prev) => ({
													...prev,
													[s]: v === "" ? null : Number(v)
												})),
												clearLabel: "—",
												"aria-label": s,
												style: { width: "100%" },
												className: "px-2 py-1 text-[10px]"
											})
										]
									}, s);
								})
							}),
							/* @__PURE__ */ jsxs("div", {
								style: {
									...S.sectionLabel,
									marginTop: 12
								},
								children: [
									i18nT("apps.crewCompanion.state.groupRandom"),
									" ",
									/* @__PURE__ */ jsx("span", {
										style: {
											fontSize: 10,
											color: "var(--text-faint)"
										},
										children: "(optional)"
									})
								]
							}),
							/* @__PURE__ */ jsx("div", {
								style: {
									display: "grid",
									gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
									gap: 8
								},
								children: [...RANDOM_STATES].map((s) => {
									const rowIdx = assignments[s];
									const row = rowIdx != null ? rows[rowIdx] : null;
									return /* @__PURE__ */ jsxs("div", {
										style: {
											background: "var(--cc-input-bg)",
											borderRadius: 8,
											padding: 8,
											display: "flex",
											flexDirection: "column",
											alignItems: "center",
											gap: 4,
											border: row ? "1px solid var(--border)" : "1px dashed var(--border)"
										},
										children: [
											/* @__PURE__ */ jsx("div", {
												style: {
													width: 64,
													height: 64,
													display: "flex",
													alignItems: "center",
													justifyContent: "center",
													overflow: "hidden",
													transform: flipX ? "scaleX(-1)" : "none"
												},
												children: row ? /* @__PURE__ */ jsx(SpriteRenderer, {
													src: row.dataUri,
													frameWidth: frameW,
													frameHeight: frameH,
													fps,
													displaySize: 64
												}) : /* @__PURE__ */ jsx(Plus, {
													size: 24,
													className: "lucide-inline",
													"aria-hidden": "true",
													style: { color: "var(--text-faint)" }
												})
											}),
											/* @__PURE__ */ jsx("span", {
												style: {
													fontSize: 11,
													color: "var(--text-muted)"
												},
												children: s
											}),
											/* @__PURE__ */ jsx(Select, {
												options: rows.map((r) => String(r.index)),
												optionLabels: rows.map((r) => i18nT("apps.crewCompanion.sprite.row", { n: r.index + 1 })),
												value: rowIdx == null ? "" : String(rowIdx),
												onChange: (v) => setAssignments((prev) => ({
													...prev,
													[s]: v === "" ? null : Number(v)
												})),
												clearLabel: "—",
												"aria-label": s,
												style: { width: "100%" },
												className: "px-2 py-1 text-[10px]"
											})
										]
									}, s);
								})
							})
						]
					})
				]
			}),
			/* @__PURE__ */ jsx(ErrorNotice, {
				message: saveError,
				className: "mx-5 mb-2"
			}),
			/* @__PURE__ */ jsx(EditorFooter, {
				missingStates: rows.length > 0 ? missingStates : [],
				canSave,
				onCancel,
				onSave: () => triggerSave(doSave),
				tt: i18nT
			}),
			/* @__PURE__ */ jsx(SaveDialog, {
				visible: showSaveDialog,
				onOverwrite: () => confirmOverwrite(doSave),
				onSaveNew: () => confirmSaveNew(doSave),
				onCancel: cancelDialog,
				i18nT
			})
		]
	});
};
// src/petdexImport.ts
/**
* petdexImport — turn a PetDex sprite sheet into a Kiro Ghost sprite pack.
*
* PetDex pets are a fixed 8-col × 9-row grid of 192×208 frames. Each row is a
* state (authoritative order from crafter-station/petdex `src/lib/pet-states.ts`).
* We slice the rows we care about into per-state horizontal strips (the shape
* our SpriteRenderer + gallery:save-sprite-pack already understand) and map them
* onto our Idle / Status / Random buckets.
*/
var FRAME_W = 192;
var FRAME_H = 208;
var FPS = 7;
/**
* PetDex canonical rows → our slots. { key, row, frames }.
*
* PetDex's nine rows (src/lib/pet-states.ts): 0 idle · 1 running-right ·
* 2 running-left · 3 waving · 4 jumping · 5 failed · 6 waiting · 7 running ·
* 8 review.
*
* Mapped onto Idle + Status (done / error) + Random:
*   failed  → error
*   jumping → done      PetDex has no "success" row, so the celebratory hop is the
*                       best fit — without it every PetDex pet fell back to idle
*                       for the job-done reaction.
*   running-right → walking (Wander)
* Skipped on purpose: running-left, because the app mirrors art with flipX, so a
* second directional loop would be redundant.
*/
var STATE_MAP = [
	{
		key: "idle",
		row: 0,
		frames: 6
	},
	{
		key: "error",
		row: 5,
		frames: 8
	},
	{
		key: "done",
		row: 4,
		frames: 5
	},
	{
		key: "walking",
		row: 1,
		frames: 8
	}
];
var RANDOM_MAP = [
	{
		name: "wave",
		row: 3,
		frames: 4
	},
	{
		name: "waiting",
		row: 6,
		frames: 6
	},
	{
		name: "run",
		row: 7,
		frames: 6
	},
	{
		name: "review",
		row: 8,
		frames: 8
	}
];
/** Crop one grid row into a horizontal strip PNG data URI. */
function sliceRow(img, row, frames) {
	const canvas = document.createElement("canvas");
	canvas.width = frames * FRAME_W;
	canvas.height = FRAME_H;
	const ctx = canvas.getContext("2d");
	ctx.clearRect(0, 0, canvas.width, canvas.height);
	ctx.drawImage(img, 0, row * FRAME_H, frames * FRAME_W, FRAME_H, 0, 0, frames * FRAME_W, FRAME_H);
	return canvas.toDataURL("image/png");
}
/**
* Crop the first idle frame out of a PetDex sheet so the import popup can show
* what the pet actually looks like before the user commits.
*/
function firstFramePreview(spriteBase64) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			try {
				const canvas = document.createElement("canvas");
				canvas.width = FRAME_W;
				canvas.height = FRAME_H;
				const ctx = canvas.getContext("2d");
				ctx.clearRect(0, 0, FRAME_W, FRAME_H);
				ctx.drawImage(img, 0, 0, FRAME_W, FRAME_H, 0, 0, FRAME_W, FRAME_H);
				resolve(canvas.toDataURL("image/png"));
			} catch (err) {
				reject(err);
			}
		};
		img.onerror = () => reject(/* @__PURE__ */ new Error("Could not decode the sprite sheet"));
		img.src = `data:image/webp;base64,${spriteBase64}`;
	});
}
/**
* Build the payload accepted by `gallery:save-sprite-pack` from a PetDex sheet
* (base64 webp/png). Resolves once the image has loaded and been sliced.
*/
function buildSpritePackData(spriteBase64, meta) {
	return new Promise((resolve, reject) => {
		const img = new Image();
		img.onload = () => {
			try {
				const assignments = {};
				const rowAssignments = {};
				for (const { key, row, frames } of STATE_MAP) {
					if ((row + 1) * FRAME_H > img.naturalHeight) continue;
					assignments[key] = sliceRow(img, row, frames);
					rowAssignments[key] = row;
				}
				if (!assignments["idle"]) {
					reject(/* @__PURE__ */ new Error("Sheet has no idle row (unexpected PetDex layout)"));
					return;
				}
				const randomAssignments = {};
				for (const { name, row, frames } of RANDOM_MAP) {
					if ((row + 1) * FRAME_H > img.naturalHeight) continue;
					randomAssignments[name] = sliceRow(img, row, frames);
				}
				resolve({
					name: meta.displayName,
					author: meta.author,
					description: meta.description,
					frameWidth: FRAME_W,
					frameHeight: FRAME_H,
					fps: FPS,
					flipX: false,
					offsetY: 0,
					assignments,
					randomAssignments,
					rowAssignments
				});
			} catch (err) {
				reject(err);
			}
		};
		img.onerror = () => reject(/* @__PURE__ */ new Error("Could not decode the PetDex sprite sheet"));
		img.src = `data:image/webp;base64,${spriteBase64}`;
	});
}
// src/catPresets.ts
/**
* CrewCompanion - Cat Color Preset System
*
* Data model, validation, and registry for cat color presets.
* Pure logic — no Electron or DOM dependencies.
*/
function extractSwatches(colorMap) {
	const vals = Object.values(colorMap).filter(isValidHexColor);
	const seen = /* @__PURE__ */ new Set();
	const unique = [];
	for (const v of vals) if (!seen.has(v)) {
		seen.add(v);
		unique.push(v);
	}
	return unique.slice(0, 5);
}
function generatePresetId() {
	return `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}
var PresetRegistry = class {
	builtInPresets;
	customPresets;
	constructor(builtInPresets, customPresets) {
		this.builtInPresets = builtInPresets;
		this.customPresets = (customPresets ?? []).filter((p) => p && typeof p === "object" && typeof p.id === "string" && p.id);
	}
	getAllPresets() {
		return [...this.builtInPresets, ...this.customPresets];
	}
	getPresetById(id) {
		return this.getAllPresets().find((p) => p.id === id) ?? null;
	}
	getBuiltInPresets() {
		return [...this.builtInPresets];
	}
	getCustomPresets() {
		return [...this.customPresets];
	}
	addCustomPreset(preset) {
		const id = generatePresetId();
		this.customPresets.push({
			...preset,
			id,
			builtIn: false
		});
		return id;
	}
	removeCustomPreset(id) {
		if (this.builtInPresets.some((p) => p.id === id)) return false;
		const idx = this.customPresets.findIndex((p) => p.id === id);
		if (idx === -1) return false;
		this.customPresets.splice(idx, 1);
		return true;
	}
};
// src/builtInCatPresets.ts
function preset(id, name, description, colorMap, swatches) {
	return {
		id,
		name,
		description,
		colorMap,
		swatches,
		builtIn: true
	};
}
var BUILT_IN_CAT_PRESETS = [
	preset("orange-tabby", "preset.orangeTabby", "", {
		"#F9A85F": "#F9A85F",
		"#F18D50": "#F18D50",
		"#EB8849": "#EB8849",
		"#E98649": "#E98649",
		"#FCD9B3": "#FCD9B3",
		"#F49681": "#F49681",
		"#F5E6CB": "#F5E6CB",
		"#522210": "#522210",
		"#522214": "#522214",
		"#391F19": "#391F19"
	}, [
		"#F9A85F",
		"#F18D50",
		"#FCD9B3"
	]),
	preset("tuxedo", "preset.tuxedo", "", {
		"#F9A85F": "#2C2C2C",
		"#F18D50": "#1A1A1A",
		"#EB8849": "#1A1A1A",
		"#E98649": "#1A1A1A",
		"#FCD9B3": "#F5F5F5",
		"#F49681": "#FFB6C1",
		"#F5E6CB": "#FFFFFF",
		"#522210": "#0D0D0D",
		"#522214": "#0D0D0D",
		"#391F19": "#000000"
	}, [
		"#2C2C2C",
		"#F5F5F5",
		"#FFFFFF"
	]),
	preset("calico", "preset.calico", "", {
		"#F9A85F": "#F5F0E8",
		"#F18D50": "#E8943A",
		"#EB8849": "#3D3D3D",
		"#E98649": "#E8943A",
		"#FCD9B3": "#FFFAF5",
		"#F49681": "#FFB6C1",
		"#F5E6CB": "#FFFAF5",
		"#522210": "#2B1810",
		"#522214": "#2B1810",
		"#391F19": "#1A0F0A"
	}, [
		"#F5F0E8",
		"#E8943A",
		"#3D3D3D"
	]),
	preset("russian-blue", "preset.russianBlue", "", {
		"#F9A85F": "#8BA4B8",
		"#F18D50": "#7090A8",
		"#EB8849": "#607E96",
		"#E98649": "#7090A8",
		"#FCD9B3": "#C0D4E4",
		"#F49681": "#B8A0B0",
		"#F5E6CB": "#D0E0EC",
		"#522210": "#283848",
		"#522214": "#283848",
		"#391F19": "#182830"
	}, [
		"#8BA4B8",
		"#C0D4E4",
		"#283848"
	]),
	preset("siamese", "preset.siamese", "", {
		"#F9A85F": "#F5E8D0",
		"#F18D50": "#6B4832",
		"#EB8849": "#4A3020",
		"#E98649": "#6B4832",
		"#FCD9B3": "#FFF5E8",
		"#F49681": "#D4A0A0",
		"#F5E6CB": "#FFF8F0",
		"#522210": "#2A1810",
		"#522214": "#2A1810",
		"#391F19": "#1A0E08"
	}, [
		"#F5E8D0",
		"#6B4832",
		"#2A1810"
	]),
	preset("british-shorthair", "preset.britishShorthair", "", {
		"#F9A85F": "#9898A8",
		"#F18D50": "#808090",
		"#EB8849": "#707080",
		"#E98649": "#808090",
		"#FCD9B3": "#C8C8D4",
		"#F49681": "#C0A8B0",
		"#F5E6CB": "#D4D4DE",
		"#522210": "#383840",
		"#522214": "#383840",
		"#391F19": "#282830"
	}, [
		"#9898A8",
		"#C8C8D4",
		"#383840"
	]),
	preset("white", "preset.white", "", {
		"#F9A85F": "#F8F8F8",
		"#F18D50": "#EFEFEF",
		"#EB8849": "#E8E8E8",
		"#E98649": "#EFEFEF",
		"#FCD9B3": "#FFFFFF",
		"#F49681": "#FFD0D0",
		"#F5E6CB": "#FFFFFF",
		"#522210": "#8A7A7A",
		"#522214": "#8A7A7A",
		"#391F19": "#6B5B5B"
	}, [
		"#F8F8F8",
		"#FFFFFF",
		"#8A7A7A"
	]),
	preset("black", "preset.black", "", {
		"#F9A85F": "#2A2A2A",
		"#F18D50": "#1E1E1E",
		"#EB8849": "#151515",
		"#E98649": "#1E1E1E",
		"#FCD9B3": "#3D3D3D",
		"#F49681": "#8B5A5A",
		"#F5E6CB": "#4A4A4A",
		"#522210": "#0A0A0A",
		"#522214": "#0A0A0A",
		"#391F19": "#000000"
	}, [
		"#2A2A2A",
		"#3D3D3D",
		"#0A0A0A"
	]),
	preset("tabby", "preset.tabby", "", {
		"#F9A85F": "#8C6840",
		"#F18D50": "#785830",
		"#EB8849": "#684828",
		"#E98649": "#785830",
		"#FCD9B3": "#C8A878",
		"#F49681": "#C09080",
		"#F5E6CB": "#D4B890",
		"#522210": "#2E1808",
		"#522214": "#2E1808",
		"#391F19": "#1E1004"
	}, [
		"#8C6840",
		"#C8A878",
		"#2E1808"
	]),
	preset("ragdoll", "preset.ragdoll", "", {
		"#F9A85F": "#EDE0D4",
		"#F18D50": "#A08068",
		"#EB8849": "#886850",
		"#E98649": "#A08068",
		"#FCD9B3": "#FFF0E0",
		"#F49681": "#E0A8B0",
		"#F5E6CB": "#FFF5EA",
		"#522210": "#4A3428",
		"#522214": "#4A3428",
		"#391F19": "#342018"
	}, [
		"#EDE0D4",
		"#A08068",
		"#4A3428"
	])
];
// src/ColorCustomizerPanel.tsx
/**
* CrewCompanion - Color Customizer Panel
*
* Preset picker grid (each preset shows an SVG preview) + manual color editor
* with per-body-part highlighting. i18n via useT().
*/
/**
* The built-in pack's id, canonical in the backend (appearances.py `DEFAULT_PACK`).
* This panel previously used a stale `DEFAULT_PACK` literal — the same bug
* GalleryPanel fixed: recolors saved under an id no pack has, so the renderer
* (which reloads by `kiro-ghost`) never saw them and the customization
* silently vanished on the next reload.
*/
var DEFAULT_PACK$1 = "kiro-ghost";
var api$1 = petBridge;
/** i18n key for each source color's body part label */
var BODY_PART_KEYS = {
	"#F9A85F": "apps.crewCompanion.color.bodyFur",
	"#F18D50": "apps.crewCompanion.color.earsShadow",
	"#EB8849": "apps.crewCompanion.color.chinLegs",
	"#E98649": "apps.crewCompanion.color.belly",
	"#FCD9B3": "apps.crewCompanion.color.tummyPaws",
	"#F49681": "apps.crewCompanion.color.innerEar",
	"#F5E6CB": "apps.crewCompanion.color.paws",
	"#522210": "apps.crewCompanion.color.outlines",
	"#522214": "apps.crewCompanion.color.bodyOutline",
	"#391F19": "apps.crewCompanion.color.shadows"
};
var CS = {
	root: { marginTop: 16 },
	section: {
		fontSize: 11,
		color: "var(--text-muted)",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 8,
		marginTop: 12
	},
	presetGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
		gap: 8,
		marginBottom: 12
	},
	presetCard: (active) => ({
		borderRadius: 8,
		textAlign: "center",
		border: active ? "2px solid var(--accent)" : "1px solid var(--border)",
		background: active ? "var(--accent-glow)" : "var(--cc-input-bg)",
		transition: "border-color 150ms"
	}),
	presetSelect: (hasDelete) => ({
		display: "block",
		width: "100%",
		padding: hasDelete ? "6px 6px 0" : 6,
		border: "none",
		borderRadius: 7,
		background: "none",
		color: "inherit",
		font: "inherit",
		textAlign: "center",
		cursor: "pointer"
	}),
	presetThumb: {
		width: 56,
		height: 56,
		objectFit: "contain",
		borderRadius: 6,
		margin: "0 auto 4px"
	},
	presetName: {
		fontSize: 10,
		fontWeight: 500,
		lineHeight: 1.3
	},
	btnRow: {
		display: "flex",
		gap: 8,
		marginTop: 12,
		flexWrap: "wrap"
	},
	btn: {
		padding: "6px 14px",
		borderRadius: 8,
		border: "1px solid var(--border)",
		background: "var(--cc-input-bg)",
		color: "var(--text)",
		cursor: "pointer",
		fontSize: 12
	},
	deleteBtn: {
		background: "none",
		border: "none",
		borderRadius: 4,
		color: "var(--danger)",
		cursor: "pointer",
		fontSize: 10,
		marginTop: 2,
		position: "relative"
	}
};
function PresetCard({ preset, active, svgContent, onClick, onDelete, deleteLabel, i18nT }) {
	const previewUri = useMemo(() => {
		const cm = preset.colorMap;
		if (!cm || Object.keys(cm).length === 0) return toDataUri(svgContent);
		return toDataUri(applySvgColorMap(svgContent, cm));
	}, [preset.colorMap, svgContent]);
	const displayName = preset.builtIn ? i18nT(preset.name) : preset.name;
	return /* @__PURE__ */ jsxs("div", {
		style: {
			...CS.presetCard(active),
			paddingBottom: onDelete ? 6 : 0,
			position: "relative"
		},
		children: [/* @__PURE__ */ jsxs("button", {
			type: "button",
			"aria-pressed": active,
			style: CS.presetSelect(!!onDelete),
			onClick,
			children: [
				/* @__PURE__ */ jsx("img", {
					src: previewUri,
					alt: displayName,
					style: CS.presetThumb,
					draggable: false
				}),
				/* @__PURE__ */ jsx("span", {
					style: {
						...CS.presetName,
						display: "block"
					},
					children: displayName
				}),
				/* @__PURE__ */ jsx("span", {
					"aria-hidden": "true",
					style: {
						position: "absolute",
						inset: 0
					}
				})
			]
		}), onDelete && /* @__PURE__ */ jsx("button", {
			type: "button",
			style: CS.deleteBtn,
			onClick: onDelete,
			children: deleteLabel
		})]
	});
}
function buildHighlightMap(allColors, highlightSrc, targetColor) {
	const faded = "#FAFAFA";
	const fadedDark = "#ECECEC";
	const darkColors = /* @__PURE__ */ new Set([
		"#522210",
		"#522214",
		"#391F19"
	]);
	const map = {};
	for (const c of allColors) map[c] = c === highlightSrc ? targetColor : darkColors.has(c) ? fadedDark : faded;
	return map;
}
function ColorEditorCard({ sourceColor, targetColor, bodyPart, svgContent, allColors, onChange }) {
	const highlightUri = useMemo(() => {
		return toDataUri(applySvgColorMap(svgContent, buildHighlightMap(allColors, sourceColor, targetColor)));
	}, [
		sourceColor,
		targetColor,
		svgContent,
		allColors
	]);
	return /* @__PURE__ */ jsxs("div", {
		style: {
			padding: 6,
			borderRadius: 8,
			textAlign: "center",
			border: "1px solid var(--border)",
			background: "var(--cc-input-bg)"
		},
		children: [
			/* @__PURE__ */ jsx("img", {
				src: highlightUri,
				alt: bodyPart,
				style: CS.presetThumb,
				draggable: false
			}),
			/* @__PURE__ */ jsx("div", {
				style: {
					fontSize: 10,
					color: "var(--text-muted)",
					marginBottom: 4
				},
				children: bodyPart
			}),
			/* @__PURE__ */ jsx("input", {
				type: "color",
				value: targetColor,
				onChange: (e) => onChange(e.target.value),
				"aria-label": bodyPart,
				style: {
					width: 36,
					height: 20,
					border: "none",
					padding: 0,
					cursor: "pointer",
					borderRadius: 4
				}
			})
		]
	});
}
var ColorCustomizerPanel = ({ idleSvgContent }) => {
	const ime = useImeGuard();
	const [colorMap, setColorMap] = useState({});
	const [registry, setRegistry] = useState(() => new PresetRegistry(BUILT_IN_CAT_PRESETS));
	const [activePresetId, setActivePresetId] = useState(null);
	const [showSaveForm, setShowSaveForm] = useState(false);
	const [saveNameInput, setSaveNameInput] = useState("");
	const saveTriggerRef = useRef(null);
	const restoreSaveFocusRef = useRef(false);
	const closeSaveForm = useCallback(() => {
		restoreSaveFocusRef.current = true;
		setShowSaveForm(false);
	}, []);
	useLayoutEffect(() => {
		if (showSaveForm || !restoreSaveFocusRef.current) return;
		restoreSaveFocusRef.current = false;
		const at = document.activeElement;
		if (at === null || at === document.body) saveTriggerRef.current?.focus({ preventScroll: true });
	}, [showSaveForm]);
	const sourceColors = useMemo(() => extractSvgColors(idleSvgContent), [idleSvgContent]);
	useEffect(() => {
		(async () => {
			const [saved, customs] = await Promise.all([api$1?.presetsGetColorMap?.(DEFAULT_PACK$1), api$1?.presetsLoadCustom?.()]);
			if (saved && Object.keys(saved).length > 0) setColorMap(saved);
			const saved2 = (customs ?? []).filter((c) => typeof c === "object" && c !== null && "name" in c);
			if (saved2.length) setRegistry(new PresetRegistry(BUILT_IN_CAT_PRESETS, saved2));
		})();
	}, []);
	const applyPreset = useCallback((preset) => {
		setColorMap(preset.colorMap);
		setActivePresetId(preset.id);
		api$1?.gallerySetColorMap?.(DEFAULT_PACK$1, preset.colorMap);
	}, []);
	const handleColorChange = useCallback((sourceColor, targetColor) => {
		setColorMap((prev) => {
			const next = {
				...prev,
				[sourceColor]: targetColor
			};
			api$1?.gallerySetColorMap?.(DEFAULT_PACK$1, next);
			return next;
		});
		setActivePresetId(null);
	}, []);
	const handleReset = useCallback(async () => {
		setColorMap({});
		setActivePresetId(null);
		await api$1?.gallerySetColorMap?.(DEFAULT_PACK$1, {});
	}, []);
	const handleSaveAsPreset = useCallback(async () => {
		const name = saveNameInput.trim();
		if (!name) return;
		const swatches = extractSwatches(colorMap);
		if (swatches.length < 2) swatches.push(...Object.values(colorMap).slice(0, 2 - swatches.length));
		registry.addCustomPreset({
			name,
			description: "",
			colorMap,
			swatches
		});
		const customs = registry.getCustomPresets();
		setRegistry(new PresetRegistry(BUILT_IN_CAT_PRESETS, customs));
		await api$1?.presetsSaveCustom?.(customs);
		setSaveNameInput("");
		closeSaveForm();
	}, [
		closeSaveForm,
		colorMap,
		registry,
		saveNameInput
	]);
	const handleDeletePreset = useCallback(async (id) => {
		registry.removeCustomPreset(id);
		const customs = registry.getCustomPresets();
		setRegistry(new PresetRegistry(BUILT_IN_CAT_PRESETS, customs));
		await api$1?.presetsSaveCustom?.(customs);
		if (activePresetId === id) setActivePresetId(null);
	}, [registry, activePresetId]);
	return /* @__PURE__ */ jsxs("div", {
		style: CS.root,
		children: [
			/* @__PURE__ */ jsx("div", {
				style: CS.section,
				children: i18nT("apps.crewCompanion.color.presets")
			}),
			/* @__PURE__ */ jsx("div", {
				style: CS.presetGrid,
				children: registry.getAllPresets().map((p) => /* @__PURE__ */ jsx(PresetCard, {
					preset: p,
					active: activePresetId === p.id,
					svgContent: idleSvgContent,
					onClick: () => applyPreset(p),
					onDelete: !p.builtIn ? () => handleDeletePreset(p.id) : void 0,
					deleteLabel: i18nT("apps.crewCompanion.color.delete"),
					i18nT
				}, p.id))
			}),
			/* @__PURE__ */ jsx("div", {
				style: CS.section,
				children: i18nT("apps.crewCompanion.color.manual")
			}),
			/* @__PURE__ */ jsxs("div", {
				style: CS.presetGrid,
				children: [/* @__PURE__ */ jsxs("div", {
					style: {
						padding: 6,
						borderRadius: 8,
						textAlign: "center",
						border: "2px solid var(--accent)",
						background: "var(--accent-glow)"
					},
					children: [/* @__PURE__ */ jsx("img", {
						src: Object.keys(colorMap).length > 0 ? toDataUri(applySvgColorMap(idleSvgContent, colorMap)) : toDataUri(idleSvgContent),
						alt: "final",
						style: CS.presetThumb,
						draggable: false
					}), /* @__PURE__ */ jsx("div", {
						style: {
							fontSize: 10,
							fontWeight: 600
						},
						children: i18nT("apps.crewCompanion.color.currentEffect")
					})]
				}), sourceColors.map((src) => /* @__PURE__ */ jsx(ColorEditorCard, {
					sourceColor: src,
					targetColor: colorMap[src] || src,
					bodyPart: BODY_PART_KEYS[src] ? i18nT(BODY_PART_KEYS[src]) : src,
					svgContent: idleSvgContent,
					allColors: sourceColors,
					onChange: (color) => handleColorChange(src, color)
				}, src))]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: CS.btnRow,
				children: [/* @__PURE__ */ jsx("button", {
					style: CS.btn,
					onClick: handleReset,
					children: i18nT("apps.crewCompanion.color.reset")
				}), !showSaveForm ? /* @__PURE__ */ jsx("button", {
					ref: saveTriggerRef,
					style: CS.btn,
					onClick: () => setShowSaveForm(true),
					children: i18nT("apps.crewCompanion.color.savePreset")
				}) : /* @__PURE__ */ jsxs("div", {
					style: {
						display: "flex",
						gap: 6,
						alignItems: "center"
					},
					children: [
						/* @__PURE__ */ jsx("input", {
							type: "text",
							value: saveNameInput,
							onChange: (e) => setSaveNameInput(e.target.value),
							...ime.bindEnter({
								onEnter: handleSaveAsPreset,
								onEscape: closeSaveForm
							}),
							placeholder: i18nT("apps.crewCompanion.color.promptName"),
							"aria-label": i18nT("apps.crewCompanion.color.promptName"),
							autoFocus: true,
							style: {
								padding: "5px 10px",
								borderRadius: 6,
								border: "1px solid var(--border)",
								background: "var(--cc-input-bg)",
								color: "var(--text)",
								fontSize: 12,
								width: 140,
								outline: "none"
							}
						}),
						/* @__PURE__ */ jsx("button", {
							style: CS.btn,
							onClick: handleSaveAsPreset,
							disabled: !saveNameInput.trim(),
							"aria-label": i18nT("apps.crewCompanion.color.savePreset"),
							children: /* @__PURE__ */ jsx(Check, {
								className: "lucide-inline",
								"aria-hidden": "true"
							})
						}),
						/* @__PURE__ */ jsx("button", {
							style: CS.btn,
							onClick: () => {
								setSaveNameInput("");
								closeSaveForm();
							},
							"aria-label": i18nT("apps.crewCompanion.gallery.cancel"),
							children: /* @__PURE__ */ jsx(X, {
								className: "lucide-inline",
								"aria-hidden": "true"
							})
						})
					]
				})]
			})
		]
	});
};
// src/host/splitOnPlaceholder.ts
/**
* Split a translated sentence on a placeholder so a component can go in its place.
*
* Returns the literal pieces with `null` marking where the placeholder was.
*
* This exists because splitting prose across TWO keys is the wrong shape: the halves
* each end mid-sentence, and a translator cannot reorder across keys — plenty of
* languages need the embedded link somewhere other than where English puts it. One key
* holding the whole sentence keeps it translatable and reorderable.
*/
function splitOnPlaceholder(text, name) {
	const token = `{{${name}}}`;
	const at = text.indexOf(token);
	if (at === -1) return [text];
	return [
		text.slice(0, at),
		null,
		text.slice(at + token.length)
	].filter((part) => part !== "");
}
// src/GalleryPanel.tsx
/**
* CrewCompanion - Gallery Panel
*
* Full gallery UI for browsing, previewing, and managing appearance packs.
* Renders as the root component of the Gallery BrowserWindow.
*
* Tasks 11.1–11.6:
* - Pack grid with cards (thumbnail, name, author, type badge, active highlight)
* - Card click expands detail panel (animation thumbnails grid + state labels)
* - Apply / Export buttons
* - Custom pack Edit / Delete buttons
* - Import Pack button (from .kiropack.zip)
* - Listens to gallery:active-changed and gallery:packs-changed broadcasts
*/
var api = galleryApi;
/**
* The built-in pack's id, canonical in the backend (appearances.py `DEFAULT_PACK`)
* and in PetAvatar. This file previously used a stale `'default-kiro'` literal that
* matches no real pack, which both broke the built-in's active-highlight/colour
* wiring and made `appearances/detail?id=default-kiro` 400 (no such pack).
*/
var DEFAULT_PACK = "kiro-ghost";
injectCss("gallery", gallery_default);
var S = {
	root: {
		width: "100%",
		height: "100%",
		borderRadius: PANEL_RADIUS.card,
		overflow: "hidden",
		boxShadow: "var(--cc-card-shadow)",
		background: "var(--bg)",
		color: "var(--text)",
		display: "flex",
		flexDirection: "column",
		fontFamily: PANEL_FONT
	},
	header: {
		display: "flex",
		alignItems: "center",
		gap: 10,
		padding: "13px 14px 12px 18px",
		...DRAG_REGION,
		userSelect: "none",
		borderBottom: "1px solid var(--border)",
		/**
		* Transparent, not `--header-bg`. With the title bar hidden the header IS the top
		* edge, so it should read as part of the page. It also removes a real risk: the
		* app's `--header-bg` resolves to `var(--chrome, #211d25)`, and that dark literal
		* would paint a dark strip across a light theme if the dashboard does not define
		* `--chrome`. The bottom border still separates it from the grid.
		*/
		background: "transparent",
		flexShrink: 0
	},
	title: {
		fontSize: 15,
		fontWeight: 600,
		flex: 1
	},
	/**
	* The window's own ✕. Named distinctly from `closeBtn` below, which is the detail
	* panel's — an earlier version of this reused that name and, being an object
	* literal, the later key silently won and dropped the `no-drag` needed to keep
	* this button clickable inside the header's drag region.
	*/
	windowCloseBtn: {
		...NO_DRAG_REGION,
		width: 28,
		height: 28,
		borderRadius: "50%",
		display: "inline-flex",
		alignItems: "center",
		justifyContent: "center",
		border: "none",
		background: "transparent",
		color: "var(--text-muted)",
		fontSize: 14,
		lineHeight: 1,
		cursor: "pointer",
		flexShrink: 0
	},
	headerBtn: {
		...NO_DRAG_REGION,
		padding: "6px 14px",
		borderRadius: PANEL_RADIUS.pill,
		border: "1px solid var(--border)",
		background: "var(--cc-input-bg)",
		color: "var(--text)",
		cursor: "pointer",
		fontSize: 12,
		whiteSpace: "nowrap",
		transition: "background 150ms"
	},
	headerBtnAccent: {
		...NO_DRAG_REGION,
		padding: "6px 14px",
		borderRadius: PANEL_RADIUS.pill,
		border: "none",
		background: "var(--accent)",
		color: "var(--cc-accent-text)",
		cursor: "pointer",
		fontSize: 12,
		fontWeight: 600,
		whiteSpace: "nowrap",
		transition: "opacity 150ms"
	},
	body: {
		flex: 1,
		overflowY: "auto",
		padding: 20
	},
	grid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
		gap: 14
	},
	card: (isActive, isSelected) => ({
		background: "var(--bg-elevated)",
		borderRadius: PANEL_RADIUS.card,
		border: isActive ? "2px solid var(--accent)" : isSelected ? "2px solid var(--border-focus)" : "1px solid var(--border)",
		padding: isActive || isSelected ? 11 : 12,
		cursor: "pointer",
		transition: "border-color 150ms, box-shadow 150ms",
		boxShadow: isActive ? "0 0 12px var(--accent-glow)" : "none",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: 8
	}),
	cardSelect: (isActive, isSelected) => ({
		width: "100%",
		flexGrow: 1,
		padding: isActive || isSelected ? 11 : 12,
		border: "none",
		borderRadius: PANEL_RADIUS.card - (isActive || isSelected ? 2 : 1),
		background: "none",
		color: "inherit",
		font: "inherit",
		cursor: "pointer",
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: 8
	}),
	thumbnail: {
		width: 80,
		height: 80,
		objectFit: "contain",
		borderRadius: PANEL_RADIUS.thumb,
		background: "var(--cc-input-bg)"
	},
	cardName: {
		fontSize: 13,
		fontWeight: 600,
		textAlign: "center",
		lineHeight: 1.3
	},
	cardAuthor: {
		fontSize: 11,
		color: "var(--text-muted)",
		textAlign: "center"
	},
	badge: (type) => ({
		fontSize: 10,
		padding: "2px 8px",
		borderRadius: PANEL_RADIUS.pill,
		background: type === "built-in" ? "var(--accent)" : "var(--cc-input-bg)",
		color: type === "built-in" ? "var(--cc-accent-text)" : "var(--text-muted)",
		border: type === "built-in" ? "none" : "1px solid var(--border)",
		fontWeight: 600
	}),
	activeBadge: {
		fontSize: 10,
		padding: "2px 8px",
		borderRadius: PANEL_RADIUS.pill,
		background: "var(--success)",
		color: "var(--cc-accent-text)",
		fontWeight: 600,
		marginLeft: 6
	},
	modal: {
		background: "var(--bg)",
		borderRadius: PANEL_RADIUS.card,
		border: "1px solid var(--border)",
		width: "90%",
		maxWidth: 420,
		boxShadow: "var(--cc-modal-shadow)",
		overflow: "hidden"
	},
	/**
	* The editor is a modal like the import dialog, but nearly card-sized: it holds a
	* form plus several slot grids, so it fills the card and scrolls internally rather
	* than being centred at dialog width.
	*/
	editorModal: {
		background: "var(--bg)",
		borderRadius: PANEL_RADIUS.card,
		border: "1px solid var(--border)",
		width: "100%",
		height: "100%",
		display: "flex",
		flexDirection: "column",
		overflow: "hidden"
	},
	modalHeader: {
		display: "flex",
		alignItems: "center",
		padding: "12px 16px",
		borderBottom: "1px solid var(--border)"
	},
	/**
	* Dim layer for the detail / import dialogs.
	*
	* Inset by GALLERY_PAD rather than `inset: 0`: the window is frameless and
	* transparent, and that pad is the gutter the card's shadow occupies. A
	* viewport-anchored overlay painted straight across it, so the dim appeared to
	* spill outside the window and squared off the card's rounded corners. Matching
	* the card's radius keeps it inside the same silhouette.
	*/
	detailOverlay: {
		position: "fixed",
		inset: 24,
		borderRadius: PANEL_RADIUS.card,
		background: "rgba(0,0,0,0.5)",
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		zIndex: 100
	},
	detailPanel: {
		background: "var(--bg)",
		borderRadius: 16,
		border: "1px solid var(--border)",
		width: "90%",
		maxWidth: 680,
		maxHeight: "85vh",
		overflowY: "auto",
		padding: 24,
		boxShadow: "0 8px 32px var(--shadow)"
	},
	detailHeader: {
		display: "flex",
		alignItems: "center",
		gap: 12,
		marginBottom: 20
	},
	detailTitle: {
		fontSize: 16,
		fontWeight: 600,
		flex: 1
	},
	closeBtn: {
		background: "none",
		border: "none",
		color: "var(--text-muted)",
		cursor: "pointer",
		fontSize: 20,
		padding: "4px 8px",
		borderRadius: 6,
		lineHeight: 1
	},
	animGrid: {
		display: "grid",
		gridTemplateColumns: "repeat(auto-fill, minmax(90px, 1fr))",
		gap: 10,
		marginBottom: 20
	},
	animCell: {
		display: "flex",
		flexDirection: "column",
		alignItems: "center",
		gap: 4
	},
	animThumb: {
		width: 64,
		height: 64,
		objectFit: "contain",
		borderRadius: 8,
		background: "var(--cc-input-bg)",
		border: "1px solid var(--border)"
	},
	animLabel: {
		fontSize: 10,
		color: "var(--text-muted)",
		textAlign: "center"
	},
	sectionLabel: {
		fontSize: 11,
		color: "var(--text-muted)",
		textTransform: "uppercase",
		letterSpacing: 1,
		marginBottom: 8,
		marginTop: 16
	},
	btnRow: {
		display: "flex",
		gap: 8,
		marginTop: 16,
		flexWrap: "wrap"
	},
	actionBtn: {
		padding: "8px 18px",
		borderRadius: 8,
		border: "1px solid var(--border)",
		background: "var(--cc-input-bg)",
		color: "var(--text)",
		cursor: "pointer",
		fontSize: 12,
		transition: "background 150ms"
	},
	applyBtn: {
		padding: "8px 18px",
		borderRadius: 8,
		border: "none",
		background: "var(--accent)",
		color: "var(--cc-accent-text)",
		cursor: "pointer",
		fontSize: 12,
		fontWeight: 600,
		transition: "opacity 150ms"
	},
	dangerBtn: {
		padding: "8px 18px",
		borderRadius: 8,
		border: "1px solid var(--danger)",
		background: "transparent",
		color: "var(--danger)",
		cursor: "pointer",
		fontSize: 12,
		transition: "background 150ms"
	},
	loading: {
		display: "flex",
		alignItems: "center",
		justifyContent: "center",
		height: "100%",
		color: "var(--text-muted)",
		fontSize: 13
	},
	error: {
		padding: "12px 16px",
		borderRadius: 8,
		background: "rgba(239,83,80,0.1)",
		border: "1px solid rgba(239,83,80,0.3)",
		color: "var(--danger)",
		fontSize: 12,
		marginBottom: 16
	}
};
function AnimThumbnail({ content, format, size = 64, spriteConfig, colorMap, eyePose }) {
	if (format === "svg" && content) {
		const processed = colorMap && Object.keys(colorMap).length > 0 ? applySvgColorMap(content, colorMap) : content;
		const img = /* @__PURE__ */ jsx("img", {
			src: toDataUri(processed),
			alt: "",
			style: {
				...S.animThumb,
				width: size,
				height: size
			}
		});
		if (!eyePose) return img;
		return /* @__PURE__ */ jsxs("div", {
			style: {
				position: "relative",
				width: size,
				height: size,
				flexShrink: 0
			},
			children: [img, /* @__PURE__ */ jsx(GhostEyeOverlay, {
				pose: eyePose,
				size
			})]
		});
	}
	if (format === "lottie" && content) return /* @__PURE__ */ jsx("div", {
		style: {
			...S.animThumb,
			width: size,
			height: size,
			overflow: "hidden"
		},
		children: /* @__PURE__ */ jsx(LottieRenderer, {
			animationData: content,
			width: size,
			height: size
		})
	});
	if (format === "sprite" && content) {
		const src = content.startsWith("data:") ? content : `data:image/png;base64,${content}`;
		const fw = spriteConfig?.frameWidth || 32;
		const fh = spriteConfig?.frameHeight || 32;
		return /* @__PURE__ */ jsx("div", {
			style: {
				...S.animThumb,
				width: size,
				height: size,
				overflow: "hidden",
				imageRendering: "pixelated",
				transform: spriteConfig?.flipX ? "scaleX(-1)" : "none"
			},
			children: /* @__PURE__ */ jsx(SpriteRenderer, {
				src,
				frameWidth: fw,
				frameHeight: fh,
				fps: spriteConfig?.fps || 6,
				displaySize: size
			})
		});
	}
	return /* @__PURE__ */ jsx("div", {
		style: {
			...S.animThumb,
			width: size,
			height: size,
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			fontSize: size * .35,
			color: "var(--text-faint)"
		},
		children: /* @__PURE__ */ jsx(Plus, {
			size: 20,
			"aria-hidden": "true"
		})
	});
}
/**
* The built-in "Kiro" pack's card art.
*
* The built-in ghost is NOT a file the backend can serve — its body is bundled with
* the frontend and its detail payload comes back with empty `animations`, so the
* generic thumbnail path had nothing to draw and fell back to a placeholder. This
* renders the bundled body exactly the way PetAvatar does: the same `kiro_idle.svg`
* asset, the user's colour map applied to its text when present, and the eyes drawn
* as a separate overlay (the body is deliberately eyeless). That keeps the gallery
* card and the live companion in lock-step.
*/
function BuiltinThumbnail({ size, colorMap }) {
	const [recolouredUri, setRecolouredUri] = useState(null);
	useEffect(() => {
		if (!colorMap || Object.keys(colorMap).length === 0) {
			setRecolouredUri(null);
			return;
		}
		let alive = true;
		fetch(kiro_idle_default).then((r) => r.text()).then((raw) => {
			if (alive) setRecolouredUri(toDataUri(applySvgColorMap(raw, colorMap)));
		}).catch(() => {});
		return () => {
			alive = false;
		};
	}, [colorMap]);
	return /* @__PURE__ */ jsxs("div", {
		style: {
			position: "relative",
			width: size,
			height: size,
			flexShrink: 0
		},
		children: [/* @__PURE__ */ jsx("img", {
			src: recolouredUri ?? "data:image/svg+xml,%3csvg%20xmlns='http://www.w3.org/2000/svg'%20viewBox='-70%20-70%20560.977%20652.0'%20width='200'%20height='232'%3e%3cpath%20d='M80.9346%20396.832C27.9757%20514.11%20140.773%20543.55%20223.972%20474.911C248.451%20551.87%20340.13%20494.431%20373.089%20434.752C445.568%20303.234%20416.288%20169.157%20408.768%20141.477C357.249%20-47.159%2099.6543%20-47.479%2055.3351%20142.437C44.9353%20175.717%2044.7753%20213.476%2039.0154%20252.675C36.1355%20272.515%2033.8955%20285.155%2026.3757%20305.954C21.8958%20317.954%2015.9759%20328.514%206.37606%20346.433C-8.34365%20374.273%20-2.10377%20427.872%2074.0548%20400.032L81.2546%20396.832H80.9346Z'%20fill='%23FFFFFF'%20stroke='%23000000'%20stroke-width='18'%20stroke-linejoin='round'/%3e%3c/svg%3e",
			alt: "",
			style: {
				...S.thumbnail,
				width: size,
				height: size
			}
		}), /* @__PURE__ */ jsx(GhostEyeOverlay, {
			pose: "primary",
			size
		})]
	});
}
function PackCard({ pack, isActive, isSelected, onClick, onManage, thumbnailContent, spriteConfig, colorMap }) {
	return /* @__PURE__ */ jsxs("div", {
		style: {
			...S.card(isActive, isSelected),
			padding: 0,
			position: "relative"
		},
		children: [/* @__PURE__ */ jsxs("button", {
			type: "button",
			"aria-pressed": isActive,
			onClick,
			title: isActive ? void 0 : i18nT("apps.crewCompanion.gallery.useNamed", { name: pack.name }),
			style: S.cardSelect(isActive, isSelected),
			children: [
				pack.id === DEFAULT_PACK ? /* @__PURE__ */ jsx(BuiltinThumbnail, {
					size: 80,
					colorMap
				}) : thumbnailContent ? /* @__PURE__ */ jsx(AnimThumbnail, {
					content: thumbnailContent,
					format: entryFormat(pack),
					size: 80,
					spriteConfig
				}) : /* @__PURE__ */ jsx("span", { style: {
					...S.thumbnail,
					display: "block"
				} }),
				/* @__PURE__ */ jsx("span", {
					style: S.cardName,
					children: pack.name
				}),
				/* @__PURE__ */ jsx("span", {
					style: S.cardAuthor,
					children: pack.author
				}),
				/* @__PURE__ */ jsx("span", {
					style: {
						display: "flex",
						alignItems: "center",
						gap: 4,
						minHeight: 20
					},
					children: isActive ? /* @__PURE__ */ jsx("span", {
						style: S.activeBadge,
						children: i18nT("apps.crewCompanion.gallery.active")
					}) : /* @__PURE__ */ jsx("span", {
						style: {
							fontSize: 11,
							color: "var(--text-muted)"
						},
						children: i18nT("apps.crewCompanion.gallery.tapToUse")
					})
				})
			]
		}), onManage && /* @__PURE__ */ jsx("button", {
			type: "button",
			onClick: onManage,
			title: i18nT("apps.crewCompanion.gallery.manage"),
			"aria-label": i18nT("apps.crewCompanion.gallery.manage"),
			style: {
				position: "absolute",
				top: 6,
				right: 6,
				width: 22,
				height: 22,
				lineHeight: "20px",
				borderRadius: 6,
				border: "1px solid var(--border)",
				background: "var(--cc-input-bg)",
				color: "var(--text-muted)",
				cursor: "pointer",
				fontSize: 13,
				padding: 0
			},
			children: /* @__PURE__ */ jsx(MoreHorizontal, {
				size: 13,
				className: "lucide-inline",
				"aria-hidden": "true"
			})
		})]
	});
}
function ImportPetDialog({ input, onInput, resolving, resolved, importing, error, onConfirm, onClose, onBrowse }) {
	const ime = useImeGuard();
	const titleId = useId();
	const dialogRef = useRef(null);
	const inputRef = useRef(null);
	useDialogFocusTrap(dialogRef, onClose, { handleEscape: false });
	useEffect(() => {
		inputRef.current?.focus({ preventScroll: true });
	}, []);
	useEffect(() => {
		const onKey = (e) => {
			if (e.key === "Escape") onClose();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, [onClose]);
	return /* @__PURE__ */ jsx("div", {
		role: "presentation",
		style: S.detailOverlay,
		onClick: onClose,
		children: /* @__PURE__ */ jsxs("div", {
			ref: dialogRef,
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": titleId,
			style: S.modal,
			onClick: (e) => e.stopPropagation(),
			children: [/* @__PURE__ */ jsxs("div", {
				style: S.modalHeader,
				children: [/* @__PURE__ */ jsx("span", {
					id: titleId,
					style: {
						fontSize: 13,
						fontWeight: 600,
						flex: 1
					},
					children: i18nT("apps.crewCompanion.gallery.importPet")
				}), /* @__PURE__ */ jsx("button", {
					onClick: onClose,
					"aria-label": i18nT("apps.crewCompanion.gallery.close"),
					style: {
						background: "none",
						border: "none",
						color: "var(--text-muted)",
						cursor: "pointer",
						fontSize: 15,
						padding: 0
					},
					children: /* @__PURE__ */ jsx(X, {
						className: "lucide-inline",
						"aria-hidden": "true"
					})
				})]
			}), /* @__PURE__ */ jsxs("div", {
				style: { padding: 16 },
				children: [
					/* @__PURE__ */ jsx("div", {
						style: {
							fontSize: 12,
							color: "var(--text-muted)",
							lineHeight: 1.5,
							marginBottom: 12
						},
						children: splitOnPlaceholder(i18nT("apps.crewCompanion.gallery.petdexIntro"), "link").map((part, i) => part === null ? /* @__PURE__ */ jsx("button", {
							type: "button",
							onClick: onBrowse,
							style: {
								display: "inline",
								padding: 0,
								border: "none",
								background: "none",
								font: "inherit",
								color: "var(--accent)",
								cursor: "pointer",
								textDecoration: "underline"
							},
							children: i18nT("apps.crewCompanion.gallery.petdexLinkLabel")
						}, "link") : /* @__PURE__ */ jsx("span", { children: part }, i))
					}),
					/* @__PURE__ */ jsx("input", {
						ref: inputRef,
						value: input,
						onChange: (e) => onInput(e.target.value),
						...ime.bindEnter({ onEnter: () => {
							if (resolved) onConfirm();
						} }),
						placeholder: i18nT("apps.crewCompanion.gallery.petdexPlaceholder"),
						"aria-label": i18nT("apps.crewCompanion.gallery.petdexPlaceholder"),
						readOnly: importing,
						"aria-disabled": importing || void 0,
						style: {
							width: "100%",
							boxSizing: "border-box",
							background: "var(--cc-input-bg)",
							border: `1px solid ${error ? "var(--danger)" : "var(--border)"}`,
							borderRadius: 8,
							color: "var(--text)",
							fontSize: 12,
							padding: "9px 11px",
							outline: "none"
						}
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							minHeight: 58,
							marginTop: 10
						},
						children: [
							resolving && /* @__PURE__ */ jsx("div", {
								style: {
									fontSize: 11,
									color: "var(--text-muted)"
								},
								children: i18nT("apps.crewCompanion.gallery.lookingUp")
							}),
							!resolving && error && /* @__PURE__ */ jsx("div", {
								style: {
									fontSize: 11,
									color: "var(--danger)"
								},
								children: error
							}),
							!resolving && !error && resolved && /* @__PURE__ */ jsxs("div", {
								style: {
									border: "1px solid var(--border)",
									borderRadius: 10,
									padding: 10,
									display: "flex",
									alignItems: "center",
									gap: 10,
									background: "var(--cc-input-bg)"
								},
								children: [resolved.preview ? /* @__PURE__ */ jsx("img", {
									src: resolved.preview,
									alt: "",
									style: {
										width: 44,
										height: 44,
										objectFit: "contain",
										imageRendering: "pixelated",
										borderRadius: 8,
										background: "var(--bg)"
									}
								}) : /* @__PURE__ */ jsx("div", { style: {
									width: 44,
									height: 44,
									borderRadius: 8,
									background: "var(--bg)"
								} }), /* @__PURE__ */ jsxs("div", {
									style: {
										flex: 1,
										minWidth: 0
									},
									children: [/* @__PURE__ */ jsx("div", {
										style: {
											fontSize: 12,
											fontWeight: 600
										},
										children: resolved.displayName
									}), /* @__PURE__ */ jsx("div", {
										style: {
											fontSize: 10,
											color: "var(--text-muted)",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap"
										},
										children: i18nT("apps.crewCompanion.gallery.foundBy", { author: resolved.author })
									})]
								})]
							})
						]
					}),
					/* @__PURE__ */ jsxs("div", {
						style: {
							display: "flex",
							alignItems: "center",
							gap: 8,
							marginTop: 4
						},
						children: [
							/* @__PURE__ */ jsx("span", {
								style: {
									flex: 1,
									fontSize: 10,
									color: "var(--text-faint)"
								},
								children: i18nT("apps.crewCompanion.gallery.fanArt")
							}),
							/* @__PURE__ */ jsx("button", {
								style: S.headerBtn,
								onClick: onClose,
								children: i18nT("apps.crewCompanion.gallery.cancel")
							}),
							/* @__PURE__ */ jsx("button", {
								style: {
									...S.headerBtnAccent,
									opacity: !resolved || importing ? .5 : 1,
									cursor: !resolved || importing ? "default" : "pointer"
								},
								disabled: !resolved,
								"aria-disabled": importing || void 0,
								onClick: onConfirm,
								children: importing ? i18nT("apps.crewCompanion.gallery.adding") : i18nT("apps.crewCompanion.gallery.usePet")
							})
						]
					})
				]
			})]
		})
	});
}
function DetailPanel({ detail, isActive, onClose, onApply, onExport, onEdit, onDelete, colorMap }) {
	const { meta, animations } = detail;
	const sc = detail.sprite;
	const [showColorCustomizer, setShowColorCustomizer] = useState(false);
	const titleId = useId();
	const dialogRef = useRef(null);
	useDialogFocusTrap(dialogRef, onClose, { handleEscape: false });
	const isDefaultKiro = meta.id === DEFAULT_PACK;
	const thumbColorMap = isDefaultKiro ? colorMap : null;
	const [accessory, setAccessory] = useState("none");
	useEffect(() => {
		if (!isDefaultKiro) return;
		api?.getCrewCompanionConfig?.().then((c) => {
			const worn = c?.kiro?.accessory;
			if (typeof worn === "string") setAccessory(worn);
		}).catch(() => {});
	}, [isDefaultKiro]);
	const stateEntries = REQUIRED_STATES.map((s) => ({
		key: s,
		label: slotLabel(s),
		anim: animations[s],
		required: true
	}));
	const label = (k) => slotLabel(k);
	const statusEntries = STATUS_STATES.filter((s) => animations[s]).map((s) => ({
		key: s,
		label: label(s),
		anim: animations[s],
		required: false
	}));
	const randomEntries = [...RANDOM_STATES, ...ALL_MOODS].filter((s) => animations[s]).map((s) => ({
		key: s,
		label: label(s),
		anim: animations[s],
		required: false
	}));
	const legacyEntries = LEGACY_STATES.filter((s) => animations[s]).map((s) => ({
		key: s,
		label: label(s),
		anim: animations[s],
		required: false
	}));
	return /* @__PURE__ */ jsx("div", {
		role: "presentation",
		style: S.detailOverlay,
		onClick: onClose,
		children: /* @__PURE__ */ jsxs("div", {
			ref: dialogRef,
			role: "dialog",
			"aria-modal": "true",
			"aria-labelledby": titleId,
			style: S.detailPanel,
			onClick: (e) => e.stopPropagation(),
			children: [
				/* @__PURE__ */ jsxs("div", {
					style: S.detailHeader,
					children: [
						/* @__PURE__ */ jsxs("div", {
							style: { flex: 1 },
							children: [
								/* @__PURE__ */ jsx("div", {
									id: titleId,
									style: S.detailTitle,
									children: meta.name
								}),
								/* @__PURE__ */ jsxs("div", {
									style: {
										fontSize: 12,
										color: "var(--text-muted)",
										marginTop: 2
									},
									children: [
										meta.author,
										" · ",
										entryFormat(meta).toUpperCase()
									]
								}),
								meta.description && /* @__PURE__ */ jsx("div", {
									style: {
										fontSize: 12,
										color: "var(--text-muted)",
										marginTop: 4,
										fontStyle: "italic"
									},
									children: meta.description
								})
							]
						}),
						/* @__PURE__ */ jsx("span", {
							style: S.badge(meta.type),
							children: meta.type === "built-in" ? i18nT("apps.crewCompanion.gallery.builtIn") : i18nT("apps.crewCompanion.gallery.custom")
						}),
						isActive && /* @__PURE__ */ jsx("span", {
							style: S.activeBadge,
							children: i18nT("apps.crewCompanion.gallery.active")
						}),
						/* @__PURE__ */ jsx("button", {
							style: S.closeBtn,
							onClick: onClose,
							"aria-label": i18nT("apps.crewCompanion.gallery.close"),
							children: /* @__PURE__ */ jsx(X, {
								className: "lucide-inline",
								"aria-hidden": "true"
							})
						})
					]
				}),
				isDefaultKiro && /* @__PURE__ */ jsxs("button", {
					onClick: () => setShowColorCustomizer(!showColorCustomizer),
					style: {
						display: "flex",
						alignItems: "center",
						gap: 6,
						margin: "0 0 12px",
						padding: "6px 14px",
						borderRadius: 20,
						border: showColorCustomizer ? "1px solid var(--accent)" : "1px solid var(--border)",
						background: showColorCustomizer ? "var(--accent-glow)" : "var(--cc-input-bg)",
						color: showColorCustomizer ? "var(--accent)" : "var(--text)",
						cursor: "pointer",
						fontSize: 12,
						fontWeight: 500,
						transition: "all 200ms ease"
					},
					children: [/* @__PURE__ */ jsx("span", {
						style: {
							transition: "transform 200ms",
							transform: showColorCustomizer ? "rotate(180deg)" : "none",
							display: "inline-flex"
						},
						children: /* @__PURE__ */ jsx(ChevronDown, {
							size: 13,
							className: "lucide-inline",
							"aria-hidden": "true"
						})
					}), showColorCustomizer ? i18nT("apps.crewCompanion.color.hideBtn") : i18nT("apps.crewCompanion.color.customizeBtn")]
				}),
				isDefaultKiro && animations.idle && /* @__PURE__ */ jsx("div", {
					style: {
						maxHeight: showColorCustomizer ? 2e3 : 0,
						opacity: showColorCustomizer ? 1 : 0,
						overflow: "hidden",
						transition: "max-height 350ms ease, opacity 250ms ease"
					},
					children: /* @__PURE__ */ jsx(ColorCustomizerPanel, { idleSvgContent: entryContent(animations.idle) })
				}),
				isDefaultKiro && /* @__PURE__ */ jsxs(Fragment, { children: [/* @__PURE__ */ jsx("div", {
					style: S.sectionLabel,
					children: i18nT("apps.crewCompanion.gallery.dressUp")
				}), /* @__PURE__ */ jsx("div", {
					style: {
						display: "flex",
						flexWrap: "wrap",
						gap: 8,
						marginBottom: 14
					},
					children: GHOST_ACCESSORIES.map((acc) => {
						const active = accessory === acc.id;
						return /* @__PURE__ */ jsx("button", {
							onClick: () => {
								setAccessory(acc.id);
								api?.updateConfig?.({ kiro: { accessory: acc.id } });
							},
							style: {
								font: "600 12px -apple-system, BlinkMacSystemFont, sans-serif",
								padding: "6px 12px",
								borderRadius: 8,
								cursor: "pointer",
								border: `1.5px solid ${active ? "var(--accent)" : "var(--border)"}`,
								background: active ? "var(--accent-subtle, var(--bg-hover))" : "transparent",
								color: "var(--text)"
							},
							children: i18nT(acc.labelKey)
						}, acc.id);
					})
				})] }),
				/* @__PURE__ */ jsx("div", {
					style: S.sectionLabel,
					children: i18nT("apps.crewCompanion.gallery.states")
				}),
				/* @__PURE__ */ jsx("div", {
					style: S.animGrid,
					children: stateEntries.map(({ key, label, anim }) => /* @__PURE__ */ jsxs("div", {
						style: S.animCell,
						children: [anim ? /* @__PURE__ */ jsx(AnimThumbnail, {
							content: entryContent(anim),
							format: entryFormat(anim),
							spriteConfig: sc,
							colorMap: thumbColorMap,
							eyePose: isDefaultKiro ? ghostPoseForKey(key) : void 0
						}) : /* @__PURE__ */ jsx("div", {
							style: {
								...S.animThumb,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "var(--text-faint)",
								fontSize: 11
							},
							children: "—"
						}), /* @__PURE__ */ jsx("div", {
							style: S.animLabel,
							children: label
						})]
					}, key))
				}),
				[
					[i18nT("apps.crewCompanion.state.groupStatus"), statusEntries],
					[i18nT("apps.crewCompanion.state.groupRandom"), randomEntries],
					[i18nT("apps.crewCompanion.state.groupLegacy"), legacyEntries]
				].filter(([, entries]) => entries.length > 0).map(([title, entries]) => /* @__PURE__ */ jsxs(React.Fragment, { children: [/* @__PURE__ */ jsx("div", {
					style: S.sectionLabel,
					children: title
				}), /* @__PURE__ */ jsx("div", {
					style: S.animGrid,
					children: entries.map(({ key, label, anim }) => /* @__PURE__ */ jsxs("div", {
						style: S.animCell,
						children: [anim ? /* @__PURE__ */ jsx(AnimThumbnail, {
							content: entryContent(anim),
							format: entryFormat(anim),
							spriteConfig: sc,
							colorMap: thumbColorMap,
							eyePose: isDefaultKiro ? ghostPoseForKey(key) : void 0
						}) : /* @__PURE__ */ jsx("div", {
							style: {
								...S.animThumb,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								color: "var(--text-faint)",
								fontSize: 11
							},
							children: "—"
						}), /* @__PURE__ */ jsx("div", {
							style: S.animLabel,
							children: label
						})]
					}, key))
				})] }, title)),
				/* @__PURE__ */ jsxs("div", {
					style: S.btnRow,
					children: [!isActive && /* @__PURE__ */ jsx("button", {
						style: S.applyBtn,
						onClick: onApply,
						children: i18nT("apps.crewCompanion.gallery.apply")
					}), meta.type === "custom" && /* @__PURE__ */ jsxs(Fragment, { children: [
						/* @__PURE__ */ jsx("button", {
							style: S.actionBtn,
							onClick: onExport,
							children: i18nT("apps.crewCompanion.gallery.export")
						}),
						/* @__PURE__ */ jsx("button", {
							style: S.actionBtn,
							onClick: onEdit,
							children: i18nT("apps.crewCompanion.gallery.edit")
						}),
						/* @__PURE__ */ jsx("button", {
							style: S.dangerBtn,
							onClick: onDelete,
							children: i18nT("apps.crewCompanion.gallery.delete")
						})
					] })]
				})
			]
		})
	});
}
/**
* The avatar gallery — its own window (renderer/galleryEntry.tsx).
*
* It was briefly embedded inside Settings. Reverted: picking an avatar is a
* preference, but importing and authoring packs are creation flows, and squeezing a
* multi-step editor into a 420px preferences column meant shrinking the list and
* floating the editor over the panel. The window is 800px because that's what these
* tools need.
*/
var GalleryPanel = () => {
	const { confirm: askConfirm, confirmDialog } = useInlineStyledConfirm();
	const [packs, setPacks] = useState([]);
	const [activePackId, setActivePackIdState] = useState("");
	const activePackIdRef = useRef(activePackId);
	const setActivePackId = useCallback((packId) => {
		activePackIdRef.current = packId;
		setActivePackIdState(packId);
	}, []);
	const [selectedPackId, setSelectedPackId] = useState(null);
	const [detail, setDetail] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [petdexInput, setPetdexInput] = useState("");
	const [importing, setImporting] = useState(false);
	const importingRef = useRef(false);
	importingRef.current = importing;
	const [showImport, setShowImport] = useState(false);
	const [resolving, setResolving] = useState(false);
	const [resolved, setResolved] = useState(null);
	const [importError, setImportError] = useState(null);
	const [mode, setMode] = useState("gallery");
	const [editingPack, setEditingPack] = useState(void 0);
	const [lang, setLang] = useState("en");
	const [thumbs, setThumbs] = useState({});
	const [spriteConfigs, setSpriteConfigs] = useState({});
	const [crewCompanionColorMap, setCrewCompanionColorMap] = useState(null);
	const fetchPacks = useCallback(async () => {
		try {
			const list = await api.galleryListPacks();
			setPacks(list);
			const thumbMap = {};
			const scMap = {};
			for (const p of list) try {
				const d = await api.galleryGetPackDetail(p.id);
				if (d?.animations?.idle) thumbMap[p.id] = entryContent(d.animations.idle);
				if (d?.sprite) scMap[p.id] = d.sprite;
			} catch {}
			setThumbs(thumbMap);
			setSpriteConfigs(scMap);
		} catch (err) {
			setError(errorText(err) || i18nT("apps.crewCompanion.gallery.loadPacksFailed"));
		}
	}, []);
	const fetchActiveId = useCallback(async () => {
		try {
			const cfg = await api.getCrewCompanionConfig();
			setActivePackId(cfg?.activeAppearance || DEFAULT_PACK);
			if (typeof cfg?.language === "string") setLang(cfg.language);
			const cm = await api?.presetsGetColorMap?.(DEFAULT_PACK);
			setCrewCompanionColorMap(cm && Object.keys(cm).length > 0 ? cm : null);
		} catch {
			setActivePackId(DEFAULT_PACK);
		}
	}, [setActivePackId]);
	useEffect(() => {
		let cancelled = false;
		(async () => {
			setLoading(true);
			await Promise.all([fetchPacks(), fetchActiveId()]);
			if (!cancelled) setLoading(false);
		})();
		return () => {
			cancelled = true;
		};
	}, [fetchPacks, fetchActiveId]);
	useEffect(() => {
		const offActive = api?.onGalleryActiveChanged?.((data) => {
			if (data?.packId) setActivePackId(data.packId);
			else fetchActiveId();
		});
		const offPacks = api?.onGalleryPacksChanged?.(() => {
			fetchPacks();
		});
		const offColor = api.onColorMapChanged?.((data) => {
			if (data.packId === DEFAULT_PACK) setCrewCompanionColorMap(data.colorMap && Object.keys(data.colorMap).length > 0 ? data.colorMap : null);
		});
		const offConfig = api.onConfigUpdated?.((kiro) => {
			if (kiro?.language && kiro.language !== lang) setLang(kiro.language);
		});
		return () => {
			offActive?.();
			offPacks?.();
			offColor?.();
			offConfig?.();
		};
	}, [
		fetchActiveId,
		fetchPacks,
		lang,
		setActivePackId
	]);
	const handleCardClick = useCallback(async (packId) => {
		if (selectedPackId === packId) {
			setSelectedPackId(null);
			setDetail(null);
			return;
		}
		setSelectedPackId(packId);
		setError(null);
		try {
			const d = await api.galleryGetPackDetail(packId);
			if (!d) {
				setDetail(null);
				return;
			}
			setDetail({
				meta: d.meta,
				animations: d.animations ?? {},
				sprite: d.sprite
			});
		} catch (err) {
			setError(errorText(err) || i18nT("apps.crewCompanion.gallery.loadDetailFailed"));
			setDetail(null);
		}
	}, [selectedPackId]);
	const handleApply = useCallback(async () => {
		if (!detail) return;
		try {
			const result = await api.gallerySetActive(detail.meta.id);
			if (result && !result.ok) {
				setError(result.error || i18nT("apps.crewCompanion.gallery.applyFailed"));
				return;
			}
			setActivePackId(detail.meta.id);
		} catch (err) {
			setError(errorText(err) || i18nT("apps.crewCompanion.gallery.applyFailed"));
		}
	}, [detail, setActivePackId]);
	const [toast, setToast] = useState(null);
	const [toastFading, setToastFading] = useState(false);
	const [spriteSaveError, setSpriteSaveError] = useState(null);
	const showToast = (msg) => {
		setToast(msg);
		setToastFading(false);
		setTimeout(() => setToastFading(true), 2e3);
		setTimeout(() => {
			setToast(null);
			setToastFading(false);
		}, 2500);
	};
	const handleExport = useCallback(async () => {
		if (!detail) return;
		try {
			const result = await api.galleryExport(detail.meta.id);
			if (!result) return;
			if (result.ok) showToast(i18nT("apps.crewCompanion.gallery.exportSuccess"));
			else setError(result.error || i18nT("apps.crewCompanion.gallery.exportFailed"));
		} catch (err) {
			setError(errorText(err) || i18nT("apps.crewCompanion.gallery.exportFailed"));
		}
	}, [detail]);
	const handleEdit = useCallback(() => {
		if (!detail) return;
		setEditingPack(detail.meta);
		setSelectedPackId(null);
		setDetail(null);
		setMode(entryFormat(detail.meta) === "sprite" ? "sprite" : "editor");
	}, [detail]);
	const handleDelete = useCallback(async () => {
		if (!detail) return;
		const packId = detail.meta.id;
		if (!await askConfirm({
			title: i18nT("apps.crewCompanion.gallery.deleteConfirm", { name: detail.meta.name }),
			confirmLabel: i18nT("apps.crewCompanion.gallery.delete"),
			backdropInset: 24,
			backdropRadius: PANEL_RADIUS.card
		})) return;
		try {
			if (packId === activePackIdRef.current) {
				if (!(await api.gallerySetActive?.(DEFAULT_PACK))?.ok) {
					setError(i18nT("apps.crewCompanion.gallery.deleteFailed"));
					return;
				}
				setActivePackId(DEFAULT_PACK);
			}
			if (!await api.galleryDelete(packId)) {
				setError(i18nT("apps.crewCompanion.gallery.deleteFailed"));
				return;
			}
			setSelectedPackId(null);
			setDetail(null);
			fetchPacks();
		} catch (err) {
			setError(errorText(err) || i18nT("apps.crewCompanion.gallery.deleteFailed"));
		}
	}, [
		askConfirm,
		detail,
		fetchPacks,
		setActivePackId
	]);
	const handleCreateNew = useCallback(() => {
		setEditingPack(void 0);
		setMode("editor");
	}, []);
	const applyPack = useCallback(async (packId) => {
		if (packId === activePackId) return;
		setError(null);
		try {
			const result = await api.gallerySetActive(packId);
			if (result && !result.ok) {
				setError(result.error || i18nT("apps.crewCompanion.gallery.applyFailed"));
				return;
			}
			setActivePackId(packId);
			showToast(i18nT("apps.crewCompanion.gallery.switched"));
		} catch (err) {
			setError(errorText(err) || i18nT("apps.crewCompanion.gallery.applyFailed"));
		}
	}, [activePackId, setActivePackId]);
	const closeImport = useCallback(() => {
		setShowImport(false);
		setPetdexInput("");
		setResolved(null);
		setImportError(null);
		setResolving(false);
	}, []);
	const resolvePetdex = useCallback(async (raw) => {
		const input = raw.trim();
		setImportError(null);
		setResolved(null);
		if (input.length < 2) return;
		setResolving(true);
		try {
			const res = await api?.petdexFetch?.(input);
			if (!res?.ok) {
				setImportError(res?.error || i18nT("apps.crewCompanion.gallery.petNotFound"));
				return;
			}
			let preview = "";
			try {
				preview = await firstFramePreview(res.spriteBase64);
			} catch {}
			setResolved({
				slug: res.slug,
				displayName: res.displayName,
				author: res.author,
				description: res.description,
				spriteBase64: res.spriteBase64,
				preview
			});
		} catch (err) {
			setImportError(errorText(err) || i18nT("apps.crewCompanion.gallery.lookupFailed"));
		} finally {
			setResolving(false);
		}
	}, []);
	useEffect(() => {
		const onKey = (e) => {
			if (e.key === "Escape" && !e.defaultPrevented) api?.closeGallery?.();
		};
		window.addEventListener("keydown", onKey);
		return () => window.removeEventListener("keydown", onKey);
	}, []);
	useEffect(() => {
		if (!showImport) return;
		const v = petdexInput.trim();
		if (v.length < 2) {
			setResolved(null);
			return;
		}
		const t = setTimeout(() => {
			if (!importingRef.current) resolvePetdex(v);
		}, 450);
		return () => clearTimeout(t);
	}, [
		petdexInput,
		showImport,
		resolvePetdex
	]);
	const confirmImport = useCallback(async () => {
		if (!resolved || importing) return;
		setImporting(true);
		setImportError(null);
		try {
			const data = await buildSpritePackData(resolved.spriteBase64, {
				displayName: resolved.displayName,
				author: resolved.author,
				description: resolved.description
			});
			const save = await api?.gallerySaveSpritePack?.(data);
			if (!save?.ok) {
				setImportError(save?.error || i18nT("apps.crewCompanion.gallery.savePetFailed"));
				return;
			}
			if (save.packId) {
				api?.gallerySetActive?.(save.packId);
				setActivePackId(save.packId);
			}
			showToast(i18nT("apps.crewCompanion.gallery.nowYourPet", { name: resolved.displayName }));
			closeImport();
			fetchPacks();
		} catch (err) {
			setImportError(errorText(err) || i18nT("apps.crewCompanion.gallery.importFailed"));
		} finally {
			setImporting(false);
		}
	}, [
		resolved,
		importing,
		fetchPacks,
		closeImport,
		setActivePackId
	]);
	const closeEditor = () => {
		setMode("gallery");
		setEditingPack(void 0);
	};
	const editorOverlay = mode === "editor" ? /* @__PURE__ */ jsx("div", {
		style: S.detailOverlay,
		children: /* @__PURE__ */ jsx("div", {
			style: S.editorModal,
			children: /* @__PURE__ */ jsx(PackEditor, {
				existingPack: editingPack,
				onSave: () => {
					showToast(i18nT(editingPack ? "apps.crewCompanion.editor.saveSuccess" : "apps.crewCompanion.editor.createSuccess"));
					closeEditor();
					fetchPacks();
				},
				onCancel: closeEditor
			})
		})
	}) : null;
	if (mode === "sprite") return /* @__PURE__ */ jsx(SpriteImporter, {
		existingPack: editingPack,
		onDone: async (result) => {
			const res = await api.gallerySaveSpritePack(result);
			if (res?.ok) {
				showToast(i18nT(editingPack ? "apps.crewCompanion.editor.saveSuccess" : "apps.crewCompanion.editor.createSuccess"));
				const packId = result.overwriteId || res.packId;
				if (packId && packId === activePackId) api?.gallerySetActive?.(packId);
				fetchPacks();
				setSpriteSaveError(null);
				setMode("gallery");
			} else setSpriteSaveError(res?.error || i18nT("apps.crewCompanion.gallery.spritePackFailed"));
		},
		saveError: spriteSaveError,
		onCancel: () => {
			setSpriteSaveError(null);
			setMode("gallery");
		}
	});
	return /* @__PURE__ */ jsxs("div", {
		style: S.root,
		children: [
			/* @__PURE__ */ jsxs("div", {
				style: S.header,
				children: [
					/* @__PURE__ */ jsx("span", {
						style: S.title,
						children: i18nT("apps.crewCompanion.gallery.title")
					}),
					/* @__PURE__ */ jsx("button", {
						style: S.headerBtnAccent,
						onClick: () => {
							setShowImport(true);
							setImportError(null);
						},
						children: i18nT("apps.crewCompanion.gallery.importFromPetdex")
					}),
					/* @__PURE__ */ jsx("button", {
						style: S.headerBtn,
						onClick: handleCreateNew,
						children: i18nT("apps.crewCompanion.gallery.makeYourOwn")
					}),
					/* @__PURE__ */ jsx("button", {
						style: S.windowCloseBtn,
						onClick: () => api?.closeGallery?.(),
						title: i18nT("apps.crewCompanion.gallery.close"),
						"aria-label": i18nT("apps.crewCompanion.gallery.close"),
						children: /* @__PURE__ */ jsx(X, {
							size: 14,
							"aria-hidden": "true"
						})
					})
				]
			}),
			/* @__PURE__ */ jsxs("div", {
				style: S.body,
				children: [
					toast && /* @__PURE__ */ jsx("div", {
						style: {
							padding: "8px 14px",
							borderRadius: 8,
							background: "rgba(76,175,80,0.15)",
							border: "1px solid rgba(76,175,80,0.3)",
							color: "var(--text)",
							fontSize: 12,
							marginBottom: 8,
							animation: toastFading ? "toastOut 0.5s forwards" : "toastIn 0.3s ease-out"
						},
						children: toast
					}),
					error && /* @__PURE__ */ jsxs("div", {
						style: S.error,
						children: [/* @__PURE__ */ jsx("span", { children: error }), /* @__PURE__ */ jsx("button", {
							onClick: () => setError(null),
							style: {
								float: "right",
								background: "none",
								border: "none",
								color: "var(--danger)",
								cursor: "pointer",
								fontSize: 14
							},
							"aria-label": i18nT("apps.crewCompanion.panel.close"),
							children: /* @__PURE__ */ jsx(X, {
								size: 14,
								"aria-hidden": "true"
							})
						})]
					}),
					loading ? /* @__PURE__ */ jsx("div", {
						style: S.loading,
						children: i18nT("apps.crewCompanion.gallery.loading")
					}) : /* @__PURE__ */ jsx("div", {
						style: S.grid,
						children: packs.map((pack) => /* @__PURE__ */ jsx(PackCard, {
							pack,
							isActive: pack.id === activePackId,
							isSelected: pack.id === selectedPackId,
							onClick: () => applyPack(pack.id),
							onManage: pack.type === "custom" ? () => handleCardClick(pack.id) : void 0,
							thumbnailContent: thumbs[pack.id],
							spriteConfig: spriteConfigs[pack.id],
							i18nT,
							colorMap: crewCompanionColorMap
						}, pack.id))
					}),
					!loading && /* @__PURE__ */ jsxs("div", {
						style: {
							marginTop: 18,
							textAlign: "center",
							fontSize: 12,
							color: "var(--text-muted)"
						},
						children: [
							i18nT("apps.crewCompanion.gallery.moreAvatarsOn"),
							" ",
							/* @__PURE__ */ jsx("button", {
								type: "button",
								onClick: () => api?.openExternal?.("https://petdex.dev"),
								style: {
									display: "inline",
									padding: 0,
									border: "none",
									background: "none",
									font: "inherit",
									color: "var(--accent)",
									cursor: "pointer",
									textDecoration: "underline"
								},
								children: "petdex.dev"
							})
						]
					})
				]
			}),
			editorOverlay,
			showImport && /* @__PURE__ */ jsx(ImportPetDialog, {
				input: petdexInput,
				onInput: setPetdexInput,
				resolving,
				resolved,
				importing,
				error: importError,
				onConfirm: confirmImport,
				onClose: closeImport,
				onBrowse: () => api?.openExternal?.("https://petdex.dev")
			}),
			detail && selectedPackId && /* @__PURE__ */ jsx(DetailPanel, {
				detail,
				isActive: detail.meta.id === activePackId,
				onClose: () => {
					setSelectedPackId(null);
					setDetail(null);
				},
				onApply: handleApply,
				onExport: handleExport,
				onEdit: handleEdit,
				onDelete: handleDelete,
				i18nT,
				colorMap: crewCompanionColorMap,
				lang
			}),
			confirmDialog
		]
	});
};
// src/entries/gallery.tsx
/**
* The avatar gallery window. GalleryPanel owns the whole surface, including its
* own close button and Escape handling, because the window is frameless.
*/
function GalleryWindow() {
	return /* @__PURE__ */ jsx(WindowRoot, {
		css: gallery_window_default,
		cssId: "gallery-window",
		revealOnPaint: true,
		children: /* @__PURE__ */ jsx(GalleryPanel, {})
	});
}
export { GalleryWindow as default };
