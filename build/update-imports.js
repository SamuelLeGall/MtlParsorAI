// update-imports.js
import { readdirSync, statSync, readFileSync, writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function updateImports(directory) {
  const files = readdirSync(directory);

  for (const file of files) {
    const filePath = join(directory, file);
    const stat = statSync(filePath);

    if (stat.isDirectory()) {
      // Recurse into directories
      updateImports(filePath);
    } else if (file.endsWith(".js")) {
      // Read the file contents
      let content = readFileSync(filePath, "utf8");

      // Replace import statements to include .js
      content = content.replace(
        /import\s+(.*)\s+from\s+['"](\.\.?.*?)['"]/g,
        (match, imports, modulePath) => {
          return `import ${imports} from '${modulePath}.js'`;
        }
      );

      // Write the updated content back to the file
      writeFileSync(filePath, content, "utf8");
    }
  }
}

// Update imports in the dist directory
updateImports(join(__dirname, "dist"));
