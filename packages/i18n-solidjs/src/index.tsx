import type { LanguageMessages } from "@de100/i18n";
import { generateI18nConfig } from "@de100/i18n";
import type { ParentComponent } from "solid-js";
import {
	createContext,
	createMemo,
	createSignal,
	For,
	untrack,
	useContext,
} from "solid-js";
import { createStore } from "solid-js/store";

export const name = "@de100/i18n-solidjs";

type BaseTranslationState = ReturnType<typeof generateI18nConfig>;

// setLocale: (locale: string) => Promise<void>;
interface I18nState {
	locale: string;
	localeDirMap: Record<string, "ltr" | "rtl">;
	defaultLocale: string;
	allowedLocales: string[] | readonly string[];
	fallbackLocale: string | string[];
	translations: Record<Lowercase<string>, LanguageMessages>;
	// loadTranslations?: (props: {
	// 	locale: string;
	// }) =>
	// 	| Record<Lowercase<string>, LanguageMessages>
	// 	| Promise<Record<Lowercase<string>, LanguageMessages>>;
	// isLoadingTranslations: boolean;
	t: BaseTranslationState["t"];
	clearCache: BaseTranslationState["clearCache"];
	setLocale: (locale: string) => Promise<void>;
	// setI18n: SetStoreFunction<I18nState>;
	loadTranslations?: (props: {
		locale: string;
	}) =>
		| Record<Lowercase<string>, LanguageMessages>
		| Promise<Record<Lowercase<string>, LanguageMessages>>;
	isLoadingTranslations: boolean;
	// setIsLoadingTranslations: Setter<boolean>;
	// setIsLoadingTranslations: (isLoading: boolean) => void;
}

// const init = (
// 	props: Pick<
// 		I18nState,
// 		| "locale"
// 		| "localeDirMap"
// 		| "defaultLocale"
// 		| "allowedLocales"
// 		| "fallbackLocale"
// 		| "translations"
// 		// | "loadTranslations"
// 	>,
// ) => {
// 	const i18nConfig = generateI18nConfig({
// 		locale: props.locale,
// 		fallbackLocale: props.fallbackLocale,
// 		translations: props.translations,
// 	});

// 	setState({
// 		locale: i18nConfig.locale,
// 		defaultLocale: props.defaultLocale,
// 		allowedLocales: props.allowedLocales,
// 		fallbackLocale: props.fallbackLocale,
// 		translations: props.translations,
// 		t: i18nConfig.t,
// 		clearCache: i18nConfig.clearCache,
// 		// loadTranslations: props.loadTranslations,
// 		isLoadingTranslations: false,
// 		localeDirMap: props.localeDirMap,
// 	});
// };

function createI18nStore(
	props: Pick<
		I18nState,
		| "locale"
		| "localeDirMap"
		| "defaultLocale"
		| "allowedLocales"
		| "fallbackLocale"
		| "translations"
		| "loadTranslations"
	>,
) {
	const i18nConfig = generateI18nConfig({
		locale: props.locale,
		fallbackLocale: props.fallbackLocale,
		translations: props.translations,
	});

	// setState({
	// 	locale: i18nConfig.locale,
	// 	defaultLocale: props.defaultLocale,
	// 	allowedLocales: props.allowedLocales,
	// 	fallbackLocale: props.fallbackLocale,
	// 	translations: props.translations,
	// 	t: i18nConfig.t,
	// 	clearCache: i18nConfig.clearCache,
	// 	// loadTranslations: props.loadTranslations,
	// 	isLoadingTranslations: false,
	// 	localeDirMap: props.localeDirMap,
	// });

	const [i18n, setI18n] = createStore<I18nState>({
		// locale: "",
		// defaultLocale: "",
		// allowedLocales: [],
		// fallbackLocale: "",
		// translations: {},
		// t: (key: string) => key, // Safe fallback
		// clearCache: () => void 0, // Safe fallback
		// // loadTranslations: async () => {
		// // 	throw new Error("Translations not loaded. Please initialize translations first.");
		// // },
		// // isLoadingTranslations: false,
		// localeDirMap: {},
		// // setIsLoadingTranslations: (isLoading: boolean) => {
		// // 	setState("isLoadingTranslations", isLoading);
		// // },

		locale: i18nConfig.locale,
		defaultLocale: props.defaultLocale,
		allowedLocales: props.allowedLocales,
		fallbackLocale: props.fallbackLocale,
		translations: props.translations,
		t: i18nConfig.t,
		clearCache: i18nConfig.clearCache,
		// loadTranslations: props.loadTranslations,
		localeDirMap: props.localeDirMap,
		isLoadingTranslations: false,
		loadTranslations: props.loadTranslations,
		setLocale: async (locale: string) => {
			untrack(async () => {
				if (!i18n.allowedLocales.includes(locale)) {
					throw new Error(`Locale "${locale}" is not allowed.`);
				}
				let translations = i18n.translations;
				if (i18n.loadTranslations) {
					const currentId = ++callInterrupt.id;
					// i18n.setIsLoadingTranslations(true);
					setI18n("isLoadingTranslations", true);
					const newTranslations = await i18n.loadTranslations({
						locale,
					});
					if (currentId !== callInterrupt.id) {
						// If a new call was made, ignore this one
						console.warn(`Locale loading interrupted for "${locale}".`);
						return;
					}
					if (!newTranslations) {
						throw new Error(`Translations for locale "${locale}" not found.`);
					}
					translations = { ...translations, ...newTranslations };
				}
				const localeDir = i18n.localeDirMap[locale];
				// document query select all elements with `data-i18n-lang-access` and `data-i18n-dir-access` and set them accordingly
				for (const el of document.querySelectorAll<HTMLElement>(
					"[data-i18n-lang-access], [data-i18n-dir-access]",
				)) {
					if (el.hasAttribute("data-i18n-lang-access")) {
						el.setAttribute("lang", locale);
					}
					if (localeDir) {
						if (el.hasAttribute("data-i18n-dir-access")) {
							el.setAttribute("dir", localeDir);
						}
					}
				}
				const i18nConfig = generateI18nConfig({
					locale: locale,
					fallbackLocale: props.fallbackLocale,
					translations: translations,
				});
				setI18n("locale", i18nConfig.locale);
				setI18n("clearCache", i18nConfig.clearCache);
				setI18n("t", i18nConfig.t);
				if (i18n.loadTranslations) {
					// i18n.setIsLoadingTranslations(false);
					setI18n("translations", translations);
					setI18n("isLoadingTranslations", false);
				}
			});
		},
	});

	return i18n;
}

