import { createApp } from "../apps/api/src/app.ts";
import { config } from "../apps/api/src/config.ts";
import { connect, sql, first } from "@studio/db";
import { readFile } from "node:fs/promises";
import { templateNames, type Draft } from "@studio/shared";
const env = config();
if (env.NODE_ENV === "production") throw Error("Seed is development-only");
const app = await createApp(env);
const { db, pool } = connect(env.DATABASE_URL);
try {
  for (const template of templateNames) {
    const handle = "demo-" + template;
    if (await first(db, sql`select id from sites where handle=${handle}`))
      continue;
    const email = handle + "@example.invalid";
    const headers: Record<string, string> = {
      origin: env.APP_ORIGIN,
      "x-studio-request": "1",
    };
    const register = await app.inject({
      method: "POST",
      url: "/auth/register",
      headers,
      payload: {
        email,
        password: crypto.randomUUID(),
        displayName: "Demo " + template,
      },
    });
    if (register.statusCode !== 201)
      throw Error("Demo registration failed: " + register.statusCode);
    headers.cookie = register.cookies[0].name + "=" + register.cookies[0].value;
    await db.execute(sql`update users set verified=true where email=${email}`);
    async function post(url: string, payload: object) {
      const res = await app.inject({ method: "POST", url, headers, payload });
      if (res.statusCode !== 200) throw Error("Seed failed at " + url);
      return res.json();
    }
    const s = await post("/sites", {
      handle,
      title: "Studio " + template,
      language: "en",
    });
    const base = "/sites/" + s.id;
    const image = await readFile(
      new URL(
        "../apps/web/public/prints/" + template + ".webp",
        import.meta.url,
      ),
    );
    const up = await post(base + "/uploads", { bytes: image.length });
    const uploadUrl = base + "/uploads/" + up.id;
    const put = await app.inject({
      method: "PUT",
      url: uploadUrl,
      headers: { ...headers, "content-type": "application/octet-stream" },
      payload: image,
    });
    if (put.statusCode !== 200) throw Error("Demo upload failed");
    await post(uploadUrl + "/finish", { title: "Print study" });
    const state = (
      await app.inject({ method: "GET", url: base, headers })
    ).json() as { draft: Draft; version: number };
    state.draft.theme.template = template;
    state.draft.step = 7;
    state.draft.artworks[0].featured = true;
    state.draft.pages[0].blocks[0].artId = state.draft.artworks[0].id;
    const result = await app.inject({
      method: "PUT",
      url: base,
      headers,
      payload: state,
    });
    if (result.statusCode !== 200) throw Error("Demo save failed");
    await post(base + "/publish", { version: result.json().version });
    console.info("Seeded /site/" + handle);
  }
} finally {
  await app.close();
  await pool.end();
}
