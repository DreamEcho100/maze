import type {
	FieldNode,
	FieldNodeConfigArrayLevel,
	FieldNodeConfigBigIntPrimitiveLevel,
	FieldNodeConfigBooleanPrimitiveLevel,
	FieldNodeConfigDatePrimitiveLevel,
	FieldNodeConfigFilePrimitiveLevel,
	FieldNodeConfigNeverLevel,
	FieldNodeConfigNullLevel,
	FieldNodeConfigNumberPrimitiveLevel,
	FieldNodeConfigObjectLevel,
	FieldNodeConfigRecordLevel,
	FieldNodeConfigStringPrimitiveLevel,
	FieldNodeConfigTupleLevel,
	FieldNodeConfigUndefinedLevel,
	FieldNodeConfigUnionRootLevel,
	FieldNodeConfigUnknownLevel,
	FieldNodeConfigVoidLevel,
	InternalFieldNode,
	ValidateReturnShape,
} from "../fields/shape/types.ts";
import type {
	FieldNodeConfigValidateOptions,
	PathSegmentItem,
} from "../shared/types.ts";

export interface InheritedMetadata {
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
	isMarkedNever?: boolean;
	isLazyEvaluated?: boolean;
}

export interface ResolverAcc {
	resolvedPathToNode: Record<string, FieldNode>;
	lazyPathToLazyNodesAccMap: Map<PathSegmentItem, (() => FieldNode)[]>;
	node: FieldNode;
}
export interface InternalResolverAcc {
	resolvedPathToNode: Record<string, InternalFieldNode>;
	lazyPathToLazyNodesAccMap: Map<PathSegmentItem, (() => FieldNode)[]>;
	node: InternalFieldNode;
	rootNode: InternalFieldNode;
}
export interface CurrentAttributes {
	isObjectProperty?: boolean;
	"array-item"?: boolean;
	isArrayTokenItem?: boolean;
	isTupleItem?: boolean;
	isRecordProperty?: boolean;
}

export interface BaseCtx {
	optional?: boolean;
	nullable?: boolean;
	readonly?: boolean;
	currentParentPathString: string;
	currentParentPathSegments: PathSegmentItem[];
	currentSchema: unknown;
	currentAttributes?: CurrentAttributes;
}

export interface ResolverUtils<
	Base extends {
		/* complex types */
		union: unknown;
		intersection: unknown;
		pipe: unknown;
		lazy: unknown;
		/* collections */
		array: unknown;
		tuple: unknown;
		record: unknown;
		object: unknown;
		/* attributes */
		prefault: unknown;
		default: unknown;
		readonly: unknown;
		nonOptional: unknown;
		optional: unknown;
		nullable: unknown;
		/* primitives */
		string: unknown;
		number: unknown;
		bigInt: unknown;
		date: unknown;
		boolean: unknown;
		file: unknown;
		unknown: unknown;
		undefined: unknown;
		null: unknown;
		void: unknown;
		never: unknown;
	},
