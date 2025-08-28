// @ts-nocheck

// form-manger/under-discussion-todo/trie.ts
import type { FormManagerError } from "../form-manger/errors.ts";
import type { FormFieldOptions } from "../form-manger/field-options.ts";
import type { FormManager } from "../form-manger/index.ts";
import type {
	FormValidationEvent,
	NestedPath,
	NestedPathValue,
	ValuesShape,
} from "../shared.ts";

/**
 * Represents a node in the path trie structure
 */
export interface PathTrieNode<Values extends ValuesShape, Schema> {
	/** Map of child nodes keyed by property name */
	children: Map<string, PathTrieNode<Values, Schema>>;

	/** The original path string that led to this node */
	path?: string;

	/**
	 * Subscribers that want to be notified when this path or its descendants change
	 * Used for conditions, dependent validations, etc.
	 */
	subscribers?: Set<{
		id: string;
		callback: (path: string, value: any) => void;
	}>;

	/**
	 * Field-specific metadata stored at this node
	 */
	fieldMeta?: {
		/** Fields that depend on this path's value */
		dependents?: Set<NestedPath<Values>>;

		/** Fields that this path depends on */
		dependencies?: Set<NestedPath<Values>>;

		/** Conditions that use this path */
		conditions?: Set<string>;

		/** Validation rules that need this path's value */
		validations?: Set<string>;
	};
}

/**
 * Path operations available in the form manager
 */
export interface PathOperations<Values extends ValuesShape, Schema> {
	/**
	 * Register a field path in the trie structure
	 * @param path The dot-notation path to register
	 */
	registerPath: (path: NestedPath<Values>) => void;

	/**
	 * Find all descendant paths of a given path
	 * e.g., finding all fields under "users.0"
	 * @param basePath The parent path to find descendants for
	 * @returns Array of full path strings
	 */
	findDescendants: (basePath: string) => NestedPath<Values>[];

	/**
	 * Subscribe to changes on a specific path or pattern
	 * @param path The path to watch for changes
	 * @param callback Function to call when the path changes
	 * @returns Unsubscribe function
	 */
	subscribePath: <T extends NestedPath<Values>>(
		path: T,
		callback: (value: NestedPathValue<Values, T>) => void,
	) => () => void;

	/**
	 * Register a dependency relationship between fields
	 * @param dependent The field that depends on others
	 * @param dependencies The fields it depends on
	 */
	registerDependency: (
		dependent: NestedPath<Values>,
		dependencies: NestedPath<Values> | NestedPath<Values>[],
	) => void;

	/**
	 * Get all fields that depend on a given field
	 * @param path The field path to check dependents for
	 * @returns Set of dependent field paths
	 */
	getDependents: (path: NestedPath<Values>) => Set<NestedPath<Values>>;

	/**
	 * Batch process all array items at a given path
	 * @param arrayPath Path to the array
	 * @param operation Function to apply to each item
	 */
	forEachArrayItem: (
		arrayPath: NestedPath<Values>,
		operation: (itemPath: string, index: number) => void,
	) => void;
}

/**
 * Condition management types
 */
export interface ConditionDefinition<Values extends ValuesShape> {
	id: string;
	dependencies: NestedPath<Values>[];
	evaluate: (values: Values) => boolean;
	targets: Array<{
		field: NestedPath<Values>;
		action: "show" | "hide" | "enable" | "disable" | "require" | "unrequire";
	}>;
}

/**
 * Builder interface for condition actions
 */
interface ConditionBuilder<Values extends ValuesShape> {
	/**
	 * Define action for a field when condition is true
	 */
	/**
	 * Define actions to take when condition is true
	 * @param field Target field
	 * @param action Action to apply
	 * @returns Unregister function
	 */
	then<F extends NestedPath<Values>>(
		field: F,
		action: "show" | "hide" | "enable" | "disable" | "require" | "unrequire",
	): ConditionBuilder<Values>;

	/**
	 * Complete condition registration and return unregister function
	 */
	register(): () => void;
}

export interface ConditionManager<Values extends ValuesShape> {
	/**
	 * Register a new condition
	 * @param dependencies Fields the condition depends on
	 * @param evaluate Function to evaluate the condition
	 * @returns A condition builder
	 */

	/**
	 * Register a condition based on a single dependency
	 */
	when<T extends NestedPath<Values>>(
		dependency: T,
		evaluate: (value: NestedPathValue<Values, T>) => boolean,
	): ConditionBuilder<Values>;

	/**
	 * Register a condition based on multiple dependencies
	 */
	whenMany<T extends NestedPath<Values>[]>(
		dependencies: [...T],
		evaluate: (
			values: { [K in T[number]]: NestedPathValue<Values, K> },
		) => boolean,
	): ConditionBuilder<Values>;

