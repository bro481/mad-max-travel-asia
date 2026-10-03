import fs from "node:fs";
import path from "node:path";

const cachePath = path.join(process.cwd(), "db", "property-cache.json");

if (!fs.existsSync(cachePath)) {
  console.error("ERROR: db/property-cache.json is missing. Public rooms would fall back to demo data.");
  process.exit(1);
}

const records = JSON.parse(fs.readFileSync(cachePath, "utf8"));
const published = Array.isArray(records)
  ? records.filter((item) => item && item.status === "published")
  : [];
const withImages = published.filter((item) => Array.isArray(item.images) && item.images.length > 0);
const hasRealMedia = withImages.some((item) =>
  item.images.some((image) => /\/api\/media\/properties\//.test(String(image))),
);

console.log(
  `static property cache: ${Array.isArray(records) ? records.length : 0} total, ${published.length} published, ${withImages.length} published with images`,
);

if (published.length < 30) {
  console.error("ERROR: Static property cache is too small. Refusing to deploy old demo inventory.");
  process.exit(1);
}

if (!hasRealMedia) {
  console.error("ERROR: Static property cache does not contain uploaded property media.");
  process.exit(1);
}
