"use client";

import type { ReactNode } from "react";
import type { StoreApi } from "zustand";
import { createContext, useContext } from "react";
import { createStore, useStore } from "zustand";
import { mutative } from "zustand-mutative";

import type { LanguageMessages } from "@de100/i18n";
import { initI18n } from "@de100/i18n";

export const name = "@de100/i18n-reactjs";

// const unusedProxyThrow = new Proxy(
// 	{},
// 	{
// 		get: () => {
// 			throw new Error("Translations not initialized yet");
// 		},
// 	},
// );

type BaseTranslationState = ReturnType<typeof initI18n>;
interface State extends BaseTranslationState {
	locale: string;
	defaultLocale: string;
	allowedLocales: string[] | readonly string[];
	fallbackLocale: string | string[];
	translations: Record<Lowercase<string>, LanguageMessages>;
}
interface Actions {
	setLocale: (locale: string) => void;
	init: (props: {
		locale: string;
		defaultLocale: string;
		allowedLocales: string[] | readonly string[];
		fallbackLocale: string | string[];
		translations: Record<Lowercase<string>, LanguageMessages>;
	}) => void;
}
const createI18nStore: () => StoreApi<State & Actions> = () =>
	createStore<State & Actions>()(
		mutative((set, get) => ({
			// Initialize with safe defaults
			locale: "",
			defaultLocale: "",
			allowedLocales: [],
			fallbackLocale: "",
			translations: {},
			t: (key: string) => key, // Safe fallback
			clearCache: () => void 0, // Safe fallback
			//
			setLocale: (locale) => {
				set((state) => {
					if (!state.allowedLocales.includes(locale)) {
						throw new Error(`Locale "${locale}" is not allowed.`);
					}

					state.locale = locale;
					state.init({
						locale: locale,
						defaultLocale: state.defaultLocale,
						allowedLocales: state.allowedLocales,
						translations: state.translations,
						fallbackLocale: state.fallbackLocale,
					});
				});
			},
			init: (props) => {
				const state = get();
				state.defaultLocale = props.defaultLocale;
				state.allowedLocales = props.allowedLocales;
				const initRes = initI18n({
					locale: props.locale,
					fallbackLocale: props.fallbackLocale,
					translations: props.translations,
				});
				state.locale = initRes.locale;
				state.clearCache = initRes.clearCache;
				state.t = initRes.t;

				set(state);
			},
		})),
	);
export const globalI18nStore = createI18nStore();

const I18nContext = createContext({ store: globalI18nStore });

export function I18nProvider({
	locale,
	defaultLocale,
	allowedLocales,
	translations,
	fallbackLocale,
	children,
	isNew,
}: {
	locale: string;
	defaultLocale: string;
	allowedLocales: string[] | readonly string[];
	translations: Record<Lowercase<string>, LanguageMessages>;
	fallbackLocale: string | string[];
	children: ReactNode;
	isNew?: boolean;
}) {
	const store = isNew ? createI18nStore() : globalI18nStore;

	// Initialize only once or when dependencies change
	store.getState().init({
		locale,
		defaultLocale,
		allowedLocales,
		fallbackLocale,
		translations,
	});

	// return store;
	// const store = useMemo(() => {
	// }, [locale, fallbackLocale, translations, isNew]);

	return <I18nContext value={{ store }}>{children}</I18nContext>;
}

export function useI18nStore(): StoreApi<State & Actions> {
	const context = useContext(I18nContext);
	return context.store;
}
export function setLocale() {
	const i18nStore = useI18nStore();
	return i18nStore.getState().setLocale;
}
export function useLocale() {
	return useStore(globalI18nStore, (state) => state.locale);
}
export function useGetLocale() {
	const i18nStore = useI18nStore();
	return useStore(i18nStore, (state) => state.locale);
}
export function useTranslations(): State["t"] {
	const i18nStore = useI18nStore();
	// const t = useStore(i18nStore, (state) => state.t);
	// return useCallback((key, args) => t(key, args), [t]) as State["t"];
	return useStore(i18nStore, (state) => state.t);
}

interface UseTranslationReturn {
	t: State["t"];
	locale: State["locale"];
	defaultLocale: State["defaultLocale"];
	allowedLocales: State["allowedLocales"];
	setLocale: Actions["setLocale"];
	translations: State["translations"];
	clearCache: State["clearCache"];
}

export function useI18n(): UseTranslationReturn {
	const i18nStore = useI18nStore();
	const locale = useStore(i18nStore, (state) => state.locale);
	const defaultLocale = useStore(i18nStore, (state) => state.defaultLocale);
	const allowedLocales = useStore(i18nStore, (state) => state.allowedLocales);
	const t = useStore(i18nStore, (state) => state.t);
	const translations = useStore(i18nStore, (state) => state.translations);
	const clearCache = useStore(i18nStore, (state) => state.clearCache);

	return {
		t,
		locale,
		defaultLocale,
		allowedLocales,
		clearCache,
		translations,
		setLocale: i18nStore.getState().setLocale,
	};
}

export function LocaleChooser({
	locales,
	loading = false,
	className,
	placeholder = "Select locale...",
}: {
	locales: string[];
	loading?: boolean;
	className?: string;
	placeholder?: string;
}) {
	const { setLocale, locale: selectedLocale } = useI18n();

	return (
		<select
			onChange={(e) => setLocale(e.target.value)}
			value={selectedLocale}
			disabled={loading}
			className={className}
		>
			<option value="" disabled>
				{placeholder}
			</option>
			{locales.map((locale) => (
				<option key={locale} value={locale}>
					{new Intl.DisplayNames([locale], { type: "language" }).of(locale) ?? locale}
				</option>
			))}
			+++++++
		</select>
	);
}
