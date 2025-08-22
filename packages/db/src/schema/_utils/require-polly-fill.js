import { createRequire } from "node:module";
// export const requirePF = typeof require === "function" ? require : createRequire(import.meta.url);
export const require = createRequire(import.meta.url);
