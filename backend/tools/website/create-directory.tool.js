import fs from "node:fs/promises";
import {safePath} from "./safe-path.js";

export async function createDirectory({path: relativePath}) {
    try {
        await fs.mkdir(safePath(relativePath), {
            recursive: true
        });

        return `Directory created successfully: ${relativePath}`;
    } catch (error) {
        throw new Error(`Failed to create directory: ${error.message}`);
    }
}