// import type { LanguageMessages } from "@de100/i18n";
// import { initI18n } from "@de100/i18n";
// import type { ParentComponent } from "solid-js";
// import { createContext, createMemo, createSignal, For, useContext } from "solid-js";

// export const name = "@de100/i18n-solidjs";

// type BaseTranslationState = ReturnType<typeof initI18n>;

// interface I18nState {
// 	locale: string;
// 	defaultLocale: string;
// 	allowedLocales: string[] | readonly string[];
// 	fallbackLocale: string | string[];
// 	translations: Record<Lowercase<string>, LanguageMessages>;
// 	loadTranslations?: (props: {
// 		locale: string;
// 	}) =>
// 		| Record<Lowercase<string>, LanguageMessages>
// 		| Promise<Record<Lowercase<string>, LanguageMessages>>;
// 	isLoadingTranslations: boolean;
// 	setIsLoadingTranslations: (isLoading: boolean) => void;
// 	t: BaseTranslationState["t"];
// 	clearCache: BaseTranslationState["clearCache"];
// }

// interface I18nActions {
// 	setLocale: (locale: string) => Promise<void>;
// 	init: (props: {
// 		locale: string;
// 		defaultLocale: string;
// 		allowedLocales: string[] | readonly string[];
// 		fallbackLocale: string | string[];
// 		translations: Record<Lowercase<string>, LanguageMessages>;
// 	}) => void;
// }

// function createI18nStore() {
// 	const [state, setState] = createSignal<I18nState>({
// 		locale: "",
// 		defaultLocale: "",
// 		allowedLocales: [],
// 		fallbackLocale: "",
// 		translations: {},
// 		t: (key: string) => key, // Safe fallback
// 		clearCache: () => void 0, // Safe fallback
// 		loadTranslations: async () => {
// 			throw new Error("Translations not loaded. Please initialize translations first.");
// 		},
// 		isLoadingTranslations: false,
// 		setIsLoadingTranslations: (isLoading: boolean) => {
// 			setState((prev) => ({
// 				...prev,
// 				isLoadingTranslations: isLoading,
// 			}));
// 		},
// 	});

// 	const callInterrupt = {
// 		id: 0,
// 	};

// 	const setLocale = async (locale: string) => {
// 		const currentState = state();
// 		if (!currentState.allowedLocales.includes(locale)) {
// 			throw new Error(`Locale "${locale}" is not allowed.`);
// 		}
// 		let translations = currentState.translations;
// 		if (currentState.loadTranslations) {
// 			const currentId = ++callInterrupt.id;
// 			currentState.setIsLoadingTranslations(true);

// 			const newTranslations = await currentState.loadTranslations({
// 				locale,
// 			});
// 			if (currentId !== callInterrupt.id) {
// 				// If a new call was made, ignore this one
// 				// setIsLoadingTranslations(false);
// 				// No need to set loading state again, it will be handled by the next call
// 				console.warn(`Locale loading interrupted for "${locale}".`);
// 				return;
// 			}
// 			currentState.setIsLoadingTranslations(false);
// 			if (!translations) {
// 				throw new Error(`Translations for locale "${locale}" not found.`);
// 			}
// 			translations = { ...translations, ...newTranslations };
// 		}

// 		init({
// 			locale: locale,
// 			defaultLocale: currentState.defaultLocale,
// 			allowedLocales: currentState.allowedLocales,
// 			translations,
// 			fallbackLocale: currentState.fallbackLocale,
// 			loadTranslations: currentState.loadTranslations,
// 		});
// 	};

// 	const init = (props: {
// 		locale: string;
// 		defaultLocale: string;
// 		allowedLocales: string[] | readonly string[];
// 		fallbackLocale: string | string[];
// 		translations: Record<Lowercase<string>, LanguageMessages>;
// 		loadTranslations?: (props: {
// 			locale: string;
// 		}) =>
// 			| Record<Lowercase<string>, LanguageMessages>
// 			| Promise<Record<Lowercase<string>, LanguageMessages>>;
// 	}) => {
// 		const initRes = initI18n({
// 			locale: props.locale,
// 			fallbackLocale: props.fallbackLocale,
// 			translations: props.translations,
// 		});

