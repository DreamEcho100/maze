// Schema adapter interface
export interface SchemaAdapter<T> {
  parse: (data: unknown) => T;
  safeParse: (data: unknown) => { success: boolean; data?: T; error?: any };
}
