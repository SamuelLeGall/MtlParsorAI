import { copy } from "fs-extra"; // Install this package first
import { join, basename, dirname } from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const copyStaticAssets = async () => {
  try {
    // Define your source and destination directories
    const sourceDirs = [
      join(__dirname, "../../src/views"),
      join(__dirname, "../../src/public"),
    ];
    const destDir = join(__dirname, "../../dist/src");

    // Copy each directory
    await Promise.all(
      sourceDirs.map(async (srcDir) => {
        const destPath = join(destDir, basename(srcDir));
        await copy(srcDir, destPath);
        console.log(`Copied ${srcDir} to ${destPath}`);
      })
    );

    console.log("Static assets copied successfully.");
  } catch (error) {
    console.error("Error copying static assets:", error);
  }
};

copyStaticAssets();
