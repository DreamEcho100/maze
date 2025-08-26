/**
 * @import {
 * 	LabelProps,
 * 	InputFieldProps,
 * 	TextAreaFieldProps,
 *  SelectFieldProps,
 * 	CheckboxFieldProps,
 * 	RadioGroupFieldProps,
 * 	FormBuilderProps,
 * 	FormDescriptionProps,
 * 	HandleOnReset
 * } from "./types.ts"
 */

import {
	createMemo,
	createSignal,
	createUniqueId,
	For,
	Match,
	onCleanup,
	Show,
	Switch,
	splitProps,
	useTransition,
} from "solid-js";

// Solid.js + TypeScript

/** @param {LabelProps} props  */
function Label(props) {
	// biome-ignore lint/a11y/noLabelWithoutControl: <explanation>
	return <label {...props} />;
}

/** @param {InputFieldProps} props  */
function InputField(props) {
	return <input {...props} />;
}
/** @param {TextAreaFieldProps} props  */
function TextAreaField(props) {
	return <textarea {...props} />;
}
/** @param {SelectFieldProps} props  */
function SelectField(props) {
	return (
		<select {...props}>
			{props.options.map((option) =>
				"options" in option ? (
					<optgroup label={option.label}>
						{option.options.map((opt) => (
							<option {...opt} />
						))}
					</optgroup>
				) : (
					<option {...option} />
				),
			)}
		</select>
	);
}
/** @param {CheckboxFieldProps} props  */
function CheckboxField(props) {
	return <input type="checkbox" {...props} />;
}
/** @param {RadioGroupFieldProps} props  */
function RadioGroupField(props) {
	const [otherProps, fieldProps] = splitProps(props, ["options"]);

	return (
		<fieldset {...fieldProps}>
			{otherProps.options.map((option) => (
				<label>
					<input type="radio" name={fieldProps.name} {...option} />
					{option.label}
				</label>
			))}
		</fieldset>
	);
}
// type DateFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
// 	ft: "date";
// };
// type NumberFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
// 	ft: "number";
// };
// type PasswordFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
// 	ft: "password";
// };
// type EmailFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
// 	ft: "email";
// };
// type UrlFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
// 	ft: "url";
// };
// type TelFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
// 	ft: "tel";
// };
// type ColorFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
// 	ft: "color";
// };
// type FileFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
// 	ft: "file";
// };
// type SearchFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {
// 	ft: "search";
// };

/*
# FormBuilder Todos

Note: some of the following will need to wait until integrate with the custom form manager lib (de100/form-manager - to be created)

## Layout and Structure
- Field Grouping: Add support for logical field groups beyond the basic fieldset
- Conditional Rendering: Allow fields to show/hide based on other field values
- Multi-column Layout: Support for responsive grid layouts within forms

## UX Improvements
- Field adornments (prefix/suffix)? - within the controls (eg: input/select/textarea) components?
- Loading States: Add submission loading indicators and disable forms during submission
- Focus Management: Better handling of focus when errors occur or fields appear/disappear
- Field Dependencies: Enable dynamic field behavior (enable/disable/modify based on other fields)

## Field Enhancements
- Custom Field Components: Support for passing custom field components
- Rich Inputs: Date pickers, autocomplete fields, masked inputs (phone, credit card)
- Field Prefixes/Suffixes: Add support for icons, units, or text before/after inputs

## Form Actions
- Additional Buttons: Support for reset, cancel, and secondary action buttons
- Action Positioning: Options for button placement and alignment

## Accessibility
- Required Field Indicators: Visual and semantic markers for required fields
- Better ARIA Support: Expanded ARIA attributes and roles
- Keyboard Navigation: Improved tab order and keyboard interactions

*/

