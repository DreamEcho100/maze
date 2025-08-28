/**
 * Special token to represent array indices in the path trie
 * This avoids collisions with actual property names
 */
export const ARRAY_ITEM_TOKEN = "@@__ARRAY_ITEM__@@";

export const FORM_VALIDATION_EVENTS = /** @type {const} */ ({
	change: "change",
	blur: "blur",
	submit: "submit",
	touch: "touch",
});
