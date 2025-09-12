import { FORM_FIELD_TN_CONFIG } from "../../../constants.js";
import type {
	AnyRecord,
	FormFieldTNConfigPresence,
	FormFieldTNConfigUserMetadata,
	FormFieldTNConfigValidateOptions,
	FormFieldTNConfigValidationEvents,
	Literal,
	NeverRecord,
	PathSegmentItem,
} from "../../shared.ts";
import type { ValidationResult } from "./errors.ts";

export type FormFieldTN<
	Config extends FormFieldTNConfig = FormFieldTNConfig,
	T = Record<string | number, FormFieldTN<any, any>>,
> = T & {
	[FORM_FIELD_TN_CONFIG]: Config;
};

export interface FormFieldTNConfigBase<
	LevelName extends string,
	InputValue,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = [],
	Rules extends AnyRecord = AnyRecord,
> {
	//
	level: LevelName;
	pathString: string;
	pathSegments: PathSegmentItem[];

	// default value if applicable
	default?: InputValue;
	// The field constraints/rules derived from the schema
	constraints: Rules;
	// The main validation function for the field
	validation: {
		allowedOn?: {
			[key in FormFieldTNConfigValidationEvents]?:
				| boolean
				| {
						debounceMs?: number; // Debounce time in milliseconds, useful for "input" event
						isDebounceLeading?: boolean; // Leading is a boolean indicating whether to trigger on the leading edge of the debounce interval, useful for handling immediate feedback scenarios and cases of when the user stops typing or interacting, default is false (only trailing aka after the user stops)
				  };
		};
		validate: (
			value: any,
			options: FormFieldTNConfigValidateOptions,
		) => Promise<ValidateReturnShape<PathAcc, OutputValue>>;
		isPending?: boolean;
	};

	// State flags - these can be managed internally by the form manager or externally by the user/dev
	// Is dirty means the value has been changed from its initial value
	// Q: Should it be called `hasChanged`, `isModified`, or something else?
	isDirty?: boolean;
	// Is touched means the field has been focused and then blurred
	isTouched?: boolean;
	// Is valid means the field has been validated and is valid
	isValid?: boolean;

	// The metadata can be used to store additional information about the field that might be useful for rendering or other purposes
	metadata?: {
		[key in
			| "isObjectProperty"
			| "isTupleItem"
			| "isRecordProperty"
			| "isArrayTokenItem"
			| "isMarkedNever"]?: boolean;
	} & {
		intersectionItem?: {
			[pathString: string]: number; // for intersection two or many, represents the power set of the items for overriding metadata
		};
		unionRootDescendant?: {
			rootPathToInfo: Record<
				string,
				{
					rootPath: string;
					rootPathSegments: PathSegmentItem[];
					paths: Set<string>;
				}[]
			>;
		};
	};
	// User-defined metadata for further extension and functionalities
	// For example, you can store UI-related metadata here like label, placeholder, description, etc.
	userMetadata: FormFieldTNConfigUserMetadata;

	// Q: Any of the following needed? Or can they be either derived from somewhere else or managed externally by the user/dev?
	// tabIndex?: number;
	// isFocused?: boolean;
	// isDisabled?: boolean;
	// isValidating?: boolean;
	// displayName?: string;
	// description?: string;
	// placeholder?: string;
	// isDynamic: boolean; // For array items, record properties
	// isConditional: boolean;
	// shouldDebounce: boolean;
	// debounceMs?: number;
}
export interface FormFieldTNConfigTempRootLevel
	extends FormFieldTNConfigBase<
		"temp-root",
		string[],
		never,
		never,
		AnyRecord
	> {}
export interface FormFieldTNConfigNeverLevel<
	InputValue = never,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	Rules extends Record<string, any> = AnyRecord,
> extends FormFieldTNConfigBase<
		"never",
		InputValue,
		OutputValue,
		PathAcc,
		Rules
	> {}
export interface FormFieldTNConfigUnknownLevel<
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	InputValue = unknown,
	OutputValue = InputValue,
	Rules extends Record<string, any> = {
		presence: FormFieldTNConfigPresence;
		readonly: boolean | undefined;
	},
