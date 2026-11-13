/**
 * Defines the common structure shared by all virtual filesystem nodes.
 */

export interface File {
    readonly name: string;
    readonly kind: "file";
    readonly content: string;
}

export interface Directory {
    readonly name: string;
    readonly kind: "directory";
    readonly children: readonly Node[];
}

export type Node = File | Directory;

/**
 * Maximum node visits to prevent infinite loop execution during freezing.
 */
const MAX_FREEZE_NODES = 50000;

/**
 * Recursively freezes a virtual filesystem tree iteratively to enforce runtime immutability.
 *
 * @param root - The root directory of the tree to freeze.
 *
 * @returns The frozen root directory.
 */
export function freezeVFS(root: Directory): Directory {
    if (typeof root !== "object" || root === null || root.kind !== "directory") {
        throw new TypeError("Root must be a valid Directory node.");
    }

    const stack: Node[] = [root];
    const visited = new Set<Node>();

    for (let count = 0; stack.length > 0 && count < MAX_FREEZE_NODES; count++) {
        const node = stack.pop()!;
        if (visited.has(node)) {
            continue;
        }
        visited.add(node);
        Object.freeze(node);

        if (node.kind === "directory") {
            Object.freeze(node.children);
            const childCount = node.children.length;
            for (let idx = 0; idx < childCount; idx++) {
                stack.push(node.children[idx]!);
            }
        }
    }

    return root;
}
