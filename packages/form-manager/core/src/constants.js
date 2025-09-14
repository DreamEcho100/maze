/* Trie structure for path-based storage and retrieval */
export const FORM_FIELD_TN_CONFIG = Symbol("FORM_FIELD_TN_CONFIG");

export const formFieldNodeConfigValidationEventsEnum = /** @type {const} */ ({
	change: "change",
	blur: "blur",
	submit: "submit",
	touch: "touch",
});

export const formFieldTNPresenceEnum = /** @type {const} */ ({
	required: "required",
	optional: "optional",
	nullable: "nullable",
	nullish: "nullish",
});

export const formFieldTNTokenEnum = /** @type {const} */ ({
	/**
	 * This is used to represent the array item in the path.
	 *
	 * For example:
	 *
	 * ```ts
	 * z.array(z.string())
	 * ```
	 *
	 * Will have the following paths:
	 * - `"@@__FIELD_TOKEN_ARRAY_ITEM__@@"` (root) -> level: "primitive" -> type: "string"
	 */
	arrayItem: "@@__FIELD_TOKEN_ARRAY_ITEM__@@",
	/**
	 * This is used to represent the direct property of an object in the path.
	 * For example:
	 * ```ts
	 * z.record(z.string(), z.number())
	 * ```
	 * Will have the following
	 * paths:
	 * - `""` (root) -> level: "record" -> type: "Record<string, number>"
	 * - `"@@__FIELD_TOKEN_RECORD_PROPERTY__@@` -> level: "primitive" -> type: "number"
	 * The root path represents the record itself, while the token path represents any property in the record.
	 * The actual property key will be dynamic and can be q valid property key _(e.g._ string, number or symbol).
	 * The token is used to indicate that it's a direct property of the record.
	 * This is useful for scenarios where you want to apply specific rules or validations to the properties of the record.
	 * For example, you might want to enforce that all properties of the record are numbers greater than zero.
	 * In such cases, you can use this token to identify and apply the necessary validations or rules.
	 * Note that this token is not used for nested objects within the record. For nested objects, the actual property keys will be used in the path to accurately represent the structure of the data.
	 * For example, if you have a record of objects like `z.record(z.string(), z.object({ age: z.number() }))`, the path for the `age` property would be something like `"someKey.age"`, where `someKey` is a dynamic key in the record.
	 * This distinction helps in accurately representing the structure of the data and applying the appropriate validations or rules at different levels of the hierarchy.
	 * This token is primarily for direct properties of the record itself.
	 * It helps in scenarios where you want to apply rules or validations to the properties of the record as a whole, rather than to nested objects within the record.
	 */
	recordProperty: "@@__FIELD_TOKEN_RECORD_PROPERTY__@@",
	/**
	 * This is used to represent the index of the union option that was valid during validation.
	 *
	 * For example:
	 *
	 * ```ts
	 * z.union([
	 *  z.object({ type: z.literal("A"), value: z.string() }),
	 * 	z.object({ type: z.literal("B"), value: z.number() }),
	 * 	z.object({ type: z.literal("C"), value: z.boolean() }),
	 * 	z.string(),
	 * ])
	 * ```
	 *
	 * Will have the following paths:
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@"`  (root) -> level: "union-root" -> type: "{ type: "A", value: string }" | "{ type: "B", value: number }" | "{ type: "C", value: boolean }"
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.0"` -> level: "object" -> type: "{ type: "A", value: string }"
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.0.type"` -> level: "primitive" -> type: "string" (literal "A")
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.0.value"` -> level: "primitive" -> type: "string"
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.1"` -> level: "object" -> type: "{ type: "B", value: number }"
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.1.type"` -> level: "primitive" -> type: "string" (literal "B")
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.1.value"` -> level: "primitive" -> type: "number"
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.2"` -> level: "object" -> type: "{ type: "C", value: boolean }"
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.2.type"` -> level: "primitive" -> type: "string" (literal "C")
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.2.value"` -> level: "primitive" -> type: "boolean"
	 * - `"@@__FIELD_TOKEN_UNION_OPTION_ON__@@.3"` -> level: "primitive" -> type: "string"
	 *
	 * The root path represents the union item itself, while the numeric paths represent each option in the union.
	 * The index of the valid option during validation can be stored in the metadata for reference.
	 */
	unionOptionOn: "@@__FIELD_TOKEN_UNION_OPTION_ON__@@",
});
