import fs from "node:fs/promises";
import path from "node:path";
import {safePath} from "./safe-path.js";

export async function writeFile({
    path: relativePath,
    content,
}) {
    try {
        const file = safePath(relativePath);

        await fs.mkdir(path.dirname(file), {
            recursive: true
        });

        await fs.writeFile(file, content, "utf-8");

        return `File written successfully: ${relativePath}`;
    } catch (error) {
        console.error(`Error writing file: ${relativePath}`, error);
        throw error;
    }
}