import {
	fieldNodeConfigValidationEventsEnum,
	fnConfigKey,
} from "./constants.js";
import type { FieldNode, NeverFieldNode } from "./fields/shape/types.ts";
import type {
	DeepFieldNodePathEntry,
	FieldNodeConfigValidationEvent,
	FormFieldNodeConfigValidationEventsEnum,
	NeverRecord,
	PathSegmentItem,
	ValuesShape,
} from "./shared/types.ts";
import type {
	FormApi,
	ValidationAllowedOnEventConfig,
	ValidationAllowedOnEvents,
} from "./types.ts";

/*
Props to consider:

```ts
		onValuesChange?: (newValues: Values, prevValues: Values) => void;
		onFieldChange?: (
			fieldPath: string,
			fieldPathSegments: readonly (string | number)[],
			newFieldNode: FieldNode,
			prevFieldNode: FieldNode,
		) => void;
		onSubmit?: (
			values: Values,
			validatedValues: FieldsShape,
		) => SubmitResult | Promise<SubmitResult>;
		onSubmitError?: (
			error: SubmitError,
			values: Values,
			validatedValues: FieldsShape,
		) => void;
		onSubmitSuccess?: (
			result: SubmitResult,
			values: Values,
			validatedValues: FieldsShape,
		) => void;
		validateOn?: FieldNodeConfigValidationEvent[];
		validateOnSubmit?: boolean;
		validateOnChange?: boolean;
		validateOnBlur?: boolean;
		validateOnMount?: boolean;
		validateOnReset?: boolean;
		resetValuesOnSubmit?: boolean;
		resetValuesOnSuccess?: boolean;
		resetValuesOnError?: boolean;
		resetValuesOnUnmount?: boolean;
		removeFieldNodesOnReset?: boolean;
		removeFieldNodesOnUnmount?: boolean;
		disableFieldNodesOnUnmount?: boolean;
		disableFieldNodesOnReset?: boolean;
		enableReinitialize?: boolean;
		keepDirtyOnReinitialize?: boolean;
		keepErrorsOnReinitialize?: boolean;
		keepTouchedOnReinitialize?: boolean;
		keepIsValidOnReinitialize?: boolean;
		keepFieldNodesOnReinitialize?: boolean;
		keepDisabledOnReinitialize?: boolean;
		keepReadonlyOnReinitialize?: boolean;
		keepValuesOnReinitialize?: boolean;
		keepMetadataOnReinitialize?: boolean;
		metadata?: AnyRecord;
		isUpdatingFieldsValueOnError?: boolean;
		forceUpdateFieldsValueOnError?: boolean;
		isUpdatingFieldsValueOnSuccess?: boolean;
		forceUpdateFieldsValueOnSuccess?: boolean;
		isUpdatingFieldsValueOnReset?: boolean;
		forceUpdateFieldsValueOnReset?: boolean;
		isUpdatingFieldsValueOnReinitialize?: boolean;
		forceUpdateFieldsValueOnReinitialize?: boolean;
		isSubmitting?: boolean;
		submitCount?: number;
		idleCount?: number;
		submittingCount?: number;
		successCount?: number;
		errorCount?: number;
```
*/

// export type CreateFormApiValidationAllowedOnEventConfig<
// 	FieldsShape extends FieldNode,
// 	Values extends ValuesShape,
// > = {
// 	[key in FieldNodeConfigValidationEvent]: {
// 		// "smart" = only validate if field is dirty/touched/modified
// 		// "all" = always validate
// 		strategy: "smart" | "off" | "on";
// 		// isActive: boolean;
// 		delay?: number | ((fieldPath: NestedPath<FieldsShape>) => number);
// 		force?: boolean | ((fieldPath: NestedPath<FieldsShape>) => boolean);
// 	};
// };

// NOTE: need to implement a `get` and `set` for nested paths in values, like lodash `get` and `set`

// NOTE: Needed To use `NeverFieldNode` and `NeverRecord` as defaults to avoid TS errors of having infinite types

type ValidateOn<FieldsShape extends FieldNode, Values extends ValuesShape> =
	| undefined
	| boolean
	| "smart"
	| "smart/eager"
	| ValidationAllowedOnEvents<FieldsShape, Values>
	| ((
			event: FieldNodeConfigValidationEvent,
	  ) => ValidationAllowedOnEventConfig<FieldsShape, Values>);

