// Schema adapter interface
export interface SchemaAdapter<T> {
	parse: (data: unknown) => T;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	safeParse: (data: unknown) => { success: boolean; data?: T; error?: any };
}
