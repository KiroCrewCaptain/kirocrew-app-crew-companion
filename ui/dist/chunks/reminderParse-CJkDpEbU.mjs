import { E as i18nT, T as currentLocale } from "./constants-De1Fjrra.mjs";
import { useLayoutEffect, useRef } from "react";
import { jsx } from "react/jsx-runtime";
// src/reminders.ts
/**
* Presentation helpers for reminders — sorting, repeat labels and the when-label
* pair. All user-visible words go through the dashboard i18n catalog; the clock time
* itself is formatted with Intl in the dashboard's active language, so a reminder
* row never shows an English time beside translated chrome.
*/
/** Chronological, with already-fired one-offs sunk to the bottom rather than hidden. */
function sortedReminders(list) {
	return [...list].sort((a, b) => {
		if (!!a.done !== !!b.done) return a.done ? 1 : -1;
		return Date.parse(a.fireAt) - Date.parse(b.fireAt);
	});
}
/** "every 2h" / "daily" — the repeat, not the next fire time. */
function repeatLabel(mins) {
	if (mins === 1440) return i18nT("apps.crewCompanion.time.repeat_daily");
	if (mins % 1440 === 0) return i18nT("apps.crewCompanion.time.repeat_days", { n: mins / 1440 });
	if (mins % 60 === 0) return i18nT("apps.crewCompanion.time.repeat_hours", { n: mins / 60 });
	return i18nT("apps.crewCompanion.time.repeat_minutes", { n: mins });
}
function sameDay(a, b) {
	return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
/** Epoch ms of `d`'s local midnight, for counting calendar days between dates. */
function localMidnight(d) {
	return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
}
/** The dashboard's active BCP-47 tag, for Intl date/time formatting. */
function activeLocale() {
	return currentLocale() || void 0;
}
function clockLabel(d) {
	return d.toLocaleTimeString(activeLocale(), {
		hour: "numeric",
		minute: "2-digit"
	});
}
/**
* Human label pair for a reminder.
*
*   under an hour  -> relative only          ("in 45 min")
*   later today    -> absolute + relative    ("3:00 PM" / "in 1h 20m")
*   beyond today   -> day-qualified          ("tomorrow" / "Wed 3:00 PM")
*/
function labelFor(fireAt, now) {
	const at = new Date(Date.parse(fireAt));
	const diffMs = at.getTime() - now.getTime();
	const mins = Math.round(diffMs / 6e4);
	if (mins < 60) return { relLabel: mins <= 0 ? i18nT("apps.crewCompanion.time.now") : i18nT("apps.crewCompanion.time.in_min", { n: mins }) };
	if (sameDay(at, now)) {
		const h = Math.floor(mins / 60);
		const m = mins % 60;
		return {
			absLabel: clockLabel(at),
			relLabel: m ? i18nT("apps.crewCompanion.time.in_hm", {
				h,
				m
			}) : i18nT("apps.crewCompanion.time.in_h", { h })
		};
	}
	const days = Math.round((localMidnight(at) - localMidnight(now)) / 864e5);
	return {
		absLabel: days <= 1 ? clockLabel(at) : `${at.toLocaleDateString(activeLocale(), { weekday: "short" })} ${clockLabel(at)}`,
		relLabel: days <= 1 ? i18nT("apps.crewCompanion.time.tomorrow") : i18nT("apps.crewCompanion.time.in_days", { n: days })
	};
}
/**
* Parse a user-typed interval, returning null when it is not a usable number.
* Returning null rather than a fallback matters: a bad value must leave the current
* setting alone instead of silently resetting it.
*/
function clampBreakMins(raw) {
	const n = typeof raw === "number" ? raw : Number(String(raw).trim());
	if (!Number.isFinite(n) || n <= 0) return null;
	return Math.min(480, Math.max(5, Math.round(n)));
}
// src/host/RadioChipGroup.tsx
/**
* One-of-N choice drawn as a row of buttons (chips, swatches, mode buttons),
* announced and operated as a radio group (WAI-ARIA radio pattern).
*
* Why not `aria-pressed`: `aria-pressed` reads as N independent on/off toggles,
* so a screen-reader user hears "pressed" / "not pressed" per button and is
* never told the buttons are one single-select set (#27459). A genuine two-state
* toggle (one button that is on or off, or a pair where pressing the active one
* clears it) keeps `aria-pressed` and does not use this group.
*
* How to use: wrap the options in `<RadioChipGroup>` with a name
* (`ariaLabel` or `ariaLabelledBy`), and give each option `{...radioChip(checked)}`
* instead of `aria-pressed`. Options must be focusable elements (`<button>`).
*
* The group owns the keyboard behaviour so no call site re-implements it:
* - One Tab stop. While focus is inside the group it is the focused option;
*   otherwise it is the checked option, or the first enabled one when none is
*   checked. The group sets each option's `tabIndex` itself, so options must
*   NOT pass their own `tabIndex` prop.
* - Arrow keys (Right/Down next, Left/Up previous, wrapping) and Home/End move
*   focus; disabled options are skipped. By default they do NOT select: many
*   consumers save on every change (settings write config, a palette saves and
*   closes, the guide's pick list commits and unmounts), so passing over an
*   option must never persist it. Space/Enter (the native button click)
*   chooses. This is the rule `SegmentedControl` already follows.
* - `selectOnArrow` opts a group into "arrow moves AND selects" (the native
*   radio behaviour), for a group where a pick is cheap and reversible and
*   that behaviour is already established (the sidebar duration chips, #22330).
* - The key is consumed (`stopPropagation`) so a host Radix menu does not also
*   treat it as its own item-to-item navigation and pull focus out.
*/
function RadioChipGroup({ ariaLabel, ariaLabelledBy, className, style, children, onKeyDown: ownKeyDown, selectOnArrow = false, "data-testid": testId }) {
	const ref = useRef(null);
	useLayoutEffect(() => {
		if (ref.current) placeTabStop(ref.current);
	});
	const onKeyDown = (e) => {
		ownKeyDown?.(e);
		if (e.defaultPrevented) return;
		if (!(e.key === "Home" || e.key === "End") && RADIO_KEY_STEP[e.key] === void 0) return;
		const radios = ownRadios(e.currentTarget).filter((r) => !isDisabled(r));
		if (radios.length === 0) return;
		e.preventDefault();
		e.stopPropagation();
		const current = radios.indexOf(document.activeElement);
		const next = e.key === "Home" ? 0 : e.key === "End" ? radios.length - 1 : (Math.max(current, 0) + RADIO_KEY_STEP[e.key] + radios.length) % radios.length;
		radios[next].focus();
		if (selectOnArrow) radios[next].click();
	};
	return /* @__PURE__ */ jsx("div", {
		ref,
		role: "radiogroup",
		"aria-label": ariaLabel,
		"aria-labelledby": ariaLabelledBy,
		className,
		style,
		onKeyDown,
		"data-testid": testId,
		onFocus: (e) => placeTabStop(e.currentTarget),
		onBlur: (e) => {
			const group = e.currentTarget;
			if (!group.contains(e.relatedTarget)) placeTabStop(group, true);
		},
		children
	});
}
/** The attributes an option inside a `RadioChipGroup` carries in place of
*  `aria-pressed`. */
function radioChip(checked) {
	return {
		role: "radio",
		"aria-checked": checked
	};
}
/** Arrow-key step through a radio group (WAI-ARIA radio pattern: Right/Down is
*  the next radio, Left/Up the previous, wrapping at either end). */
var RADIO_KEY_STEP = {
	ArrowRight: 1,
	ArrowDown: 1,
	ArrowLeft: -1,
	ArrowUp: -1
};
/** Give exactly one of the group's own enabled radios `tabIndex` 0: the
*  focused one while focus is inside (unless `leaving`), else the checked one,
*  else the first. */
function placeTabStop(group, leaving = false) {
	const radios = ownRadios(group);
	const enabled = radios.filter((r) => !isDisabled(r));
	const stop = (leaving ? void 0 : enabled.find((r) => r === document.activeElement)) ?? enabled.find((r) => r.getAttribute("aria-checked") === "true") ?? enabled[0];
	for (const r of radios) r.tabIndex = r === stop ? 0 : -1;
}
/** This group's own radios, not those of a radio group nested inside it. */
function ownRadios(group) {
	return Array.from(group.querySelectorAll("[role=\"radio\"]")).filter((r) => r.closest("[role=\"radiogroup\"]") === group);
}
function isDisabled(el) {
	return el.disabled === true || el.getAttribute("aria-disabled") === "true";
}
// src/reminderText.ts
/**
* Index-alignment helpers for the reminder parsers.
*
* ## The rule these exist to enforce
*
* Both parsers locate schedule words with regexes and record `{start, end}` spans
* taken from `RegExp.index`. Those spans are later used to blank the matched ranges
* out of the **original** typed text (`cleanText`), so the string a span was measured
* against and the string it is applied to must agree on what index 5 means.
*
* `RegExp.index` counts **UTF-16 code units**. Two everyday operations silently break
* that agreement:
*
* 1. **`[...str]` iterates CODE POINTS.** One astral character — any emoji in a typed
*    reminder — is two code units but one code point, so every later index is off by
*    one and the wrong characters get blanked.
* 2. **`str.toLowerCase()` can CHANGE LENGTH.** Turkish `İ` (U+0130) lowercases to
*    `i` + U+0307 COMBINING DOT ABOVE: one code unit becomes two. Spans measured on
*    the folded string are then shifted when applied to the original, so
*    `İlaç at 3pm` saved as `İlaç a`.
*
* Both bugs corrupt text the user typed and already saved. This module is the single
* place that gets it right; the parsers must not hand-roll either operation.
*/
/**
* Split into an array of **UTF-16 code units**, the unit `RegExp.index` counts.
*
* Use this instead of `[...str]` (or `Array.from`) anywhere the resulting array is
* indexed with a regex-derived offset. Surrogate pairs are deliberately split into
* halves: the halves are rejoined intact by `join('')` as long as neither is dropped,
* and preserving index alignment is what matters.
*/
function toUnits(s) {
	return s.split("");
}
/**
* Lowercase **for matching only**, guaranteed to stay index-aligned with the input.
*
* A code point is folded only when its lowercase form occupies the same number of code
* units; otherwise the original is kept. So `İ` stays `İ` — it will not match a
* lowercase pattern, which is correct and harmless, because every schedule token the
* parsers look for is ASCII or Han. Losing a match on an exotic character is a
* non-event; shifting every span after it corrupts the user's saved text.
*
* The length guarantee is by CONSTRUCTION, not by assertion: iterating code points and
* appending either the folded form (same code-unit length) or the original means the
* total cannot drift. `foldForMatch(s).length === s.length` always holds.
*/
function foldForMatch(s) {
	let out = "";
	for (const ch of s) {
		const low = ch.toLowerCase();
		out += low.length === ch.length ? low : ch;
	}
	return out;
}
// src/reminderParseParts.ts
/**
* The shape a non-English reminder parser hands back, and the one assembly step the
* language modules share.
*
* Chinese and Korean differ in every pattern but agree on the plumbing: mask what the
* interval and delay already consumed so their digits are not re-read as a clock,
* scan the remainder for a clock, carry a day-part hour that the mask would otherwise
* hide, and collect the spans the caller strips from the saved text. That sequence is
* about how the pieces fit together rather than about either language, so it lives
* here — one place to get the masking order right, instead of two that drift.
*/
/**
* Combine the per-language hits into the parts the caller resolves against a clock.
*
* `findClock` is called on a COPY of the input with the interval and delay ranges
* blanked, which is what stops the 2 in 每2小时 / 2시간마다 being read as 2 o'clock.
* It receives a string of the same length as the input, so the spans it reports stay
* aligned with the original text.
*/
function assembleParts(input, interval, delay, dayOff, findClock) {
	const masked = toUnits(input);
	for (const sp of [interval?.span, delay?.span].filter(Boolean)) for (let i = sp.start; i < sp.end; i++) masked[i] = " ";
	let clock = findClock(masked.join(""));
	if (!clock && interval?.hour != null) clock = {
		hour: interval.hour,
		minute: 0,
		explicit: true,
		span: interval.span
	};
	const spans = [];
	if (interval) spans.push(interval.span);
	if (delay) spans.push(delay.span);
	if (clock) spans.push(clock.span);
	if (dayOff) spans.push(dayOff.span);
	return {
		everyMinutes: interval?.everyMinutes ?? null,
		delayMinutes: delay?.minutes ?? null,
		clock: clock ? {
			hour: clock.hour,
			minute: clock.minute,
			explicit: clock.explicit,
			...clock.nightRollover ? { nightRollover: true } : {}
		} : null,
		dayOffset: dayOff?.offset ?? 0,
		dayExplicit: !!dayOff,
		spans,
		hasSignal: !!(interval || delay || clock || dayOff)
	};
}
// src/reminderParseZh.ts
/**
* Chinese natural-language reminder parsing — pure and separately testable.
*
* A separate module rather than more branches in reminderParse.ts, because almost
* nothing transfers. The English patterns lean on `\b` word boundaries, and `\b`
* does not match between a Han character and a digit or another Han character, so
* reusing them would fail in ways that look like "no schedule found" rather than
* like a bug. Chinese also puts the unit before the marker (2小时后, not "after 2
* hours") and folds the meridiem into a day-part word (下午3点 = 15:00).
*
* Scope is the same as the English side: the common shapes, and an honest refusal
* otherwise. It does NOT handle weekday names (每周一) or dates (8月5日), because
* the Recurrence model is a single interval and cannot express them.
*/
var MIN$2 = 1;
var HOUR$2 = 60;
var DAY$2 = 1440;
var WEEK$2 = 10080;
/** Does this look like Chinese input at all? */
function hasHan(s) {
	return /[\u4e00-\u9fff]/.test(s);
}
var CN_DIGITS = {
	零: 0,
	一: 1,
	二: 2,
	两: 2,
	三: 3,
	四: 4,
	五: 5,
	六: 6,
	七: 7,
	八: 8,
	九: 9
};
/**
* A Chinese or Arabic number.
*
* Handles the 十 forms people actually type for durations (十, 十五, 二十, 二十五,
* 三十), plus 半 for "half". Larger constructions (一百二十) are out of scope — a
* reminder interval that long is written with digits in practice.
*/
function cnNumber(raw) {
	const s = raw.trim();
	if (!s) return null;
	if (/^\d+$/.test(s)) return parseInt(s, 10);
	if (s === "半") return .5;
	if (s.includes("十")) {
		const [tensPart, onesPart] = s.split("十");
		const tens = tensPart === "" ? 1 : CN_DIGITS[tensPart];
		const ones = onesPart === "" || onesPart === void 0 ? 0 : CN_DIGITS[onesPart];
		if (tens == null || ones == null) return null;
		return tens * 10 + ones;
	}
	if (s.length === 1) return CN_DIGITS[s] ?? null;
	return null;
}
var NUM$1 = "(\\d+|[零一二两三四五六七八九十]+|半)";
/** Unit word → minutes. `个` is optional filler (2个小时). */
function unitMinutes$1(word) {
	if (/^(分钟|分)$/.test(word)) return MIN$2;
	if (/^(个?小时|个?钟头|个?小時)$/.test(word)) return HOUR$2;
	if (/^(天|日)$/.test(word)) return DAY$2;
	if (/^(周|星期|礼拜)$/.test(word)) return WEEK$2;
	return null;
}
var UNIT$1 = "(分钟|分|个?小时|个?钟头|天|日|周|星期|礼拜)";
/**
* Default hour for a named part of the day.
*
* Chinese folds the meridiem into these words, so 下午3点 is unambiguous in a way
* that bare "at 3" is not — the hour is shifted rather than guessed.
*/
var NIGHT_HOUR = 20;
/**
* INVARIANT: every entry is a COMPLETE schedule word, never a bare character.
*
* These words are matched anywhere in the reminder and the match is then BLANKED
* OUT of the saved text, so a single character here silently eats the user's own
* words: a bare '晚' turned 明天提醒我交晚班报告 ("hand in the night-shift
* report") into 交班报告 at 20:00. Any entry short enough to occur inside an
* ordinary word (晚班, 早餐, 中午饭, 夜宵) corrupts text rather than mis-times it.
*
* 今晚/明晚 are spelled out because they are what a bare '晚' was really serving.
* 每晚 does not need an entry: findInterval anchors it behind a required 每.
*/
var DAY_PARTS$2 = [
	[
		"凌晨",
		5,
		0
	],
	[
		"早上",
		9,
		0
	],
	[
		"早晨",
		9,
		0
	],
	[
		"上午",
		9,
		0
	],
	[
		"中午",
		12,
		12
	],
	[
		"下午",
		15,
		12
	],
	[
		"傍晚",
		18,
		12
	],
	[
		"晚上",
		20,
		12
	],
	[
		"今晚",
		NIGHT_HOUR,
		12
	],
	[
		"明晚",
		NIGHT_HOUR,
		12
	],
	[
		"夜里",
		22,
		12
	]
];
/**
* Default hour for a day-part word, including the bare '晚' that only
* findInterval sees (behind a required 每, so it cannot match inside a word).
*/
function dayPartHour(word) {
	const found = DAY_PARTS$2.find(([w]) => w === word);
	if (found) return found[1];
	return word === "晚" ? NIGHT_HOUR : void 0;
}
/** Verbs that open the reminder body: after one of these, we are in the ACTION. */
var ZH_SCHEDULE_VERB = /^(?:提醒|叫我|记得|让我|通知)/;
/** A day/frequency marker directly before a day part makes it a time phrase. */
var ZH_DAY_MARKER = /(?:今|明|后|每)$/;
/**
* Whether a day-part word at `start` is acting as a TIME rather than sitting inside
* one of the user's words.
*
* This is the guard that the whole DAY_PARTS class of bug comes down to. The word is
* matched anywhere in the string and then BLANKED from the saved text, so matching it
* inside a noun compound does not mis-schedule the reminder — it rewrites what the
* user typed. 提醒我买下午茶 became 买茶 at 15:00; before that, 交晚班报告 became
* 交班报告.
*
* A day part counts as a time when the character AFTER it ends the time phrase — a
* schedule verb, a clock, punctuation, whitespace, or end of input — or when a
* day/frequency marker sits directly BEFORE it. Anything else (下午 followed by 茶)
* is part of a word.
*
* Deliberately conservative: 提醒我明天下午开会 fails this test, so it falls back to
* the conventional hour rather than 15:00. Telling 下午开会 from 下午茶 needs
* part-of-speech knowledge this parser does not have, and a slightly wrong time is a
* far better failure than silently altering the reminder's words.
*/
function inSchedulePosition$1(s, start, word) {
	const before = s.slice(0, start);
	if (ZH_DAY_MARKER.test(before)) return true;
	const after = s.slice(start + word.length);
	if (after === "") return true;
	if (ZH_SCHEDULE_VERB.test(after)) return true;
	return /^[\s，,、。：:0-9０-９一二三四五六七八九十半点分]/.test(after);
}
var span = (m) => ({
	start: m.index,
	end: m.index + m[0].length
});
/** 一天两次 / 每天三次 → an interval derived from a rate. */
function findRate$1(s) {
	const m = s.match(new RegExp(`(?:每|一)(天|日|小时|周)${NUM$1}次`));
	if (!m) return null;
	const per = unitMinutes$1(m[1]);
	const times = cnNumber(m[2]);
	if (per == null || times == null || times <= 0) return null;
	return {
		everyMinutes: Math.max(1, Math.round(per / times)),
		span: span(m)
	};
}
/** 每2小时 / 每天 / 每隔30分钟 / 每晚. */
function findInterval$2(s) {
	const rate = findRate$1(s);
	if (rate) return rate;
	const withUnit = s.match(new RegExp(`每(?:隔)?${NUM$1}?\\s*${UNIT$1}`));
	if (withUnit) {
		if (/^(周|星期|礼拜)$/.test(withUnit[2])) {
			const after = s.charAt(withUnit.index + withUnit[0].length);
			if (/[一二三四五六日]/.test(after)) return null;
		}
		const mins = unitMinutes$1(withUnit[2]);
		if (mins != null) {
			const count = withUnit[1] ? cnNumber(withUnit[1]) : 1;
			if (count != null && count > 0) return {
				everyMinutes: Math.max(1, Math.round(count * mins)),
				span: span(withUnit)
			};
		}
	}
	const dayPart = s.match(/每(?:隔)?(凌晨|早上|早晨|上午|中午|下午|傍晚|晚上|夜里|晚)/);
	if (dayPart) return {
		everyMinutes: DAY$2,
		span: span(dayPart),
		hour: dayPartHour(dayPart[1])
	};
	return null;
}
/** 20分钟后 / 半小时后 / 过两小时. */
function findDelay$2(s) {
	const after = s.match(new RegExp(`${NUM$1}\\s*${UNIT$1}(?:之)?后`));
	if (after) {
		const mins = unitMinutes$1(after[2]);
		const count = cnNumber(after[1]);
		if (mins != null && count != null && count > 0) return {
			minutes: Math.max(1, Math.round(count * mins)),
			span: span(after)
		};
	}
	const guo = s.match(new RegExp(`过${NUM$1}\\s*${UNIT$1}`));
	if (guo) {
		const mins = unitMinutes$1(guo[2]);
		const count = cnNumber(guo[1]);
		if (mins != null && count != null && count > 0) return {
			minutes: Math.max(1, Math.round(count * mins)),
			span: span(guo)
		};
	}
	return null;
}
/** 下午3点半 / 早上9点 / 8点30分 / 15:00. */
function findClock$2(s) {
	const partsAlt0 = DAY_PARTS$2.map(([w]) => w).join("|");
	const colon = s.match(new RegExp(`(${partsAlt0})?\\s*(\\d{1,2}):(\\d{2})`));
	if (colon) {
		let h = parseInt(colon[2], 10);
		const mi = parseInt(colon[3], 10);
		if (h <= 23 && mi <= 59) {
			const part = colon[1];
			let explicit = false;
			if (part) {
				const found = DAY_PARTS$2.find(([w]) => w === part);
				if (found) {
					if (found[2] === 12 && h < 12) h += 12;
					if (found[2] === 0 && h === 12) h = 0;
					explicit = true;
				}
			} else if (h >= 13 || h === 0) explicit = true;
			return {
				hour: h,
				minute: mi,
				explicit,
				span: span(colon)
			};
		}
	}
	const partsAlt = partsAlt0;
	const m = s.match(new RegExp(`(${partsAlt})?\\s*${NUM$1}\\s*点\\s*(半|${NUM$1}\\s*分?)?`));
	if (m) {
		const hour = cnNumber(m[2]);
		if (hour != null && hour <= 23) {
			let h = hour;
			let minute = 0;
			if (m[3] === "半") minute = 30;
			else if (m[3]) {
				const mm = cnNumber(m[3].replace(/分/g, "").trim());
				if (mm != null && mm <= 59) minute = mm;
			}
			const part = m[1];
			let explicit = false;
			if (part) {
				const found = DAY_PARTS$2.find(([w]) => w === part);
				if (found) {
					const shift = found[2];
					if (shift === 12 && h < 12) h += 12;
					if (shift === 0 && h === 12) h = 0;
					explicit = true;
				}
			}
			return {
				hour: h,
				minute,
				explicit,
				span: span(m)
			};
		}
	}
	for (const [w, hour] of DAY_PARTS$2) {
		const dm = s.match(new RegExp(w));
		if (dm && inSchedulePosition$1(s, dm.index, w)) return {
			hour,
			minute: 0,
			explicit: true,
			span: span(dm)
		};
	}
	return null;
}
/** 今天 / 明天 / 后天 / 大后天. */
function findDayOffset$1(s) {
	for (const [re, offset] of [
		[/大后天/, 3],
		[/后天/, 2],
		[/明天|明日|明晚/, 1],
		[/今天|今晚|今日/, 0]
	]) {
		const m = s.match(re);
		if (m) return {
			offset,
			span: span(m)
		};
	}
	return null;
}
/**
* Parse the schedule parts out of Chinese input.
*
* Returns the pieces rather than a finished reminder so the caller can apply the
* same next-occurrence and rollover rules used for English — those rules are about
* time, not language, and should not be duplicated.
*/
function parseZhParts(input) {
	return assembleParts(input, findInterval$2(input), findDelay$2(input), findDayOffset$1(input), findClock$2);
}
/** Politeness and framing that carries no meaning once the schedule is extracted. */
var ZH_LEAD_FILLER = /^(?:请|麻烦|帮我|记得|别忘了|不要忘了|提醒我(?:要|去)?|叫我)+/;
// src/reminderParseKo.ts
/**
* Korean natural-language reminder parsing — pure and separately testable.
*
* A separate module rather than more branches in reminderParse.ts, for the same
* reason the Chinese rules live apart: the English patterns lean on `\b`, and `\b`
* does not match between a Hangul syllable and a digit or another syllable, so
* reusing them fails as "no schedule found" rather than as a visible bug. Korean
* also puts the marker AFTER the quantity (20분 뒤, not "after 20 minutes"), marks
* the repeat with a suffix (30분마다), and folds the meridiem into a separate word
* (오후 3시 = 15:00).
*
* Scope matches the other two languages: the common shapes, and an honest refusal
* otherwise. Weekday repeats (매주 월요일) and calendar dates (8월 5일) are out —
* the Recurrence model is a single interval and cannot express either, so they are
* refused rather than mis-scheduled.
*/
var MIN$1 = 1;
var HOUR$1 = 60;
var DAY$1 = 1440;
var WEEK$1 = 10080;
/**
* Does this look like Korean input at all?
*
* Covers precomposed syllables plus the compatibility and conjoining Jamo blocks,
* so a half-composed IME string still routes here instead of falling through to the
* English parser, which would find nothing.
*/
function hasHangul(s) {
	return /[\uac00-\ud7a3\u3130-\u318f\u1100-\u11ff]/.test(s);
}
/** Native Korean counters, which is what people use with 시간 / 시 / 번. */
var KO_NATIVE = {
	하나: 1,
	한: 1,
	둘: 2,
	두: 2,
	셋: 3,
	세: 3,
	넷: 4,
	네: 4,
	다섯: 5,
	여섯: 6,
	일곱: 7,
	여덟: 8,
	아홉: 9,
	열: 10,
	열다섯: 15,
	스무: 20,
	스물: 20,
	서른: 30,
	마흔: 40,
	쉰: 50,
	예순: 60,
	반: .5
};
/** Sino-Korean digits, which is what people use with 분 and with a bare 시. */
var KO_SINO = {
	영: 0,
	공: 0,
	일: 1,
	이: 2,
	삼: 3,
	사: 4,
	오: 5,
	육: 6,
	칠: 7,
	팔: 8,
	구: 9
};
/**
* A Korean or Arabic number.
*
* Handles the two counting systems people mix freely in reminders, plus the 십
* compounds that cover every interval anyone types in words (십오, 삼십, 사십오).
* Bigger constructions (백이십) are out of scope: an interval that long is written
* with digits in practice.
*/
function koNumber(raw) {
	const s = raw.trim();
	if (!s) return null;
	if (/^\d+$/.test(s)) return parseInt(s, 10);
	if (s in KO_NATIVE) return KO_NATIVE[s];
	if (s.includes("십")) {
		const [tensPart, onesPart] = s.split("십");
		const tens = tensPart === "" ? 1 : KO_SINO[tensPart];
		const ones = onesPart === "" || onesPart === void 0 ? 0 : KO_SINO[onesPart];
		if (tens == null || ones == null) return null;
		return tens * 10 + ones;
	}
	if (s.length === 1) return KO_SINO[s] ?? null;
	return null;
}
/**
* Number alternation, built FROM the tables above rather than written out again, so a
* counter cannot be added to one and forgotten in the other.
*
* Native forms are sorted longest-first because the regex engine takes the first
* alternative that matches, and a shorter prefix listed earlier truncates the count
* (열 ahead of 열다섯 reads 열다섯 as 10). The 십 compound precedes a bare sino digit
* for the same reason.
*
* Every pattern that uses this anchors it against a following unit or counter word,
* which is what keeps a sino digit from matching the first syllable of an ordinary
* word: the 일 in 일어서기 is only read as a number when a unit follows it.
*/
var SINO_ALT = Object.keys(KO_SINO).join("|");
var NATIVE_ALT = Object.keys(KO_NATIVE).sort((a, b) => b.length - a.length).join("|");
var DIGITS = /\d+/.source;
var NUM = `(${DIGITS}|${NATIVE_ALT}|(?:${SINO_ALT})?십(?:${SINO_ALT})?|${SINO_ALT})`;
var HOUR_NUM = `(${DIGITS}|${Object.keys(KO_NATIVE).filter((w) => w !== "반").sort((a, b) => b.length - a.length).join("|")})`;
/**
* A count for durations and rates, narrower than `NUM` the same way `HOUR_NUM` is.
*
* Digits, native counters, and 십-compounds only — a BARE sino digit is
* deliberately absent, because sino digits open ordinary words: 구분 ("section")
* read as 9분 and turned 구분마다 into a nine-minute repeat. Clock MINUTES keep the
* full `NUM`: after 시 a sino reading (9시 삼십분) is unambiguous.
*/
var COUNT_NUM = `(${DIGITS}|${NATIVE_ALT}|(?:${SINO_ALT})?십(?:${SINO_ALT})?)`;
/**
* Interval, delay and rate readings must also START at a word boundary — the
* other half of the same defect: 매일 sits inside 구매일 ("purchase date") and 일
* inside 휴일 ("holiday"), so an unanchored unit pattern reads a repeat out of an
* ordinary noun.
*/
var WORD_START = "(?<![가-힣])";
/** Duration units. 시 is deliberately absent: it reads a clock, not a length. */
var UNIT = "(분|시간|일|주일|주)";
function unitMinutes(word) {
	if (word === "분") return MIN$1;
	if (word === "시간") return HOUR$1;
	if (word === "일") return DAY$1;
	if (word === "주" || word === "주일") return WEEK$1;
	return null;
}
/**
* Longest schedule this model can carry, in minutes — ten years, matching the
* ceiling the backend applies to a stored recurrence.
*
* Not cosmetic: a typed 20-digit count otherwise reaches `new Date`, produces an
* Invalid Date, and `toISOString()` THROWS out of the submit handler, so the add
* crashes rather than merely landing on a wrong time. Refusing the reading turns it
* back into a "when?" prompt.
*/
var MAX_SCHEDULE_MINUTES = 5270400;
/** A duration in minutes, or null when it is unusable or beyond what can be scheduled. */
function scaledMinutes(count, unitMins) {
	const total = Math.round(count * unitMins);
	if (!Number.isFinite(total) || total <= 0 || total > MAX_SCHEDULE_MINUTES) return null;
	return Math.max(1, total);
}
/**
* Default hour for a named part of the day, and which meridiem it states.
*
* Korean states the meridiem as its own word, so 오후 3시 is unambiguous in a way a
* bare 3시 is not — the hour is shifted rather than guessed. 점심 ("lunchtime") is
* an afternoon word: 점심 1시 is 13:00, so it takes the `pm` rule (which leaves a
* stated 12 alone). 정오 is `noon` — STRICTLY 12:00. A clock other than 12 beside
* it (정오 1시) contradicts the word, so it is refused, not silently kept: shifting
* or keeping the hour would both be wrong.
*
* INVARIANT: every entry is a complete word a user would write as a time. A bare
* syllable here would be blanked out of the middle of the user's own words: 밤 is
* also "chestnut" and 낮 opens 낮잠, which is why the standalone reading of any of
* these has to pass `inSchedulePosition` first.
*/
var DAY_PARTS$1 = [
	[
		"새벽",
		5,
		"am"
	],
	[
		"아침",
		9,
		"am"
	],
	[
		"오전",
		9,
		"am"
	],
	[
		"점심",
		12,
		"pm"
	],
	[
		"정오",
		12,
		"noon"
	],
	[
		"낮",
		13,
		"pm"
	],
	[
		"오후",
		15,
		"pm"
	],
	[
		"저녁",
		19,
		"pm"
	],
	[
		"밤",
		20,
		"night"
	],
	[
		"자정",
		0,
		"am"
	]
];
function shiftMeridiem(hour, meridiem) {
	if (meridiem === "night") {
		if (hour === 12) return 0;
		if (hour === 0) return 0;
		if (hour >= 1 && hour <= 5) return hour;
		return hour < 12 ? hour + 12 : hour;
	}
	if (meridiem === "pm" && hour < 12) return hour + 12;
	if (meridiem === "am" && hour === 12) return 0;
	return hour;
}
/**
* 정오 (`noon`) is STRICTLY 12:00. A stated clock other than 12 beside it — 정오 1시 —
* contradicts the word; `shiftMeridiem` has no meaning for it and would silently
* keep the raw hour (정오 1시 → 01:00). The caller treats this as a broken clock and
* asks, rather than persisting a time the phrase does not name.
*/
function noonMismatch(hour, meridiem) {
	return meridiem === "noon" && hour !== 12;
}
var DAY_PART_ALT = DAY_PARTS$1.map(([w]) => w).join("|");
/** A day or frequency marker directly before a day part makes it a time phrase. */
var KO_DAY_MARKER = /(?:오늘|내일|낼|모레|글피|매일|매|이번|다음|다음\s*주|주말)\s*$/;
/**
* The SINGLE definition of the two token classes that end a Korean time phrase:
* approximators (9시쯤) and time particles (저녁에, 내일부터). Every tail rule below
* derives from these two — the 군밤/저녁에 class of bug was four hand-copied
* variants of this list drifting apart.
*/
var KO_APPROX = "(?:쯤|경|정도)";
var KO_PARTICLE = "(?:에|엔|부터|까지)(?:는|도)?";
/**
* Particles that end a Korean time phrase, and therefore belong INSIDE the span.
*
* Blanking only the time word would strand its particle in the saved text: 저녁에
* 약 먹기 would come back as "에 약 먹기". Absorbing the particle is what keeps the
* reminder reading like the user's own sentence.
*/
var KO_TIME_TAIL = new RegExp(`^${KO_APPROX}?(?:${KO_PARTICLE})?`);
/** A REQUIRED particle (optionally approximated), not welded into a longer word. */
var KO_PARTICLE_AFTER = new RegExp(`^${KO_APPROX}?${KO_PARTICLE}(?![가-힣])`);
/**
* The right-hand mirror of `WORD_START`: a schedule token that ENDS in Hangul must
* also end at a word boundary, or it reads a repeat/delay out of the head of an
* ordinary noun. 매일 sits at the front of 매일경제 (a newspaper) and 후 (the "after"
* delay marker) at the front of 후원하기 ("to sponsor") — 매일경제 구독하기 became a
* daily reminder and 한 시간 후원하기 a one-hour delay, each blanking the word the
* user typed. Four blocking findings across three review rounds were all this one
* missing invariant on a token whose last character is Hangul.
*
* A token is complete when it is followed by end-of-input, a non-Hangul character,
* or one of the time particles a time phrase legitimately takes (에/엔/부터/까지,
* which `withTail` then absorbs into the span). This is exactly the template the
* 주말|평일|주중 refusal already uses; the approximator 경 is deliberately NOT in the
* allowlist because it is itself Hangul and opens ordinary words (경제, 경기), which
* is the very ambiguity this bound exists to reject.
*/
var WORD_END = "(?=$|[^가-힣]|에|엔|부터|까지)";
/**
* `WORD_END` as a standalone test against the text that FOLLOWS a token: true when
* that text begins at a word/schedule boundary. `inSchedulePosition` uses it so the
* day-marker branch requires the day part to END at a boundary, exactly as the
* clock path does — 오늘 낮잠 자기 must not read 낮 out of the head of 낮잠 (a nap).
*/
var KO_WORD_END_AT = new RegExp(`^${WORD_END}`);
/**
* Whether a schedule token starting at `idx` sits INSIDE an ordinary Hangul word.
*
* The SINGLE definition of "mid-word" for every reader in this module: a token
* whose first character is directly preceded by Hangul is part of that word
* (제한시, 군밤, 낮잠) — UNLESS the Hangul before it ends in a day marker, because
* 오늘밤 9시 is one fused time phrase and must keep reading.
*/
function startsMidWord(s, idx) {
	return idx > 0 && /[가-힣]/.test(s[idx - 1]) && !KO_DAY_MARKER.test(s.slice(0, idx));
}
/**
* Whether a day-part word at `start` is acting as a TIME rather than sitting inside
* ordinary text the user wants to keep.
*
* The Korean mirror of `inSchedulePosition` in reminderParseZh.ts, and the guard the
* whole DAY_PARTS class of bug comes down to: the word is matched anywhere and then
* BLANKED from the saved text, so a match inside a noun compound does not mis-time
* the reminder, it rewrites what the user typed. Without it, 아침 회의록 정리
* ("write up the morning meeting notes") is scheduled for 9:00 AND saved as
* "회의록 정리", and 밤 사 오기 ("buy chestnuts") becomes 사 오기 at 20:00.
*
* A day part counts as a time when a day or frequency marker sits directly before
* it, or when it starts a word AND a time particle follows it or it ends the input.
* The mid-word rejection applies to EVERY branch: 군밤 ends the input and 군밤에
* carries a particle, yet neither 밤 is a time — the noun it ends decides, not
* what follows.
*
* Deliberately conservative: when it is unclear the word stays in the user's text
* and the reminder simply has no time, which `needsSchedule` then asks about.
* Silently dropping a word the user typed is the worse failure.
*/
function inSchedulePosition(s, start, word) {
	const after = s.slice(start + word.length);
	if (KO_DAY_MARKER.test(s.slice(0, start))) return KO_WORD_END_AT.test(after);
	if (startsMidWord(s, start)) return false;
	if (after === "") return true;
	return KO_PARTICLE_AFTER.test(after);
}
/** How many characters of marker sit directly before a day part. */
function markerWidthBefore$1(s, start) {
	const m = s.slice(0, start).match(KO_DAY_MARKER);
	return m ? m[0].length : 0;
}
/** How many characters of trailing particle belong to a time phrase ending at `end`. */
function tailWidthAfter(s, end) {
	const m = s.slice(end).match(KO_TIME_TAIL);
	return m ? m[0].length : 0;
}
var spanOf = (m) => ({
	start: m.index,
	end: m.index + m[0].length
});
/** Widen a span to swallow the time particle that follows it. */
function withTail(s, span) {
	return {
		start: span.start,
		end: span.end + tailWidthAfter(s, span.end)
	};
}
/**
* A weekday or 주말 directly after 주 means the user named a DAY, not a week.
*
* The Recurrence model is a single interval and cannot express a weekday, so 매주
* 월요일 must fall through and ASK — treating it as weekly would fire on the wrong
* day, every week.
*/
function namesAWeekday(s, afterIndex) {
	return /^\s*(?:[월화수목금토일]요일|[월화수목금토일]욜|말(?![가-힣]))/.test(s.slice(afterIndex));
}
/** 하루에 세 번 / 한 시간에 두 번 — a rate rather than an interval, so it divides. */
function findRate(s) {
	const m = s.match(new RegExp(`${WORD_START}(하루|일주일|한\\s*주|1\\s*주|한\\s*시간|1\\s*시간)\\s*에?\\s*${COUNT_NUM}\\s*번(?:\\s*씩(?![가-힣]))?`));
	if (!m) return null;
	const per = /주/.test(m[1]) ? WEEK$1 : /시간/.test(m[1]) ? HOUR$1 : DAY$1;
	const times = koNumber(m[2]);
	if (times == null || times <= 0) return null;
	const every = scaledMinutes(1 / times, per);
	if (every == null) return null;
	return {
		everyMinutes: every,
		span: spanOf(m)
	};
}
/**
* 30분마다 / 매 2시간 / 매일 / 매시간 / 매일 아침.
*
* `hour` is carried out for the day-part form, because the span masks the day-part
* word before the clock scan runs — without it 매일 저녁 would lose its 19:00 and
* fall back to "one interval from now".
*/
function findInterval$1(s) {
	const rate = findRate(s);
	if (rate) return rate;
	const dayPart = s.match(new RegExp(`${WORD_START}매\\s*일?\\s*(${DAY_PART_ALT})(?:\\s*(?:마다|씩)(?![가-힣])|${WORD_END})`));
	if (dayPart) {
		const rest = s.slice(dayPart.index + dayPart[0].length);
		if (!new RegExp(`^\\s*(?:${HOUR_NUM}\\s*시(?!간)|\\d{1,2}:\\d{2})`).test(rest)) {
			const entry = DAY_PARTS$1.find(([w]) => w === dayPart[1]);
			return {
				everyMinutes: DAY$1,
				span: withTail(s, spanOf(dayPart)),
				hour: entry?.[1]
			};
		}
	}
	const prefixed = s.match(new RegExp(`${WORD_START}매\\s*${COUNT_NUM}?\\s*${UNIT}(?:\\s*(?:마다|씩|간격으로|간격)(?![가-힣])|${WORD_END})`));
	if (prefixed) {
		const mins = unitMinutes(prefixed[2]);
		const count = prefixed[1] ? koNumber(prefixed[1]) : 1;
		const weekday = /^주/.test(prefixed[2]) && namesAWeekday(s, prefixed.index + prefixed[0].length);
		const every = mins != null && count != null ? scaledMinutes(count, mins) : null;
		if (every != null && !weekday) return {
			everyMinutes: every,
			span: withTail(s, spanOf(prefixed))
		};
	}
	const fused = s.match(new RegExp(`${WORD_START}(?:매\\s*)?(${FUSED_DAY_ALT})\\s*(?:마다|간격으로|간격)(?![가-힣])`));
	if (fused) return {
		everyMinutes: FUSED_DAYS[fused[1]] * DAY$1,
		span: spanOf(fused)
	};
	const suffixed = s.match(new RegExp(`${WORD_START}${COUNT_NUM}?\\s*${UNIT}\\s*(?:마다|간격으로|간격)(?![가-힣])`));
	if (suffixed) {
		const mins = unitMinutes(suffixed[2]);
		const count = suffixed[1] ? koNumber(suffixed[1]) : 1;
		const every = mins != null && count != null ? scaledMinutes(count, mins) : null;
		if (every != null) return {
			everyMinutes: every,
			span: spanOf(suffixed)
		};
	}
	return null;
}
/**
* Day counts Korean writes as one fused word rather than a number plus a unit.
*
* These cannot fall out of the `NUM` + `UNIT` shape at all — 이틀 is not "2" followed
* by "day" — so without them the most ordinary way to say "in two days" reads as no
* schedule.
*/
var FUSED_DAYS = {
	하루: 1,
	이틀: 2,
	사흘: 3,
	나흘: 4,
	닷새: 5,
	엿새: 6,
	이레: 7,
	열흘: 10
};
var FUSED_DAY_ALT = Object.keys(FUSED_DAYS).join("|");
/** 20분 뒤에 / 한 시간 후 / 30분 있다가 / 이틀 뒤. */
function findDelay$1(s) {
	const AFTER = `(?:뒤|후|이따가?|있다가|지나(?:서|면))${WORD_END}`;
	const fused = s.match(new RegExp(`${WORD_START}(${FUSED_DAY_ALT})\\s*${AFTER}`));
	if (fused) return {
		minutes: FUSED_DAYS[fused[1]] * DAY$1,
		span: withTail(s, spanOf(fused))
	};
	const m = s.match(new RegExp(`${WORD_START}${COUNT_NUM}\\s*${UNIT}\\s*${AFTER}`));
	if (!m) return null;
	const mins = unitMinutes(m[2]);
	const count = koNumber(m[1]);
	if (mins == null || count == null) return null;
	const minutes = scaledMinutes(count, mins);
	if (minutes == null) return null;
	return {
		minutes,
		span: withTail(s, spanOf(m))
	};
}
/**
* The SINGLE clock scan behind both `findClock` and `hasBrokenClock`.
*
* Six review rounds of this parser came down to the reader and the guard being two
* parallel definitions of "a valid clock reading" that disagreed on new input
* shapes: the reader refused 9시 90 but the guard only checked minutes wearing 분,
* so the refused clock silently fell through to the 09:00 day default. Here every
* clock-shaped candidate is enumerated ONCE and given one verdict:
*
*  - well-formed and readable -> it may become the reading (`hit`),
*  - clock-shaped but malformed (hour > 23, minute > 59, unbounded digit run) ->
*    it poisons the parse (`broken`), because the user plainly TRIED to state a
*    clock and the honest outcome is to ask,
*  - shaped like a clock but sitting inside an ordinary word (제한시) -> neither:
*    it is the word the user typed, skipped for reading and not poison.
*
* The reader and the guard cannot disagree again because there is nothing left to
* disagree: both consume this one scan.
*/
function scanClocks(s) {
	let hit = null;
	let broken = false;
	const tokenStart = (c) => c.index + (c[0].length - c[0].trimStart().length);
	const hourStart = (c, prefix) => {
		const start = tokenStart(c);
		if (!prefix) return start;
		const rel = c[0].trimStart().slice(prefix.length);
		return start + prefix.length + (rel.length - rel.trimStart().length);
	};
	const prefixUse = (c, prefix) => {
		const validPrefix = prefix != null && !startsMidWord(s, tokenStart(c)) && DAY_PARTS$1.some(([w]) => w === prefix);
		if (!validPrefix && startsMidWord(s, hourStart(c, prefix))) return null;
		if (prefix && !validPrefix) return {
			entry: void 0,
			spanStart: hourStart(c, prefix)
		};
		return {
			entry: validPrefix ? DAY_PARTS$1.find(([w]) => w === prefix) : void 0,
			spanStart: tokenStart(c)
		};
	};
	for (const m of s.matchAll(/\d+:\d+/g)) {
		const before = s[m.index - 1];
		const after = s[m.index + m[0].length];
		if (before !== void 0 && /\d/.test(before) || after !== void 0 && /\d/.test(after) || !/^(?:[01]?\d|2[0-3]):[0-5]\d$/.test(m[0])) broken = true;
	}
	const colonRe = new RegExp(`(${DAY_PART_ALT})?\\s*(?<!\\d)(\\d{1,2}):(\\d{2})(?!\\d)`, "g");
	let clockMentions = 0;
	for (const c of s.matchAll(colonRe)) {
		const use = prefixUse(c, c[1]);
		if (!use) continue;
		let hour = parseInt(c[2], 10);
		const minute = parseInt(c[3], 10);
		if (hour > 23 || minute > 59) continue;
		clockMentions++;
		if (hit) continue;
		const entry = use.entry;
		if (entry && noonMismatch(hour, entry[2])) {
			broken = true;
			continue;
		}
		let explicit = false;
		let nightRollover = false;
		if (entry) {
			hour = shiftMeridiem(hour, entry[2]);
			explicit = true;
			nightRollover = entry[2] === "night" && hour <= 5;
		} else if (hour >= 13 || hour === 0) explicit = true;
		hit = {
			hour,
			minute,
			explicit,
			nightRollover,
			span: withTail(s, {
				start: use.spanStart,
				end: c.index + c[0].length
			})
		};
	}
	const clockRe = new RegExp(`(${DAY_PART_ALT})?\\s*${HOUR_NUM}\\s*시(?!간)(?:\\s*(반|${NUM}(?!\\d)(?:\\s*분)?))?`, "g");
	const clockTail = new RegExp(`^(?:$|[^가-힣]|${KO_APPROX}|${KO_PARTICLE})`);
	for (const c of s.matchAll(clockRe)) {
		const hour = koNumber(c[2]);
		let minute = 0;
		let malformed = hour == null || hour > 23;
		if (c[3] === "반") minute = 30;
		else if (c[3]) {
			const mm = koNumber(c[3].replace(/분/g, "").trim());
			if (mm == null || mm > 59) malformed = true;
			else minute = mm;
		}
		if (malformed) {
			broken = true;
			continue;
		}
		const use = prefixUse(c, c[1]);
		if (!use) continue;
		clockMentions++;
		if (hit) continue;
		if (!clockTail.test(s.slice(c.index + c[0].length))) {
			broken = true;
			continue;
		}
		const entry = use.entry;
		let shifted = hour;
		if (entry && noonMismatch(shifted, entry[2])) {
			broken = true;
			continue;
		}
		let explicit = false;
		let nightRollover = false;
		if (entry) {
			shifted = shiftMeridiem(shifted, entry[2]);
			explicit = true;
			nightRollover = entry[2] === "night" && shifted <= 5;
		} else if (shifted >= 13 || shifted === 0) explicit = true;
		hit = {
			hour: shifted,
			minute,
			explicit,
			nightRollover,
			span: withTail(s, {
				start: use.spanStart,
				end: c.index + c[0].length
			})
		};
	}
	if (clockMentions > 1) broken = true;
	return {
		hit,
		broken,
		mentions: clockMentions
	};
}
/** 오후 3시 30분 / 아침 9시 / 9시 반 / 15:00 / 정오. */
function findClock$1(s) {
	const { hit } = scanClocks(s);
	if (hit) return hit;
	for (const [word, hour] of DAY_PARTS$1) {
		const global = new RegExp(word, "g");
		let dm;
		while ((dm = global.exec(s)) !== null) {
			if (!inSchedulePosition(s, dm.index, word)) continue;
			return {
				hour,
				minute: 0,
				explicit: true,
				span: withTail(s, {
					start: dm.index - markerWidthBefore$1(s, dm.index),
					end: dm.index + word.length
				})
			};
		}
	}
	return null;
}
/** 오늘 / 내일 / 모레 / 글피. */
function findDayOffset(s) {
	const dayTail = `(?=$|[^가-힣]|${DAY_PART_ALT}|${KO_APPROX}?${KO_PARTICLE})`;
	const dayWord = (alt) => `(?<![가-힣])(?:${alt})${dayTail}`;
	const table = [
		[new RegExp(dayWord("글피")), 3],
		[new RegExp(dayWord("내일\\s*모레|모레")), 2],
		[new RegExp(`${dayWord("내일")}|(?<![가-힣])낼(?![가-힣])`), 1],
		[new RegExp(dayWord("오늘")), 0]
	];
	for (const [re, offset] of table) {
		const m = s.match(re);
		if (m) return {
			offset,
			span: withTail(s, spanOf(m))
		};
	}
	return null;
}
/**
* 매주 월요일 / 매주말 — a weekday or weekend repeat.
*
* Refused WHOLESALE, not partially. Dropping only the repeat leaves the clock
* standing, so 매주 월요일 오전 9시 would save as a ONE-TIME 9am reminder — a weekly
* request silently turned into a single one, which is worse than admitting the shape
* is unsupported. With no schedule at all the caller asks instead.
*
* The Recurrence model is a single interval and cannot express a named day; the
* Chinese path refuses 每周一 for the same reason.
*/
function namesWeekdayRepeat(s) {
	const every = s.match(/매\s*주/);
	if (every && namesAWeekday(s, every.index + every[0].length)) return true;
	return /(?:[월화수목금토일]요일|[월화수목금토일]욜|주말)\s*마다/.test(s);
}
/**
* 12월 25일 오전 9시 / 월요일 아침 / 다음 주 화요일 — calendar shapes the model
* cannot express, refused WHOLESALE for the same reason as the weekday repeat:
* dropping only the date leaves the clock standing, so 12월 25일 오전 9시 was
* persisted for the NEXT 09:00 instead of December 25 — a reminder on a day the
* user never named. With no schedule at all the caller asks instead.
*/
function namesUnsupportedDate(s) {
	if (/(?<!\d)\d{1,2}\s*월\s*\d{1,2}\s*일/.test(s)) return true;
	if (/(?<![\d.])(?:1[0-2]|0?[1-9])\s*[./]\s*(?:3[01]|[12]\d|0?[1-9])(?![\d.])/.test(s)) return true;
	if (/(?<![\d.])\d{4}\s*[-./]\s*(?:1[0-2]|0?[1-9])\s*[-./]\s*(?:3[01]|[12]\d|0?[1-9])(?![\d.])/.test(s)) return true;
	if (/(?<![가-힣])(?:주말|평일|주중)(?=$|[^가-힣]|에|엔|부터|까지)|(?:이번|다음)\s*주(?=$|[^가-힣]|에|엔|부터|까지|말)/.test(s)) return true;
	return /[월화수목금토일]요일|[월화수목금토일]욜(?![가-힣])/.test(s);
}
/**
* A clock-shaped candidate the unified scan refuses.
*
* A rejected clock must poison the WHOLE parse rather than only itself: with a
* named day in the input, 내일 012:30 회의 dropped the broken clock, kept 내일, and
* persisted tomorrow at the 09:00 default — a time the user never gave. The user
* plainly TRIED to state a clock, so the honest outcome is to ask. The verdict
* comes from the SAME scan the reader consumes (see scanClocks), so a shape the
* reader refuses is a shape this guard poisons — by construction, not by keeping
* two regexes in step.
*/
/**
* How many separate day-part TIME MENTIONS the input carries — the day-part
* mirror of scanClocks' clock-mention count. A mention is a day-part word that
* is not mid-word, is not fused to a following clock (내일 아침 9시 is ONE
* mention, read by the clock scan), and is qualified as a time by a day marker
* before it, a time particle after it, or a joining conjunction (아침과 저녁에) —
* the conjunction form is exactly the shape the fallback skipped, leaving 아침과
* stranded in the saved text while 저녁에 persisted alone. A bare day-part noun
* (아침 먹고 = breakfast; 오후 12시에 점심 = lunch) matches no arm and is never
* counted.
*/
function countDayPartMentions(s) {
	const followedByClock = new RegExp(`^\\s*(?:${HOUR_NUM}\\s*시(?!간)|\\d{1,2}:\\d{2})`);
	const conjunction = /^(?:과|와|하고|이랑|랑|및)(?![가-힣])/;
	let count = 0;
	for (const [word] of DAY_PARTS$1) {
		const global = new RegExp(word, "g");
		let dm;
		while ((dm = global.exec(s)) !== null) {
			if (startsMidWord(s, dm.index)) continue;
			const after = s.slice(dm.index + word.length);
			if (followedByClock.test(after)) continue;
			if (KO_DAY_MARKER.test(s.slice(0, dm.index)) || KO_PARTICLE_AFTER.test(after) || conjunction.test(after)) count++;
		}
	}
	return count;
}
function hasBrokenClock(s) {
	const { broken, mentions } = scanClocks(s);
	return broken || mentions + countDayPartMentions(s) > 1;
}
/**
* Parse the schedule parts out of Korean input.
*
* Returns the pieces rather than a finished reminder so the caller applies the same
* next-occurrence and rollover rules the other two languages use — those rules are
* about time, not language, and duplicating them is how the paths would drift.
*/
function parseKoParts(input) {
	if (namesWeekdayRepeat(input) || namesUnsupportedDate(input) || hasBrokenClock(input)) return {
		everyMinutes: null,
		delayMinutes: null,
		clock: null,
		dayOffset: 0,
		dayExplicit: false,
		spans: [],
		hasSignal: false
	};
	return assembleParts(input, findInterval$1(input), findDelay$1(input), findDayOffset(input), findClock$1);
}
/** Politeness and framing that opens a sentence and carries no meaning. */
var KO_LEAD_FILLER = /^(?:제발\s+|좀\s+|리마인더\s*[:：]\s*)+/;
/**
* A leading "to me" (나에게 / 저한테), stripped ONLY when the input carries request
* framing (a trailing 알려 줘-style verb): there it addresses the reminder itself.
* Standing alone it is part of the task — 내일 저에게 온 메일 확인하기 ("check the
* mail that came TO ME") lost its recipient once the day word was removed and the
* old unconditional lead filler saw 저에게 at the front.
*
* Both 나 and 저 REQUIRE their dative particle (에게/한테): a bare 나 also opens
* ordinary words and clauses — 나 대신 회의 참석하라고 알려줘 ("remind me to attend
* the meeting IN MY PLACE") had its 나 stripped, saving "대신 회의 참석".
*/
var KO_LEAD_RECIPIENT = /^(?:나(?:에게|한테)\s+|저(?:에게|한테)\s+)+/;
/**
* The Korean analogue of the English lead filler, at the other end of the sentence.
*
* Korean puts the request verb last (물 마시기 알려 줘), so stripping only a leading
* opener would leave "알려 줘" welded onto every saved reminder.
*
* The quotative branch carries only the COMPLETE verb forms 하라고 / 한다고. A bare
* 라고 is always welded to the verb stem it quotes (먹으라고, 마시라고), so stripping
* it truncated the stem — 약 먹으라고 알려줘 was saved as 약 먹으. Leaving the
* quotative in place keeps the user's own words whole.
*
* EVERY request verb strips only with an explicit request ending (주세요 / 줘요 /
* 줘 / 주라 / 달라) — one rule, no per-verb exceptions. Each of these verbs can be
* the task itself, not a request about the reminder: 아기 깨워 ("wake the baby") and
* 팀에 결과 말해 ("tell the team the results") both lost their action verb when a
* bare final verb was treated as filler. The ending is what marks the verb as
* addressed to the assistant; without it the verb stays in the user's text.
*/
var KO_TRAIL_FILLER = /(?:\s*(?:하라고|한다고)?\s*(?:좀\s*)?(?:알려|말해|얘기해|리마인드\s*해?|기억해|깨워)\s*(?:주세요|줘요|줘|주라|달라)|\s*잊지\s*(?:마(?:세요|요)?|말\s*(?:아?라|게|자|고)?)|\s*해\s*(?:주세요|줘))\s*[.!?~]*$/;
// src/reminderParse.ts
/** Conventional hour for a bare "tomorrow" — morning, not midnight. */
var DEFAULT_HOUR = 9;
var MIN = 1;
var HOUR = 60;
var DAY = 1440;
var WEEK = 10080;
/** Unit words → minutes. Ordered longest-first where prefixes overlap. */
var UNITS = [
	[/^(minutes?|mins?|m)$/, MIN],
	[/^(hours?|hrs?|h)$/, HOUR],
	[/^(days?|d)$/, DAY],
	[/^(weeks?|wks?|w)$/, WEEK],
	[/^(mornings?|afternoons?|evenings?|nights?)$/, DAY]
];
/**
* Default hour for a named part of the day.
*
* These are CONVENTIONS, not guesses in the sense the parser otherwise refuses:
* the user did name a time, just coarsely. Inventing a time for "buy milk" (no time
* words at all) is a different thing, and still refused.
*/
var DAY_PARTS = [
	[/\b(mornings?)\b/, 9],
	[/\b(afternoons?)\b/, 15],
	[/\b(evenings?)\b/, 19],
	[/\b(tonight|nights?|nightly)\b/, 20]
];
function unitToMinutes(word) {
	for (const [re, mins] of UNITS) if (re.test(word)) return mins;
	return null;
}
/** Words people use for a count instead of a digit. */
var WORD_NUMBERS = {
	a: 1,
	an: 1,
	one: 1,
	two: 2,
	three: 3,
	four: 4,
	five: 5,
	six: 6,
	seven: 7,
	eight: 8,
	nine: 9,
	ten: 10,
	fifteen: 15,
	twenty: 20,
	thirty: 30,
	forty: 40,
	fortyfive: 45,
	sixty: 60,
	ninety: 90,
	half: .5
};
function toCount(raw) {
	const t = raw.trim().toLowerCase();
	if (/^\d+$/.test(t)) return parseInt(t, 10);
	return WORD_NUMBERS[t] ?? null;
}
/**
* "every 2 hours", "every hour", "hourly", "daily".
*
* Note `every other day` is NOT special-cased — it falls out of the general form
* only if written "every 2 days", so it is left to needsSchedule rather than
* silently parsed as daily.
*/
function findInterval(lower) {
	const rate = lower.match(/\b(twice|(\d+)\s*times?)\s+(?:a|per|each)\s+([a-z]+)\b/);
	if (rate) {
		const per = unitToMinutes(rate[3]);
		const times = rate[2] ? parseInt(rate[2], 10) : 2;
		if (per != null && times > 0) return {
			everyMinutes: Math.max(1, Math.round(per / times)),
			span: {
				start: rate.index,
				end: rate.index + rate[0].length
			}
		};
	}
	const withCount = lower.match(/\b(?:every|each)\s+(\d+|[a-z]+)\s+([a-z]+)\b/);
	if (withCount) {
		const mins = unitToMinutes(withCount[2]);
		const count = toCount(withCount[1]);
		if (mins != null && count != null && count > 0) return {
			everyMinutes: Math.max(1, Math.round(count * mins)),
			span: {
				start: withCount.index,
				end: withCount.index + withCount[0].length
			}
		};
	}
	const bare = lower.match(/\b(?:every|each)\s+([a-z]+)\b/);
	if (bare) {
		const mins = unitToMinutes(bare[1]);
		if (mins != null) return {
			everyMinutes: mins,
			span: {
				start: bare.index,
				end: bare.index + bare[0].length
			}
		};
	}
	const named = lower.match(/\b(hourly|daily|weekly|nightly)\b/);
	if (named) return {
		everyMinutes: named[1] === "hourly" ? HOUR : named[1] === "weekly" ? WEEK : DAY,
		span: {
			start: named.index,
			end: named.index + named[0].length
		}
	};
	return null;
}
/**
* A named part of the day ("tonight", "every morning") as a clock reading.
*
* Treated as an explicit meridiem: "morning" means 9am, and must never resolve to
* 9pm via the bare-hour ambiguity rule.
*/
/**
* A scheduling marker immediately BEFORE a day part makes it a time phrase:
* "tomorrow morning", "this evening", "every night", "in the morning", "by tonight".
*/
var EN_DAY_MARKER = /\b(?:tomorrow|today|tonight|this|每|every|each|on|at|by|in\s+the|the\s+following|next)\s*$/;
/** A trailing schedule fragment: a clock, a connector, or nothing at all. */
var EN_SCHEDULE_TAIL = /^(?:\s*$|[\s,;.]*(?:at|by|on|around|from)\b|\s*\d|\s*(?:tomorrow|today|tonight)\b)/;
/**
* Whether a day-part word at `start` is acting as a TIME rather than sitting inside
* ordinary text the user wants to keep.
*
* The English mirror of `inSchedulePosition` in reminderParseZh.ts. Without it,
* "morning" in "submit morning report" is read as 9am AND blanked out of the saved
* text, so the reminder becomes "submit report". Every day-part word is also an
* ordinary English noun or adjective -- "morning report", "afternoon tea",
* "night shift", "evening news" -- so position, not presence, decides.
*
* Kept deliberately conservative: when it is unclear, the word stays in the user's
* text and the reminder simply has no time, which `needsSchedule` then asks about.
* Silently dropping a word the user typed is the worse failure.
*/
function inSchedulePositionEn(lower, start, word) {
	if (EN_DAY_MARKER.test(lower.slice(0, start))) return true;
	const after = lower.slice(start + word.length);
	return EN_SCHEDULE_TAIL.test(after);
}
/**
* How many characters of marker sit directly before a day part, so the span can
* swallow them.
*
* Blanking only the day part would leave its introducer stranded in the saved
* text: "this evening call dad" would become "this call dad", and "take pills in
* the morning" would become "take pills in the". The marker is part of the time
* phrase, so it belongs inside the span. Harmless when it overlaps another span --
* `cleanText` blanks ranges, so overlapping with e.g. the "tomorrow" span is
* idempotent.
*/
function markerWidthBefore(lower, start) {
	const m = lower.slice(0, start).match(EN_DAY_MARKER);
	return m ? m[0].length : 0;
}
function findDayPart(lower) {
	for (const [re, hour] of DAY_PARTS) {
		const global = new RegExp(re.source, "g");
		let m;
		while ((m = global.exec(lower)) !== null) {
			if (!inSchedulePositionEn(lower, m.index, m[0])) continue;
			return {
				hour,
				minute: 0,
				explicitMeridiem: true,
				span: {
					start: m.index - markerWidthBefore(lower, m.index),
					end: m.index + m[0].length
				}
			};
		}
	}
	return null;
}
/** "in 20 minutes", "in an hour", "in 2h". */
function findDelay(lower) {
	const m = lower.match(/\bin\s+(\d+|[a-z]+)\s*([a-z]+)\b/);
	if (!m) return null;
	const mins = unitToMinutes(m[2]);
	const count = toCount(m[1]);
	if (mins == null || count == null || count <= 0) return null;
	return {
		minutes: Math.max(1, Math.round(count * mins)),
		span: {
			start: m.index,
			end: m.index + m[0].length
		}
	};
}
/** "at 3pm", "3:30pm", "15:00", "at noon". */
function findClock(lower) {
	const noon = lower.match(/\b(noon|midday|midnight)\b/);
	if (noon) return {
		hour: noon[1] === "midnight" ? 0 : 12,
		minute: 0,
		explicitMeridiem: true,
		span: {
			start: noon.index,
			end: noon.index + noon[0].length
		}
	};
	for (const m of lower.matchAll(/\b(?:(at)\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b/g)) {
		const hasAt = !!m[1];
		const meridiem = m[4];
		const hasMinutes = m[3] != null;
		if (!hasAt && !meridiem && !hasMinutes) continue;
		let hour = parseInt(m[2], 10);
		const minute = m[3] ? parseInt(m[3], 10) : 0;
		if (hour > 23 || minute > 59) continue;
		if (meridiem === "pm" && hour < 12) hour += 12;
		if (meridiem === "am" && hour === 12) hour = 0;
		return {
			hour,
			minute,
			explicitMeridiem: !!meridiem,
			span: {
				start: m.index,
				end: m.index + m[0].length
			}
		};
	}
	return null;
}
function findTomorrow(lower) {
	const m = lower.match(/\b(tomorrow|tmr|tomorow)\b/);
	return m ? {
		start: m.index,
		end: m.index + m[0].length
	} : null;
}
function atClock(base, hour, minute) {
	const d = new Date(base);
	d.setHours(hour, minute, 0, 0);
	return d;
}
/**
* Resolve a clock reading to a concrete future instant.
*
* A bare hour ("at 9") is genuinely ambiguous, so it resolves to whichever of 9:00
* / 21:00 comes first — predictable, and never in the past. With an explicit am/pm
* the stated hour is honoured and only the DAY rolls forward.
*/
function resolveClock(now, hit, tomorrow) {
	if (tomorrow) {
		const d = atClock(now, hit.hour, hit.minute);
		d.setDate(d.getDate() + 1);
		return d;
	}
	const first = atClock(now, hit.hour, hit.minute);
	if (first > now) return first;
	if (!hit.explicitMeridiem && hit.hour < 12) {
		const pm = atClock(now, hit.hour + 12, hit.minute);
		if (pm > now) return pm;
	}
	const next = atClock(now, hit.hour, hit.minute);
	next.setDate(next.getDate() + 1);
	return next;
}
/** Filler that carries no meaning once the schedule is extracted. */
var LEAD_FILLER = /^(?:please\s+)?(?:can\s+you\s+)?(?:remind(?:er)?\s+me\s+(?:to\s+|about\s+)?|remember\s+to\s+|tell\s+me\s+to\s+|nudge\s+me\s+(?:to\s+)?)/i;
function cleanText(original, spans) {
	const chars = toUnits(original);
	for (const s of spans) for (let i = s.start; i < s.end && i < chars.length; i++) chars[i] = "\0";
	let out = chars.filter((c) => c !== "\0").join("");
	out = out.replace(LEAD_FILLER, "");
	out = out.replace(/\s+/g, " ").trim();
	out = out.replace(/[\s,]*\b(at|on|every|in|to)\b[\s,]*$/i, "").trim();
	out = out.replace(/^[\s,]*\b(at|on|to)\b\s*/i, "").trim();
	out = out.replace(/[.,;:]+$/, "").trim();
	return out;
}
/**
* Parse a reminder phrase.
*
* `now` is injected so the resolution rules are testable at a fixed instant.
* `fallbackText` is the text used when nothing but schedule words was typed.
*/
function parseReminder(input, now, fallbackText = "Reminder") {
	const original = input.trim();
	const lower = foldForMatch(original);
	if (hasHangul(original)) return parseKo(original, now, fallbackText);
	if (hasHan(original)) return parseZh(original, now, fallbackText);
	const interval = findInterval(lower);
	const delay = findDelay(lower);
	const tomorrowSpan = findTomorrow(lower);
	const consumed = [interval?.span, delay?.span].filter(Boolean);
	const masked = toUnits(lower);
	for (const s of consumed) for (let i = s.start; i < s.end; i++) masked[i] = " ";
	const dayPart = findDayPart(lower);
	const clock = findClock(masked.join("")) ?? dayPart;
	const spans = [...consumed];
	if (clock) spans.push(clock.span);
	if (dayPart) spans.push(dayPart.span);
	if (tomorrowSpan) spans.push(tomorrowSpan);
	const text = cleanText(original, spans) || fallbackText;
	if (!interval && !delay && !clock && tomorrowSpan) {
		const d = atClock(now, DEFAULT_HOUR, 0);
		d.setDate(d.getDate() + 1);
		return {
			text,
			fireAt: d.toISOString(),
			recurrence: null,
			needsSchedule: false
		};
	}
	if (!interval && !delay && !clock) return {
		text,
		fireAt: null,
		recurrence: null,
		needsSchedule: true
	};
	let fireAt;
	if (clock) fireAt = resolveClock(now, clock, !!tomorrowSpan);
	else if (delay) fireAt = new Date(now.getTime() + delay.minutes * 6e4);
	else fireAt = new Date(now.getTime() + interval.everyMinutes * 6e4);
	if (!Number.isFinite(fireAt.getTime())) return {
		text,
		fireAt: null,
		recurrence: null,
		needsSchedule: true
	};
	return {
		text,
		fireAt: fireAt.toISOString(),
		recurrence: interval ? { everyMinutes: interval.everyMinutes } : null,
		needsSchedule: false
	};
}
/**
* Turn already-extracted schedule pieces into a reminder.
*
* Shared by the Chinese and Korean paths, and deliberately reusing the English
* path's `atClock` / `resolveClock`: the next-occurrence and day-rollover rules are
* about time, not language, and duplicating them per language is how the paths
* silently drift apart.
*/
function resolveParts(parts, text, now, askText = text) {
	const hasSchedule = parts.clock != null || parts.delayMinutes != null || parts.everyMinutes != null || parts.dayOffset > 0;
	if (!parts.hasSignal || !hasSchedule) return {
		text,
		fireAt: null,
		recurrence: null,
		needsSchedule: true
	};
	let fireAt;
	if (parts.clock) {
		if (parts.dayOffset > 0) {
			fireAt = atClock(now, parts.clock.hour, parts.clock.minute);
			fireAt.setDate(fireAt.getDate() + parts.dayOffset);
			if (parts.clock.nightRollover) fireAt.setDate(fireAt.getDate() + 1);
		} else if (parts.dayExplicit) {
			let candidate = atClock(now, parts.clock.hour, parts.clock.minute);
			if (parts.clock.nightRollover) candidate.setDate(candidate.getDate() + 1);
			if (candidate <= now && !parts.clock.explicit && parts.clock.hour < 12) candidate = atClock(now, parts.clock.hour + 12, parts.clock.minute);
			if (candidate <= now) return {
				text: askText,
				fireAt: null,
				recurrence: null,
				needsSchedule: true
			};
			fireAt = candidate;
		} else fireAt = resolveClock(now, {
			hour: parts.clock.hour,
			minute: parts.clock.minute,
			explicitMeridiem: parts.clock.explicit,
			span: {
				start: 0,
				end: 0
			}
		}, false);
	} else if (parts.delayMinutes != null) fireAt = new Date(now.getTime() + parts.delayMinutes * 6e4);
	else if (parts.dayOffset > 0) {
		fireAt = atClock(now, DEFAULT_HOUR, 0);
		fireAt.setDate(fireAt.getDate() + parts.dayOffset);
	} else fireAt = new Date(now.getTime() + parts.everyMinutes * 6e4);
	if (!Number.isFinite(fireAt.getTime())) return {
		text: askText,
		fireAt: null,
		recurrence: null,
		needsSchedule: true
	};
	return {
		text,
		fireAt: fireAt.toISOString(),
		recurrence: parts.everyMinutes ? { everyMinutes: parts.everyMinutes } : null,
		needsSchedule: false
	};
}
/** Resolve Chinese input. */
function parseZh(original, now, fallbackText) {
	const parts = parseZhParts(original);
	let text = cleanText(original, parts.spans);
	text = text.replace(ZH_LEAD_FILLER, "").trim();
	text = text.replace(/^[，,、。\s]+|[，,、。\s]+$/g, "").trim();
	if (!text) text = fallbackText;
	let askText = original.replace(ZH_LEAD_FILLER, "").trim();
	askText = askText.replace(/^[，,、。\s]+|[，,、。\s]+$/g, "").trim();
	if (!askText) askText = fallbackText;
	return resolveParts(parts, text, now, askText);
}
/**
* Resolve Korean input.
*
* The request verb comes LAST in Korean (물 마시기 알려 줘), so the trailing filler
* is stripped as well as the leading one, and a stranded particle left behind by a
* removed time phrase is cleaned off the ends.
*/
function parseKo(original, now, fallbackText) {
	const parts = parseKoParts(original);
	const requestFramed = KO_TRAIL_FILLER.test(original);
	let text = cleanText(original, parts.spans);
	text = text.replace(KO_TRAIL_FILLER, "").trim();
	text = text.replace(KO_LEAD_FILLER, "").trim();
	if (requestFramed) text = text.replace(KO_LEAD_RECIPIENT, "").trim();
	text = text.replace(/^[\s,、]*(?:에|엔|부터)\s+/, "").trim();
	text = text.replace(/\s+(?:에|엔|부터)[\s,、.]*$/, "").trim();
	text = text.replace(/^[，,、。\s]+|[，,、。\s]+$/g, "").trim();
	if (!text) text = fallbackText;
	let askText = original.replace(KO_TRAIL_FILLER, "").trim();
	askText = askText.replace(KO_LEAD_FILLER, "").trim();
	if (requestFramed) askText = askText.replace(KO_LEAD_RECIPIENT, "").trim();
	askText = askText.replace(/^[，,、。\s]+|[，,、。\s]+$/g, "").trim();
	if (!askText) askText = fallbackText;
	return resolveParts(parts, text, now, askText);
}
export { labelFor as a, sortedReminders as c, clampBreakMins as i, RadioChipGroup as n, localMidnight as o, radioChip as r, repeatLabel as s, parseReminder as t };
