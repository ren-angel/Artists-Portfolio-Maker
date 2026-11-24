import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, readdir, rename, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import sharp from "sharp";
import { createApp } from "../apps/api/src/app.ts";
import { config } from "../apps/api/src/platform/config.ts";
import type { Draft } from "@doodallery/shared";
import type { HTTPMethods } from "fastify";
test("real API stores an isolated draft, verifies an upload, atomically publishes, resets sessions and deletes data", async () => {
  assert(
    process.env.TEST_DATABASE_URL,
    "Provide a disposable migrated PostgreSQL TEST_DATABASE_URL for integration tests",
  );
  const folder = await mkdtemp(join(tmpdir(), "doodallery-test-"));
  const origin = "http://localhost:3000";
  const env = config({
    NODE_ENV: "test",
    APP_ORIGIN: origin,
    PLATFORM_DOMAIN: "localhost",
    DATABASE_URL: process.env.TEST_DATABASE_URL,
    LOCAL_DATA_DIR: folder,
    MAX_ARTWORKS: "1",
    MAX_UPLOAD_BYTES: "65536",
    MAX_STORAGE_BYTES: "131072",
  });
  const app = await createApp(env);
  const password = "a-long-test-password",
    suffix = crypto.randomUUID().slice(0, 8);
  const email = "a-" + suffix + "@example.test",
    otherEmail = "b-" + suffix + "@example.test";
  const request = (
    method: HTTPMethods,
    url: string,
    body?: object | string | Buffer,
    cookie = "",
    binary = false,
  ) =>
    app.inject({
      method,
      url,
      headers: {
        origin,
        "x-doodallery-request": "1",
        cookie,
        ...(binary ? { "content-type": "application/octet-stream" } : {}),
      },
      payload: body,
    });
  const register = async (address: string) => {
    const r = await request("POST", "/auth/register", {
      email: address,
      password,
      displayName: "Test artist",
      accept: true,
    });
    assert.equal(r.statusCode, 201, r.body);
    return r.cookies[0].name + "=" + r.cookies[0].value;
  };
  const mailToken = async (purpose: string) => {
    for (const f of await readdir(join(folder, "mail"))) {
      const m = JSON.parse(await readFile(join(folder, "mail", f), "utf8"));
      if (m.email === email && m.purpose === purpose)
        return m.link.split("#")[1];
    }
    throw Error("Missing development email");
  };
  try {
    assert.equal((await request("GET", "/health")).statusCode, 200);
    const a = await register(email),
      b = await register(otherEmail);
    assert.equal((await request("GET", "/me")).statusCode, 401);
    assert.equal(
      (
        await app.inject({
          method: "POST",
          url: "/auth/logout",
          headers: { cookie: a },
        })
      ).statusCode,
      403,
    );
    assert.equal(
      (await request("POST", "/sites", { title: "Test", handle: "admin" }, a))
        .statusCode,
      400,
    );
    const handle = "artist-" + suffix;
    const created = await request(
      "POST",
      "/sites",
      { title: "First title", handle },
      a,
    );
    assert.equal(created.statusCode, 200, created.body);
    const site = created.json().id,
      path = "/sites/" + site;
    assert.equal((await request("GET", path, undefined, b)).statusCode, 404);
    assert.equal(
      (
        await request(
          "PUT",
          path,
          {
            version: 1,
            draft: (await request("GET", path, undefined, a)).json().draft,
          },
          b,
        )
      ).statusCode,
      404,
    );
    assert.equal(
      (await request("POST", path + "/publish", { version: 1 }, a)).statusCode,
      403,
    );
    assert.equal(
      (
        await request("POST", "/auth/verify", {
          token: await mailToken("verify"),
        })
      ).statusCode,
      200,
    );
    assert.equal((await request("GET", "/public/" + handle)).statusCode, 404);
    assert.equal(
      (await request("POST", path + "/uploads", { bytes: 65537 }, a))
        .statusCode,
      413,
    );
    const add = async (bytes: Buffer) => {
      const init = await request(
        "POST",
        path + "/uploads",
        { bytes: bytes.length },
        a,
      );
      assert.equal(init.statusCode, 200, init.body);
      const url = path + "/uploads/" + init.json().id;
      assert.equal((await request("PUT", url, bytes, a, true)).statusCode, 200);
      return request("POST", url + "/finish", { title: "Painting" }, a);
    };
    assert.equal((await add(Buffer.from("fake PNG"))).statusCode, 415);
    const file = await sharp({
      create: { width: 120, height: 90, channels: 3, background: "red" },
    })
      .png()
      .toBuffer();
    const attempts = await Promise.all(
      [1, 2].map(() =>
        request("POST", path + "/uploads", { bytes: file.length }, a),
      ),
    );
    assert.deepEqual(attempts.map((r) => r.statusCode).sort(), [200, 409]);
    const reserved = attempts.find((r) => r.statusCode === 200)!.json().id;
    await request("DELETE", path + "/uploads/" + reserved, undefined, a);
    const asset = await add(file);
    assert.equal(asset.statusCode, 200, asset.body);
    const get = async () =>
      (await request("GET", path, undefined, a)).json() as {
        draft: Draft;
        version: number;
      };
    const state = await get(),
      d = state.draft;
    const art = d.artworks[0];
    art.featured = true;
    art.alt = "Red square";
    const media = "/media/" + site + "/" + art.assetId + "/thumb";
    assert.equal((await request("GET", media, undefined, b)).statusCode, 404);
    d.pages.push({
      ...d.pages[0],
      id: crypto.randomUUID(),
      slug: "about",
      title: "About",
      blocks: [],
    });
    d.pages[0].blocks.reverse();
    d.theme.template = "story";
    d.galleries.push({
      id: crypto.randomUUID(),
      slug: "painting",
      title: "Painting",
      description: "",
      visible: true,
      cover: art.id,
      artIds: [art.id],
    });
    const saved = await request(
      "PUT",
      path,
      { version: state.version, draft: d },
      a,
    );
    assert.equal(saved.statusCode, 200, saved.body);
    assert.equal(
      (await request("PUT", path, { version: state.version, draft: d }, a))
        .statusCode,
      409,
    );
    assert.deepEqual((await get()).draft, d);
    assert.equal(
      (
        await request(
          "POST",
          path + "/publish",
          { version: saved.json().version },
          a,
        )
      ).statusCode,
      200,
    );
    const publicData = (await request("GET", "/public/" + handle)).json().draft;
    assert.equal(publicData.artworks[0].id, art.id);
    assert.equal((await request("GET", media)).statusCode, 200);
    const thumbnail = join(folder, "objects", site, art.assetId, "thumb.webp");
    await rename(thumbnail, thumbnail + ".backup");
    const unavailable = await request("GET", media);
    assert.equal(unavailable.statusCode, 503);
    assert.equal(unavailable.json().error, "media_unavailable");
    assert.match(String(unavailable.headers["cache-control"]), /no-store/);
    await rename(thumbnail + ".backup", thumbnail);
    assert.equal((await request("GET", media)).statusCode, 200);
    const visibility = path + "/visibility";
    const discovery = async () => (await request("GET", "/discover?q=" + handle)).json().works;
    assert.deepEqual(await discovery(), []);
    assert.equal((await request("PUT", visibility, { discoverable: true, indexable: false }, b)).statusCode, 404);
    assert.equal((await request("PUT", visibility, { discoverable: true, indexable: false }, a)).statusCode, 200);
    assert.equal((await discovery())[0].artId, art.id);
    assert.equal((await request("GET", "/public/" + handle)).json().indexable, false);
    const next = await get();
    next.draft.artworks[0].title = "Draft only";
    next.draft.title = "Unpublished edit";
    next.draft.pages.pop();
    next.draft.galleries = [];
    assert.equal((await request("PUT", path, next, a)).statusCode, 200);
    assert.equal(
      (await request("GET", "/public/" + handle)).json().draft.title,
      "First title",
    );
    assert.equal((await discovery())[0].title, art.title);
    await request(
      "POST",
      path + "/unpublish",
      { version: (await get()).version },
      a,
    );
    assert.equal((await request("GET", "/public/" + handle)).statusCode, 404);
    assert.equal((await request("GET", media)).statusCode, 401);
    assert.deepEqual(await discovery(), []);
    await request("POST", "/auth/forgot", { email });
    const reset = await mailToken("reset");
    assert.equal(
      (
        await request("POST", "/auth/reset", {
          token: reset,
          password: password + "2",
        })
      ).statusCode,
      200,
    );
    assert.equal(
      (await request("POST", "/auth/reset", { token: reset, password }))
        .statusCode,
      400,
    );
    assert.equal((await request("GET", "/me", undefined, a)).statusCode, 401);
    const login = await request("POST", "/auth/login", {
      email,
      password: password + "2",
    });
    assert.equal(login.statusCode, 200);
    const current = login.cookies[0].name + "=" + login.cookies[0].value;
    assert.equal(
      (await request("DELETE", "/me", { password: password + "2" }, current))
        .statusCode,
      200,
    );
    assert.equal(
      (await request("POST", "/auth/logout", undefined, b)).statusCode,
      200,
    );
    assert.equal((await request("GET", "/me", undefined, b)).statusCode, 401);
    const other = await request("POST", "/auth/login", {
      email: otherEmail,
      password,
    });
    await request(
      "DELETE",
      "/me",
      { password },
      other.cookies[0].name + "=" + other.cookies[0].value,
    );
  } finally {
    await app.close();
    await rm(folder, { recursive: true, force: true });
  }
});

test("readiness rejects a connected PostgreSQL database without the application schema", async () => {
  assert(process.env.TEST_DATABASE_URL);
  const url = new URL(process.env.TEST_DATABASE_URL);
  url.searchParams.set("options", "-c search_path=pg_catalog");
  const app = await createApp(config({
    NODE_ENV: "test", DATABASE_URL: url.href, PLATFORM_DOMAIN: "localhost", APP_ORIGIN: "http://localhost:3000",
  }));
  try {
    const result = await app.inject({url: "/health"});
    assert.equal(result.statusCode, 503);
    assert.deepEqual(result.json(), {ok: false});
  } finally {
    await app.close();
  }
});
