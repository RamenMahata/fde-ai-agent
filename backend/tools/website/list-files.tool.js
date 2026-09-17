import fs from 'node:fs/promises';
import path from 'node:path';
import {safePath, websiteWorkspace} from './safe-path.js';

export async function listFiles({ path: relativePath }) {
    try {
        const directory = safePath(relativePath);

        try {
            await fs.access(directory);
        } catch (error) {
            throw new Error(`Directory does not exist: ${relativePath}`);
        }

        const files = [];

        async function walk(current) {
            const entries = await fs.readdir(current, { withFileTypes: true });
            for(const entry of entries) {
                const item = path.join(current, entry.name);

                files.push(
                    path.relative(websiteWorkspace, item)
                );
                if(entry.isDirectory()) {
                    await walk(item);
                }
            }
        }

        await walk(directory);

        return files.join('\n');
    } catch (error) {
        console.error(`Error listing files in directory: ${relativePath}`, error);
        throw error;
    }
}