import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Directory } from "../../src/vfs/node.js";
import { freezeVFS } from "../../src/vfs/node.js";
import { findNode } from "../../src/vfs/lookup.js";

describe("freezeVFS", () => {
    it("freezes all nodes and child arrays in the hierarchy", () => {
        const root: Directory = {
            name: "",
            kind: "directory",
            children: [
                {
                    name: "projects",
                    kind: "directory",
                    children: [
                        {
                            name: "notes.txt",
                            kind: "file",
                            content: "my notes",
                        },
                    ],
                },
            ],
        };

        const frozen = freezeVFS(root);

        assert.equal(Object.isFrozen(frozen), true);
        assert.equal(Object.isFrozen(frozen.children), true);
        assert.equal(Object.isFrozen(frozen.children[0]), true);

        const projectDir = frozen.children[0] as Directory;
        assert.equal(Object.isFrozen(projectDir.children), true);
        assert.equal(Object.isFrozen(projectDir.children[0]), true);
    });

    it("throws TypeError if root is invalid", () => {
        assert.throws(() => {
            freezeVFS(null as unknown as Directory);
        }, TypeError);
    });
});

describe("findNode", () => {
    const vfs: Directory = freezeVFS({
        name: "",
        kind: "directory",
        children: [
            {
                name: "file.txt",
                kind: "file",
                content: "content",
            },
        ],
    });

    it("returns success with node when path exists", () => {
        const result = findNode(vfs, { components: ["file.txt"], isAbsolute: true });

        assert.equal(result.success, true);
        if (result.success) {
            assert.equal(result.node.name, "file.txt");
        }
    });

    it("returns NOT_FOUND error value without throwing", () => {
        const result = findNode(vfs, { components: ["missing.txt"], isAbsolute: true });

        assert.equal(result.success, false);
        if (!result.success) {
            assert.equal(result.error, "NOT_FOUND");
        }
    });

    it("returns NOT_A_DIRECTORY error value without throwing", () => {
        const result = findNode(vfs, { components: ["file.txt", "sub"], isAbsolute: true });

        assert.equal(result.success, false);
        if (!result.success) {
            assert.equal(result.error, "NOT_A_DIRECTORY");
        }
    });
});
