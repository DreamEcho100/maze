import type {
	NestedPath,
	NestedPathValue,
	ValidationEvents,
	ValuesShape,
} from "../shared.ts";
import type { FormMangerErrors } from "./errors.ts";
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
		formManager: FormManger<Values, Schema, SubmissionResult, SubmissionError>;
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

export interface FormManger<
	Values extends ValuesShape,
	Schema,
	SubmissionResult = unknown,
	SubmissionError = unknown,
> {
	baseId: string;
	values: Values;
	isLoadingValues: boolean;
	initialValues: Values;
	// Call it `fields` or `paths`
	getValue: <T extends NestedPath<Values>>(
		name: T,
	) => NestedPathValue<Values, T>;
	setValue: <Name extends NestedPath<Values>>(
		name: Name,
		valueOrUpdater:
			| ((
					value: NestedPathValue<Values, Name>,
			  ) => NestedPathValue<Values, Name>)
			| NestedPathValue<Values, Name>,
		validationName?: keyof Schema,
	) => void;
	// watch: {
	// 	<T extends NestedPath<Values>>(name: T): NestedPathValue<Values, T>;
	// 	<T extends NestedPath<Values>[]>(names: T): { [K in T[number]]: NestedPathValue<Values, K> };
	// 	(): Values;
	// };
	// This is the main state of the form fields and their metadata
	fields: {
		options: {
			// A fields options is specified by name path as key
			// And are lazily created when `getOptions` is called for the first time
			// Or when when the form manager is created with schema that
			// Q: Should it be wrapped with a proxy to lazily create options when accessed? how will it interact with Solid.js reactivity _(for example stores)_?
			[Path in NestedPath<Values>]?: FormFieldOptions<
				NestedPathValue<Values, Path>,
				Path,
				NestedPathValue<Schema, Path>,
				Values
			>;
		};
		// Important for performance - tracks what's actually changed
		modified: Set<NestedPath<Values>>;
		errors: FormMangerErrors<Schema>;
		errorFormatter: (
			error: unknown,
			validationEvent: ValidationEvents,
		) => string;
		// No need for `currentDirtyEventsCounter` here, since we can get the size of the `dirty` set
		dirty: Set<NestedPath<Values>>;
		touched: Set<NestedPath<Values>>;
		validating: Set<NestedPath<Values>>;
		focus:
			| {
					// getFirstError: () => NestedPath<Schema> | undefined;
					// focusFirstError: () => void;
					// tabOrder: NestedPath<Values>[];
					// setTabOrder: (order: NestedPath<Values>[]) => void;
					onFocus?: (name: NestedPath<Values>) => void;
					onBlur?: () => void;
			  }
			| (
					| {
							state: "focused";
							name: NestedPath<Values>;
					  }
					| {
							state: "blurred";
							name: null;
					  }
			  );
		isDirty: boolean;
		isTouched: boolean;
		isValidating: boolean;
		isFocused: boolean;
		isBlurred: boolean;
		setFocus: <T extends NestedPath<Values>>(
			name: T,
			isFocused: boolean,
		) => void;
		// is
		parser: <Name extends NestedPath<Values>>(
			name: Name,
			value: any,
			metadata?: { customEvent?: string },
		) => NestedPathValue<Values, Name>;
		// serializer
		// Important for performance - tracks what's actually changed
		getOptions: <Path extends NestedPath<Values>>(
			path: Path,
		) => FormFieldOptions<
			NestedPathValue<Values, Path>,
			Path,
			NestedPathValue<Schema, Path>,
			Values
		>;
	};
	// This is the main state of the form submission
	submission: Submission<
		Values,
		Schema,
		SubmissionResult,
		SubmissionError
	> | null;
	reset: (options?: {
		values?: Partial<Values>;
		initialValues?: Partial<Values>;
		keepValuesMode?: "merge" | "replace";
		keepInitialValuesMode?: "merge" | "replace";
		keepValues?:
			| boolean
			| {
					[Key in NestedPath<Values>]?: NestedPathValue<Values, Key>;
			  };
		keepInitialValues?: {
			[Key in NestedPath<Values>]?: NestedPathValue<Values, Key>;
		};
		keepErrors?:
			| boolean
			| {
					[Key in NestedPath<Values>]?: boolean;
			  };
		keepDirty?:
			| boolean
			| {
					[Key in NestedPath<Values>]?: boolean;
			  };
		keepTouched?:
			| boolean
			| {
					[Key in NestedPath<Values>]?: boolean;
			  };
	}) => void;
}
