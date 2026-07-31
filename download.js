// scripts/download-psap-images.mjs
import fs from "node:fs/promises";
import path from "node:path";

const OUTPUT_DIR = "./src/assets/img";

const images = [
  {
    url: "https://static.wixstatic.com/media/9eef37_65e292f6259c4633b3f931743d288831~mv2.png/v1/fill/w_216,h_80,al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/gsa-network_edited_edited_edited_edited_.png",
    filename: "gsa-network.avif",
  },
  {
    url: "https://static.wixstatic.com/media/9eef37_0e8497ee708b47a69c1e841c061c9273~mv2.jpg/v1/fill/w_540,h_251,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/54410241814_8a20244379_o_edited.jpg",
    filename: "psap-group.avif",
  },
  {
    url: "https://static.wixstatic.com/media/9eef37_9a462ca030b14160a52f75cf118b7663~mv2.jpg/v1/fill/w_540,h_251,al_c,q_80,usm_0.66_1.00_0.01,enc_avif,quality_auto/PXL_20230331_163816532.jpg",
    filename: "psap-leaders-council.avif",
  },
];

async function downloadImage(url, outputPath) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to download ${url}: ${response.status} ${response.statusText}`,
    );
  }

  const buffer = await response.arrayBuffer();
  await fs.writeFile(outputPath, Buffer.from(buffer));

  console.log(`Downloaded: ${outputPath}`);
}

async function main() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });

  for (const { url, filename } of images) {
    const outputPath = path.join(OUTPUT_DIR, filename);
    await downloadImage(url, outputPath);
  }

  console.log("All PSAP images downloaded successfully.");
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
