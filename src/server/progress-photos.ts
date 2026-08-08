import { randomUUID } from "crypto";
import { BlobNotFoundError, del, get, put } from "@vercel/blob";
import { getVercelOidcToken } from "@vercel/oidc";
import sharp from "sharp";
import { prisma } from "@/src/lib/prisma";
import type { ProgressPhotoItem } from "@/src/types/body-evolution";

export const PROGRESS_PHOTO_VIEWS = ["FRONT", "SIDE", "BACK", "FREE"] as const;
export type ProgressPhotoViewValue = (typeof PROGRESS_PHOTO_VIEWS)[number];

// Browser-side preparation keeps the request below Vercel Functions' payload limit.
const MAX_SERVER_UPLOAD_BYTES = 4 * 1024 * 1024;
const MAX_INPUT_PIXELS = 40_000_000;
const MAX_IMAGE_EDGE = 1600;

type ProfileRef = { id: string };
type BlobOidcOptions = { storeId: string; oidcToken: string };

async function getPrivateBlobOidcOptions(): Promise<BlobOidcOptions> {
  const storeId = process.env.BLOB_STORE_ID?.trim();
  if (!storeId) throw new Error("BLOB_STORE_NOT_CONFIGURED");

  try {
    // Vercel provides this short-lived token per Function request, or via `vercel env pull` locally.
    return { storeId, oidcToken: await getVercelOidcToken() };
  } catch {
    throw new Error("BLOB_OIDC_NOT_CONFIGURED");
  }
}

async function deleteBlobIfPresent(blobPath: string, oidc: BlobOidcOptions) {
  try {
    await del(blobPath, oidc);
  } catch (error) {
    if (error instanceof BlobNotFoundError) return;
    throw error;
  }
}

function hasBytes(value: Buffer, signature: number[]) {
  return signature.every((byte, index) => value[index] === byte);
}

export function detectProgressPhotoMimeType(buffer: Buffer) {
  if (hasBytes(buffer, [0xff, 0xd8, 0xff])) return "image/jpeg" as const;
  if (hasBytes(buffer, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return "image/png" as const;
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") {
    return "image/webp" as const;
  }
  return null;
}

function parseRecordedAt(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new Error("INVALID_PHOTO_DATE");
  const recordedAt = new Date(`${value}T12:00:00.000Z`);
  if (Number.isNaN(recordedAt.getTime())) throw new Error("INVALID_PHOTO_DATE");
  return recordedAt;
}

function toProgressPhotoItem(photo: {
  id: string;
  recordedAt: Date;
  view: ProgressPhotoViewValue;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
}): ProgressPhotoItem {
  return {
    id: photo.id,
    recordedAt: photo.recordedAt.toISOString(),
    view: photo.view,
    mimeType: photo.mimeType,
    byteSize: photo.byteSize,
    width: photo.width,
    height: photo.height,
    imageUrl: `/api/evolution/photos/${encodeURIComponent(photo.id)}/content`,
  };
}

export function serializeProgressPhotos(photos: Array<{
  id: string;
  recordedAt: Date;
  view: ProgressPhotoViewValue;
  mimeType: string;
  byteSize: number;
  width: number | null;
  height: number | null;
}>): ProgressPhotoItem[] {
  return photos.map(toProgressPhotoItem);
}

export async function createProgressPhoto(
  profile: ProfileRef,
  input: { file: File; recordedAt: string; view: string },
) {
  if (!PROGRESS_PHOTO_VIEWS.includes(input.view as ProgressPhotoViewValue)) throw new Error("INVALID_PHOTO_VIEW");
  if (!input.file.size || input.file.size > MAX_SERVER_UPLOAD_BYTES) throw new Error("INVALID_PHOTO_SIZE");
  if (!["image/jpeg", "image/png", "image/webp"].includes(input.file.type)) {
    throw new Error("INVALID_PHOTO_MIME");
  }

  const recordedAt = parseRecordedAt(input.recordedAt);
  const source = Buffer.from(await input.file.arrayBuffer());
  const detectedMimeType = detectProgressPhotoMimeType(source);
  if (!detectedMimeType || detectedMimeType !== input.file.type) throw new Error("INVALID_PHOTO_SIGNATURE");

  const optimized = await sharp(source, { limitInputPixels: MAX_INPUT_PIXELS, failOn: "error" })
    .rotate()
    .resize(MAX_IMAGE_EDGE, MAX_IMAGE_EDGE, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 82, effort: 4 })
    .toBuffer({ resolveWithObject: true });

  const oidc = await getPrivateBlobOidcOptions();
  const blob = await put(`progress-photos/${randomUUID()}.webp`, optimized.data, {
    ...oidc,
    access: "private",
    addRandomSuffix: false,
    contentType: "image/webp",
    cacheControlMaxAge: 60,
    maximumSizeInBytes: MAX_SERVER_UPLOAD_BYTES,
  });

  try {
    const photo = await prisma.progressPhoto.create({
      data: {
        userProfileId: profile.id,
        recordedAt,
        view: input.view as ProgressPhotoViewValue,
        blobPath: blob.url,
        mimeType: "image/webp",
        byteSize: optimized.info.size,
        width: optimized.info.width ?? null,
        height: optimized.info.height ?? null,
      },
    });
    return toProgressPhotoItem(photo);
  } catch (error) {
    try {
      await deleteBlobIfPresent(blob.url, oidc);
    } catch {
      console.error("PROGRESS_PHOTO_ORPHAN_CLEANUP_FAILED", { operation: "create" });
    }
    throw error;
  }
}

export async function getProgressPhotoContent(profileId: string, photoId: string) {
  const photo = await prisma.progressPhoto.findFirst({
    where: { id: photoId, userProfileId: profileId },
    select: { blobPath: true, mimeType: true },
  });
  if (!photo) return null;

  const blob = await get(photo.blobPath, { access: "private", ...(await getPrivateBlobOidcOptions()) });
  if (!blob || blob.statusCode !== 200) return null;
  return { stream: blob.stream, mimeType: photo.mimeType };
}

export async function deleteProgressPhoto(profileId: string, photoId: string) {
  const photo = await prisma.progressPhoto.findFirst({
    where: { id: photoId, userProfileId: profileId },
    select: { id: true, blobPath: true },
  });
  if (!photo) return false;

  await deleteBlobIfPresent(photo.blobPath, await getPrivateBlobOidcOptions());
  const deleted = await prisma.progressPhoto.deleteMany({ where: { id: photo.id, userProfileId: profileId } });
  if (deleted.count !== 1) {
    console.error("PROGRESS_PHOTO_METADATA_DELETE_FAILED", { operation: "delete" });
    throw new Error("PROGRESS_PHOTO_DELETE_FAILED");
  }
  return true;
}

export async function purgeProgressPhotoBlobs(profileId: string) {
  const photos = await prisma.progressPhoto.findMany({
    where: { userProfileId: profileId },
    select: { blobPath: true },
  });
  if (photos.length === 0) return;

  const oidc = await getPrivateBlobOidcOptions();
  const results = await Promise.allSettled(photos.map((photo) => deleteBlobIfPresent(photo.blobPath, oidc)));
  if (results.some((result) => result.status === "rejected")) {
    console.error("PROGRESS_PHOTO_ACCOUNT_PURGE_FAILED", { operation: "account_delete", count: photos.length });
    throw new Error("PROGRESS_PHOTO_PURGE_FAILED");
  }
}
