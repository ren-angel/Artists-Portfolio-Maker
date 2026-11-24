import test from "node:test";
import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, normalize, relative, sep } from "node:path";

/* Architectural rules for the API bounded contexts and the web feature
   modules. Failing here means a dependency crossed a boundary. */

const root = join(import.meta.dirname, "..");
const files = (dir: string): string[] =>
  readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (name === "node_modules" || name === ".next") return [];
    return statSync(path).isDirectory() ? files(path) : /\.(ts|tsx)$/.test(name) ? [path] : [];
  });
const imports = (file: string) =>
  [...readFileSync(file, "utf8").matchAll(/(?:from|import)\s*\(?\s*["']([^"']+)["']/g)].map((m) => m[1]);
const resolveSpec = (file: string, spec: string) =>
  spec.startsWith(".") ? normalize(join(dirname(file), spec)) : spec;

const api = join(root, "apps/api/src");
const modules = join(api, "modules");
const moduleOf = (path: string) => {
  const rel = relative(modules, path);
  return rel.startsWith("..") ? null : rel.split(sep)[0];
};

test("API domain layers have no framework, database or provider dependencies", () => {
  const forbidden = /^(fastify|@fastify\/|@doodallery\/db|drizzle-orm|pg|@aws-sdk\/|sharp|node:fs|node:dns|node:tls)/;
  for (const file of files(modules).filter((f) => f.includes(sep + "domain" + sep))) {
    for (const spec of imports(file)) {
      assert.ok(!forbidden.test(spec), `${relative(root, file)} imports ${spec}`);
      const target = resolveSpec(file, spec);
      assert.ok(
        !/[/\\](application|infrastructure|presentation)[/\\]/.test(target),
        `${relative(root, file)} depends on an outer layer: ${spec}`,
      );
    }
  }
});

test("API modules use each other only through their public index", () => {
  for (const file of files(modules)) {
    const own = moduleOf(file);
    for (const spec of imports(file).filter((s) => s.startsWith("."))) {
      const target = resolveSpec(file, spec);
      const other = moduleOf(target);
      if (!other || other === own) continue;
      assert.equal(
        relative(join(modules, other), target),
        "index.ts",
        `${relative(root, file)} reaches into ${other}: ${spec}`,
      );
    }
  }
  for (const file of files(join(api, "platform")))
    for (const spec of imports(file))
      assert.ok(!resolveSpec(file, spec).includes(sep + "modules" + sep), `${relative(root, file)} depends on a module`);
});

test("API module dependencies form no cycle", () => {
  const graph = new Map<string, Set<string>>();
  for (const file of files(modules)) {
    const own = moduleOf(file)!;
    if (!graph.has(own)) graph.set(own, new Set());
    for (const spec of imports(file).filter((s) => s.startsWith("."))) {
      const other = moduleOf(resolveSpec(file, spec));
      if (other && other !== own) graph.get(own)!.add(other);
    }
  }
  const state = new Map<string, "visiting" | "done">();
  const visit = (node: string, path: string[]) => {
    if (state.get(node) === "done") return;
    assert.notEqual(state.get(node), "visiting", "module cycle: " + [...path, node].join(" → "));
    state.set(node, "visiting");
    for (const next of graph.get(node) ?? []) visit(next, [...path, node]);
    state.set(node, "done");
  };
  for (const node of graph.keys()) visit(node, []);
});

const web = join(root, "apps/web");
test("web shared code and public rendering stay independent of studio features", () => {
  const shared = join(web, "shared");
  for (const file of files(shared))
    for (const spec of imports(file).filter((s) => s.startsWith(".")))
      assert.ok(
        !resolveSpec(file, spec).startsWith(join(web, "features")),
        `${relative(root, file)} depends on a feature: ${spec}`,
      );
  // Public portfolio routes must not ship studio client code.
  const publicRoutes = [join(web, "app/site"), join(web, "app/demo")];
  for (const file of publicRoutes.flatMap(files))
    for (const spec of imports(file).filter((s) => s.startsWith(".")))
      assert.ok(
        !/features[/\\](studio|editor|billing|admin)/.test(resolveSpec(file, spec)),
        `${relative(root, file)} imports studio code: ${spec}`,
      );
});

test("web code never imports API or database packages", () => {
  for (const file of files(web))
    for (const spec of imports(file))
      assert.ok(
        !/^(@doodallery\/db|@doodallery\/api|fastify|pg|drizzle-orm)/.test(spec) && !spec.includes("apps/api"),
        `${relative(root, file)} imports server-only ${spec}`,
      );
});
