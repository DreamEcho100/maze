// form-manger/errors.ts
import type { FieldNodeConfigValidationEvents } from "../shared.ts";

export interface FormManagerError<Path extends string> {
	/** The error message of the issue. */
	readonly message: string | null;
	/** The path of the issue, if any. */
	readonly path: Path; // ReadonlyArray<PropertyKey | PathSegment> | undefined;
	/** The validation event that triggered the issue, if any. */
	readonly validationEvent: FieldNodeConfigValidationEvents;
}
