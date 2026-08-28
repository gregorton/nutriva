/**
 * Derives every shipped brand asset from one source file, so replacing the logo is a
 * file drop plus a rerun rather than an image-editor session.
 *
 * Source: `public/logos/slim-wellness-asia-square.png` — the client lockup, transparent,
 * with uneven padding baked in around it.
 *
 * Writes:
 *   public/logos/slim-wellness-asia.png  tight-cropped lockup, transparent — the site logo.
 *                                        Cropped so the masthead can size it by height and
 *                                        get the optical size it asked for.
 *   app/icon.png                         favicon, on white. The lockup is thin gold strokes
 *                                        on transparency; over a dark browser tab strip it
 *                                        would disappear, so the icons carry their own field.
 *   app/apple-icon.png                   home-screen icon, same treatment. iOS rounds it.
 *
 * Run: node reference/brand/icons.mjs
 */
import { readFile, writeFile } from "node:fs/promises";
import sharp from "sharp";

const SOURCE = "public/logos/slim-wellness-asia-square.png";
const LOCKUP = "public/logos/slim-wellness-asia.png";

/** Icons sit on white, padded so the lockup's long edge fills this much of the canvas. */
const ICONS = [
  ["app/icon.png", 256],
  ["app/apple-icon.png", 180],
];
const FILL = 0.84;

/** Tightest box containing anything visible. `sharp`'s own trim reads the corner pixel,
 *  which on a transparent source is not a colour it can measure against. */
async function contentBox(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;
  let left = width;
  let top = height;
  let right = -1;
  let bottom = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (data[(y * width + x) * channels + 3] <= 16) continue;
      if (x < left) left = x;
      if (x > right) right = x;
      if (y < top) top = y;
      if (y > bottom) bottom = y;
    }
  }

  if (right < 0) throw new Error(`${file} is entirely transparent`);
  return { left, top, width: right - left + 1, height: bottom - top + 1 };
}

const box = await contentBox(SOURCE);
const source = await readFile(SOURCE);

const lockup = await sharp(source).extract(box).png({ compressionLevel: 9 }).toBuffer();
await writeFile(LOCKUP, lockup);
console.log(`${LOCKUP}  ${box.width}x${box.height}  ${(lockup.length / 1024).toFixed(1)} kB`);

for (const [file, size] of ICONS) {
  const inner = Math.round(size * FILL);
  const scaled = sharp(lockup).resize({
    width: box.width >= box.height ? inner : undefined,
    height: box.height > box.width ? inner : undefined,
    fit: "inside",
  });
  const { data, info } = await scaled.png().toBuffer({ resolveWithObject: true });

  const icon = await sharp({
    create: {
      width: size,
      height: size,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([
      {
        input: data,
        left: Math.round((size - info.width) / 2),
        top: Math.round((size - info.height) / 2),
      },
    ])
    .png({ compressionLevel: 9 })
    .toBuffer();

  await writeFile(file, icon);
  console.log(`${file}  ${size}x${size}  ${(icon.length / 1024).toFixed(1)} kB`);
}