/** @param {FormDescriptionProps} props  */
function FormDescription(props) {
	const [otherProps, descriptionProps] = splitProps(props, [
		"id",
		"generateId",
	]);
	const descriptionById = createMemo(() =>
		otherProps && typeof otherProps === "object" && "id" in otherProps
			? (otherProps.id ?? otherProps.generateId?.())
			: undefined,
	);

	return (
		<Show
			when={descriptionById()}
			fallback={
				<div style={{ border: "1px solid red", padding: "0.5rem" }}>
					Warning: Form description is missing an ID. Please provide an ID or
					use the generateId prop.
				</div>
			}
		>
			{(id) => <div {...descriptionProps} id={id()} />}
		</Show>
	);
}

/** @type {HandleOnReset} */
// biome-ignore lint/correctness/noUnusedVariables: <explanation>
function handleOnReset(el, accessor) {
	if (!accessor) return;

	const onReset = () => {
		accessor()?.();
	};
	el.addEventListener("reset", onReset);

	onCleanup(() => el.removeEventListener("reset", onReset));
}

/** @param {FormBuilderProps} props  */
export function FormBuilder(props) {
	const [otherProps, formProps] = splitProps(props, [
		"onSubmit",
		"fields",
		"actions",
		"description",
		"error",
	]);

	const uniqueId = createUniqueId();
	const [isIdle, setIsIdle] = createSignal(true);
	const [isSubmitPending, setIsSelfSubmitPending] = useTransition();
	const formId = createMemo(() => formProps.id ?? `form--${uniqueId}`);
	const descriptionById = createMemo(() =>
		otherProps.description &&
		typeof otherProps.description === "object" &&
		"id" in otherProps.description
			? (otherProps.description.id ?? `${formId()}--description`)
			: undefined,
	);
	const errorDescriptionById = createMemo(() =>
		otherProps.error ? `${formId()}--error` : undefined,
	);
	const formAriaDescribedby = createMemo(() => {
		/** @type {string[]} */
		const ids = [];
		if (formProps["aria-describedby"]) ids.push(formProps["aria-describedby"]);

		const descriptionId = descriptionById();
		if (descriptionId) ids.push(descriptionId);

		const errorId = errorDescriptionById();
		if (errorId) ids.push(errorId);

		return ids.length > 0 ? ids.join(" ") : undefined;
	});

	const formDescription = (
		<Switch>
			<Match when={typeof otherProps.description === "string"}>
				{(description) => (
					<FormDescription
						aria-live="assertive"
						id={descriptionById()}
						style={{ color: "red", "margin-top": "0.5rem" }}
					>
						{description()}
					</FormDescription>
				)}
			</Match>
			<Match
				when={
					!!(
						otherProps.description && typeof otherProps.description === "object"
					) && otherProps.description
				}
			>
				{(description) => (
					<FormDescription
						aria-live="assertive"
						{...description}
						id={descriptionById()}
						style={{
							color: "red",
							"margin-top": "0.5rem",
							...description().style,
						}}
					>
						{description().children}
					</FormDescription>
				)}
			</Match>
		</Switch>
	);

	const errorDescription = (
		<Switch>
			<Match when={typeof otherProps.error === "string"}>
				{(error) => (
					<FormDescription
						aria-live="assertive"
						id={errorDescriptionById()}
						style={{ color: "red", "margin-top": "0.5rem" }}
					>
						{error()}
					</FormDescription>
				)}
			</Match>
			<Match
				when={
					!!(otherProps.error && typeof otherProps.error === "object") &&
					otherProps.error
				}
			>
				{(error) => (
					<FormDescription
						aria-live="assertive"
						{...error}
						id={errorDescriptionById()}
						style={{ color: "red", "margin-top": "0.5rem", ...error().style }}
					>
						{error().children}
					</FormDescription>
				)}
			</Match>
		</Switch>
	);

	const formActionButtons = (
		<div>
			<Switch>
				<Match
					when={
						typeof otherProps.actions?.resetBtn === "boolean" &&
						otherProps.actions?.resetBtn
					}
				>
					{(resetBtn) => resetBtn() && <button type="reset">Reset</button>}
				</Match>
				<Match
					when={
						typeof otherProps.actions?.resetBtn === "object" &&
						otherProps.actions?.resetBtn
					}
				>
					{(resetBtn) => (
						<button
							{...(typeof resetBtn() === "object" ? resetBtn() : {})}
							type="reset"
						>
							{typeof resetBtn() === "object"
								? (resetBtn().children ?? "Reset")
								: "Reset"}
						</button>
					)}
				</Match>
			</Switch>{" "}
			<button {...otherProps.actions?.submitBtn} type="submit">
				{otherProps.actions?.submitBtn?.children ?? "Submit"}
			</button>
		</div>
	);

	const formFields = (
		<Show
			when={
				otherProps.fields && otherProps.fields.length > 0 && otherProps.fields
			}
		>
			{(fields) => (
				<fieldset>
					<For each={fields()}>
						{(field) => {
							const controlId = createMemo(
								() => field.id ?? `${formId()}--${field.name}`,
							);

							const labelComp = (
								<Switch>
									<Match when={typeof field.label === "string" && field.label}>
										{(label) => <label for={controlId()}>{label()}</label>}
									</Match>
									<Match
										when={
											!!field.label &&
											typeof field.label === "object" &&
											field.label
										}
									>
										{(label) => <Label {...label()} for={controlId()} />}
									</Match>
									{/* <Match when={!field.label}>{null}</Match> */}
								</Switch>
							);

							return (
								<div>
									{labelComp}
									{field.ft === "textarea" ? (
										<TextAreaField {...field} id={controlId()} />
									) : field.ft === "select" ? (
										<SelectField {...field} id={controlId()} />
									) : field.ft === "checkbox" ? (
										<CheckboxField {...field} id={controlId()} />
									) : field.ft === "radio-group" ? (
										<RadioGroupField {...field} id={controlId()} />
									) : (
										<InputField {...field} id={controlId()} />
									)}
								</div>
							);
						}}
					</For>
				</fieldset>
			)}
		</Show>
	);

	return (
		<form
			{...formProps}
			onSubmit={(event) => {
				setIsSelfSubmitPending(async () => {
					setIsIdle(false);
					event.preventDefault();
					const formData = new FormData(event.currentTarget);
					/** @type {any} */
					const values = {};
					formData.forEach((value, key) => {
						values[key] = value;
					});
					await otherProps.onSubmit({ values, event });
				});
			}}
			// @ts-expect-error
			// biome-ignore lint/suspicious/noTsIgnore: <explanation>
			use:handleOnReset={() => setIsIdle(true)}
			aria-describedby={formAriaDescribedby()}
			data-submit-state={
				isSubmitPending()
					? "pending"
					: otherProps.error
						? "dirty"
						: isIdle()
							? "idle"
							: "submitted"
			}
		>
			{formDescription}
			{formFields}
			{formActionButtons}
			{errorDescription}
		</form>
	);
}

/*
To be implemented on the de100/form-manger lib on the future:

## Dynamic Field Props

```
type DynamicFieldProps = {
	[FieldName: string]: {
		watch:
			| `values.${string}`
			| `errors.${string}`
			| `touched.${string}`
			| "submit.count"
			| "submit.success"
			| "submit.error";
		cb: (formManager: any) => any;
		props: {
			[key: string]: {
				watch:
					| `values.${string}`
					| `errors.${string}`
					| `touched.${string}`
					| "submit.count"
					| "submit.success"
					| "submit.error";
				cb: (formManager: any) => any;
			};
		};
	};
};
```

This will allow to create dynamic fields that can change their props based on the form state (eg: show/hide, enable/disable, change options, etc...).
And it should return an object that handle a **field** not a control, label, description, etc separately _(a field is a group of related elements: control-element merged with label, control, description, error message, container etc.)_.

## Validation Schema
- support for standard validation schemas (eg: Zod, ...).
- Extract and apply validation rules from the schema to the fields automatically.

## Field Error Handling
- automatic error message display based on validation results.

*/
