import { config } from "./platform/config.ts";
import { createApp } from "./app.ts";
const env = config();
const app = await createApp(env);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => void app.close());
await app.listen({ port: env.PORT, host: env.HOST });
