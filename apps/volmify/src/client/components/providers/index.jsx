"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import { I18nProvider } from "@de100/i18n-reactjs";
import { Toaster } from "@de100/ui/components/sonner";

import SessionProvider from "#client/libs/auth/components/session-provider";
import { orpc, ORPCContext, queryClient } from "#client/libs/orpc";
import { ThemeProvider } from "../theme-provider";

/** @param {Parameters<typeof I18nProvider>[0] & { children: React.ReactNode } } props  */
export default function Providers(props) {
	return (
		<I18nProvider
			allowedLocales={props.allowedLocales}
			defaultLocale={props.defaultLocale}
			fallbackLocale={props.fallbackLocale}
			translations={props.translations}
			locale={props.locale}>
			<ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
				<QueryClientProvider client={queryClient}>
					<SessionProvider>
						<ORPCContext.Provider value={orpc}>{props.children}</ORPCContext.Provider>
						<ReactQueryDevtools />
					</SessionProvider>
				</QueryClientProvider>
				<Toaster richColors />
			</ThemeProvider>
		</I18nProvider>
	);
}
