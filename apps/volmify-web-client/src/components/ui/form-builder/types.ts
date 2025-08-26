import type { JSX } from "solid-js";

// Solid.js + TypeScript

export type LabelProps = JSX.LabelHTMLAttributes<HTMLLabelElement>;

interface FormFieldBaseProps {
	label?: string | LabelProps;
	name: string;
	description?: string | JSX.HTMLAttributes<HTMLDivElement>;
}

export type InputFieldProps = JSX.InputHTMLAttributes<HTMLInputElement>;

export type TextAreaFieldProps =
	JSX.TextareaHTMLAttributes<HTMLTextAreaElement>;

export interface SelectFieldProps
	extends JSX.SelectHTMLAttributes<HTMLSelectElement> {
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

export type CheckboxFieldProps = JSX.InputHTMLAttributes<HTMLInputElement> & {};

export interface RadioGroupFieldProps
	extends JSX.FieldsetHTMLAttributes<HTMLFieldSetElement> {
	options: ({
		ft?: "radio";
		label: string;
		value: string;
	} & JSX.InputHTMLAttributes<HTMLInputElement>)[];
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

export interface FormDescriptionProps
	extends Omit<JSX.HTMLAttributes<HTMLDivElement>, "style"> {
	id?: string;
	generateId?: () => string | undefined;
	style?: JSX.CSSProperties;
}

export type HandleOnReset = (
	el: HTMLFormElement,
	accessor?: (() => () => void) | undefined,
) => void;

export interface FormBuilderProps
	extends Omit<
		JSX.FormHTMLAttributes<HTMLFormElement>,
		"onSubmit" | "children"
	> {
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
