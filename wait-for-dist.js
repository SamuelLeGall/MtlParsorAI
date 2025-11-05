// wait-for-dist.js
import { existsSync } from "fs";
import { setTimeout as wait } from "timers/promises";

const target = "dist/bin/www.js";

const waitForFile = async () => {
    console.log(`Waiting for ${target} to be built...`);
    while (!existsSync(target)) {
        await wait(500);
    }
    console.log(`${target} detected, starting app...`);
};

await waitForFile();
