import path from 'node:path';

const websiteWorkspace = path.resolve("generated-sites");

export function safePath(relativePath) {
    const resolved = path.resolve(
        websiteWorkspace,
        relativePath
    );

    if(
        resolved !== websiteWorkspace &&
        !resolved.startsWith(`${websiteWorkspace}${path.sep}`)
    ) {
        throw new Error("Access outside generated-sites is not allowed");
    }

    return resolved;
}

export {websiteWorkspace};