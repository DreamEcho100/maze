"use client";

import type { ReactNode } from "react";
import type { StoreApi } from "zustand";
import { createContext, useContext, useMemo } from "react";
import { createStore, useStore } from "zustand";
import { mutative } from "zustand-mutative";

import type { LanguageMessages } from "@de100/i18n";
import { initI18n } from "@de100/i18n";

export const name = "@de100/i18n-react";

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
	fallbackLocale: string | string[];
	translations: Record<Lowercase<string>, LanguageMessages>;
}
interface Actions {
	setLocale: (locale: string) => void;
	setTranslations: (translations: Record<Lowercase<string>, LanguageMessages>) => void;
	setFallbackLocale?: (fallbackLocale: string | string[]) => void;
	init: (props: {
		defaultLocale: string;
		fallbackLocale: string | string[];
		translations: Record<Lowercase<string>, LanguageMessages>;
	}) => void;
}
const createI18nStore: () => StoreApi<State & Actions> = () =>
	createStore<State & Actions>()(
		mutative((set) => ({
			// Initialize with safe defaults
			locale: "",
			fallbackLocale: "",
			translations: {},
			t: (key: string) => key, // Safe fallback
			clearCache: () => void 0, // Safe fallback
			//
			setTranslations: (translations) => {
				set((state) => {
					state.translations = translations;
					state.init({
						defaultLocale: state.locale,
						fallbackLocale: state.fallbackLocale,
						translations,
					});
				});
			},
			setFallbackLocale: (fallbackLocale) => {
				set((state) => {
					state.fallbackLocale = fallbackLocale;
					state.init({
						defaultLocale: state.locale,
						fallbackLocale,
						translations: state.translations,
					});
				});
			},
			setLocale: (locale) => {
				set((state) => {
					state.locale = locale;
					state.init({
						defaultLocale: locale,
						translations: state.translations,
						fallbackLocale: state.fallbackLocale,
					});
				});
			},
			init: (props) => {
				set((state) => {
					const initRes = initI18n({
						locale: props.defaultLocale,
						fallbackLocale: props.fallbackLocale,
						translations: props.translations,
					});
					state.locale = initRes.locale;
					state.clearCache = initRes.clearCache;
					state.t = initRes.t;
				});
			},
		})),
	);
export const globalI18nStore = createI18nStore();

const I18nContext = createContext({ store: globalI18nStore });

export function I18nProvider({
	defaultLocale,
	translations,
	fallbackLocale,
	children,
	isNew,
}: {
	defaultLocale: string;
	translations: Record<Lowercase<string>, LanguageMessages>;
	fallbackLocale: string | string[];
	children: ReactNode;
	isNew?: boolean;
}) {
	const store = useMemo(() => {
		const store = isNew ? createI18nStore() : globalI18nStore;

		// Initialize only once or when dependencies change
		store.getState().init({
			defaultLocale,
			fallbackLocale,
			translations,
		});

		return store;
	}, [defaultLocale, fallbackLocale, translations, isNew]);

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
	setLocale: Actions["setLocale"];
	setTranslations: Actions["setTranslations"];
	setFallbackLocale: Actions["setFallbackLocale"];
	translations: State["translations"];
	clearCache: State["clearCache"];
}

export function useI18n(): UseTranslationReturn {
	const i18nStore = useI18nStore();
	const locale = useStore(i18nStore, (state) => state.locale);
	const t = useStore(i18nStore, (state) => state.t);
	const translations = useStore(i18nStore, (state) => state.translations);
	const clearCache = useStore(i18nStore, (state) => state.clearCache);

	return {
		t,
		locale,
		clearCache,
		translations,
		setLocale: i18nStore.getState().setLocale,
		setTranslations: i18nStore.getState().setTranslations,
		setFallbackLocale: i18nStore.getState().setFallbackLocale,
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
			className={className}>
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