> extends FormFieldTNConfigBase<
		"unknown",
		InputValue,
		OutputValue,
		PathAcc,
		Rules
	> {}
export interface FormFieldTNConfigPrimitiveLevelBase<
	InputValue = any,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	Rules extends Record<string, any> = AnyRecord,
> extends FormFieldTNConfigBase<
		"primitive",
		InputValue,
		OutputValue,
		PathAcc,
		Rules & {
			coerce: boolean | undefined;
			presence: FormFieldTNConfigPresence;
			readonly: boolean | undefined;
		}
	> {}
export interface FormFieldTNConfigStringPrimitiveLevel<
	InputValue = string,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldTNConfigPrimitiveLevelBase<
		InputValue,
		OutputValue,
		PathAcc,
		{
			minLength: number | undefined;
			maxLength: number | undefined;
			regex: RegExp | undefined;
		}
	> {
	type: "string";
	metadata:
		| (FormFieldTNConfigPrimitiveLevelBase<any>["metadata"] & {
				enum?: string[];
				literal?: Literal;
		  })
		| undefined;
}
export interface FormFieldTNConfigNumberPrimitiveLevel<
	InputValue = number,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldTNConfigPrimitiveLevelBase<
		InputValue,
		OutputValue,
		PathAcc,
		{
			min: number | undefined;
			inclusiveMin: boolean | undefined;
			max: number | undefined;
			inclusiveMax: boolean | undefined;
			multipleOf: number | bigint | undefined;
		}
	> {
	type: "number";
	metadata:
		| (FormFieldTNConfigPrimitiveLevelBase<any>["metadata"] & {
				enum?: number[];
				literal?: Literal;
		  })
		| undefined;
}
export interface FormFieldTNConfigBigIntPrimitiveLevel<
	InputValue = bigint,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldTNConfigPrimitiveLevelBase<
		InputValue,
		OutputValue,
		PathAcc,
		{
			min: number | bigint | undefined;
			inclusiveMin: boolean | undefined;
			max: number | bigint | undefined;
			inclusiveMax: boolean | undefined;
			// int: boolean | undefined;
			multipleOf: number | bigint;
		}
	> {
	type: "bigint";
	metadata:
		| (FormFieldTNConfigPrimitiveLevelBase<any>["metadata"] & {
				enum?: (number | bigint)[];
				literal?: Literal;
		  })
		| undefined;
}

// type DateLike = Date | string | number;
export interface FormFieldTNConfigDatePrimitiveLevel<
	InputValue = Date,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldTNConfigPrimitiveLevelBase<
		InputValue,
		OutputValue,
		PathAcc,
		{
			min: Date | undefined;
			inclusiveMin: boolean | undefined;
			max: Date | undefined;
			inclusiveMax: boolean | undefined;
		}
	> {
	type: "date";
}
export interface FormFieldTNConfigBooleanPrimitiveLevel<
	InputValue = boolean,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldTNConfigPrimitiveLevelBase<
		InputValue,
		OutputValue,
		PathAcc,
		AnyRecord
	> {
	type: "boolean";
}
export interface FormFieldTNConfigFilePrimitiveLevel<
	InputValue = File,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldTNConfigPrimitiveLevelBase<
		InputValue,
		OutputValue,
		PathAcc,
		{
			min: number | undefined;
			max: number | undefined;
			mimeTypes: string[] | undefined;
			// extensions: string[] | undefined;
			// accept: string | undefined;
			// multiple: boolean | undefined;
			// directory: boolean | undefined;
			// maxTotalFileSize: number | undefined;
			// minTotalFileSize: number | undefined;
			// application: boolean | undefined;
		}
	> {
	type: "file";
	// metadata:
	// 	| (FormFieldTNConfigPrimitiveLevelBase<any>["metadata"] & {
	// 			multiple?: boolean;
	// 			directory?: boolean;
	// 			literal?: Literal;
	// 		// multiple: boolean | undefined;
	// 		// directory: boolean | undefined;
	// 		// maxTotalFileSize: number | undefined;
	// 		// minTotalFileSize: number | undefined;
	// 		// application: boolean | undefined;
	// 						  })
	// 	| undefined;
}

