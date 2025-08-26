import type { NestedPath, ValidationEvents, ValuesShape } from "../shared.ts";

export interface FormFieldOptions<
	Value,
	Key extends NestedPath<Values>,
	ValidValue,
	Values extends ValuesShape,
> {
	name: Key & string;
	validation?: {
		nativeRules?: {
			required?: boolean | string;
			min?: number | string | { value: number | string; message: string };
			max?: number | string | { value: number | string; message: string };
			pattern?: RegExp | { value: RegExp; message: string };
			minLength?: number | { value: number; message: string };
			maxLength?: number | { value: number; message: string };
		};
		validate?:
			| ((value: any, values: Values) => ValidValue | Promise<ValidValue>)
			| {
					[key: string]: (
						value: any,
						values: Values,
					) => ValidValue | Promise<ValidValue>;
			  };
		allowedOnEvent?: {
			[key in ValidationEvents]?: boolean;
		};
		// deps?: NestedPath<Values>[]; // Fields that trigger validation of this field
		// mode?: ValidationEvents | "onChange";
		// asyncDebounceMs?: number;
		// shouldValidate?: (values: Values) => boolean;
	};
	// Q: Is the following necessary, given that we have initialValues in the form store? which is better? and is there a better way to handle this?
	//
	// The following will initially be a getter that will cache the initial value for subsequent calls
	// The cached value is stored in the form store locally so it can be invalidated or changed when needed
	// (e.g. when the form is reset with new initial values)
	// Other approach is it a getter initially, and then becomes a normal value after the first call, still will interact with the form store to be updated when needed somehow _(not sure how yet)_
	// Or we can just have it as a normal value that is set when the form store
	initialValue: Value;
	defaultValue?: Value; // Q: or `ValidValue`?
	parser?: (value: any, metadata?: { customEvent?: string }) => Value;
	isDisabled?: boolean;
	isDirty?: boolean;
	isTouched?: boolean;
	isValidating?: boolean;
	events?: {
		onInput?: (event: { target: { value: any } }) => void;
		onBlur?: () => void;
		onFocus?: () => void;
	};
	shouldFocusOnError?: boolean;
	shouldValidateOnMount?: boolean;
	// focus: <T extends NestedPath<Values>>(name: T) => void;
	isFocused?: boolean;
	tabIndex?: number;
}
