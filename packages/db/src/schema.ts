import {
  pgTable,
  uuid,
  text,
  boolean,
  integer,
  timestamp,
  jsonb,
  primaryKey,
  bigint,
} from "drizzle-orm/pg-core";
import type { Draft } from "@studio/shared";
const time = (name: string) =>
  timestamp(name, { withTimezone: true, mode: "date" });
export const users = pgTable("users", {
  id: uuid().primaryKey().defaultRandom(),
  email: text().notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  displayName: text("display_name").notNull(),
  verified: boolean().notNull().default(false),
  avatarAsset: uuid("avatar_asset"),
  createdAt: time("created_at").notNull().defaultNow(),
  updatedAt: time("updated_at").notNull().defaultNow(),
});
export const sites = pgTable("sites", {
  id: uuid().primaryKey().defaultRandom(),
  ownerId: uuid("owner_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  handle: text().notNull().unique(),
  version: integer().notNull().default(1),
  title: text().notNull(),
  description: text().notNull().default(""),
  language: text().notNull().default("pt-BR"),
  step: integer().notNull().default(2),
  home: uuid().notNull(),
  social: jsonb().$type<string[]>().notNull(),
  discoverable: boolean().notNull().default(false),
  indexable: boolean().notNull().default(true),
  publishedId: uuid("published_id"),
  createdAt: time("created_at").notNull().defaultNow(),
  updatedAt: time("updated_at").notNull().defaultNow(),
});
export const sessions = pgTable("sessions", {
  digest: text().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: time("expires_at").notNull(),
});
export const tokens = pgTable("tokens", {
  digest: text().primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  purpose: text().notNull(),
  expiresAt: time("expires_at").notNull(),
});
const siteId = () =>
  uuid("site_id")
    .notNull()
    .references(() => sites.id, { onDelete: "cascade" });
export const entitlements = pgTable("entitlements", {
  userId: uuid("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  plan: text().notNull().default("free"),
});
export const themes = pgTable("themes", {
  siteId: siteId().primaryKey(),
  config: jsonb().$type<Draft["theme"]>().notNull(),
});
export const pages = pgTable(
  "pages",
  {
    siteId: siteId(),
    id: uuid().notNull(),
    title: text().notNull(),
    slug: text().notNull(),
    position: integer().notNull(),
    inNav: boolean("in_nav").notNull(),
    blocks: jsonb().$type<Draft["pages"][number]["blocks"]>().notNull(),
  },
  (p) => [primaryKey({ columns: [p.siteId, p.id] })],
);
export const assets = pgTable(
  "assets",
  {
    siteId: siteId(),
    id: uuid().notNull().defaultRandom(),
    bytes: integer().notNull(),
    width: integer().notNull(),
    height: integer().notNull(),
    sourceBytes: integer("source_bytes").notNull(),
    sourceWidth: integer("source_width").notNull(),
    sourceHeight: integer("source_height").notNull(),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (a) => [primaryKey({ columns: [a.siteId, a.id] })],
);
export const artworks = pgTable(
  "artworks",
  {
    siteId: siteId(),
    id: uuid().notNull(),
    assetId: uuid("asset_id").notNull(),
    title: text().notNull(),
    description: text().notNull(),
    alt: text().notNull(),
    featured: boolean().notNull(),
    details: jsonb().$type<NonNullable<Draft["artworks"][number]["details"]>>().notNull().default({}),
    position: integer().notNull(),
  },
  (a) => [primaryKey({ columns: [a.siteId, a.id] })],
);
export const galleries = pgTable(
  "galleries",
  {
    siteId: siteId(),
    id: uuid().notNull(),
    title: text().notNull(),
    slug: text().notNull(),
    description: text().notNull(),
    visible: boolean().notNull(),
    cover: uuid(),
    position: integer().notNull(),
  },
  (g) => [primaryKey({ columns: [g.siteId, g.id] })],
);
export const memberships = pgTable(
  "memberships",
  {
    siteId: uuid("site_id").notNull(),
    galleryId: uuid("gallery_id").notNull(),
    artId: uuid("art_id").notNull(),
    position: integer().notNull(),
  },
  (m) => [primaryKey({ columns: [m.siteId, m.galleryId, m.artId] })],
);
export const revisions = pgTable(
  "revisions",
  {
    siteId: siteId(),
    id: uuid().notNull().defaultRandom(),
    snapshot: jsonb().$type<Draft>().notNull(),
    createdAt: time("created_at").notNull().defaultNow(),
  },
  (r) => [primaryKey({ columns: [r.siteId, r.id] })],
);
export const revisionAssets = pgTable(
  "revision_assets",
  {
    siteId: uuid("site_id").notNull(),
    revisionId: uuid("revision_id").notNull(),
    assetId: uuid("asset_id").notNull(),
  },
  (r) => [primaryKey({ columns: [r.siteId, r.revisionId, r.assetId] })],
);
export const uploads = pgTable("uploads", {
  id: uuid().primaryKey().defaultRandom(),
  siteId: siteId(),
  sourceBytes: integer("source_bytes").notNull(),
  replacement: uuid(),
  expiresAt: time("expires_at").notNull(),
});
export const garbage = pgTable("garbage", {
  objectKey: text("object_key").primaryKey(),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const reports = pgTable("reports", {
  id: uuid().primaryKey().defaultRandom(),
  siteId: uuid("site_id").references(() => sites.id, { onDelete: "set null" }),
  reason: text().notNull(),
  status: text().notNull().default("open"),
  createdAt: time("created_at").notNull().defaultNow(),
});
export const events = pgTable("events", {
  id: bigint({ mode: "bigint" }).primaryKey().generatedAlwaysAsIdentity(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
  event: text().notNull(),
  createdAt: time("created_at").notNull().defaultNow(),
});
