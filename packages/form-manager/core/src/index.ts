import { fieldNodeConfigValidationEventsEnum } from "#constants";
import type { FieldNode, NeverFieldNode } from "#fields/shape/types";
import type {
	DeepFieldNodePathEntry,
	FieldNodeConfigValidationEvent,
	NeverRecord,
	ValuesShape,
} from "#shared/types";
import type {
	FormManager,
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

// export type CreateFormManagerValidationAllowedOnEventConfig<
// 	FieldsShape extends FieldNode,
// 	Values extends ValuesShape,
// > = {
// 	[key in FieldNodeConfigValidationEvent]: {
// 		// "smart" = only validate if field is dirty/touched/modified
// 		// "all" = always validate
// 		strategy: "smart" | "off" | "on";
// 		// isActive: boolean;
// 		delay?: number | ((fieldPath: NestedPath<Values>) => number);
// 		force?: boolean | ((fieldPath: NestedPath<Values>) => boolean);
// 	};
// };

// NOTE: need to implement a `get` and `set` for nested paths in values, like lodash `get` and `set`

// NOTE: Needed To use `NeverFieldNode` and `NeverRecord` as defaults to avoid TS errors of having infinite types

function getFieldNodeConfigValidationEventConfig<
	FieldsShape extends FieldNode,
	Values extends ValuesShape,
>(
	event: FieldNodeConfigValidationEvent,
	validateOn?:
		| boolean
		| "smart"
		| "smart/eager"
		| ValidationAllowedOnEvents<FieldsShape, Values>
		| ((
				event: FieldNodeConfigValidationEvent,
		  ) => ValidationAllowedOnEventConfig<FieldsShape, Values>),
) {
	if (
		typeof validateOn === "undefined" ||
		(typeof validateOn === "string" && validateOn.includes("smart")) ||
		(typeof validateOn === "boolean" && validateOn)
	) {
		return {
			isActive: ["blur", "change", "submit", "custom"].includes(event),
			ifOnlyHasError: event === "change",
			delay:
				validateOn === "smart/eager"
					? undefined
					: event === "change"
						? 300
						: event === "submit"
							? undefined
							: 0,
		};
	}

	if (typeof validateOn === "function") {
		const config = validateOn(event);
		config.delay ??= undefined;
		return config;
	}

	if (typeof validateOn === "object" && validateOn && event in validateOn) {
		const config = validateOn[event];
		config.delay ??= undefined;
		return config;
	}

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
}

export function createFormManager<
	FieldsShape extends FieldNode = NeverFieldNode,
	Values extends ValuesShape = NeverRecord,
	SubmitError = unknown,
	SubmitResult = unknown,
>(props: {
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
}): FormManager<FieldsShape, Values, SubmitError, SubmitResult> {
	type FormManagerType = FormManager<
		NeverFieldNode,
		NeverRecord,
		SubmitError,
		SubmitResult
	>;

	const validationAllowedOnEventConfigDefault = {} as ValidationAllowedOnEvents<
		NeverFieldNode,
		NeverRecord
	>;

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
				// TODO: need to implement a proper deep equality check
				// for now, just return `true` to avoid TS errors
				return true;
			}),

		get isDirty() {
			return this.modified.size > 0;
		},
		get isTouched() {
			return this.touched.size > 0;
		},
		get isValidating() {
			return this.validating.size > 0;
		},
		get isFocused() {
			return this.focused !== null;
		},
		get isBlurred() {
			return this.focused === null;
		},
		get isError() {
			return this.errors.count > 0;
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
	} satisfies FormManagerType["fields"];

	const formManager = {
		baseId: props.baseId,
		values: {
			current: (props.values || {}) as NeverRecord,
			initial: structuredClone(props.values || {}),
			isLoading: false,
			get(name) {
				throw new Error("Not implemented");
			},
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
	} satisfies FormManagerType;

	return formManager as any;
}