// const globalI18nStore = createI18nStore();

const I18nContext = createContext<I18nState>();

export const I18nProvider: ParentComponent<
	Pick<
		I18nState,
		| "locale"
		| "localeDirMap"
		| "defaultLocale"
		| "allowedLocales"
		| "translations"
		| "fallbackLocale"
		// | "loadTranslations"
	> & {
		isNew?: boolean;
		localeParam?: string;
		loadTranslations?: I18nState["loadTranslations"];
	}
> = (props) => {
	// const store = props.isNew ? createI18nStore() : globalI18nStore;
	const i18n = createI18nStore({
		locale: props.locale,
		defaultLocale: props.defaultLocale,
		allowedLocales: props.allowedLocales,
		fallbackLocale: props.fallbackLocale,
		translations: props.translations,
		loadTranslations: props.loadTranslations,
		localeDirMap: props.localeDirMap,
	});
	// const [isLoadingTranslations, setIsLoadingTranslations] = createSignal(false);

	// // createRenderEffect(() => {
	// untrack(() => {
	// 	// Initialize store
	// 	store.actions.init({
	// 		locale: props.locale,
	// 		defaultLocale: props.defaultLocale,
	// 		allowedLocales: props.allowedLocales,
	// 		fallbackLocale: props.fallbackLocale,
	// 		translations: props.translations,
	// 		loadTranslations: props.loadTranslations,
	// 		localeDirMap: props.localeDirMap,
	// 	});
	// });
	// // });
	// createEffect(
	// 	on(
	// 		() =>
	// 			!store.state.isLoadingTranslations &&
	// 			props.localeParam !== store.state.locale &&
	// 			props.localeParam,
	// 		(localeParam) => {
	// 			if (localeParam) {
	// 				untrack(() => {
	// 					store.actions.setLocale(localeParam);
	// 				});
	// 			}
	// 		},
	// 		{ defer: true },
	// 	),
	// );

	return (
		<I18nContext.Provider value={i18n}>{props.children}</I18nContext.Provider>
	);
};

export function useI18n() {
	const context = useContext(I18nContext);
	if (!context) {
		throw new Error("useI18n must be used within an I18nProvider");
	}
	return context;
}

const callInterrupt = {
	id: 0,
};

export function useGetLocale() {
	const i18n = useI18n();
	return createMemo(() => i18n.locale);
}

// export function useTranslations() {
// 	return () => useI18nStore().state.t;
// }
export function useTranslations() {
	const i18n = useI18n();
	// const i18n = useI18n();

	// return state.t; // Gets the function reference NOW, not later, losses reactivity

	// Return a function that reactively accesses state.t each time it's called
	return ((key, params) => {
		return i18n.t(key, params); // ✅ Reactive access on each call
	}) as I18nState["t"] satisfies I18nState["t"];
}
// const useLocale = ()
export function useIsLoadingTranslations() {
	const i18n = useI18n();
	return createMemo(() => i18n.isLoadingTranslations);
}

export function LocaleChooser(props: {
	locales: string[];
	loading?: boolean;
	class?: string;
	placeholder?: string;
}) {
	const i18n = useI18n();

	return (
		<select
			onChange={(e) => i18n.setLocale(e.target.value)}
			value={i18n.locale}
			disabled={props.loading || i18n.isLoadingTranslations}
			class={props.class}
		>
			<option value="" disabled>
				{props.placeholder || "Select locale..."}
			</option>
			<For each={props.locales}>
				{(localeItem) => (
					<option value={localeItem}>
						{new Intl.DisplayNames([localeItem], { type: "language" }).of(
							localeItem,
						) ?? localeItem}
					</option>
				)}
			</For>
		</select>
	);
}
