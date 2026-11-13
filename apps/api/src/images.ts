import sharp from "sharp";
import { defaults } from "@studio/shared";
import { Fault, assert } from "./errors.ts";
export async function optimize(source: Buffer) {
  try {
    const pipeline = sharp(source, {
      limitInputPixels: defaults.pixels,
      failOn: "warning",
    });
    const meta = await pipeline.metadata();
    assert(
      ["png", "jpeg", "webp"].includes(meta.format ?? "") &&
        (meta.pages ?? 1) === 1,
      415,
      "invalid_image",
    );
    const master = await pipeline
      .clone()
      .rotate()
      .webp({ quality: 94, alphaQuality: 100 })
      .toBuffer({ resolveWithObject: true });
    const thumb = await sharp(master.data)
      .resize({
        width: 800,
        height: 800,
        fit: "inside",
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toBuffer();
    return {
      master: master.data,
      thumb,
      width: master.info.width,
      height: master.info.height,
      sourceWidth: meta.width!,
      sourceHeight: meta.height!,
    };
  } catch {
    throw new Fault(415, "invalid_image");
  }
}
