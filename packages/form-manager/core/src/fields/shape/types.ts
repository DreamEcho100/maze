import { fnConfigKeyCONFIG } from "../../constants.js";
import type {
	AnyRecord,
	FieldNodeConfigPresence,
	FieldNodeConfigUserMetadata,
	FieldNodeConfigValidateOptions,
	FieldNodeConfigValidationEvents,
	Literal,
	NeverRecord,
	PathSegmentItem,
} from "../../shared/types.ts";
import type { ValidationResult } from "../errors/types.ts";

export type FieldNode<
	Config extends FieldNodeConfig = FieldNodeConfig,
	T = Record<string | number, FieldNode<any, any>>,
> = T & {
	[fnConfigKeyCONFIG]: Config;
};
export type InternalFieldNode<
	Config extends InternalFieldNodeConfig = InternalFieldNodeConfig,
	T = Record<string | number, InternalFieldNode<any, any>>,
> = T & {
	[fnConfigKeyCONFIG]: Config;
};

export type FieldNodeConfigMetadata = {
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
export interface FieldNodeConfigBase<
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
			[key in FieldNodeConfigValidationEvents]?:
				| boolean
				| {
						debounceMs?: number; // Debounce time in milliseconds, useful for "input" event
						isDebounceLeading?: boolean; // Leading is a boolean indicating whether to trigger on the leading edge of the debounce interval, useful for handling immediate feedback scenarios and cases of when the user stops typing or interacting, default is false (only trailing aka after the user stops)
				  };
		};
		validate: (
			value: unknown,
			options: FieldNodeConfigValidateOptions,
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
	metadata?: FieldNodeConfigMetadata;
	// User-defined metadata for further extension and functionalities
	// For example, you can store UI-related metadata here like label, placeholder, description, etc.
	userMetadata: FieldNodeConfigUserMetadata;

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
export interface FieldNodeConfigTempRootLevel
	extends FieldNodeConfigBase<"temp-root", string[], never, never, AnyRecord> {}
export interface FieldNodeConfigTempParentLevel
	extends FieldNodeConfigBase<
		"temp-parent",
		string[],
		never,
		never,
		AnyRecord
	> {}
export interface FieldNodeConfigUnknownLevel<
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	InputValue = unknown,
	OutputValue = InputValue,
	Rules extends Record<string, any> = {
		presence: FieldNodeConfigPresence;
		readonly: boolean | undefined;
	},
> extends FieldNodeConfigBase<
		"unknown",
		InputValue,
		OutputValue,
		PathAcc,
		Rules
	> {}
// export interface FieldNodeConfigBase<
// 	InputValue = any,
// 	OutputValue = InputValue,
// 	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
// 	Rules extends Record<string, any> = AnyRecord,
// > extends FieldNodeConfigBase<
// 		"primitive",
// 		InputValue,
// 		OutputValue,
// 		PathAcc,
// 		Rules & {
// 			coerce: boolean | undefined;
// 			presence: FieldNodeConfigPresence;
// 			readonly: boolean | undefined;
// 		}
// 	> {}
export interface FieldNodeConfigStringPrimitiveLevel<
	InputValue = string,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FieldNodeConfigBase<
		"string",
		InputValue,
		OutputValue,
		PathAcc,
		{
			presence: FieldNodeConfigPresence;
			coerce?: boolean;
			readonly?: boolean;
			minLength?: number;
			maxLength?: number;
			regex?: RegExp;
		}
	> {
	metadata:
		| (FieldNodeConfigMetadata & {
				enum?: string[];
				literal?: Literal;
		  })
		| undefined;
}
export interface FieldNodeConfigNumberPrimitiveLevel<
	InputValue = number,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FieldNodeConfigBase<
		"number",
		InputValue,
		OutputValue,
		PathAcc,
		{
			presence: FieldNodeConfigPresence;
			coerce?: boolean;
			readonly?: boolean;
			min?: number;
			inclusiveMin?: boolean;
			max?: number;
			inclusiveMax?: boolean;
			multipleOf?: number | bigint;
			regex?: RegExp;
		}
	> {
	metadata:
		| (FieldNodeConfigMetadata & {
				enum?: number[];
				literal?: Literal;
		  })
		| undefined;
}
export interface FieldNodeConfigBigIntPrimitiveLevel<
	InputValue = bigint,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FieldNodeConfigBase<
		"bigint",
		InputValue,
		OutputValue,
		PathAcc,
		{
			coerce?: boolean;
			presence: FieldNodeConfigPresence;
			readonly?: boolean;
			min?: number | bigint;
			inclusiveMin?: boolean;
			max?: number | bigint;
			inclusiveMax?: boolean;
			multipleOf: number | bigint;
			regex?: RegExp;
			// int?: boolean;
		}
	> {
	metadata:
		| (FieldNodeConfigMetadata & {
				enum?: (number | bigint)[];
				literal?: Literal;
		  })
		| undefined;
}

// type DateLike = Date | string | number;
export interface FieldNodeConfigDatePrimitiveLevel<
	InputValue = Date,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FieldNodeConfigBase<
		"date",
		InputValue,
		OutputValue,
		PathAcc,
		{
			coerce: boolean | undefined;
			presence: FieldNodeConfigPresence;
			readonly: boolean | undefined;
			min: Date | undefined;
			inclusiveMin: boolean | undefined;
			max: Date | undefined;
			inclusiveMax: boolean | undefined;
		}
	> {}
export interface FieldNodeConfigBooleanPrimitiveLevel<
	InputValue = boolean,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FieldNodeConfigBase<
		"boolean",
		InputValue,
		OutputValue,
		PathAcc,
		{
			presence: FieldNodeConfigPresence;
			coerce?: boolean;
			readonly?: boolean;
			regex?: RegExp;
		}
	> {}
export interface FieldNodeConfigUndefinedLevel<
	InputValue = undefined,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FieldNodeConfigBase<
		"undefined",
		InputValue,
		OutputValue,
		PathAcc,
		{
			presence: FieldNodeConfigPresence;
			readonly?: boolean;
		}
	> {}
export interface FieldNodeConfigNullLevel<
	InputValue = null,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FieldNodeConfigBase<
		"null",
		InputValue,
		OutputValue,
		PathAcc,
		{
			presence: FieldNodeConfigPresence;
			readonly?: boolean;
		}
	> {}
export interface FieldNodeConfigVoidLevel<
	InputValue = void,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FieldNodeConfigBase<
		"void",
		InputValue,
		OutputValue,
		PathAcc,
		{
			presence: FieldNodeConfigPresence;
			readonly?: boolean;
		}
	> {}
export interface FieldNodeConfigNeverLevel<
	InputValue = never,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	Rules extends Record<string, any> = AnyRecord,
> extends FieldNodeConfigBase<
		"never",
		InputValue,
		OutputValue,
		PathAcc,
		Rules
	> {}
export interface FieldNodeConfigFilePrimitiveLevel<
	InputValue = File,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FieldNodeConfigBase<
		"file",
		InputValue,
		OutputValue,
		PathAcc,
		{
			// coerce: boolean | undefined;
			presence: FieldNodeConfigPresence;
			readonly: boolean | undefined;
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
	// metadata:
	// 	| (FieldNodeConfigMetadata & {
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

export type FieldNodeConfigPrimitiveLevel =
	| FieldNodeConfigStringPrimitiveLevel
	| FieldNodeConfigNumberPrimitiveLevel
	| FieldNodeConfigBigIntPrimitiveLevel
	| FieldNodeConfigDatePrimitiveLevel
	| FieldNodeConfigBooleanPrimitiveLevel
	| FieldNodeConfigFilePrimitiveLevel
	| FieldNodeConfigUnknownLevel
	| FieldNodeConfigUndefinedLevel
	| FieldNodeConfigNullLevel
	| FieldNodeConfigVoidLevel
	| FieldNodeConfigNeverLevel;

export interface FieldNodeConfigObjectLevel<
	InputValue = AnyRecord,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FieldNodeConfigBase<
		"object",
		InputValue,
		OutputValue,
		PathAcc,
		{ presence: FieldNodeConfigPresence; readonly: boolean | undefined }
	> {
	// No need to store `shape` since it won't help much and we're relaying mainly on the `TrieNode` data structure
	// shape: Record<string, TrieNode>;
}
export interface FieldNodeConfigArrayLevel<
	InputValue = any[],
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FieldNodeConfigBase<
		"array",
		InputValue,
		OutputValue,
		PathAcc,
		{
			presence: FieldNodeConfigPresence;
			minLength: number | undefined;
			maxLength: number | undefined;
			readonly: boolean | undefined;
		}
	> {
	// No need to store `items` since it won't help much and we're relaying mainly on the `TrieNode` data structure
	// items: TrieNode; // Need to find a way to reference the main type here
}
export interface FieldNodeConfigTupleLevel<
	InputValue = any[],
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FieldNodeConfigBase<
		"tuple",
		InputValue,
		OutputValue,
		PathAcc,
		{
			presence: FieldNodeConfigPresence;
			exactLength: number | undefined;
			minLength: number | undefined;
			maxLength: number | undefined;
			readonly: boolean | undefined;
		}
	> {
	// No need to store `items` since it won't help much and we're relaying mainly on the `TrieNode` data structure
	// items: TrieNode[];
}

export interface FieldNodeConfigRecordLevel<
	InputValue = Record<PropertyKey, any>,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FieldNodeConfigBase<
		"record",
		InputValue,
		OutputValue,
		PathAcc,
		{ presence: FieldNodeConfigPresence; readonly: boolean | undefined }
	> {}
// z.record(z.string(), z.number()).def.keyType;
// z.record(z.string(), z.number()).def.valueType;
export interface FieldNodeConfigUnionRootLevel<
	InputValue = unknown,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	Rules extends Record<string, any> = {
		// presence: FieldNodeConfigPresence;
		// readonly: boolean | undefined;
		tag?:
			| {
					key: string;
					values: Set<Literal>;
					/** @description This map is used to quickly find the index of the option based on the tag value */
					valueToOptionIndex: {
						get: (tagValue: Literal) => number | undefined;
					};
			  }
			| undefined;
	},
> extends FieldNodeConfigBase<
		"union-root",
		InputValue,
		OutputValue,
		PathAcc,
		Rules & {
			presence: FieldNodeConfigPresence;
			readonly: boolean | undefined;
		}
	> {
	options: FieldNode[];
}
export interface FieldNodeConfigUnionDescendantLevel<
	InputValue = unknown,
	OutputValue = InputValue,
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
> extends FieldNodeConfigBase<
		"union-descendant",
		InputValue,
		OutputValue,
		PathAcc,
		NeverRecord
	> {
	options: FieldNode[];
}

export interface ValidateReturnShape<
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	ValidValue = unknown,
> {
	result: ValidationResult<PathAcc, ValidValue>;
	metadata:
		| {
				// /** The validation event that triggered the validation, if any. */
				validationEvent: FieldNodeConfigValidationEvents;
				"union-descendant"?: { firstValidOptionIndex: number };
		  }
		| undefined;
}

export type FieldNodeConfig =
	| FieldNodeConfigPrimitiveLevel
	| FieldNodeConfigRecordLevel
	| FieldNodeConfigObjectLevel
	| FieldNodeConfigArrayLevel
	| FieldNodeConfigTupleLevel
	| FieldNodeConfigUnionRootLevel
	| FieldNodeConfigUnionDescendantLevel;

export type InternalFieldNodeConfig =
	| FieldNodeConfigTempRootLevel
	| FieldNodeConfigTempParentLevel
	| FieldNodeConfig;
