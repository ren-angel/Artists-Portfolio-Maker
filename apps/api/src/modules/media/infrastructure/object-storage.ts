import { mkdir, readFile, writeFile, rm } from "node:fs/promises";
import { dirname, join } from "node:path";
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { assert } from "../../../platform/errors.ts";
import type { Config } from "../../../platform/config.ts";
export interface Storage {
  put(key: string, bytes: Buffer): Promise<void>;
  get(key: string, maxBytes?: number): Promise<Buffer>;
  signUpload?(key: string, bytes: number): Promise<string>;
  remove(key: string): Promise<void>;
}
export function storage(env: Config): Storage {
  if (env.STORAGE_DRIVER === "local") {
    const path = (key: string) => join(env.LOCAL_DATA_DIR, "objects", key);
    return {
      async put(key, bytes) {
        await mkdir(dirname(path(key)), { recursive: true, mode: 0o700 });
        await writeFile(path(key), bytes, { mode: 0o600 });
      },
      get: (key) => readFile(path(key)),
      remove: (key) => rm(path(key), { force: true }),
    };
  }
  const client = new S3Client({
    endpoint: env.S3_ENDPOINT,
    region: env.S3_REGION,
    forcePathStyle: true,
    requestChecksumCalculation: "WHEN_REQUIRED",
    credentials: {
      accessKeyId: env.S3_ACCESS_KEY_ID!,
      secretAccessKey: env.S3_SECRET_ACCESS_KEY!,
    },
  });
  return {
    async signUpload(Key, ContentLength) {
      const command = new PutObjectCommand({
        Bucket: env.S3_BUCKET,
        Key,
        ContentLength,
        ContentType: "application/octet-stream",
      });
      return getSignedUrl(client, command, {
        expiresIn: 300,
        signableHeaders: new Set(["content-length", "content-type"]),
      });
    },
    async put(Key, Body) {
      await client.send(
        new PutObjectCommand({
          Bucket: env.S3_BUCKET,
          Key,
          Body,
          ContentType: Key.endsWith(".webp")
            ? "image/webp"
            : "application/octet-stream",
        }),
      );
    },
    async get(Key, maxBytes) {
      const r = await client.send(
        new GetObjectCommand({
          Bucket: env.S3_BUCKET,
          Key,
          ...(maxBytes ? { Range: "bytes=0-" + maxBytes } : {}),
        }),
      );
      if (maxBytes)
        assert(
          r.ContentLength !== undefined && r.ContentLength <= maxBytes,
          413,
          "upload_size",
        );
      return Buffer.from(await r.Body!.transformToByteArray());
    },
    async remove(Key) {
      await client.send(
        new DeleteObjectCommand({ Bucket: env.S3_BUCKET, Key }),
      );
    },
  };
}
