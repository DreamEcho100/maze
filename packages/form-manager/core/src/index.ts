import {
	fieldNodeConfigValidationEventsEnum,
	fieldNodeTokenEnum,
	fnConfigKey,
} from "#constants";
import type { FieldNode, NeverFieldNode } from "#fields/shape/types";
import type {
	DeepFieldNodePathEntry,
	FieldNodeConfigValidationEvent,
	NeverRecord,
	PathSegmentItem,
	ValuesShape,
} from "#shared/types";
import type {
	FormApi,
	ValidationAllowedOnEventConfig,
	ValidationAllowedOnEvents,
} from "#types";

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

function set<T, P extends PathSegmentItem | PathSegmentItem[] | undefined | "">(
	obj: T,
	path: P,
	value: any,
	isImmutable = false,
): void {
	const segments = Array.isArray(path)
		? path
		: typeof path === "string"
			? path.split(".")
			: typeof path === "number"
				? [path]
				: [];
	let current: any = obj;

	for (let i = 0; i < segments.length - 1; i++) {
		const segment = segments[i];
		const nextSegment = segments[i + 1];

		if (current[segment] == null) {
			// Determine if the next segment is a number to create an array
			if (
				typeof nextSegment === "number" ||
				!Number.isNaN(Number(nextSegment))
			) {
				current[segment] = [];
			} else {
				current[segment] = {};
			}
		}

		if (isImmutable) {
			current[segment] =
				// Array
				Array.isArray(current[segment])
					? [...current[segment]]
					: // Map
						current[segment] instanceof Map
						? new Map(current[segment])
						: // Set
							current[segment] instanceof Set
							? new Set(current[segment])
							: // Class instance _9not only object
								typeof current[segment] === "object";
			// How to clone class instance properly?
		}
		current = current[segment];
	}

	const lastSegment = segments[segments.length - 1];
	if (typeof lastSegment === "number" || !Number.isNaN(Number(lastSegment))) {
		current[Number(lastSegment)] = value;
	} else {
		current[lastSegment] = value;
	}
}

function getFieldNodeConfigValidationEventConfig<
	FieldsShape extends FieldNode,
	Values extends ValuesShape,
>(
	event: FieldNodeConfigValidationEvent,
	validateOn?: ValidateOn<FieldsShape, Values>,
) {
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

interface CreateFormApiProps<
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
				props.normalizedPathString;
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
			// get(name) {
			// 	throw new Error("Not implemented");
			// },
			set(name, value) {
				throw new Error("Not implemented");
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

/**
 * Simulate a state manager with basic get and set functionality.
 * This is a placeholder and should be replaced with a proper state management solution.
 * It should be replaced with your state management solution
 */
function stateManagerSimulator<T>(initialState: T) {
	let state = { ...initialState };

	return {
		getState: () => state,
		setState: (newState: Partial<T>) => {
			state = { ...state, ...newState };
		},
	};
}

/**
 * @notes
 * This is more like a base approach on how the integration with other state management libs will be
 * Which means it will differ internally by you slightly based on the state management solution you use
 * As long as you can provide a `getState`, `setState` and a stable reference for the instance, it should work 😊
 *
 * @warning
 *
 * - **Serialization Problems**: this instance will have problems if you try to serialize it (e.g., for server-side rendering or saving to local storage). Consider implementing a custom serialization method if needed.
 * - **Performance**: This will mostly depend on the state management solution you use. If you notice performance issues, consider optimizing the state updates or using a more efficient state management library.
 * - **Deep Equality Checks**: If your state management solution uses deep equality checks, maybe it's better to disable it if possible to avoid unnecessary re-renders.
 */
function createFormApi<
	FieldsShape extends FieldNode,
	Values extends ValuesShape,
	SubmitError = unknown,
	SubmitResult = unknown,
>(
	props: Omit<
		CreateFormApiProps<FieldsShape, Values, SubmitError, SubmitResult>,
		"stateManager"
	>,
) {
	type FormApiType = FormApi<FieldsShape, Values, SubmitError, SubmitResult>;

	// Potential other approach:
	// To cache the initial instance on the _stalled closure_
	// Still you will need to set the instance on the state manager
	// Or use a stable reference for the instance, for example using `useRef` in React
	// let instanceCache: any;

	const formApi: {
		getState: () => {
			instance: FormApiType;
		};
		setState: (
			newState: Partial<{
				instance: FormApiType;
			}>,
		) => void;
	} = stateManagerSimulator<{
		instance: FormApiType;
	}>({
		get instance() {
			try {
				if (process.env.NODE_ENV === "development") {
					console.log("Initializing FormApi...");
				}

				const instance = initFormApi<
					FieldsShape,
					Values,
					SubmitError,
					SubmitResult
				>({
					...props,
					stateManager: {
						getState: () => formApi.getState().instance,
						setState: (newState) =>
							formApi.setState({
								instance: {
									...formApi.getState().instance,
									...newState,
								},
							}),
					},
				});

				Object.defineProperty(this, "instance", {
					value: instance,
					configurable: true,
					enumerable: true,
				});
				// Potential other approach:
				// This could be nessacery
				// instanceCache = instance
				// formApi.setState({ instance })

				return instance;
			} catch (error) {
				console.error("FormApi initialization failed:", error);
				throw error;
			}
		},
	});

	return formApi.getState().instance;
}

const formApi = createFormApi({
	fieldsShape: {
		[fnConfigKey]: {
			level: "object",
			constraints: { presence: "required", readonly: false },
			pathSegments: [],
			pathString: "",
			userMetadata: {},
			metadata: {},
			validation: {
				validate(value, options) {
					if (!value || typeof value !== "object") {
						throw new Error("Not implemented");
					}
					throw new Error("Not implemented");
				},
			},
		},
		foo: {
			[fnConfigKey]: {
				level: "string",
				constraints: { presence: "required", readonly: false },
				pathSegments: ["foo"] as const,
				pathString: "foo",
				userMetadata: {},
				metadata: {},
				validation: {
					validate(value: unknown) {
						if (typeof value !== "string") {
							throw new Error("Not implemented");
						}
						throw new Error("Not implemented");
					},
				},
			},
		},
		bar: {
			[fnConfigKey]: {
				level: "number",
				constraints: { presence: "optional", readonly: false },
				pathSegments: ["bar"] as const,
				pathString: "bar",
				userMetadata: {},
				metadata: {},
				validation: {
					validate(value: unknown) {
						if (typeof value !== "number") {
							throw new Error("Not implemented");
						}
						throw new Error("Not implemented");
					},
				},
			},
		},
	} as const satisfies FieldNode,
	initialValues: { foo: "initialFoo", bar: 42 },
	baseId: "form-manager",
});

formApi.fields.shape.bar[fnConfigKey].validation;
formApi.fields.errors.current.fieldNode;
formApi.values.current.foo;
