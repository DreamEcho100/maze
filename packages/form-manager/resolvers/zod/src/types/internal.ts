// It's isn't about Zod semantics — it's about making a common interface that different schema validators can be transformed for form ergonomics.
// So we can have a common ground for different schema validators to work with the form manager.
// And keep form state agnostic of the validator library.
import type z from "zod/v4";

export const name = "form-manager-resolver-zod";

export type ZodAny =
	| z.ZodTypeAny
	| z.core.$ZodType<any, any, any>
	| z.core.SomeType;
