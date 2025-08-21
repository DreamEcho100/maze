// import type { LanguageMessages, } from "@de100/i18n";

import type { LanguageMessages } from "@de100/i18n";
import { defineTranslation as dt } from "@de100/i18n";

const enMessages = {
	locale: "en",
	greetings: "Hello {name}! Your last login was {lastLoginDate:date}.",
	inboxMessages: dt("Hello {name}, you have {messages:plural}.", {
		plural: { messages: { one: "1 message", other: "{?} messages" } },
	}),
	hobby: dt("You chose {hobby:enum} as your hobby.", {
		enum: { hobby: { runner: "runner", developer: "developer" } },
	}),
	nested: {
		greetings: "Hello {names:list}!",
	},
} as const satisfies LanguageMessages;
export default enMessages;
