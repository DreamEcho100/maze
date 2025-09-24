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
	arrayItem: "\uFFFF@de100/fm-🔢📌", // Short but distinctive

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

// Config key - much shorter but still distinctive
export const fnConfigKey = "\uFFFF@de100/fm-⚙️🛠️";
