import type { NextRequest } from "next/server";

import { customCreateIntlMiddleware } from "#server/libs/middleware";

export function middleware(request: NextRequest) {
	return customCreateIntlMiddleware(request);
}

export const config = {
	// Match only internationalized pathnames
	matcher: [
		"/((?!api|/__nextjs_original-stack-frame|images|_next/static|_next/image|favicon.ico|apple-touch-icon.png|favicon.svg|images/books|icons|manifest).*)",
	],
	// matcher: ["/((?!api|_next|_vercel\\..*).*)"],
	// matcher: "/((?!api|trpc|_next|_vercel|.*\\..*).*)",
	runtime: "nodejs",
};
