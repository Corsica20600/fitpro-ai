import assert from "node:assert/strict";
import test from "node:test";
import { detectProgressPhotoMimeType } from "@/src/server/progress-photos";

test("detectProgressPhotoMimeType recognises allowed image signatures", () => {
  assert.equal(detectProgressPhotoMimeType(Buffer.from([0xff, 0xd8, 0xff, 0xe0])), "image/jpeg");
  assert.equal(detectProgressPhotoMimeType(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])), "image/png");
  assert.equal(detectProgressPhotoMimeType(Buffer.from("RIFFxxxxWEBPVP8 ", "ascii")), "image/webp");
});

test("detectProgressPhotoMimeType rejects non-image content", () => {
  assert.equal(detectProgressPhotoMimeType(Buffer.from("not an image", "utf8")), null);
});
