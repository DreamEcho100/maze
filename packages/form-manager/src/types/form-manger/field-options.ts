// form-manger/field-options.ts

import type {
	FormValidationEvent,
	NestedPath,
	ValuesShape,
} from "../shared.ts";
import type { FormManagerError } from "./errors.ts";

interface SuccessResult<Output> {
	/** The typed output value. */
	readonly value: Output;
	/** The non-existent issues. */
	readonly issues?: undefined;
}

/** The result interface if validation fails. */
interface FailureResult<Path extends string> {
	/** The issues of failed validation. */
	readonly issues: ReadonlyArray<FormManagerError<Path>>;
}
type ValidationResult<Path extends string, ValidValue> =
	| SuccessResult<ValidValue>
	| FailureResult<Path>;

// import { StandardSchemaV1 } from "@standard-schema/spec";
// Awaited<
// 	ReturnType<StandardSchemaV1<ValidValue>["~standard"]["validate"]>
// >;

// /** The path segment interface of the issue. */
// interface PathSegment {
// 	/** The key representing a path segment. */
// 	readonly key: PropertyKey;
// }
// interface Issue<Path extends string> {
// 	/** The error message of the issue. */
// 	readonly message: string;
// 	/** The path of the issue, if any. */
// 	readonly path: Path; // ReadonlyArray<PropertyKey | PathSegment> | undefined;
// 	/** The validation event that triggered the issue, if any. */
// 	readonly validationEvent: ValidationEvents;
// }

// import z from "zod";
// const t = await (z.object({ id: z.number(), completed: z.boolean() })["~standard"].validate({}));
// if (t.issues) {
// 	t.issues[0].path
// }

export interface FormFieldOptions<
	Values extends ValuesShape,
	Path extends NestedPath<Values>,
	Value,
	ValidValue,
> {
	name: Path & string;
	validation?: {
		nativeRules?: {
			required?: boolean | string;
			min?: number | string | { value: number | string; message: string };
			max?: number | string | { value: number | string; message: string };
			pattern?: RegExp | { value: RegExp; message: string };
			minLength?: number | { value: number; message: string };
			maxLength?: number | { value: number; message: string };
		};
		validate?: // |
		(
			value: any,
			values: Values,
		) =>
			| ValidationResult<Path, ValidValue>
			| Promise<ValidationResult<Path, ValidValue>>;
		// | {
		// 		[key: string]: ( // `key` can be the name of the validation rule
		// 			value: any,
		// 			values: Values,
		// 		) => ValidValue | Promise<ValidValue>;
		//   };
		allowedOnEvent?: {
			[key in FormValidationEvent]?: boolean;
		};
		// deps?: NestedPath<Values>[]; // Fields that trigger validation of this field
		// mode?: ValidationEvents | "onChange";
		// asyncDebounceMs?: number;
		// shouldValidate?: (values: Values) => boolean;
	};
	// // Q: Is the following necessary, given that we have initialValues in the form store? which is better? and is there a better way to handle this?
	// //
	// // The following will initially be a getter that will cache the initial value for subsequent calls
	// // The cached value is stored in the form store locally so it can be invalidated or changed when needed
	// // (e.g. when the form is reset with new initial values)
	// // Other approach is it a getter initially, and then becomes a normal value after the first call, still will interact with the form store to be updated when needed somehow _(not sure how yet)_
	// // Or we can just have it as a normal value that is set when the form store
	// initialValue: Value;
	// defaultValue is what the field wants by itself; initialValue is form-level snapshot
	defaultValue: Value;
	parser?: (value: any, metadata?: { customEvent?: string }) => Value;
	isDisabled?: boolean;
	isDirty?: boolean;
	isTouched?: boolean;
	isValidating?: boolean;
	events?: {
		onInput?: (value: Value) => void;
		onBlur?: () => void;
		onFocus?: () => void;
	};
	// focus: <T extends NestedPath<Values>>(name: T) => void;
	isFocused?: boolean;
	tabIndex?: number;
}