	/**
	 * Get the current state for a field based on all applicable conditions
	 * @param field Field to check state for
	 * @returns Current field state
	 */
	getFieldState: <T extends NestedPath<Values>>(
		field: T,
	) => {
		hidden: boolean;
		disabled: boolean;
		required: boolean;
	};
}

/**
 * Enhanced validation options
 */
export interface EnhancedValidationOptions<
	Value,
	ValidValue,
	Values extends ValuesShape,
> {
	/** Existing validation properties */
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
		[key in FormValidationEvent]?: boolean;
	};

	/** Fields that should trigger validation of this field */
	/**
	 * Fields that should trigger validation of this field
	 * Can be a single field or multiple fields
	 */
	deps?: NestedPath<Values> | NestedPath<Values>[];

	/**
	 * Advanced dependency validation
	 * Allows custom validation based on specific dependency changes
	 */
	dependentValidation?: {
		[Key in NestedPath<Values>]?: (
			fieldValue: Value,
			dependencyValue: NestedPathValue<Values, Key>,
			values: Values,
		) => ValidValue | Promise<ValidValue>;
	};

	/** When to validate this field */
	mode?: FormValidationEvent | "onChange";

	/** Debounce time for async validation (ms) */
	asyncDebounceMs?: number;

	/** Custom function to determine if validation should run */
	shouldValidate?: (values: Values) => boolean;
}

/**
 * Enhanced FormFieldOptions with updated validation
 */
export interface EnhancedFormFieldOptions<
	Values extends ValuesShape,
	Key extends NestedPath<Values>,
	Value,
	ValidValue,
> extends Omit<FormFieldOptions<Values, Key, Value, ValidValue>, "validation"> {
	validation?: EnhancedValidationOptions<Value, ValidValue, Values>;
}

/**
 * Enhanced form manager with path operations
 */
export interface EnhancedFormManager<
	Values extends ValuesShape,
	Schema,
	SubmissionResult = unknown,
	SubmissionError = unknown,
> extends FormManager<Values, Schema, SubmissionResult, SubmissionError> {
	/** Path management operations */
	paths: PathOperations<Values, Schema>;

	/** Condition management */
	conditions: ConditionManager<Values>;

	/** Enhanced field access with trie-based optimizations */
	fields: {
		/** Existing field properties */
		options: {
			[Key in NestedPath<Values>]?: EnhancedFormFieldOptions<
				Values,
				Key,
				NestedPathValue<Values, Key>,
				NestedPathValue<Schema, Key>
			>;
		};
		modified: Set<NestedPath<Values>>;
		errors: { [Path in NestedPath<Schema>]?: FormManagerError<Path> };
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
		parser: <Name extends NestedPath<Values>>(
			name: Name,
			value: any,
			metadata?: { customEvent?: string },
		) => NestedPathValue<Values, Name>;
		getOptions: <Path extends NestedPath<Values>>(
			path: Path,
		) => EnhancedFormFieldOptions<
			Values,
			Path,
			NestedPathValue<Values, Path>,
			NestedPathValue<Schema, Path>
		>;
	};

	/** Enhanced validation with dependency tracking */
	validation: {
		validateField: <T extends NestedPath<Values>>(name: T) => Promise<boolean>;
		validateForm: () => Promise<boolean>;
		setError: <T extends NestedPath<Schema>>(
			name: T,
			error: { message: string; validationEvent: FormValidationEvent } | null,
		) => void;
		clearErrors: (names?: NestedPath<Schema>[]) => void;
	};
}

/**
 * Implementation Notes:
 *
 * 1. Path Trie Construction:
 * - Build the trie on-demand as paths are registered
 * - When a path like "users.0.name" is registered:
 *   - Split into ["users", "0", "name"]
 *   - "0" is detected as a number and replaced with ARRAY_ITEM_TOKEN in the trie
 *   - Store the original path at the leaf node for reference
 *
 * 2. Dependency Tracking:
 * - When field A depends on field B:
 *   - Add B to A's dependencies
 *   - Add A to B's dependents
 *   - When B changes, notify all its dependents
 *
 * 3. Condition Evaluation:
 * - Register conditions with their dependencies
 * - When any dependency changes, re-evaluate the condition
 * - Apply actions based on the result
 *
 * 4. Array Operations:
 * - Use the trie to efficiently find all descendant paths
 * - When removing/inserting array items, adjust all affected paths
 *
 * 5. Performance Optimizations:
 * - Only build trie nodes for paths that are actually used
 * - Use efficient path lookups rather than string operations
 * - Cache evaluation results when appropriate
 */

/**
 *
 * ## Note after the update to support multiple dependencies for conditions and validations
 *
 * This enhanced type system provides explicit and type-safe support for multiple dependencies, making complex form logic easier to implement and maintain.
 *
 * It allows defining conditions based on multiple fields, specifying actions to take when conditions are met, and managing field states (like visibility, enabled/disabled, required/unrequired) in a clear and structured way.
 */
