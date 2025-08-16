/// <reference types="@solidjs/start/env" />

// TODO: more investigation on how to leverage this
// biome-ignore lint/suspicious/useNamespaceKeyword: <explanation>
declare module App {
	// biome-ignore lint/suspicious/noEmptyInterface: <explanation>
	interface RequestEventLocals {
		/**
		 * Declare your getRequestEvent().locals here
		 */
	}
}
// declare namespace App {
//   // biome-ignore lint/suspicious/noEmptyInterface: <explanation>
//   interface RequestEventLocals {
//     /**
//      * Declare your getRequestEvent().locals here
//      */
//   }
// }
