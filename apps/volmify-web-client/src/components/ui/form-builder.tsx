import {
	createMemo,
	createSignal,
	createUniqueId,
	For,
	type JSX,
	Match,
	mergeProps,
	onCleanup,
	Show,
	Switch,
	splitProps,
	useTransition,
} from "solid-js";

// Solid.js + TypeScript

type LabelProps = JSX.LabelHTMLAttributes<HTMLLabelElement>;
function Label(props: LabelProps) {
	// biome-ignore lint/a11y/noLabelWithoutControl: <explanation>
	return <label {...props} />;
}

interface FormFieldBaseProps {
	label?: string | LabelProps;
	name: string;
	description?: string | JSX.HTMLAttributes<HTMLDivElement>;
}

type InputFieldProps = JSX.InputHTMLAttributes<HTMLInputElement>;
function InputField(props: InputFieldProps) {
	return <input {...props} />;
}
type TextAreaFieldProps = JSX.TextareaHTMLAttributes<HTMLTextAreaElement>;
function TextAreaField(props: TextAreaFieldProps) {
	return <textarea {...props} />;
}
interface SelectFieldProps extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
	options: (
		| ({
				ft?: "option";
				label: string;
				value: string;
		  } & JSX.OptionHTMLAttributes<HTMLOptionElement>)
		| {
				ft: "optgroup";
				label: string;
				options: ({
					ft?: "option";
					label: string;
					value: string;
				} & JSX.OptionHTMLAttributes<HTMLOptionElement>)[];
		  }
	)[];
}
function SelectField(props: SelectFieldProps) {
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
type CheckboxFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {};
function CheckboxField(props: CheckboxFieldProps) {
	return <input type="checkbox" {...props} />;
}
interface RadioGroupFieldProps extends JSX.FieldsetHTMLAttributes<HTMLFieldSetElement> {
	options: ({
		ft?: "radio";
		label: string;
		value: string;
	} & JSX.InputHTMLAttributes<HTMLInputElement>)[];
}
function RadioGroupField(props: RadioGroupFieldProps) {
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

type FormField = (
	| (InputFieldProps & { ft?: "input" })
	| (TextAreaFieldProps & { ft: "textarea" })
	| (SelectFieldProps & { ft: "select" })
	| (CheckboxFieldProps & { ft: "checkbox" })
	| (RadioGroupFieldProps & { ft: "radio-group" })
) &
	FormFieldBaseProps;

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

interface FormDescriptionProps extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "style"> {
	id?: string;
	generateId?: () => string | undefined;
	style?: JSX.CSSProperties;
}
function FormDescription(props: FormDescriptionProps) {
	const [otherProps, descriptionProps] = splitProps(props, ["id", "generateId"]);
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
					Warning: Form description is missing an ID. Please provide an ID or use the generateId
					prop.
				</div>
			}
		>
			{(id) => <div {...descriptionProps} id={id()} />}
		</Show>
	);
}

// biome-ignore lint/correctness/noUnusedVariables: <explanation>
function handleOnReset(el: HTMLFormElement, accessor?: () => () => void) {
	if (!accessor) return;

	const onReset = () => {
		accessor()?.();
	};
	el.addEventListener("reset", onReset);

	onCleanup(() => el.removeEventListener("reset", onReset));
}

export function FormBuilder(
	props: {
		onSubmit: (submitProps: {
			values: any;
			event: SubmitEvent & {
				currentTarget: HTMLFormElement;
				target: Element;
			};
		}) => void | Promise<void>;
		fields?: FormField[];
		actions?: {
			submitBtn?: JSX.ButtonHTMLAttributes<HTMLButtonElement> & {
				children?: JSX.ButtonHTMLAttributes<HTMLButtonElement>["children"];
			};
			resetBtn?: JSX.ButtonHTMLAttributes<HTMLButtonElement> | boolean;
		};
		description?: string | FormDescriptionProps;
		error?: string | FormDescriptionProps | null | false;
	} & Omit<JSX.FormHTMLAttributes<HTMLFormElement>, "onSubmit" | "children">,
) {
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
		const ids: string[] = [];
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
					!!(otherProps.description && typeof otherProps.description === "object") &&
					otherProps.description
				}
			>
				{(description) => (
					<FormDescription
						aria-live="assertive"
						{...description}
						id={descriptionById()}
						style={{ color: "red", "margin-top": "0.5rem", ...description().style }}
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
				when={!!(otherProps.error && typeof otherProps.error === "object") && otherProps.error}
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
					when={typeof otherProps.actions?.resetBtn === "boolean" && otherProps.actions?.resetBtn}
				>
					{(resetBtn) => resetBtn() && <button type="reset">Reset</button>}
				</Match>
				<Match
					when={typeof otherProps.actions?.resetBtn === "object" && otherProps.actions?.resetBtn}
				>
					{(resetBtn) => (
						<button {...(typeof resetBtn() === "object" ? resetBtn() : {})} type="reset">
							{typeof resetBtn() === "object" ? (resetBtn().children ?? "Reset") : "Reset"}
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
		<Show when={otherProps.fields && otherProps.fields.length > 0 && otherProps.fields}>
			{(fields) => (
				<fieldset>
					<For each={fields()}>
						{(field) => {
							const controlId = field.id ?? `${formId()}--${field.name}`;

							const labelComp =
								field.label && typeof field.label === "string" ? (
									<label for={field.name}>{field.label}</label>
								) : !field.label ? null : typeof field.label === "string" ? (
									<Label for={field.name}>{field.label}</Label>
								) : (
									<Label {...field.label} for={field.name} />
								);

							return (
								<div>
									{labelComp}
									{field.ft === "textarea" ? (
										<TextAreaField {...field} id={controlId} />
									) : field.ft === "select" ? (
										<SelectField {...field} id={controlId} />
									) : field.ft === "checkbox" ? (
										<CheckboxField {...field} id={controlId} />
									) : field.ft === "radio-group" ? (
										<RadioGroupField {...field} id={controlId} />
									) : (
										<InputField {...field} id={controlId} />
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
					const values: any = {};
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
				isSubmitPending() ? "pending" : otherProps.error ? "dirty" : isIdle() ? "idle" : "submitted"
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
