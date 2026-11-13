import { spawnSync } from "node:child_process";
if (!process.env.TEST_DATABASE_URL) throw Error("TEST_DATABASE_URL required");
const result = spawnSync(
  "psql",
  [
    "-X",
    "-v",
    "ON_ERROR_STOP=1",
    "-d",
    process.env.TEST_DATABASE_URL,
    "-f",
    "tests/database.sql",
  ],
  { stdio: "inherit" },
);
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
