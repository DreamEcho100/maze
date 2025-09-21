import type { PathSegmentItem } from "../../shared/types.ts";

export interface FormManagerError<
	PathAcc extends PathSegmentItem[] = string[],
> {
	/** The error message of the issue. */
	message: string | null;
	/** The path of the issue, if any. */
	// TODO: it should be inferred from the PathAcc
	pathString: string; // ReadonlyArray<PropertyKey | PathSegment> | undefined;
	pathSegments: PathAcc;
	// TODO: `fieldPath` and `fieldPathSegments`, those will be lazily computed using a getter and cached/set once accessed so we don't pay the cost if not needed, it will try to compute the actual field path by figuring any actual token through traversing the TreeNode by the pathSegments, if any token is not resolvable, it will return undefined, otherwise it will return the actual path to the field, or making a `normalizeZodPath` that the user/dev can call to get the actual field path from the issue.pathSegments
}

export interface SuccessResult<Output> {
	/** The typed output value. */
	value: Output;
	/** The non-existent issues. */
	issues: undefined;
}
/** The result interface if validation fails. */
export interface FailureResult<PathAcc extends PathSegmentItem[] = string[]> {
	/** The issues of failed validation. */
	issues: ReadonlyArray<FormManagerError<PathAcc>>;
}
export type ValidationResult<
	PathAcc extends PathSegmentItem[] = PathSegmentItem[],
	ValidValue = unknown,
> = SuccessResult<ValidValue> | FailureResult<PathAcc>;
