import { activeLocale, fmtNumber, fmtTime } from "@kirocrew/app-sdk";
// src/host/format.ts
/**
* The four dashboard formatters the companion uses that the App Kit SDK does not
* export (`fmtUnit`, `fmtDateFields`, `fmtWeekday`, `fmtList`), with the
* dashboard's own behaviour (`website/src/i18n/format.ts` in Kiro Crew): the
* host's active language, `localeMatcher: 'lookup'`, and a dash for a value that
* cannot be shown. The SDK's `fmtNumber` and `activeLocale` are the host's own.
*/
var NO_VALUE = "—";
/** A millisecond timestamp below this is read as seconds, as the dashboard does. */
var SECONDS_CEILING = 1e11;
function locale() {
	try {
		const value = activeLocale();
		return typeof value === "string" && value ? value : "en";
	} catch {
		return "en";
	}
}
var formatters = /* @__PURE__ */ new Map();
function memo(kind, lng, options, build) {
	const key = `${kind}|${lng}|${JSON.stringify(options ?? null)}`;
	const hit = formatters.get(key);
	if (hit !== void 0) return hit;
	const made = build();
	formatters.set(key, made);
	return made;
}
function toDate(value) {
	if (value === null || value === void 0 || value === "") return null;
	if (value instanceof Date) return Number.isNaN(value.getTime()) ? null : value;
	if (typeof value === "number") {
		if (!Number.isFinite(value) || value <= 0) return null;
		const d = new Date(value < SECONDS_CEILING ? value * 1e3 : value);
		return Number.isNaN(d.getTime()) ? null : d;
	}
	const d = new Date(value);
	return Number.isNaN(d.getTime()) ? null : d;
}
function dateTime(value, options) {
	const d = toDate(value);
	if (!d) return NO_VALUE;
	const lng = locale();
	return memo("datetime", lng, options, () => new Intl.DateTimeFormat(lng, {
		localeMatcher: "lookup",
		...options
	})).format(d);
}
/**
* A value with a unit, `90m` or `512MB`. Every plain space becomes a no-break
* space, so the number and its unit never wrap apart in any language.
*/
function fmtUnit(value, unit, options) {
	if (!Number.isFinite(value)) return NO_VALUE;
	return fmtNumber(value, {
		style: "unit",
		unit,
		unitDisplay: "narrow",
		...options
	}).split(" ").join("\xA0");
}
/** A date from explicit components (`weekday`, `hour`, ...), never a style preset. */
function fmtDateFields(value, options) {
	return dateTime(value, options);
}
var ISO_WEEK = [
	1,
	2,
	3,
	4,
	5,
	6,
	7
];
/** A weekday name by ISO index, 1 = Monday to 7 = Sunday, whatever the host timezone. */
function fmtWeekday(isoIndex, style = "short") {
	const idx = Math.trunc(isoIndex);
	if (!ISO_WEEK.includes(idx)) return NO_VALUE;
	return dateTime(new Date(Date.UTC(2024, 0, idx)), {
		weekday: style,
		timeZone: "UTC"
	});
}
/** Join items the way the language joins them (`A, B and C`, `A、B和C`). */
function fmtList(items, options) {
	const type = options?.type ?? "conjunction";
	const style = options?.style ?? "long";
	const lng = locale();
	return memo("list", lng, {
		type,
		style
	}, () => new Intl.ListFormat(lng, {
		localeMatcher: "lookup",
		type,
		style
	})).format(items.filter((item) => item !== ""));
}
export { fmtWeekday as a, fmtUnit as i, fmtList as n, fmtTime as r, fmtDateFields as t };
