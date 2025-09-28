import type {
	FieldNode,
	NormalizePathSegments,
	NormalizePathSegmentsToString,
} from "#fields/shape/types.ts";
import type {
	DeepFieldNodePathEntry,
	FieldNodeConfigValidationEvent,
	FnConfigKey,
	PathSegmentItem,
} from "../../shared/types.ts";

export interface FieldError<
	PathSegments extends PathSegmentItem[] = PathSegmentItem[],
> {
	/** The error message of the issue. */
	message: string | null;
	/** The path of the issue, if any. */
	// TODO: it should be inferred from the PathSegments
	// pathString: PathSegmentsToString<PathSegments>; // ReadonlyArray<PropertyKey | PathSegment> | undefined;
	// pathSegments: PathSegments;
	normalizedPathSegments: PathSegments;
	pathIssuerSegments: NormalizePathSegments<PathSegments>;
	// TODO: `fieldPath` and `fieldPathSegments`, those will be lazily computed using a getter and cached/set once accessed so we don't pay the cost if not needed, it will try to compute the actual field path by figuring any actual token through traversing the TreeNode by the pathSegments, if any token is not resolvable, it will return undefined, otherwise it will return the actual path to the field, or making a `normalizeZodPath` that the user/dev can call to get the actual field path from the issue.pathSegments
	event: FieldNodeConfigValidationEvent;
}

export interface SuccessResult<Output> {
	/** The typed output value. */
	value: Output;
	/** The non-existent issues. */
	issues: undefined;
}
/** The result interface if validation fails. */
export interface FailureResult<
	PathSegments extends PathSegmentItem[] = string[],
> {
	/** The issues of failed validation. */
	issues: ReadonlyArray<FieldError<PathSegments>>;
}
export type ValidationResult<
	PathSegments extends PathSegmentItem[] = PathSegmentItem[],
	ValidValue = unknown,
> = SuccessResult<ValidValue> | FailureResult<PathSegments>;

type Pretty<T> = { [K in keyof T]: T[K] } & {};
export type FieldPathToError<T extends FieldNode> =
	// DeepFieldNodePathEntry<T>["pathSegments"]
	Pretty<{
		[NodeInfo in DeepFieldNodePathEntry<T> as NormalizePathSegmentsToString<
			// NodeInfo["normalizedPathString"]
			NodeInfo["pathSegments"]
		>]?: FieldError<NodeInfo["fieldNode"][FnConfigKey]["pathSegments"]>;
		// test: DeepFieldNodePathEntry<T>;
	}>;
