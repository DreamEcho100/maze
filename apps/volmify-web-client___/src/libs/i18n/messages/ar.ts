// import type { LanguageMessages, } from "@de100/i18n";

import type { LanguageMessages } from "@de100/i18n";
import { defineTranslation as dt } from "@de100/i18n";

const arMessages = {
	// locale: "en",
	// greetings: "Hello {name}! Your last login was {lastLoginDate:date}.",
	// inboxMessages: dt("Hello {name}, you have {messages:plural}.", {
	// 	plural: { messages: { one: "1 message", other: "{?} messages" } },
	// }),
	// hobby: dt("You chose {hobby:enum} as your hobby.", {
	// 	enum: { hobby: { runner: "runner", developer: "developer" } },
	// }),
	// nested: {
	// 	greetings: "Hello {names:list}!",
	// },
	locale: "ar",
	greetings: "مرحبا {name}! آخر تسجيل دخول لك كان في {lastLoginDate:date}.",
	inboxMessages: dt("مرحبا {name}, لديك {messages:plural}.", {
		plural: { messages: { one: "رسالة واحدة", other: "{?} رسائل" } },
	}),
	hobby: dt("اخترت {hobby:enum} كهوايتك.", {
		enum: { hobby: { runner: "عداء", developer: "مطور" } },
	}),
	nested: {
		greetings: "مرحبا {names:list}!",
	},
	missingES: "هذه ترجمة مفقودة في es-ES",
} as const satisfies LanguageMessages;
export default arMessages;