> {
	/* complex types */
	union: {
		is: (schema: any) => schema is Base["union"];
		build: <T extends Base["union"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigUnionRootLevel["constraints"];
			validate: FieldNodeConfigUnionRootLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigUnionRootLevel["metadata"]>;
			userMetadata: FieldNodeConfigUnionRootLevel["userMetadata"];
			optionsSchema: readonly unknown[] | unknown[];
		};
	};
	intersection: {
		is: (schema: any) => schema is Base["intersection"];
		build: <T extends Base["intersection"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			// constraints: FieldNodeConfigTempParentLevel["constraints"];
			// validate: FieldNodeConfigTempParentLevel["validation"]["validate"];
			// metadata: Partial<FieldNodeConfigTempParentLevel["metadata"]>;
			// userMetadata: FieldNodeConfigTempParentLevel["userMetadata"];
			leftSchema: unknown;
			rightSchema: unknown;
		};
	};
	pipe: {
		is: (schema: any) => schema is Base["pipe"];
		build: <T extends Base["pipe"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			inSchema: unknown;
			outSchema: unknown;
		};
	};
	lazy: {
		is: (schema: any) => schema is Base["lazy"];
		build: <T extends Base["lazy"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			innerSchema: unknown;
		};
	};
	/* collections */
	array: {
		is: (schema: any) => schema is Base["array"];
		build: <T extends Base["array"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigArrayLevel["constraints"];
			validate: FieldNodeConfigArrayLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigArrayLevel["metadata"]>;
			userMetadata: FieldNodeConfigArrayLevel["userMetadata"];
			elementSchema: unknown;
		};
	};
	tuple: {
		is: (schema: any) => schema is Base["tuple"];
		build: <T extends Base["tuple"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigTupleLevel["constraints"];
			validate: FieldNodeConfigTupleLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigTupleLevel["metadata"]>;
			userMetadata: FieldNodeConfigTupleLevel["userMetadata"];
			itemsSchema: readonly unknown[] | unknown[];
		};
	};
	record: {
		is: (schema: any) => schema is Base["record"];
		build: <T extends Base["record"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigRecordLevel["constraints"];
			validate: FieldNodeConfigRecordLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigRecordLevel["metadata"]>;
			userMetadata: FieldNodeConfigRecordLevel["userMetadata"];
			valueSchema: unknown;
			keySchema: unknown;
		};
	};
	object: {
		is: (schema: any) => schema is Base["object"];
		build: <T extends Base["object"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigObjectLevel["constraints"];
			validate: FieldNodeConfigObjectLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigObjectLevel["metadata"]>;
			userMetadata: FieldNodeConfigObjectLevel["userMetadata"];
			shapeSchema: Record<string, unknown>;
		};
	};
	/* attributes */
	prefault: Base["prefault"] extends undefined
		? undefined
		: {
				is: (schema: any) => schema is Base["prefault"];
				build: <T extends Base["prefault"]>(
					schema: T,
				) => {
					defaultValue: unknown;
					innerSchema: unknown;
				};
			};
	default: Base["default"] extends undefined
		? undefined
		: {
				is: (schema: any) => schema is Base["default"];
				build: <T extends Base["default"]>(
					schema: T,
				) => {
					defaultValue: unknown;
					innerSchema: unknown;
				};
			};
	readonly: Base["readonly"] extends undefined
		? undefined
		: {
				is: (schema: any) => schema is Base["readonly"];
				build: <T extends Base["readonly"]>(
					schema: T,
				) => { innerSchema: unknown };
			};
	nonOptional: Base["nonOptional"] extends undefined
		? undefined
		: {
				is: (schema: any) => schema is Base["nonOptional"];
				build: <T extends Base["nonOptional"]>(
					schema: T,
				) => { innerSchema: unknown };
			};
	optional: Base["optional"] extends undefined
		? undefined
		: {
				is: (schema: any) => schema is Base["optional"];
				build: <T extends Base["optional"]>(
					schema: T,
				) => { innerSchema: unknown };
			};
	nullable: Base["nullable"] extends undefined
		? undefined
		: {
				is: (schema: any) => schema is Base["nullable"];
				build: <T extends Base["nullable"]>(
					schema: T,
				) => { innerSchema: unknown };
			};
	/* primitives */
	string: {
		is: (schema: any) => schema is Base["string"];
		build: <T extends Base["string"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigStringPrimitiveLevel["constraints"];
			validate: FieldNodeConfigStringPrimitiveLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigStringPrimitiveLevel["metadata"]>;
			userMetadata: FieldNodeConfigStringPrimitiveLevel["userMetadata"];
		};
	};
	number: {
		is: (schema: any) => schema is Base["number"];
		build: <T extends Base["number"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigNumberPrimitiveLevel["constraints"];
			validate: FieldNodeConfigNumberPrimitiveLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigNumberPrimitiveLevel["metadata"]>;
			userMetadata: FieldNodeConfigNumberPrimitiveLevel["userMetadata"];
		};
	};
	bigInt: {
		is: (schema: any) => schema is Base["bigInt"];
		build: <T extends Base["bigInt"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigBigIntPrimitiveLevel["constraints"];
			validate: FieldNodeConfigBigIntPrimitiveLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigBigIntPrimitiveLevel["metadata"]>;
			userMetadata: FieldNodeConfigBigIntPrimitiveLevel["userMetadata"];
		};
	};
	date: {
		is: (schema: any) => schema is Base["date"];
		build: <T extends Base["date"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigDatePrimitiveLevel["constraints"];
			validate: FieldNodeConfigDatePrimitiveLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigDatePrimitiveLevel["metadata"]>;
			userMetadata: FieldNodeConfigDatePrimitiveLevel["userMetadata"];
		};
	};
	boolean: {
		is: (schema: any) => schema is Base["boolean"];
		build: <T extends Base["boolean"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigBooleanPrimitiveLevel["constraints"];
			validate: FieldNodeConfigBooleanPrimitiveLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigBooleanPrimitiveLevel["metadata"]>;
			userMetadata: FieldNodeConfigBooleanPrimitiveLevel["userMetadata"];
		};
	};
	file: {
		is: (schema: any) => schema is Base["file"];
		build: <T extends Base["file"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigFilePrimitiveLevel["constraints"];
			validate: FieldNodeConfigFilePrimitiveLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigFilePrimitiveLevel["metadata"]>;
			userMetadata: FieldNodeConfigFilePrimitiveLevel["userMetadata"];
		};
	};
	unknown: {
		is: (schema: any) => schema is Base["unknown"];
		build: <T extends Base["unknown"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigUnknownLevel["constraints"];
			validate: FieldNodeConfigUnknownLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigUnknownLevel["metadata"]>;
			userMetadata: FieldNodeConfigUnknownLevel["userMetadata"];
		};
	};
	undefined: {
		is: (schema: any) => schema is Base["undefined"];
		build: <T extends Base["undefined"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigUndefinedLevel["constraints"];
			validate: FieldNodeConfigUndefinedLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigUndefinedLevel["metadata"]>;
			userMetadata: FieldNodeConfigUndefinedLevel["userMetadata"];
		};
	};
	null: {
		is: (schema: any) => schema is Base["null"];
		build: <T extends Base["null"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigNullLevel["constraints"];
			validate: FieldNodeConfigNullLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigNullLevel["metadata"]>;
			userMetadata: FieldNodeConfigNullLevel["userMetadata"];
		};
	};
	void: {
		is: (schema: any) => schema is Base["void"];
		build: <T extends Base["void"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigVoidLevel["constraints"];
			validate: FieldNodeConfigVoidLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigVoidLevel["metadata"]>;
			userMetadata: FieldNodeConfigVoidLevel["userMetadata"];
		};
	};
	never: {
		is: (schema: any) => schema is Base["never"];
		build: <T extends Base["never"]>(
			schema: T,
			ctx: BaseCtx,
		) => {
			constraints: FieldNodeConfigNeverLevel["constraints"];
			validate: FieldNodeConfigNeverLevel["validation"]["validate"];
			metadata: Partial<FieldNodeConfigNeverLevel["metadata"]>;
			userMetadata: FieldNodeConfigNeverLevel["userMetadata"];
		};
	};
	/* */
	unsupportedField: (props: {
		options: FieldNodeConfigValidateOptions;
		value: unknown;
		currentParentPathString: string;
		currentParentSegments: PathSegmentItem[];
		schema: unknown;
		// UnreachableField:
	}) => Promise<ValidateReturnShape<PathSegmentItem[], unknown>>;
	UnreachableField: <TReason extends "intersection-conflict">(props: {
		options: FieldNodeConfigValidateOptions;
		value: unknown;
		currentParentPathString: string;
		currentParentSegments: PathSegmentItem[];
		reason: "intersection-conflict";
	}) => Promise<
		ValidateReturnShape<
			PathSegmentItem[],
			TReason extends "intersection-conflict" ? never : unknown
		>
	>;
}