export type FormFieldTNConfigPrimitiveLevel =
	| FormFieldTNConfigStringPrimitiveLevel
	| FormFieldTNConfigNumberPrimitiveLevel
	| FormFieldTNConfigBigIntPrimitiveLevel
	| FormFieldTNConfigDatePrimitiveLevel
	| FormFieldTNConfigBooleanPrimitiveLevel
	| FormFieldTNConfigFilePrimitiveLevel;

export interface FormFieldTNConfigObjectLevel<
	InputValue = AnyRecord,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldTNConfigBase<
		"object",
		InputValue,
		OutputValue,
		PathAcc,
		{ presence: FormFieldTNConfigPresence; readonly: boolean | undefined }
	> {
	// No need to store `shape` since it won't help much and we're relaying mainly on the `TrieNode` data structure
	// shape: Record<string, TrieNode>;
}
export interface FormFieldTNConfigArrayLevel<
	InputValue = any[],
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldTNConfigBase<
		"array",
		InputValue,
		OutputValue,
		PathAcc,
		{
			presence: FormFieldTNConfigPresence;
			minLength: number | undefined;
			maxLength: number | undefined;
			readonly: boolean | undefined;
		}
	> {
	// No need to store `items` since it won't help much and we're relaying mainly on the `TrieNode` data structure
	// items: TrieNode; // Need to find a way to reference the main type here
}
export interface FormFieldTNConfigTupleLevel<
	InputValue = any[],
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldTNConfigBase<
		"tuple",
		InputValue,
		OutputValue,
		PathAcc,
		{
			presence: FormFieldTNConfigPresence;
			exactLength: number | undefined;
			minLength: number | undefined;
			maxLength: number | undefined;
			readonly: boolean | undefined;
		}
	> {
	// No need to store `items` since it won't help much and we're relaying mainly on the `TrieNode` data structure
	// items: TrieNode[];
}

export interface FormFieldTNConfigRecordLevel<
	InputValue = Record<PropertyKey, any>,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldTNConfigBase<
		"record",
		InputValue,
		OutputValue,
		PathAcc,
		{ presence: FormFieldTNConfigPresence; readonly: boolean | undefined }
	> {}
// z.record(z.string(), z.number()).def.keyType;
// z.record(z.string(), z.number()).def.valueType;
export interface FormFieldTNConfigUnionRootLevel<
	InputValue = unknown,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	Rules extends
		| {
				tag: {
					key: string;
					values: Set<Literal>;
					/** @description This map is used to quickly find the index of the option based on the tag value */
					valueToOptionIndex: Map<Literal, number>;
				};
		  }
		| AnyRecord = AnyRecord,
> extends FormFieldTNConfigBase<
		"union-root",
		InputValue,
		OutputValue,
		PathAcc,
		Rules & {
			presence: FormFieldTNConfigPresence;
			readonly: boolean | undefined;
		}
	> {
	options: FormFieldTN[];
	// tag: {
	// 	key: string;
	// 	valueToOptionIndex: Map<Literal, number>;
	// };
}
export interface FormFieldTNConfigUnionDescendantLevel<
	InputValue = unknown,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FormFieldTNConfigBase<
		"union-descendant",
		InputValue,
		OutputValue,
		PathAcc,
		NeverRecord
	> {
	options: FormFieldTN[];
}

export interface ValidateReturnShape<
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	ValidValue = unknown,
> {
	result: ValidationResult<PathAcc, ValidValue>;
	metadata:
		| {
				// /** The validation event that triggered the validation, if any. */
				validationEvent: FormFieldTNConfigValidationEvents;
				"union-descendant"?: { firstValidOptionIndex: number };
		  }
		| undefined;
}

export type FormFieldTNConfig =
	| FormFieldTNConfigTempRootLevel
	| FormFieldTNConfigUnknownLevel
	| FormFieldTNConfigNeverLevel
	| FormFieldTNConfigPrimitiveLevel
	| FormFieldTNConfigRecordLevel
	| FormFieldTNConfigObjectLevel
	| FormFieldTNConfigArrayLevel
	| FormFieldTNConfigTupleLevel
	| FormFieldTNConfigUnionRootLevel
	| FormFieldTNConfigUnionDescendantLevel;
