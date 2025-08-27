// form-manger/index.ts

import type {
	FormValidationEvent,
	NestedPath,
	NestedPathValue,
	ValuesShape,
} from "../shared.ts";
import type { FormManagerError } from "./errors.ts";
import type { FormFieldOptions } from "./field-options.ts";

// TODO: add a metadata that the user can optionally add to it's types
// to improve the experience of the form manager
// `isUpdatingFieldsValueOnError`/`forceUpdateFieldsValueOnError`

export type Submission<
	Values extends ValuesShape,
	Schema,
	SubmissionResult = unknown,
	SubmissionError = unknown,
> = {
	cb: <T>(params: {
		values: Values;
		validatedValues: Schema;
		formManager: FormManager<Values, Schema, SubmissionResult, SubmissionError>;
	}) => T | Promise<T>;
	retry: () => void;
	count: number;
	idleCount: number;
	submittingCount: number;
	successCount: number;
	errorCount: number;
} & (
	| {
			state: "idle";
			error: null;
			result: null;
			isSubmitting: false;
			isDirty: boolean;
			isValid: boolean;
	  }
	| {
			state: "submitting";
			error: null;
			result: null;
			isSubmitting: true;
			isDirty: boolean;
			isValid: boolean;
	  }
	| {
			state: "success";
			error: null;
			result: SubmissionResult;
			isSubmitting: false;
			isDirty: boolean;
			isValid: boolean;
	  }
	| {
			state: "error";
			error: Error;
			result: null;
			isSubmitting: false;
			isDirty: boolean;
			isValid: boolean;
	  }
);

export interface FormManager<
	Values extends ValuesShape,
	Schema,
	SubmissionResult = unknown,
	SubmissionError = unknown,
