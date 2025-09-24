/* Our token system uses Unicode-enhanced string identifiers for namespace isolation and visual debugging... aka we are using emojis on the string 🤣 */

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
	 *
	 * @danger
	 * **WARNING**: cringe ahh alternative to symbols for hydration safety 🥲, proceed with cation
	 *
	 * The Greatest Array Show on Earth! 🎪
	 *
	 * Ringmaster 🤪 presents the most spectacular array performance ever!
	 * Watch death-defying acrobats leap between indices 🤸‍♂️,
	 * see tigers jump through flaming bracket hoops 🔥,
	 * as the crowd goes WILD for the amazing flying array items! 🎊🫠
	 */
	arrayItem: "🤪FN🔤TKN🎪ARR🤸‍♂️CIRCUS🔥AMAZING🎊🫠",

	/**
	 *
	 * @danger
	 * **WARNING**: cringe ahh alternative to symbols for hydration safety 🥲, proceed with cation
	 *
	 * The Record Property Magic Show 🎩
	 *
	 * Ladies and gentlemen, magician 🤪 will now attempt
	 * the impossible trick of making record properties appear 🎩✨
	 * from thin air! Watch as keys materialize from nowhere 🗝️,
	 * ABRACADABRA! The crowd gasps in amazement! 👏🫠
	 */
	recordProperty: "🤪FN🔤TKN🎩RCRD✨MAGIC🗝️ABRACADABRA👏🫠",

	/**
	 *
	 * @danger
	 * **WARNING**: cringe ahh alternative to symbols for hydration safety 🥲, proceed with cation
	 *
	 * The Union Battle Royale Wrestling Match 🤼‍♂️
	 *
	 * 🤪 announces tonight's MAIN EVENT championship bout!
	 * In this corner: String Type! In that corner: Number Type! 📢
	 * The crowd chants as they grapple for ultimate union supremacy 💪,
	 * AND THE WINNER IS... *drumroll* 🥁 THE CHAMPION! 🏆🫠
	 */
	unionOptionOn: "🤪FN🔤TKN🤼‍♂️UNION📢WRESTLING💪CHAMPION🏆🫠",
});

/**
 *
 * @danger
 * **WARNING**: cringe ahh alternative to symbols for hydration safety 🥲, proceed with cation
 *
 * The Grand Finale: The Master Ringmaster's Secret Vault! 🎪
 *
 * Deep beneath the Greatest Show on Earth, 🤪 discovers the legendary
 * Master Ringmaster's ancient vault 🏛️ containing the most precious artifact:
 * The Golden Config Key 🗝️ that controls ALL circus performances! 🎪
 * Guarded by mystical config dragons 🐉 and protected by ancient spells ✨,
 * only the worthy developer can claim this ultimate power and become
 * the Supreme Ringmaster of Form Management! 👑🫠
 */
export const fnConfigKey = "🤪FN🔤TKN🏛️CFG🐉VAULT🗝️RINGMASTER👑🫠";
