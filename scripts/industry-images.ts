/* ------------------------------------------------------------------ */
/* npm run images:webp — convert the industry photos to WebP           */
/* ------------------------------------------------------------------ */
/*
 * Put photos in public/images/industries/ (saas-1.jpg, ecommerce-1.jpg,
 * clinic-1.jpg, realestate-1.jpg). This writes a resized .webp next to
 * each one; the demo pages use the .webp automatically. Uses sharp,
 * which ships with Next.js. Re-run after replacing a photo.
 */
import { readdir } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const DIR = path.join(process.cwd(), "public", "images", "industries");

async function main() {
  const files = (await readdir(DIR)).filter((f) => /\.(jpe?g|png)$/i.test(f));
  if (files.length === 0) {
    console.log(`No .jpg/.png files in ${path.relative(process.cwd(), DIR)} — nothing to convert.`);
    return;
  }
  for (const file of files) {
    const out = file.replace(/\.(jpe?g|png)$/i, ".webp");
    const info = await sharp(path.join(DIR, file))
      .rotate() // respect camera orientation
      .resize({ width: 1600, withoutEnlargement: true })
      .webp({ quality: 80 })
      .toFile(path.join(DIR, out));
    console.log(`✓ ${file} → ${out} (${info.width}×${info.height}, ${Math.round(info.size / 1024)} KB)`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
