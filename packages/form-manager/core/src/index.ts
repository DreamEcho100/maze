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
	FormValuesQuery,
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

function setValue<Value = unknown>(props: {
	fieldNode: FieldNode;
	path?: PathSegmentItem | PathSegmentItem[] | undefined | "";
	values: ValuesShape;
	valueOrUpdater: Value | ((value: Value) => any);
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
	// - Use the field parent shape to know what to do when ensuring the path when needed
	// - Use the parent validation rules when needed
	//	 (like when the current node is undefined)
	let prevNode: any = null;
	// We register the current node to be able to:
	// - Use the field current shape to know what to do when ensuring the path
	// - Use the validation rules for the last segments
	let currentNode: any = props.fieldNode;
	const currentValue: any = props.values;

	let i = 0;
	for (; i < segments.length; i++) {
		// Register the previous node
		prevNode = currentNode;

		// Get the current segment
		const segment = segments[i];

		currentNode = typeof segment !== "undefined" && currentNode?.[segment];

		if (typeof segment === "undefined" || currentNode === undefined) {
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
				currentValue[segment] =
					typeof props.valueOrUpdater === "function"
						? // biome-ignore lint/suspicious/noTsIgnore: <explanation>
							// @ts-ignore
							props.valueOrUpdater(currentValue[segment])
						: props.valueOrUpdater;
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

interface ValuesQueryProps<
	FieldsShape extends FieldNode,
	Values extends ValuesShape,
	SubmitError = unknown,
	SubmitResult = unknown,
> {
	fn: (props: {
		formApi: FormApi<FieldsShape, Values, SubmitError, SubmitResult>;
	}) => Values;
	onSuccess?: (props: {
		values: Values;
		prevValues: Values | undefined;
		formApi: FormApi<FieldsShape, Values, SubmitError, SubmitResult>;
	}) => {
		shouldSetInitialValues?: boolean;
		shouldSetValues?: boolean;
	};
	onError?: (props: {
		error: Error;
		prevValues: Values | undefined;
		formApi: FormApi<FieldsShape, Values, SubmitError, SubmitResult>;
	}) => void;
	onSettled?: (props: {
		values: Values | undefined;
		error: Error | null;
		prevValues: Values | undefined;
		status: "success" | "error";
		formApi: FormApi<FieldsShape, Values, SubmitError, SubmitResult>;
	}) => void;
}

function handleValuesQuery<
	FieldsShape extends FieldNode,
	Values extends ValuesShape,
	SubmitError = unknown,
	SubmitResult = unknown,
>(
	valuesQuery: ValuesQueryProps<FieldsShape, Values, SubmitError, SubmitResult>,
	props: {
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
		registerCleanup: (cleanup: () => any) => {
			// dispose: () => void;
			id: number;
			cleanup: () => any;
		};
	},
): FormValuesQuery<FieldsShape, Values, SubmitError, SubmitResult> {
	let successTimeoutId: ReturnType<typeof setTimeout> | null = null;
	let isCancelled = false;
	const timeoutId = setTimeout(async () => {
		const currentState = props.stateManager.getState();
		try {
			// TODO: Should pass a signal for cancelling
			const newValues = await valuesQuery.fn({
				formApi: props.stateManager.getState(),
			});

			if (isCancelled) return;

			const onSuccessResult = valuesQuery.onSuccess?.({
				values: newValues,
				prevValues: currentState.values.initial,
				formApi: props.stateManager.getState(),
			}) ?? {
				shouldSetInitialValues: true,
				shouldSetValues: true,
			};

			props.stateManager.setState({
				values: {
					...currentState.values,
					state: "success",
					current: onSuccessResult.shouldSetValues
						? newValues
						: currentState.values.current,
					initial: onSuccessResult.shouldSetInitialValues
						? structuredClone(newValues)
						: currentState.values.initial,
					isLoading: false,
				},
			});

			successTimeoutId = setTimeout(() => {
				props.stateManager.setState({
					values: {
						...props.stateManager.getState().values,
						state: "idle",
					},
				});
			}, 50);
		} catch (error) {
			if (isCancelled) return;
			valuesQuery.onError?.({
				error: error instanceof Error ? error : new Error(String(error)),
				prevValues: currentState.values.initial,
				formApi: props.stateManager.getState(),
			});

			props.stateManager.setState({
				values: {
					...currentState.values,
					state: "error",
					error: error instanceof Error ? error : new Error(String(error)),
					isLoading: false,
				},
			});
		} finally {
			if (!isCancelled) {
				valuesQuery.onSettled?.({
					values: props.stateManager.getState().values.current as Values,
					error:
						props.stateManager.getState().values.error ??
						(null as Error | null),
					prevValues: currentState.values.initial,
					status:
						props.stateManager.getState().values.error === null
							? "success"
							: "error",
					formApi: props.stateManager.getState(),
				});
			}
		}
	}, 0);

	const { cleanup } = registerCleanup(() => {
		isCancelled = true;
		clearTimeout(timeoutId);
		successTimeoutId && clearTimeout(successTimeoutId);
	});

	return {
		// isLoading: true,
		// values: undefined as Values | undefined,
		// cleanup: () => {
		// 	clearTimeout(timeoutId);
		// 	successTimeoutId && clearTimeout(successTimeoutId);
		// },
		onSuccess: valuesQuery.onSuccess,
		onError: valuesQuery.onError,
		onSettled: valuesQuery.onSettled,
		refetch: async (refetchProps: {
			onSuccess?: (ctx: {
				values: Values;
				prevValues: Values | undefined;
				formApi: FormApi<FieldsShape, Values, SubmitError, SubmitResult>;
			}) => {
				shouldSetInitialValues?: boolean;
				shouldSetValues?: boolean;
			};
			onError?: (ctx: {
				error: Error;
				prevValues: Values | undefined;
				formApi: FormApi<FieldsShape, Values, SubmitError, SubmitResult>;
			}) => void;
			onSettled?: (ctx: {
				values: Values | undefined;
				error: Error | null;
				prevValues: Values | undefined;
				status: "success" | "error";
				formApi: FormApi<FieldsShape, Values, SubmitError, SubmitResult>;
			}) => void;
		}) => {
			cleanup();
			handleValuesQuery(
				{
					...valuesQuery,
					onSuccess: refetchProps.onSuccess ?? valuesQuery.onSuccess,
					onError: refetchProps.onError ?? valuesQuery.onError,
					onSettled: refetchProps.onSettled ?? valuesQuery.onSettled,
				},
				{
					stateManager: props.stateManager,
					registerCleanup: props.registerCleanup,
				},
			);
			return props.stateManager.getState().values.current as Values;
		},
		lastUpdatedAt: isCancelled ? Date.now() : null,
		isLoading: !isCancelled,
		state: isCancelled ? "idle" : "loading",
		isSuccess: false,
		isError: false,
		error: null,
	};
}

export interface CreateFormApiProps<
	FieldsShape extends FieldNode,
	Values extends ValuesShape,
	SubmitError = unknown,
	SubmitResult = unknown,
> {
	fieldsShape: FieldsShape;
	initialValues?: Partial<Values>;
	values?: Values;
	valuesQuery?: ValuesQueryProps<
		FieldsShape,
		Values,
		SubmitError,
		SubmitResult
	>;
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

	const cleanups: ((() => any) | null)[] = [];

	let values: Values | undefined;
	let valuesQuery: FormValuesQuery<
		NeverFieldNode,
		NeverRecord,
		SubmitError,
		SubmitResult
	> | null | null = null;
	if (typeof props.valuesQuery === "function") {
		valuesQuery = handleValuesQuery(props.valuesQuery, {
			stateManager: props.stateManager,
			registerCleanup: (cleanup) => {
				cleanups.push(cleanup);
				return {
					id: cleanups.push(cleanup),
					cleanup,
				};
			},
		}) as unknown as FormValuesQuery<
			NeverFieldNode,
			NeverRecord,
			SubmitError,
			SubmitResult
		>;
	} else if (props.values !== undefined && props.values !== null) {
		values = props.values;
	} else if (
		props.initialValues !== undefined &&
		props.initialValues !== null
	) {
		values = props.initialValues as Values;
	}

	const initialValues = props.initialValues ?? values;

	const formApi = {
		baseId: props.baseId,
		values: {
			current: values as NeverRecord,
			initial: (initialValues
				? structuredClone(initialValues)
				: undefined) as NeverRecord,
			query: valuesQuery,
			set(path, valueOrUpdater, options) {
				const currentState = props.stateManager.getState();
				setValue({
					fieldNode: currentState.fields.shape,
					values: currentState.values,
					path,
					ensurePathExists: options?.ensurePathExists,
					valueOrUpdater,
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
		cleanup() {
			for (let i = 0; i < cleanups.length; i++) {
				const cleanup = cleanups[i];
				cleanup?.();
				cleanups[i] = null;
			}
			cleanups.length = 0;
		},
	} satisfies FormApiType;

	return formApi as any;
}
