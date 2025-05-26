export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const isApiErrorResponse = (
	response: unknown,
): response is { success: boolean; error: string } =>
	!!(response && typeof response === "object" && "success" in response && !response.success);
