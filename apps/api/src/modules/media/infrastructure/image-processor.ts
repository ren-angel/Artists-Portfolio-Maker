import sharp from "sharp";
import { defaults } from "@studio/shared";
import { Fault, assert } from "../../../platform/errors.ts";

// Defense in depth for untrusted uploads: libvips may only run the decoders
// for the accepted formats, so HEIF, SVG, TIFF, PDF and other parsers are
// unreachable even before the format check below.
sharp.block({ operation: ["VipsForeignLoad"] });
sharp.unblock({
  operation: ["VipsForeignLoadJpegBuffer", "VipsForeignLoadPngBuffer", "VipsForeignLoadWebpBuffer"],
});
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