// 		setState({
// 			locale: initRes.locale,
// 			defaultLocale: props.defaultLocale,
// 			allowedLocales: props.allowedLocales,
// 			fallbackLocale: props.fallbackLocale,
// 			translations: props.translations,
// 			t: initRes.t,
// 			clearCache: initRes.clearCache,
// 			loadTranslations: props.loadTranslations,
// 			isLoadingTranslations: false,
// 			setIsLoadingTranslations: (isLoading: boolean) => {
// 				setState((prev) => ({
// 					...prev,
// 					isLoadingTranslations: isLoading,
// 				}));
// 			},
// 		});
// 	};

// 	return {
// 		state,
// 		actions: {
// 			setLocale,
// 			init,
// 		},
// 	};
// }

// const globalI18nStore = createI18nStore();

// const I18nContext = createContext<{ state: () => I18nState; actions: I18nActions }>();

// export const I18nProvider: ParentComponent<{
// 	locale: string;
// 	defaultLocale: string;
// 	allowedLocales: string[] | readonly string[];
// 	translations: Record<Lowercase<string>, LanguageMessages>;
// 	fallbackLocale: string | string[];
// 	isNew?: boolean;
// 	loadTranslations?: (props: {
// 		locale: string;
// 	}) =>
// 		| Record<Lowercase<string>, LanguageMessages>
// 		| Promise<Record<Lowercase<string>, LanguageMessages>>;
// }> = (props) => {
// 	const store = props.isNew ? createI18nStore() : globalI18nStore;

// 	// Initialize store
// 	store.actions.init({
// 		locale: props.locale,
// 		defaultLocale: props.defaultLocale,
// 		allowedLocales: props.allowedLocales,
// 		fallbackLocale: props.fallbackLocale,
// 		translations: props.translations,
// 		loadTranslations: props.loadTranslations,
// 	});

// 	return (
// 		<I18nContext.Provider value={{ state: store.state, actions: store.actions }}>
// 			{props.children}
// 		</I18nContext.Provider>
// 	);
// };

// export function useI18nStore() {
// 	const context = useContext(I18nContext);
// 	if (!context) {
// 		return { state: globalI18nStore.state, actions: globalI18nStore.actions };
// 	}
// 	return context;
// }

// export function setLocale() {
// 	const { actions } = useI18nStore();
// 	return actions.setLocale;
// }

// export function useLocale() {
// 	return createMemo(() => globalI18nStore.state().locale);
// }

// export function useGetLocale() {
// 	const { state } = useI18nStore();
// 	return createMemo(() => state().locale);
// }

// export function useTranslations() {
// 	const { state } = useI18nStore();
// 	return createMemo(() => state().t);
// }

// interface UseTranslationReturn {
// 	t: () => I18nState["t"];
// 	locale: () => I18nState["locale"];
// 	defaultLocale: () => I18nState["defaultLocale"];
// 	allowedLocales: () => I18nState["allowedLocales"];
// 	setLocale: I18nActions["setLocale"];
// 	translations: () => I18nState["translations"];
// 	loadTranslations?: I18nState["loadTranslations"];
// 	clearCache: () => I18nState["clearCache"];
// }

// export function useI18n(): UseTranslationReturn {
// 	const { state, actions } = useI18nStore();

// 	return {
// 		t: createMemo(() => state().t),
// 		locale: createMemo(() => state().locale),
// 		defaultLocale: createMemo(() => state().defaultLocale),
// 		allowedLocales: createMemo(() => state().allowedLocales),
// 		clearCache: createMemo(() => state().clearCache),
// 		translations: createMemo(() => state().translations),
// 		// loadTranslations: async () => {
// 		// 	// This is a placeholder for any async loading logic if needed
// 		// 	throw new Error("loadTranslations not implemented.");
// 		// },
// 		setLocale: actions.setLocale,
// 	};
// }

