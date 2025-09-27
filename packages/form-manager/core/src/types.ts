// form-manger/index.ts

import type { FormApiFields } from "#fields/types.ts";
import type { FieldError, FieldPathToError } from "./fields/errors/types.ts";
import type { FieldNode } from "./fields/shape/types.ts";
import type {
	DeepFieldNodePath,
	DeepFieldNodePathEntry,
	FieldNodeConfigValidationEvent,
	NestedPath,
	NestedPathValue,
	ValuesShape,
} from "./shared/types.ts";

// TODO: add a metadata that the user can optionally add to it's types
// to improve the experience of the form manager
// `isUpdatingFieldsValueOnError`/`forceUpdateFieldsValueOnError`

export type Submit<
	FieldsShape extends FieldNode,
	Values extends ValuesShape,
	SubmitResult = unknown,
	SubmitError = unknown,
> = {
	cb: <T>(params: {
		values: Values;
		validatedValues: FieldsShape;
		formApi: FormApi<FieldsShape, Values, SubmitResult, SubmitError>;
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
			result: SubmitResult;
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

export interface Config {
	maxDepthForNestedPath: 1000;
}

export interface ValidationAllowedOnEventConfig<
	FieldsShape extends FieldNode,
	Values extends ValuesShape,
> {
	isActive: boolean;
	ifOnlyHasError?: boolean;
	delay?:
		| number
		| ((
				props: DeepFieldNodePathEntry<FieldsShape> & {
					field: DeepFieldNodePathEntry<FieldsShape>;
					fieldPath: DeepFieldNodePath<FieldsShape>;
					values: Values;
					formApi: FormApi<FieldsShape, Values>;
					error: FieldPathToError<FieldsShape> | null;
				},
		  ) => number);
}

export type ValidationAllowedOnEvents<
	FieldsShape extends FieldNode,
	Values extends ValuesShape,
> = {
	[key in FieldNodeConfigValidationEvent]: ValidationAllowedOnEventConfig<
		FieldsShape,
		Values
	>;
};

export interface FormApi<
	FieldsShape extends FieldNode,
	Values extends ValuesShape,
	SubmitError = unknown,
	SubmitResult = unknown,
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

		// /** Get a value by nested path */
		// get: <T extends NestedPath<Values>>(name: T) => NestedPathValue<Values, T>;

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
			validationName?: keyof FieldsShape,
		) => void;

		// /** Fully typed if path is literal, fallback to any if dynamic */
		// get<P extends Path<TValues>>(path: P): PathValue<TValues, P>;
		// get(path: string): any; // escape hatch for runtime dynamic paths

		// set<P extends Path<TValues>>(path: P, value: PathValue<TValues, P>): void;
		// set(path: string, value: any): void;
	};

	/** 🔹 Submit domain
	 * This is the main state of the form submit
	 */
	submit: Submit<FieldsShape, Values, SubmitResult, SubmitError> | null;

	/** 🔹 Fields domain
	 * This is the main state of the form fields and their metadata
	 */
	fields: FormApiFields<FieldsShape, Values>;

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
