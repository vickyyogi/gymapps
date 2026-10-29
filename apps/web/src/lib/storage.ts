import "server-only";

import path from "node:path";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client
} from "@aws-sdk/client-s3";
import { log } from "@/lib/log";

export type StoredObject = { ref: string; size: number };

export function s3Enabled() {
  return Boolean(process.env.S3_BUCKET);
}

let client: S3Client | null = null;

function s3() {
  if (!client) {
    const accessKeyId = process.env.S3_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY;
    client = new S3Client({
      region: process.env.S3_REGION ?? "auto",
      endpoint: process.env.S3_ENDPOINT || undefined,
      // MinIO/R2 are path-style; set S3_FORCE_PATH_STYLE=false for virtual-hosted buckets.
      forcePathStyle: process.env.S3_FORCE_PATH_STYLE !== "false",
      ...(accessKeyId && secretAccessKey ? { credentials: { accessKeyId, secretAccessKey } } : {})
    });
  }
  return client;
}

function localDir() {
  return process.env.EXPORT_DIR || path.join(process.cwd(), ".exports");
}

// Absolute refs are legacy local paths; relative refs resolve inside EXPORT_DIR.
function localPath(ref: string) {
  return path.isAbsolute(ref) ? ref : path.join(/*turbopackIgnore: true*/ localDir(), ref);
}

/**
 * Stores one object. `ref` is the S3 key; the local driver returns an absolute
 * path instead, which is what `exports.file_path` keeps.
 */
export async function putObject(
  ref: string,
  body: Buffer | string,
  contentType: string
): Promise<StoredObject> {
  const data = typeof body === "string" ? Buffer.from(body, "utf8") : body;

  if (s3Enabled()) {
    await s3().send(
      new PutObjectCommand({
        Bucket: process.env.S3_BUCKET,
        Key: ref,
        Body: data,
        ContentType: contentType
      })
    );
    return { ref, size: data.byteLength };
  }

  const filePath = localPath(ref);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, data);
  return { ref: filePath, size: data.byteLength };
}

export async function getObject(ref: string): Promise<Buffer> {
  if (!s3Enabled()) return readFile(localPath(ref));

  const result = await s3().send(
    new GetObjectCommand({ Bucket: process.env.S3_BUCKET, Key: ref })
  );
  if (!result.Body) throw new Error("storage_empty_body");
  return Buffer.from(await result.Body.transformToByteArray());
}

export async function deleteObject(ref: string | null) {
  if (!ref) return;

  if (s3Enabled()) {
    try {
      await s3().send(new DeleteObjectCommand({ Bucket: process.env.S3_BUCKET, Key: ref }));
    } catch (error) {
      // Account purge / export delete must not fail on a missing object.
      log("warn", "storage_delete_failed", { error });
    }
    return;
  }

  await rm(localPath(ref), { force: true });
}
