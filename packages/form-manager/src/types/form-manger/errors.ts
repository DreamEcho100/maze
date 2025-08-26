import type { NestedPath, ValidationEvents } from "../shared";

export type FormMangerErrors<Schema> = {
	[Key in NestedPath<Schema>]?: {
		name: Key;
		message: string | null;
		validationEvent: ValidationEvents;
	};
};
