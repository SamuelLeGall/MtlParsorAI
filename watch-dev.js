// watch-dev.js
import { spawn } from "child_process";
import { existsSync } from "fs";
import { setTimeout as wait } from "timers/promises";

const target = "dist/bin/www.js"; // adjust to your compiled entry point

async function waitForDist() {
    console.log(`[watch-dev] Waiting for initial build (${target})...`);
    while (!existsSync(target)) {
        await wait(300);
    }
    console.log(`[watch-dev] Found ${target}! Running initial fixups...`);
    runFixups();
}

function runFixups() {
    console.log("🔧 Running copy-assets + update-imports");
    if (existsSync("copy-assets.js"))
        spawn("node", ["copy-assets.js"], { stdio: "inherit", shell: true });
    if (existsSync("update-imports.js"))
        spawn("node", ["update-imports.js"], { stdio: "inherit", shell: true });
}

// Start tsc watcher first
const tsc = spawn("npx", ["tsc", "--watch", "--preserveWatchOutput"], {
    stdio: ["ignore", "pipe", "inherit"],
    shell: true,
});

// After tsc starts, wait for dist to exist before first fixup
waitForDist();

tsc.stdout.on("data", () => {
        console.log("🔁 Detected rebuild → running fixups...");
        runFixups();
});

tsc.on("exit", (code) => {
    console.log(`❌ tsc exited with code ${code}`);
});
