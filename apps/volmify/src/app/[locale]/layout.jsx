/**
 * @import { Metadata } from "next";
 * @import { PropsWithChildren } from "react";
 */
import { Geist, Geist_Mono } from "next/font/google";

import "#client/index.css";

import { notFound } from "next/navigation";

import Header from "#client/components/header";
import Providers from "#client/components/providers";
import { allowedLocales, defaultLocale, fallbackLocale } from "#i18n/constants";
import { getTranslation } from "#i18n/getTranslations";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

/** @type {Metadata} */
export const metadata = {
	title: "volmify",
	description: "volmify",
};

/** @param {PropsWithChildren<{ params: Promise<{ locale?: string }>; }>} props  */
export default async function RootLayout(props) {
	const params = await props.params;

	// Use the locale from URL params, not from getRequestLocale()
	const locale = params.locale ?? defaultLocale;

	if (
		!locale ||
		!(/** @type {string[]} */ (/** @type {unknown} */ (allowedLocales)).includes(locale))
	) {
		console.log("Not Found");
		return notFound();
	}

	// updateLocaleConfigCache({
	// 	allowedLocales,
	// 	defaultLocale,
	// 	locale,
	// });

	// const currentSession = await getCurrentSession();

	const localeTranslations = await getTranslation(locale);

	return (
		<html lang={locale} suppressHydrationWarning>
			<body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
				<Providers
					allowedLocales={allowedLocales}
					defaultLocale={defaultLocale}
					fallbackLocale={fallbackLocale}
					translations={{ [locale]: localeTranslations }}
					locale={locale}>
					<div className="grid h-svh grid-rows-[auto_1fr]">
						<Header />
						{props.children}
					</div>
				</Providers>
			</body>
		</html>
	);
}
