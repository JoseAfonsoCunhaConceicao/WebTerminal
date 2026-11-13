import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Directory, File, Node } from "../../src/vfs/node.js";
import type { Path } from "../../src/vfs/path.js";
import {
    PathNotFoundError,
    NotADirectoryError,
} from "../../src/vfs/errors.js";
import { lookup } from "../../src/vfs/lookup.js";

const readme: File = {
    name: "README.md",
    kind: "file",
    content: "WebTerminal",
};

const indexFile: File = {
    name: "index.txt",
    kind: "file",
    content: "Index",
};

const projects: Directory = {
    name: "projects",
    kind: "directory",
    children: [
        indexFile,
    ],
};

const home: Directory = {
    name: "home",
    kind: "directory",
    children: [
        readme,
        projects,
    ],
};

const root: Directory = {
    name: "",
    kind: "directory",
    children: [
        home,
    ],
};

describe("lookup", () => {
    it("returns the root for the root path", () => {
        const path: Path = {
            components: [],
            isAbsolute: true,
        };

        const result = lookup(root, path);

        assert.strictEqual(result, root);
    });

    it("finds a direct child directory", () => {
        const path: Path = {
            components: ["home"],
            isAbsolute: true,
        };

        const result = lookup(root, path);

        assert.strictEqual(result, home);
    });

    it("finds a direct child file", () => {
        const path: Path = {
            components: ["home", "README.md"],
            isAbsolute: true,
        };

        const result = lookup(root, path);

        assert.strictEqual(result, readme);
    });

    it("finds a nested directory", () => {
        const path: Path = {
            components: ["home", "projects"],
            isAbsolute: true,
        };

        const result = lookup(root, path);

        assert.strictEqual(result, projects);
    });

    it("finds a file nested multiple levels deep", () => {
        const path: Path = {
            components: ["home", "projects", "index.txt"],
            isAbsolute: true,
        };

        const result = lookup(root, path);

        assert.strictEqual(result, indexFile);
    });

    it("throws PathNotFoundError when a root child does not exist", () => {
        const path: Path = {
            components: ["missing"],
            isAbsolute: true,
        };

        assert.throws(
            () => lookup(root, path),
            PathNotFoundError,
        );
    });

    it("throws PathNotFoundError when a nested child does not exist", () => {
        const path: Path = {
            components: ["home", "projects", "missing.txt"],
            isAbsolute: true,
        };

        assert.throws(
            () => lookup(root, path),
            PathNotFoundError,
        );
    });

    it("throws NotADirectoryError when traversal continues through a file", () => {
        const path: Path = {
            components: ["home", "README.md", "child"],
            isAbsolute: true,
        };

        assert.throws(
            () => lookup(root, path),
            NotADirectoryError,
        );
    });

    it("does not modify the path", () => {
        const path: Path = {
            components: ["home", "projects", "index.txt"],
            isAbsolute: true,
        };

        const originalComponents = [...path.components];
        const originalIsAbsolute = path.isAbsolute;

        lookup(root, path);

        assert.deepStrictEqual(path.components, originalComponents);
        assert.strictEqual(path.isAbsolute, originalIsAbsolute);
    });

    it("returns the same node on repeated lookups", () => {
        const path: Path = {
            components: ["home", "projects", "index.txt"],
            isAbsolute: true,
        };

        const firstResult = lookup(root, path);
        const secondResult = lookup(root, path);

        assert.strictEqual(firstResult, secondResult);
        assert.strictEqual(firstResult, indexFile);
    });

    it("throws TypeError if path is not absolute", () => {
        const relativePath: Path = {
            components: ["home"],
            isAbsolute: false,
        };

        assert.throws(() => lookup(root, relativePath), {
            name: "TypeError",
            message: /Path must be an absolute path/,
        });
    });
});