// export function LocaleChooser(props: {
// 	locales: string[];
// 	loading?: boolean;
// 	class?: string;
// 	placeholder?: string;
// }) {
// 	const { setLocale, locale } = useI18n();

// 	return (
// 		<select
// 			onChange={(e) => setLocale(e.target.value)}
// 			value={locale()}
// 			disabled={props.loading}
// 			class={props.class}
// 		>
// 			<option value="" disabled>
// 				{props.placeholder || "Select locale..."}
// 			</option>
// 			<For each={props.locales}>
// 				{(localeItem) => (
// 					<option value={localeItem}>
// 						{new Intl.DisplayNames([localeItem], { type: "language" }).of(localeItem) ?? localeItem}
// 					</option>
// 				)}
// 			</For>
// 		</select>
// 	);
// }

import type { LanguageMessages } from "@de100/i18n";
import { initI18n } from "@de100/i18n";
import type { ParentComponent } from "solid-js";
import { createContext, createMemo, For, useContext } from "solid-js";
import { createStore } from "solid-js/store";

export const name = "@de100/i18n-solidjs";

type BaseTranslationState = ReturnType<typeof initI18n>;

interface I18nState {
	locale: string;
	defaultLocale: string;
	allowedLocales: string[] | readonly string[];
	fallbackLocale: string | string[];
	translations: Record<Lowercase<string>, LanguageMessages>;
	loadTranslations?: (props: {
		locale: string;
	}) =>
		| Record<Lowercase<string>, LanguageMessages>
		| Promise<Record<Lowercase<string>, LanguageMessages>>;
	isLoadingTranslations: boolean;
	t: BaseTranslationState["t"];
	clearCache: BaseTranslationState["clearCache"];
}

interface I18nActions {
	setLocale: (locale: string) => Promise<void>;
	init: (props: {
		locale: string;
		defaultLocale: string;
		allowedLocales: string[] | readonly string[];
		fallbackLocale: string | string[];
		translations: Record<Lowercase<string>, LanguageMessages>;
	}) => void;
	setIsLoadingTranslations: (isLoading: boolean) => void;
}

function createI18nStore() {
	const [state, setState] = createStore<I18nState>({
		locale: "",
		defaultLocale: "",
		allowedLocales: [],
		fallbackLocale: "",
		translations: {},
		t: (key: string) => key, // Safe fallback
		clearCache: () => void 0, // Safe fallback
		loadTranslations: async () => {
			throw new Error(
				"Translations not loaded. Please initialize translations first.",
			);
		},
		isLoadingTranslations: false,
	});

	const callInterrupt = {
		id: 0,
	};

	const setIsLoadingTranslations = (isLoading: boolean) => {
		setState("isLoadingTranslations", isLoading);
	};

	const setLocale = async (locale: string) => {
		if (!state.allowedLocales.includes(locale)) {
			throw new Error(`Locale "${locale}" is not allowed.`);
		}

		let translations = state.translations;
		if (state.loadTranslations) {
			const currentId = ++callInterrupt.id;
			setIsLoadingTranslations(true);

			const newTranslations = await state.loadTranslations({
				locale,
			});

			if (currentId !== callInterrupt.id) {
				// If a new call was made, ignore this one
				console.warn(`Locale loading interrupted for "${locale}".`);
				return;
			}

			setIsLoadingTranslations(false);

			if (!newTranslations) {
				throw new Error(`Translations for locale "${locale}" not found.`);
			}

			translations = { ...translations, ...newTranslations };
		}

		init({
			locale: locale,
			defaultLocale: state.defaultLocale,
			allowedLocales: state.allowedLocales,
			translations,
			fallbackLocale: state.fallbackLocale,
			loadTranslations: state.loadTranslations,
		});
	};

	const init = (props: {
		locale: string;
		defaultLocale: string;
		allowedLocales: string[] | readonly string[];
		fallbackLocale: string | string[];
		translations: Record<Lowercase<string>, LanguageMessages>;
		loadTranslations?: (props: {
			locale: string;
		}) =>
			| Record<Lowercase<string>, LanguageMessages>
			| Promise<Record<Lowercase<string>, LanguageMessages>>;
	}) => {
		const initRes = initI18n({
			locale: props.locale,
			fallbackLocale: props.fallbackLocale,
			translations: props.translations,
		});

		setState({
			locale: initRes.locale,
			defaultLocale: props.defaultLocale,
			allowedLocales: props.allowedLocales,
			fallbackLocale: props.fallbackLocale,
			translations: props.translations,
			t: initRes.t,
			clearCache: initRes.clearCache,
			loadTranslations: props.loadTranslations,
			isLoadingTranslations: false,
		});
	};

	return {
		state,
		actions: {
			setLocale,
			init,
			setIsLoadingTranslations,
		},
	};
}

