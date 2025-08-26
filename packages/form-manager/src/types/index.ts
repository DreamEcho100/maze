type NestedPath<Obj, Path extends string | number = ""> = {
	[Key in keyof Obj]: Obj[Key] extends object
		? `${Path}${Key & string}` | NestedPath<Obj[Key], `${Path}${Key & string}.`>
		: `${Path}${Key & string}`;
}[keyof Obj];

type NestedPathValue<
	Obj,
	Path extends string = NestedPath<Obj>,
> = Path extends `${infer Key}.${infer Rest}`
	? Key extends keyof Obj
		? Rest extends NestedPath<Obj[Key]>
			? NestedPathValue<Obj[Key], Rest>
			: never
		: never
	: Path extends keyof Obj
		? Obj[Path]
		: never;

// const testHierarchicalPath: NestedPath<{
// 	a: { b: { c: number } };
// 	d: string;
// }> = "a.b";
// const testHierarchicalKeyValuePair: NestedPathValue<{
// 	a: { b: { c: number } };
// 	d: string;
// }> = { c: 5 };

export type ValidationEvents = "onBlur" | "onInput" | "onSubmit";

type ValuesShape = Record<string, any>;
// type SchemaShape = Record<string, any>;

interface FormFieldOptions<Value, ValidValue, Values extends ValuesShape> {
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
	parser?: (value: any, metadata?: { customEvent?: string }) => Value;
	isDisabled?: boolean;
	isDirty?: boolean;
	isTouched?: boolean;
	isValidating?: boolean;
	defaultValue?: ValidValue;
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

type FormMangerErrors<Schema> = {
	[Key in NestedPath<Schema>]?: {
		name: Key;
		message: string | null;
		validationEvent: ValidationEvents;
	};
};

type Submission<
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
	values: Values;
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
			[Key in NestedPath<Values>]?: FormFieldOptions<
				NestedPathValue<Values, Key>,
				NestedPathValue<Schema, Key>,
				Values
			>;
		};
		// Important for performance - tracks what's actually changed
		modified: Set<NestedPath<Values>>;
		errors: FormMangerErrors<Schema>;
		dirty: Set<NestedPath<Values>>;
		touched: Set<NestedPath<Values>>;
		validating: Set<NestedPath<Values>>;
		focus: {
			setFocus: <T extends NestedPath<Values>>(name: T) => void;
			getFirstError: () => NestedPath<Schema> | undefined;
			focusFirstError: () => void;
			tabOrder: NestedPath<Values>[];
			setTabOrder: (order: NestedPath<Values>[]) => void;
			isFocused: (name: NestedPath<Values>) => boolean;
			isBlurred: (name: NestedPath<Values>) => boolean;
		};
		isDirty: boolean;
		isTouched: boolean;
		isValidating: boolean;
		// isFocused: (name: NestedPath<Values>) => boolean;
		// isDisabled: (name: NestedPath<Values>) => boolean;
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

/**
 * # Todos:
 * - [ ] Add support for field arrays utility methods
 * - [ ] Add support for conditions
 * 	- [ ] For fields conditions maybe use the `Trie` data structure to efficiently store and evaluate conditions?
 * 	- [ ] For validation conditions maybe use a simple dependency graph to track which fields depend on which other fields?
 */

// interface FormMangerWithFieldArrays<Values extends ValuesShape> {
// 	fieldArrays: {
// 		[Key in NestedPath<Values>]?: {
//			// For efficient rendering in Solid.js
//			keys: string[]; // Stable keys for each array item
//			getItemPath: (index: number) => string;
// 			fields: Array<{ id: string; index: number }>;
// 			append: (value: NestedPathValue<Values, Key>[number]) => void;
// 			prepend: (value: NestedPathValue<Values, Key>[number]) => void;
// 			insert: (
// 				index: number,
// 				value: NestedPathValue<Values, Key>[number],
// 			) => void;
// 			remove: (index?: number | number[]) => void;
// 			move: (from: number, to: number) => void;
// 			swap: (indexA: number, indexB: number) => void;
// 			update: (
// 				index: number,
// 				value: NestedPathValue<Values, Key>[number],
// 			) => void;
// 			replace: (values: NestedPathValue<Values, Key>) => void;
// 			fields: Array<{ index: number; key: string }>;
// 		};
// 	};
// }

// // Add to FormManger interface
// conditions: {
//   when: <T extends NestedPath<Values>>(
//     dependsOn: T | T[],
//     condition: (values: Record<T, NestedPathValue<Values, T>>) => boolean
//   ) => {
//     then: <F extends NestedPath<Values>>(
//       field: F,
//       action: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'unrequire'
//     ) => void;
//   }
// };

// // Add to FormManger interface
// conditions: {
//   // Register condition once, evaluate efficiently
//   register: <T extends NestedPath<Values>>(
//     dependsOn: T | T[],
//     condition: (values: Record<T, NestedPathValue<Values, T>>) => boolean,
//     actions: Array<{
//       field: NestedPath<Values>,
//       action: 'show' | 'hide' | 'enable' | 'disable' | 'require' | 'unrequire'
//     }>
//   ) => () => void; // Return unregister function

//   // Get current state for rendering
//   getFieldState: <T extends NestedPath<Values>>(
//     field: T
//   ) => {
//     hidden: boolean;
//     disabled: boolean;
//     required: boolean;
//   };
// };

// 2. Validation Optimization
// // Add to FormFieldOptions
// validation?: {
//   // ...existing validation
//   deps?: NestedPath<Values>[]; // Fields that should trigger this field's validation
//   mode?: ValidationEvents | "onChange";
//   asyncDebounceMs?: number; // For performance with async validation
// };

// // Add to FormManger interface
// validation: {
//   validateField: <T extends NestedPath<Values>>(name: T) => Promise<boolean>;
//   validateForm: () => Promise<boolean>;
//   setError: <T extends NestedPath<Schema>>(
//     name: T,
//     error: { message: string; validationEvent: ValidationEvents } | null
//   ) => void;
//   clearErrors: (names?: NestedPath<Schema>[]) => void;
// };

// 3. Performance Optimizations
// // Add to FormManger interface
// internals: {
//   // For performance - prevent unnecessary re-renders
//   isDirtyMap: Map<NestedPath<Values>, boolean>;
//   isTouchedMap: Map<NestedPath<Values>, boolean>;
//   isValidatingMap: Map<NestedPath<Values>, boolean>;

//   // For tracking dependencies between fields
//   dependencyGraph: Map<NestedPath<Values>, Set<NestedPath<Values>>>;

//   // Batch updates for better performance
//   batch: (fn: () => void) => void;
// };
