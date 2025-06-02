import type { SchemaAdapter } from "#schemas";
import type z from "zod/v4-mini";

// Zod schema adapter
export class ZodSchemaAdapter<T> implements SchemaAdapter<T> {
	constructor(private schema: z.ZodMiniType<T>) {}

	parse(data: unknown): T {
		return this.schema.parse(data);
	}

	safeParse(data: unknown): { success: boolean; data?: T; error?: any } {
		const result = this.schema.safeParse(data);
		if (result.success) {
			return { success: true, data: result.data };
		} else {
			return { success: false, error: result.error };
		}
	}
}

// Factory function to create a Zod schema adapter
export function createZodAdapter<T>(schema: z.ZodMiniType<T>): SchemaAdapter<T> {
	return new ZodSchemaAdapter(schema);
}
