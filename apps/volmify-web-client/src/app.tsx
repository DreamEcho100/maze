import { MetaProvider, Title } from "@solidjs/meta";
import { Router } from "@solidjs/router";
import { FileRoutes } from "@solidjs/start/router";
import { Suspense } from "solid-js";
import "./app.css";
import { Link } from "@de100/i18n-solid-startjs/client/components/Link";
import Providers from "./components/providers";

export default function App() {
	return (
		<Router
			root={(props) => {
				return (
					<MetaProvider>
						<Providers>
							<Title>SolidStart - Basic</Title>
							<Link href="/">Index</Link>
							<Link href="/about">About</Link>
							<Suspense>{props.children}</Suspense>
						</Providers>
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
