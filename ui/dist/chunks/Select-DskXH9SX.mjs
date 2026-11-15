import { forwardRef, useImperativeHandle, useRef } from "react";
import { jsx, jsxs } from "react/jsx-runtime";
import * as ui from "@kirocrew/app-sdk/ui";
// src/errorText.ts
/**
* A message from a caught value.
*
* `catch` binds `unknown`, because anything can be thrown. Narrowing here keeps the
* call sites free of casts and guarantees the UI shows a string rather than
* "[object Object]".
*/
function errorText(err) {
	if (err instanceof Error) return err.message;
	if (typeof err === "string") return err;
	return "";
}
// src/host/NativeSelect.tsx
/**
* The fallback for `Select` on a host that does not export one: a plain native
* `<select>` with the same props, so the call sites do not branch.
*/
function NativeSelect({ options, optionLabels, value, onChange, clearLabel, disabled, "aria-label": ariaLabel, title, className }) {
	const emptyRow = clearLabel !== void 0 || !options.includes(value);
	return /* @__PURE__ */ jsxs("select", {
		value,
		onChange: (e) => onChange(e.target.value),
		disabled,
		"aria-label": ariaLabel,
		title,
		className: "text-sm px-2 py-1 rounded-md bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text)]" + (className ? ` ${className}` : ""),
		children: [emptyRow && /* @__PURE__ */ jsx("option", {
			value: "",
			children: clearLabel ?? ""
		}), options.map((option, index) => /* @__PURE__ */ jsx("option", {
			value: option,
			children: optionLabels?.[index] ?? option
		}, option))]
	});
}
// src/host/Select.tsx
/**
* The dashboard's select as the reminder editor and the sprite importer used it
* (`SimpleSelect`): the host's own themed dropdown (`Select` from
* `@kirocrew/app-sdk/ui`), or a native `<select>` on a host without one.
*
* Two things `SimpleSelect` did that the host's narrowed `Select` does not take as
* props are kept here: `style` lands on a wrapper (where `SimpleSelect` put it),
* and a ref focuses the control, which the schedule editor uses to put the
* keyboard on its first field when it opens.
*/
var HostSelect = ("Select" in ui ? ui.Select : void 0) ?? NativeSelect;
var Select = forwardRef(function Select({ style, ...props }, ref) {
	const wrapper = useRef(null);
	useImperativeHandle(ref, () => ({ focus() {
		wrapper.current?.querySelector("button, select, [tabindex]")?.focus();
	} }), []);
	return /* @__PURE__ */ jsx("div", {
		ref: wrapper,
		style,
		children: /* @__PURE__ */ jsx(HostSelect, { ...props })
	});
});
export { errorText as n, Select as t };
