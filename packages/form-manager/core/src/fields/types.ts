import type {
	DeepFieldNodePathEntry,
	FieldNodeConfigValidationEvent,
	NestedPath,
	NestedPathValue,
	ValuesShape,
} from "#shared/types";
import type { ValidationAllowedOnEvents } from "#types";
import type { FieldPathToError } from "./errors/types";
import type { FieldNode } from "./shape/types";

export interface FormManagerFields<
	FieldsShape extends FieldNode,
	Values extends ValuesShape,
> {
	/**
	 * The structure/shape of the form fields, mirroring the values shape
	 * It's in a Trie/Tree like structure/shape for optimal path-based access and operations
	 * So the user/dev can easily traverse and manipulate the structure/shape if needed
	 * For example, to get the field config for a specific path
	 *
	 * ```ts
	 * const fieldConfig = formManager.fields.shape.user.name;
	 * ```
	 * But to get the field config you will need to access it using `fnConfigKey`
	 *
	 * ```ts
	 * import { fnConfigKey } from "@de100/form-manager-core/constants";
	 * const fieldConfig = formManager.fields.shape.user.name[fnConfigKey];
	 *
	 * ```ts
	 * This is done to avoid name collisions with potential field names
	 * and to make it clear that this is a special property
	 * that holds the field configuration and metadata
	 *
	 * ```ts
	 * const fieldConfig = formManager.fields.shape.user.name[fnConfigKey];
	 * console.log(fieldConfig.validation);
	 * ```
	 */
	shape: FieldsShape;

	// // Important for performance - tracks what's actually changed
	/** 🔹 State sets (performance: track only what's changed) */
	modified: Set<NestedPath<FieldsShape>>;
	dirty: Set<NestedPath<FieldsShape>>;
	touched: Set<NestedPath<FieldsShape>>;
	validating: Set<NestedPath<FieldsShape>>;
	/** 🔹 Focus state */
	focused: NestedPath<FieldsShape> | null; // | "custom";

	/** 🔹 Errors */
	errors: {
		/** Current errors mapped by field/schema */
		current: FieldPathToError<FieldsShape>;
		/** Count of current errors */
		count: number;
		/** First error path (if any) */
		first?: NestedPath<FieldsShape> | null;

		/** Parses an error into the internal structure */
		parse?: (props: { error: unknown; path?: NestedPath<FieldsShape> }) => void;
		/** Formats an error into a user-facing string */
		format?: (
			error: unknown,
			validationEvent: FieldNodeConfigValidationEvent,
		) => string;
	};

	computeIsDirty: <T extends FieldNode>(
		props: DeepFieldNodePathEntry<T>,
	) => boolean;

	/** 🔹 Derived flags (booleans derived from sets above) */
	isDirty: boolean;
	isTouched: boolean;
	isValidating: boolean;
	isFocused: boolean;
	isBlurred: boolean;
	isError: boolean;

	/** 🔹 Parsing & formatting */
	parse?: <Name extends NestedPath<Values>>(
		name: Name,
		value: any,
		metadata?: { customEvent?: string },
	) => NestedPathValue<Values, Name>;
	format?: <Name extends NestedPath<Values>>(
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
		allowedOnEvent: ValidationAllowedOnEvents<FieldsShape, Values>;

		// /** Validate a single field */
		// validateOne: <T extends NestedPath<Values>>(props: {
		// 	// name: T;
		// 	// validationEvent?: FieldNodeConfigValidationEvent;
		// 	// force?: boolean;
		// }) => Promise<NestedPathValue<FieldsShape, T> | null>;

		// /** Validate multiple fields */
		// validateMany: <T extends NestedPath<Values>>(
		// 	// names: T[],
		// 	// validationEvent?: FieldNodeConfigValidationEvent,
		// 	// force?: boolean,
		// ) => Promise<{ [K in T]: NestedPathValue<FieldsShape, K> | null }>;

		// /** Validate the entire form */
		// validateAll: (
		// 	// validationEvent?: FieldNodeConfigValidationEvent,
		// 	// force?: boolean,
		// ) => Promise<FieldsShape | null>;
	};
}
