export type ValuesShape = Record<string, any>;

export type NestedPath<Obj, Path extends string | number = ""> = {
	[Key in keyof Obj]: Obj[Key] extends object
		? `${Path}${Key & string}` | NestedPath<Obj[Key], `${Path}${Key & string}.`>
		: `${Path}${Key & string}`;
}[keyof Obj];

export type NestedPathValue<
	Obj,
	Path extends string = NestedPath<Obj>,
> = Path extends `${infer Key}.${infer Rest}`
	? Key extends keyof Obj
		? Rest extends NestedPath<Obj[Key]>
			? NestedPathValue<Obj[Key], Rest>
			: never
		: never
	: Path extends keyof Obj
		? Obj[Path]
		: never;

export type ValidationEvents = "blur" | "input" | "submit";
