import { createMiddleware } from "@solidjs/start/middleware";
import { createI18nMiddlewareOnRequest } from "#libs/i18n/server/middleware.ts";

export default createMiddleware({
	onRequest: (event) => {
		// const { cookieName, headerName } = event.locals;

		const url = new URL(event.request.url);
		const pathname = url.pathname;

		const pathnameFirstSegment = pathname.split("/")[1];
		const notAllowedMap = {
			server: true,
			_server: true,
			_build: true,
			assets: true,
			api: true,
		};
		// Skip middleware for static files and API routes
		if (
			pathnameFirstSegment &&
			(pathnameFirstSegment in notAllowedMap || // Skip
				pathnameFirstSegment.includes(".")) // Skip if it contains a dot (e.g., file extensions)
		) {
			return;
		}

		const i18nResponse = createI18nMiddlewareOnRequest({ event });
		if (i18nResponse) {
			return i18nResponse;
		}
	},
	// onBeforeResponse: (event) => {
	// 	const endTime = Date.now();
	// 	const duration = endTime - event.locals.startTime;
	// 	console.log(`Request took ${duration}ms`);
	// },
});