> {
	/** 🔹 Unique identity for the form instance */
	baseId: string;

	/** 🔹 Values domain */
	values: {
		/** The current values of the form */
		current: Values;

		/** The initial values of the form */
		initial: Values;

		/** Whether values are still being loaded (e.g. async defaults) */
		isLoading: boolean;

		/** Get a value by nested path */
		get: <T extends NestedPath<Values>>(name: T) => NestedPathValue<Values, T>;

		// Todo: support string paths with type safety
		// get<Path extends NestedPath<Values>>(path: Path): NestedPathValue<Values, Path>;
		// get<T = unknown>(path: string): T;

		// 2. How TanStack Form does it
		// TanStack Form (v1 beta, Nate’s new rewrite) uses proxy-based APIs + generics. The key method is:
		// form.getField(path)
		// with overloads:
		// getField<P extends FieldPath<TValues>>(path: P): FieldApi<PathValue<TValues, P>>;
		// getField(path: string): FieldApi<any>;
		// Where:
		// FieldPath<TValues> is very similar to our Path<T> above.
		// FieldApi<Value> is a tiny object that wraps field state (value, error, setValue, etc).
		/*
		type Values = {
			user: {
				name: string;
				tags: string[];
			};
		};

		const form = createForm<Values>();

		// fully typed
		const nameField = form.getField("user.name");
		nameField.value; // string
		nameField.setValue("hi"); // ✅ string only

		// array indexing
		const firstTag = form.getField("user.tags.0");
		firstTag.value; // string

		// escape hatch
		const someField = form.getField("user." + Math.random());
		someField.value; // any
		*/

		/** Set a value by nested path */
		set: <Name extends NestedPath<Values>>(
			name: Name,
			valueOrUpdater:
				| ((
						value: NestedPathValue<Values, Name>,
				  ) => NestedPathValue<Values, Name>)
				| NestedPathValue<Values, Name>,
			validationName?: keyof Schema,
		) => void;

		// /** Fully typed if path is literal, fallback to any if dynamic */
		// get<P extends Path<TValues>>(path: P): PathValue<TValues, P>;
		// get(path: string): any; // escape hatch for runtime dynamic paths

		// set<P extends Path<TValues>>(path: P, value: PathValue<TValues, P>): void;
		// set(path: string, value: any): void;
	};

	/** 🔹 Submission domain
	 * This is the main state of the form submission
	 */
	submission: Submission<
		Values,
		Schema,
		SubmissionResult,
		SubmissionError
	> | null;

	/** 🔹 Fields domain
	 * This is the main state of the form fields and their metadata
	 */
	fields: {
		/** Options for each field, lazily created when accessed */
		options: {
			[Path in NestedPath<Values>]?: FormFieldOptions<
				Values,
				Path,
				NestedPathValue<Values, Path>,
				NestedPathValue<Schema, Path>
			>;
		};

		/** Get (or lazily create) options for a field */
		getOptions: <Path extends NestedPath<Values>>(
			path: Path,
		) => FormFieldOptions<
			Values,
			Path,
			NestedPathValue<Values, Path>,
			NestedPathValue<Schema, Path>
		>;

		// // Important for performance - tracks what's actually changed
		/** 🔹 State sets (performance: track only what's changed) */
		modified: Set<NestedPath<Values>>;
		dirty: Set<NestedPath<Values>>;
		touched: Set<NestedPath<Values>>;
		validating: Set<NestedPath<Values>>;

		/** 🔹 Errors */
		// errors: FormManagerErrors<Schema>;
		// errorFormatter: (
		// 	error: unknown,
		// 	validationEvent: ValidationEvents,
		// ) => string;
		errors: {
			// /** Current errors mapped by field/schema */
			// current: FormManagerErrors<Schema>;

			// /** Formats an error into a user-facing string */
			// formatter: (error: unknown, validationEvent: ValidationEvents) => string;

			// // (optional) helpers you may want to add later:
			// // getFirst: () => NestedPath<Schema> | undefined;
			// hasErrors: boolean;

			/** Current errors mapped by field/schema */
			current: { [Path in NestedPath<Schema>]?: FormManagerError<Path> };
			/** Count of current errors */
			count: number;
			/** First error path (if any) */
			first?: NestedPath<Schema>;

			/** Parses an error into the internal structure */
			parse: (props: { error: unknown; path?: NestedPath<Schema> }) => void;
			/** Formats an error into a user-facing string */
			format: (error: unknown, validationEvent: FormValidationEvent) => string;
		};

		/** 🔹 Derived flags (booleans derived from sets above) */
		isDirty: boolean;
		isTouched: boolean;
		isValidating: boolean;
		isFocused: boolean;
		isBlurred: boolean;

		/** 🔹 Parsing & formatting */
		parse: <Name extends NestedPath<Values>>(
			name: Name,
			value: any,
			metadata?: { customEvent?: string },
		) => NestedPathValue<Values, Name>;
		format: <Name extends NestedPath<Values>>(
			name: Name,
			value: NestedPathValue<Values, Name>,
			metadata?: { customEvent?: string },
		) => any;
		// parser: <Name extends NestedPath<Values>>(
		// 	name: Name,
		// 	value: any,
		// 	metadata?: { customEvent?: string },
		// ) => NestedPathValue<Values, Name>;
		// // serializer

		/** 🔹 Validation */
		validation: {
			/** Rules per validation event */
			allowedOnEvent?: { [key in FormValidationEvent]?: boolean };

			/** Validate a single field */
			validateOne: <T extends NestedPath<Values>>(
				name: T,
				validationEvent?: FormValidationEvent,
				force?: boolean,
			) => Promise<NestedPathValue<Schema, T> | null>;

			/** Validate multiple fields */
			validateMany: <T extends NestedPath<Values>>(
				names: T[],
				validationEvent?: FormValidationEvent,
				force?: boolean,
			) => Promise<{ [K in T]: NestedPathValue<Schema, K> | null }>;

			/** Validate the entire form */
			validateAll: (
				validationEvent?: FormValidationEvent,
				force?: boolean,
			) => Promise<Schema | null>;
		};

		/** 🔹 Focus state */
		focus: {
			set: <T extends NestedPath<Values>>(name: T, isFocused: boolean) => void;
		} & (
			| { state: "focused"; name: NestedPath<Values> }
			| { state: "blurred"; name: null }
		);
	};

	/** 🔹 Reset domain */
	reset: (options?: {
		values?: Partial<Values>;
		initialValues?: Partial<Values>;
		keepValuesMode?: "merge" | "replace";
		keepInitialValuesMode?: "merge" | "replace";
		keepValues?:
			| boolean
			| { [Key in NestedPath<Values>]?: NestedPathValue<Values, Key> };
		keepInitialValues?: {
			[Key in NestedPath<Values>]?: NestedPathValue<Values, Key>;
		};
		keepErrors?: boolean | { [Key in NestedPath<Values>]?: boolean };
		keepDirty?: boolean | { [Key in NestedPath<Values>]?: boolean };
		keepTouched?: boolean | { [Key in NestedPath<Values>]?: boolean };
		keepValidating?: boolean | { [Key in NestedPath<Values>]?: boolean };
		// `keepModified` should always be derived from the `values` and `initialValues` and the `dirty` state
		// keepModified
	}) => void;

	// watch: {
	// 	<T extends NestedPath<Values>>(name: T): NestedPathValue<Values, T>;
	// 	<T extends NestedPath<Values>[]>(names: T): { [K in T[number]]: NestedPathValue<Values, K> };
	// 	(): Values;
	// };
}
