async function customValidate(
	value: any,
	currentParent: string,
	acc: { schema: z.ZodTypeAny },
) {
	try {
		const result = await acc.schema["~standard"].validate(value);

		if ("issues" in result && result.issues) {
			return {
				issues: result.issues.map((issue) => ({
					message: issue.message,
					path: issue.path?.join(".") || currentParent,
				})),
			};
		}

		if ("value" in result) {
			return { value: result.value };
		}

		// This case should never happen with proper Zod usage
		return {
			issues: [{ message: "Unknown validation error", path: currentParent }],
		};
	} catch (error) {
		// Handle sync validation errors
		return {
			issues: [
				{
					message: error instanceof Error ? error.message : "Validation failed",
					path: currentParent,
				},
			],
		};
	}
}
