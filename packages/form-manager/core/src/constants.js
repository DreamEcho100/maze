/* Trie structure for path-based storage and retrieval */
// Node emoji:
// Symbol("fnConfigKey");
export const fnIOValueToInfer = Symbol("fnIOValueToInfer");

export const fieldNodeConfigValidationEventsEnum = /** @type {const} */ ({
	change: "change",
	blur: "blur",
	submit: "submit",
	touch: "touch",
	custom: "custom",
});

export const fieldNodePresenceEnum = /** @type {const} */ ({
	required: "required",
	optional: "optional",
	nullable: "nullable",
	nullish: "nullish",
});

export const fieldNodeTokenEnum = /** @type {const} */ ({
	/**
	 * 📊 Array Item Token
	 * Emoji key: 🔢 (array) + 📌 (item)
	 */
	arrayItem: "\uFFFF@de100/fm-🔢📌",

	/**
	 * 🏢 Record Property Token
	 * Emoji key: 🔑 (record) + 📝 (property)
	 */
	recordProperty: "\uFFFF@de100/fm-🔑📝",

	/**
	 * ⚡ Union Option Token
	 * Emoji key: 🔀 (union) + 🎯 (selected option)
	 */
	unionOptionOn: "\uFFFF@de100/fm-🔀🎯",
});

/**
 *
 * @description
 * The key used to store field configuration on field values and nodes.
 *
 * This key is a string with special characters to minimize the risk of collisions
 * with user-defined keys. It is used as a property key on objects to store metadata
 * about the field, such as its type, constraints, and other configuration details.
 *
 * @warning Always use the `${fnConfigKey}` or `[fnConfigKey]`  instead of the string directly to avoid typos and ensure type safety.
 */
export const fnConfigKey =
	// /** @type {"\uFFFF@de100/fm-⚙️🛠️" & { __brand: "key" }} */
	// "\uFFFF@de100/fm-⚙️🛠️";
	"\uFFFF@de100/fm-\u2699\uFE0F\uD83D\uDEE0\uFE0F";