const createValidationConfig = {
	smart: (event: FieldNodeConfigValidationEvent) => ({
		isActive: ["blur", "change", "submit", "custom"].includes(event),
		ifOnlyHasError: event === "change",
		delay: event === "change" ? 300 : 0,
	}),

	["smart/eager"]: (event: FieldNodeConfigValidationEvent) => ({
		isActive: ["blur", "change", "submit", "custom"].includes(event),
		ifOnlyHasError: event === "change",
		delay: undefined, // No delay
	}),

	function: (
		event: FieldNodeConfigValidationEvent,
		validateOnFn: (
			event: FieldNodeConfigValidationEvent,
		) => ValidationAllowedOnEventConfig<any, any>,
	) => {
		const config = validateOnFn(event);
		config.delay ??= undefined;
		return config;
	},

	object: (
		event: FieldNodeConfigValidationEvent,
		validateOnObj: ValidationAllowedOnEvents<any, any>,
	) => {
		if (event in validateOnObj) {
			const config = validateOnObj[event];
			config.delay ??= undefined;
			return config;
		}
		return {
			isActive: false,
			ifOnlyHasError: false,
			delay: undefined,
		};
	},

	fallback: (
		validateOn:
			| boolean
			| "smart"
			| "smart/eager"
			| ValidationAllowedOnEvents<any, any>
			| undefined,
	) => {
		const config =
			typeof validateOn === "object" && validateOn
				? {
						delay: undefined,
						...validateOn,
					}
				: {
						isActive: false,
						ifOnlyHasError: false,
						delay: undefined,
					};

		return config;
	},
};

function setValue<
	FN extends FieldNode,
	P extends PathSegmentItem | PathSegmentItem[] | undefined | "",
>(props: {
	fieldNode: FN;
	path: P;
	values: any;
	newValue: any;
	ensurePathExists?: boolean;
	event: FieldNodeConfigValidationEvent;
}) {
	const segments = Array.isArray(props.path)
		? props.path
		: typeof props.path === "string"
			? props.path.split(".")
			: typeof props.path === "number"
				? [props.path]
				: [];

	// We register the previous node to be able to:
	let prevNode: any = null;
	// We register the current node to be able to:
	// - Use the field parent shape to know what to do when ensuring the path
	// - Use the validation rules for the last segments
	let currentNode: any = props.fieldNode;
	const currentValue: any = props.values;

	let i = 0;
	for (; i < segments.length; i++) {
		// Register the previous node
		prevNode = currentNode;

		// Get the current segment
		const segment = segments[i];

		currentNode = currentNode?.[segment];

		if (currentNode === undefined) {
			// If the current node is undefined, we don't go further
			// Even if we need to ensure the path, we can't go further
			break;
		}

		// If the current value is undefined or null, we don't go further
		if (typeof currentValue === "undefined" || currentValue === null) {
			// But if we need to ensure the path, we create the missing parts
			// We will use the current node config to know what to create
			if (props.ensurePathExists) {
				continue;
			}

			// else we stop here
			break;
		}

		// If we are at the last segment, we set the value
		if (i === segments.length - 1) {
			// Set the value
			if (
				(typeof currentValue === "object" && currentValue !== null) ||
				Array.isArray(currentValue)
			) {
				currentValue[segment] = props.newValue;
				// Do validation of needed for the current node
				break;
			}

			// If the current value is not an object, we can't set the value
			// We stop here
			break;
		}

		// If the current value is an object or array, we go deeper
		if (
			(typeof currentValue === "object" && currentValue !== null) ||
			Array.isArray(currentValue)
		) {
			// Go deeper
			continue;
		}

		// If the current value is not an object, we can't go deeper
		// We stop here
		break;
	}
}

function getFieldNodeConfigValidationEventConfig<
	FN extends FieldNode,
	Values extends ValuesShape,
>(event: FieldNodeConfigValidationEvent, validateOn?: ValidateOn<FN, Values>) {
	if (
		typeof validateOn === "undefined" ||
		(typeof validateOn === "boolean" && validateOn)
	) {
		return createValidationConfig.smart(event);
	}

	if (typeof validateOn === "string") {
		return createValidationConfig[validateOn](event);
	}

	if (typeof validateOn === "function") {
		return createValidationConfig.function(event, validateOn);
	}

	if (typeof validateOn === "object" && validateOn && event in validateOn) {
		return createValidationConfig.object(event, validateOn);
	}

	return createValidationConfig.fallback(validateOn);
}

export interface CreateFormApiProps<
	FieldsShape extends FieldNode,
	Values extends ValuesShape,
	SubmitError = unknown,
	SubmitResult = unknown,
