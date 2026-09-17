import fs from 'node:fs/promises';
import {safePath} from './safe-path.js';

export async function readFile({
    path: relativePath,
}) {
    try {
        return await fs.readFile(safePath(relativePath), 'utf-8');
    } catch (error) {
        console.error(`Error reading file: ${relativePath}`, error);
        throw error;
    }
}