const globalI18nStore = createI18nStore();

const I18nContext = createContext<{ state: I18nState; actions: I18nActions }>();

export const I18nProvider: ParentComponent<{
	locale: string;
	defaultLocale: string;
	allowedLocales: string[] | readonly string[];
	translations: Record<Lowercase<string>, LanguageMessages>;
	fallbackLocale: string | string[];
	isNew?: boolean;
	loadTranslations?: (props: {
		locale: string;
	}) =>
		| Record<Lowercase<string>, LanguageMessages>
		| Promise<Record<Lowercase<string>, LanguageMessages>>;
}> = (props) => {
	const store = props.isNew ? createI18nStore() : globalI18nStore;

	// Initialize store
	store.actions.init({
		locale: props.locale,
		defaultLocale: props.defaultLocale,
		allowedLocales: props.allowedLocales,
		fallbackLocale: props.fallbackLocale,
		translations: props.translations,
		loadTranslations: props.loadTranslations,
	});

	return (
		<I18nContext.Provider
			value={{ state: store.state, actions: store.actions }}
		>
			{props.children}
		</I18nContext.Provider>
	);
};

export function useI18nStore() {
	const context = useContext(I18nContext);
	if (!context) {
		return { state: globalI18nStore.state, actions: globalI18nStore.actions };
	}
	return context;
}

export function setLocale() {
	return useI18nStore().actions.setLocale;
}

export function useLocale() {
	return createMemo(() => globalI18nStore.state.locale);
}

export function useGetLocale() {
	return () => useI18nStore().state.locale;
}

export function useTranslations() {
	return useI18nStore().state.t;
}

export function useIsLoadingTranslations() {
	return () => useI18nStore().state.isLoadingTranslations;
}

interface UseTranslationReturn {
	t: I18nState["t"];
	locale: () => I18nState["locale"];
	defaultLocale: () => I18nState["defaultLocale"];
	allowedLocales: () => I18nState["allowedLocales"];
	setLocale: I18nActions["setLocale"];
	translations: () => I18nState["translations"];
	loadTranslations?: I18nState["loadTranslations"];
	clearCache: I18nState["clearCache"];
	isLoadingTranslations: () => I18nState["isLoadingTranslations"];
}

export function useI18n(): UseTranslationReturn {
	const { state, actions } = useI18nStore();

	return {
		t: state.t,
		locale: () => state.locale,
		defaultLocale: () => state.defaultLocale,
		allowedLocales: () => state.allowedLocales,
		clearCache: state.clearCache,
		translations: () => state.translations,
		isLoadingTranslations: () => state.isLoadingTranslations,
		setLocale: actions.setLocale,
	};
}

export function LocaleChooser(props: {
	locales: string[];
	loading?: boolean;
	class?: string;
	placeholder?: string;
}) {
	const { setLocale, locale, isLoadingTranslations } = useI18n();

	return (
		<select
			onChange={(e) => setLocale(e.target.value)}
			value={locale()}
			disabled={props.loading || isLoadingTranslations()}
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
