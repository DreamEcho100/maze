import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import { authRoutesConfig } from "#libs/auth/client/components/routes-config.js";

export default function App() {
	return (
		<Router
			root={(props) => {
				return (
					<MetaProvider>
						<Title>SolidStart - Basic</Title>
						<Link href="/">Index</Link>
						<Link href="/about">About</Link>
						<Link href="/orpc">ORPC</Link>
						<Link href={authRoutesConfig.login.path}>
							{authRoutesConfig.login.title}
						</Link>
						<Link href={authRoutesConfig.verifyEmail.path}>
							{authRoutesConfig.verifyEmail.title}
						</Link>
						<Link href={authRoutesConfig.register.path}>
							{authRoutesConfig.register.title}
						</Link>
						<Suspense>{props.children}</Suspense>
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
