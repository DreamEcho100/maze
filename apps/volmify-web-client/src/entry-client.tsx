// @refresh reload

import { mount, StartClient } from "@solidjs/start/client";

// if (import.meta.env.DEV) {
// 	await import("solid-devtools");
// 	const { attachDevtoolsOverlay } = await import("@solid-devtools/overlay");
// 	// const [attachDevtoolsOverlay] = await Promise.all([
// 	// 	import("solid-devtools").then(({ default: devtools }) => devtools()),
// 	// 	import("@solid-devtools/overlay").then((mod) => mod.attachDevtoolsOverlay),
// 	// ]);

// 	attachDevtoolsOverlay();

// 	// or with some options

// 	attachDevtoolsOverlay({
// 		defaultOpen: true, // or alwaysOpen
// 		noPadding: true,
// 	});
// }

mount(() => <StartClient />, document.getElementById("app")!);