> {
	fieldsShape: FieldsShape;
	initialValues?: Partial<Values>;
	values?: Partial<Values>;
	validateOn?:
		| boolean
		| "smart"
		| ValidationAllowedOnEvents<FieldsShape, Values>;
	computeIsDirty?: <T extends FieldNode>(
		props: DeepFieldNodePathEntry<T>,
	) => boolean;
	baseId: string;
	/**
	 * State manager to get and set the form state api instance
	 * Which will be used internally on the methods and getters
	 */
	stateManager: {
		getState: () => FormApi<FieldsShape, Values, SubmitError, SubmitResult>;
		setState: (
			newState: Partial<
				FormApi<FieldsShape, Values, SubmitError, SubmitResult>
			>,
			cb?: (state: {
				instance: FormApi<FieldsShape, Values, SubmitError, SubmitResult>;
			}) => void,
		) => void;
	};
}

export function initFormApi<
	FieldsShape extends FieldNode,
	Values extends ValuesShape,
	SubmitError = unknown,
	SubmitResult = unknown,
>(
	props: CreateFormApiProps<FieldsShape, Values, SubmitError, SubmitResult>,
): FormApi<FieldsShape, Values, SubmitError, SubmitResult> {
	/**
	 * @note
	 *
	 * - `NeverFieldNode` and `NeverRecord` are used here to avoid Typescript infinite depth/recursion issue
	 */
	type FormApiType = FormApi<
		NeverFieldNode,
		NeverRecord,
		SubmitError,
		SubmitResult
	>;

	const validationAllowedOnEventConfigDefault = {} as ValidationAllowedOnEvents<
		NeverFieldNode,
		NeverRecord
	>;

	const getState = props.stateManager.getState;
	const setState = props.stateManager.setState;

	for (const key in fieldNodeConfigValidationEventsEnum) {
		// biome-ignore lint/suspicious/noTsIgnore: <explanation>
		// @ts-ignore
		validationAllowedOnEventConfigDefault[
			// biome-ignore lint/suspicious/noTsIgnore: <explanation>
			// @ts-ignore
			fieldNodeConfigValidationEventsEnum[key]
		] = getFieldNodeConfigValidationEventConfig(
			key as FieldNodeConfigValidationEvent,
			props.validateOn,
		);
	}

	const fields = {
		shape: props.fieldsShape as NeverFieldNode,
		// Q: is `modified` needed if we have `dirty`?
		// A: yes, because `dirty` means "different from initial value"
		//    while `modified` means "has been changed by the user"
		//    so a field can be modified but not dirty (if user changes it back to initial value)
		//    and a field can be dirty but not modified (if initial value is changed externally)
		// But can't we derive `modified` from `dirty` and `touched`?
		// A: No, because `touched` means "has been focused and blurred" which is independent of value changes
		//    so a field can be dirty but not touched (if initial value is changed externally)
		//    and a field can be touched but not dirty (if user focuses and blurs without changing value)
		// So we need all three: `modified`, `dirty`, and `touched`
		// to accurately represent the state of the form fields
		modified: new Set(),
		dirty: new Set(),
		touched: new Set(),
		validating: new Set(),
		focused: null,

		errors: {
			current: {},
			count: 0,
			first: null,

			// parse
			// format
		},

		computeIsDirty:
			props.computeIsDirty ??
			((props) => {
				props;
				// TODO: need to implement a proper deep equality check
				// for now, just return `true` to avoid TS errors
				return true;
			}),

		get isDirty() {
			return getState().fields.modified.size > 0;
		},
		get isTouched() {
			return getState().fields.touched.size > 0;
		},
		get isValidating() {
			return getState().fields.validating.size > 0;
		},
		get isFocused() {
			return getState().fields.focused !== null;
		},
		get isBlurred() {
			return getState().fields.focused === null;
		},
		get isError() {
			return getState().fields.errors.count > 0;
		},

		// parse
		// format

		validation: {
			allowedOnEvent: validationAllowedOnEventConfigDefault,

			// validateOne:
			// validateMany
			// validateAll
		},

		// reset
	} satisfies FormApiType["fields"];

	const formApi = {
		baseId: props.baseId,
		values: {
			current: (props.values || {}) as NeverRecord,
			initial: structuredClone(props.values || {}),
			isLoading: false,
			set(path, value, options) {
				const currentState = props.stateManager.getState();
				setValue({
					fieldNode: currentState.fields.shape,
					values: currentState.values,
					path,
					ensurePathExists: options?.ensurePathExists,
					newValue: value,
					event: options.event,
				});
			},
		},
		fields,
		reset(options) {
			// TODO: implement reset logic
		},
		submit: {
			count: 0,
			idleCount: 0,
			errorCount: 0,
			successCount: 0,
			submittingCount: 0,
			state: "idle",
			error: null,
			result: null,
			isSubmitting: false,
			isDirty: false,
			isValid: true,
			cb(params) {
				throw new Error("Not implemented");
			},
			retry() {
				throw new Error("Not implemented");
			},
		},
	} satisfies FormApiType;

	return formApi as any;
}
