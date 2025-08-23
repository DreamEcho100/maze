import { I18nA } from "@de100/i18n-solid-startjs/client/components/Link";
import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { ErrorBoundary, Suspense } from "solid-js";
import { authRoutesConfig } from "#libs/auth/client/components/routes-config.js";

export default function App() {
	return (
		<Router
			root={(props) => {
				return (
					<MetaProvider>
						{/* <ErrorBoundary
							fallback={(error) => (
								<div>
									<h1>Error</h1>
									<p>{error.message}</p>
								</div>
							)}
						> */}
						<Suspense>
							<p>lang</p>
							{props.children}
						</Suspense>
						{/* </ErrorBoundary> */}
					</MetaProvider>
				);
			}}
		>
			<FileRoutes />
		</Router>
	);
}

// import { defineConfig } from "@solidjs/start/config";

// export const config = defineConfig({
// 	// server: {
// 	//   prerender: {
// 	//     routes: ["/", "/about"]
// 	//   }
// 	// }
// 	ssr: true,
// });
