// @refresh reload

import { createHandler, StartServer } from "@solidjs/start/server";
import { defaultLocale, localeDirMap } from "#libs/i18n/constants.ts";
import { isAllowedLocale } from "#libs/i18n/is-allowed-locale.ts";
import { getLocaleFromHeaders } from "#libs/i18n/server/get-server-locale.ts";

/*
import { getRequestEvent } from "solid-js/web";
import { defaultLocale, localeDirMap } from "#libs/i18n/constants.ts";
import { getServerLocale } from "#libs/i18n/server/get-server-locale.ts";

export default createHandler(() => (
	<StartServer
		document={({ assets, children, scripts }) => {
			const event = getRequestEvent();
			if (!event) {
				throw new Error("No `requestEvent` found!");
			}
			const { foundLocale = defaultLocale } = getServerLocale({
				nativeEvent: event.nativeEvent,
				headers: event.request.headers,
				pathname: new URL(event.request.url).pathname,
			});

			return (
				<html lang={foundLocale} data-i18n-lang-access="true" dir={localeDirMap[foundLocale]} data-i18n-dir-access="true">
					<head>
						<meta charset="utf-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1" />
						<link rel="icon" href="/favicon.ico" />
						{assets}
					</head>
					<body>
						<div id="app">{children}</div>
						{scripts}
					</body>
				</html>
			);
		}}
	/>
));
*/

export default createHandler((context) => (
	<StartServer
		document={({ assets, children, scripts }) => {
			const localeInHeader = getLocaleFromHeaders(context.request.headers);
			const foundLocale = isAllowedLocale(localeInHeader) ? localeInHeader : defaultLocale;

			return (
				<html
					lang={foundLocale}
					data-i18n-lang-access="true"
					dir={localeDirMap[foundLocale]}
					data-i18n-dir-access="true"
				>
					<head>
						<meta charset="utf-8" />
						<meta name="viewport" content="width=device-width, initial-scale=1" />
						<link rel="icon" href="/favicon.ico" />
						{assets}
					</head>
					<body>
						<div id="app">{children}</div>
						{scripts}
					</body>
				</html>
			);
		}}
	/>
));

// export default createHandler(() => (
// 	<StartServer
// 		document={({ assets, children, scripts }) => (
// 			<html lang="en">
// 				<head>
// 					<meta charset="utf-8" />
// 					<meta name="viewport" content="width=device-width, initial-scale=1" />
// 					<link rel="icon" href="/favicon.ico" />
// 					{assets}
// 				</head>
// 				<body>
// 					<div id="app">{children}</div>
// 					{scripts}
// 				</body>
// 			</html>
// 		)}
// 	/>
// ));
