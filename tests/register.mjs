// Render the homepage and shared portfolio components with the web app's JSX runtime.
import { fileURLToPath } from "node:url";
import { register } from "tsx/esm/api";

register({ tsconfig: fileURLToPath(new URL("../apps/web/tsconfig.json", import.meta.url)) });
