import type { Path } from "./path.js";
import type { Node, Directory } from "./node.js";
import { PathNotFoundError, NotADirectoryError } from "./errors.js";

/**
 * Result of a non-throwing filesystem node lookup.
 */
export type LookupResult =
    | { readonly success: true; readonly node: Node }
    | { readonly success: false; readonly error: "NOT_FOUND" | "NOT_A_DIRECTORY"; readonly message: string };

/**
 * Resolves a normalized path within the virtual filesystem without throwing exceptions.
 *
 * @param root - Root directory of the virtual filesystem.
 * @param path - Absolute normalized path to resolve.
 *
 * @returns A LookupResult containing either the resolved node or an error reason.
 */
export function findNode(root: Directory, path: Path): LookupResult {
    if (typeof root !== "object" || root === null || root.kind !== "directory") {
        throw new TypeError("Root must be a valid Directory node.");
    }
    if (typeof path !== "object" || path === null || !Array.isArray(path.components)) {
        throw new TypeError("Path must be a valid Path object.");
    }

    let current: Node = root;
    const components = path.components;
    const componentsSize = components.length;

    for (let idx = 0; idx < componentsSize; idx++) {
        if (current.kind !== "directory") {
            return {
                success: false,
                error: "NOT_A_DIRECTORY",
                message: "Can not traverse a file.",
            };
        }

        const component = components[idx]!;
        const children = current.children;
        const childCount = children.length;
        let found: Node | undefined;

        for (let c = 0; c < childCount; c++) {
            const child = children[c]!;
            if (child.name === component) {
                found = child;
                break;
            }
        }

        if (found === undefined) {
            return {
                success: false,
                error: "NOT_FOUND",
                message: "Path component not found.",
            };
        }

        current = found;
    }

    return { success: true, node: current };
}

/**
 * Resolves an absolute normalized path within the virtual filesystem.
 *
 * @param root - Root directory of the virtual filesystem.
 * @param path - Absolute normalized path to resolve.
 *
 * @returns The node located at the given path.
 *
 * @throws {NotADirectoryError} If traversal attempts to continue through a file.
 * @throws {PathNotFoundError} If a path component does not exist.
 */
export function lookup(root: Directory, path: Path): Node {
    const result = findNode(root, path);
    if (result.success) {
        return result.node;
    }

    if (result.error === "NOT_A_DIRECTORY") {
        throw new NotADirectoryError(result.message);
    }

    throw new PathNotFoundError(result.message);
}
