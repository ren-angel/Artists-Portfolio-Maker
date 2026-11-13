if (!process.env.TEST_DATABASE_URL) throw Error("TEST_DATABASE_URL required");
process.env.DIRECT_DATABASE_URL = process.env.TEST_DATABASE_URL;
await import("../packages/db/src/migrate.ts");
export {};
