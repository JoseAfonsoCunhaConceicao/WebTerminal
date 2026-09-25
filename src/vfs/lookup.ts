import type { Directory } from "./directories.js";
import type { Path } from "./path.js";
import type { Node } from "./node.js";
import { PathNotFoundError, NotADirectoryError } from "./errors.js";


/**
 * Resolves an absolute normalized path within the virtual filesystem.
 *
 * The function traverses the VFS starting at the given root directory and
 * returns the node corresponding to the requested path.
 *
 * @param root - Root directory of the virtual filesystem.
 * @param path - Absolute normalized path to resolve.
 * @returns The node located at the given path.
 *
 * @throws {NotADirectoryError}
 * Thrown when traversal attempts to continue through a file.
 *
 * @throws {PathNotFoundError}
 * Thrown when a path component does not exist in the current directory.
 */
export function lookup(root: Directory, path: Path): Node {
    let current: Node = root;

    const components = path.components;

    const componentsSize = components.length;

    for (let idx = 0; idx < componentsSize; idx++) {
        const component = components[idx]!;

        if (current.kind !== "directory") {
            throw new NotADirectoryError("Can not traverse a file.");
        }


        const children = current.children;

        let found: Node | undefined;

        for (const child of children) {
            if (child.name === component) {
                found = child;
                break;
            }
        }

        if (found === undefined) {
            throw new PathNotFoundError("Path component not found.");
        }

        current = found;
    }

    return current;
}