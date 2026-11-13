import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { Session } from "../../src/session/session.js";
import type { Directory } from "../../src/vfs/node.js";
import type { ExecutionContext } from "../../src/command/context.js";
import { treeCommand } from "../../src/command/builtins/tree.js";
import { createCommandRegistry } from "../../src/command/registry.js";
import { registerBuiltinCommands } from "../../src/command/builtins/index.js";
import { executeLine } from "../../src/command/executor.js";

function createTestVFS(): Directory {
    return {
        name: "",
        kind: "directory",
        children: [
            {
                name: "projects",
                kind: "directory",
                children: [
                    {
                        name: "app",
                        kind: "directory",
                        children: [
                            {
                                name: "index.ts",
                                kind: "file",
                                content: "console.log('hi');",
                            },
                        ],
                    },
                    {
                        name: "notes.txt",
                        kind: "file",
                        content: "notes",
                    },
                    {
                        name: ".config",
                        kind: "file",
                        content: "secret",
                    },
                ],
            },
            {
                name: "docs",
                kind: "directory",
                children: [
                    {
                        name: "readme.md",
                        kind: "file",
                        content: "docs",
                    },
                ],
            },
            {
                name: "empty_dir",
                kind: "directory",
                children: [],
            },
            {
                name: "root_file.txt",
                kind: "file",
                content: "root file content",
            },
        ],
    };
}

describe("tree command", () => {
    it("renders empty directory tree correctly", () => {
        const emptyVFS: Directory = { name: "", kind: "directory", children: [] };
        const context: ExecutionContext = {
            root: emptyVFS,
            session: new Session(),
        };

        const result = treeCommand(
            { command: "tree", options: [], arguments: [] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.equal(result.output, ".\n\n0 directories, 0 files");
    });

    it("renders hierarchical tree with branches and summary", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = treeCommand(
            { command: "tree", options: [], arguments: [] },
            context
        );

        assert.equal(result.exitCode, 0);

        const expected = [
            ".",
            "├── docs",
            "│   └── readme.md",
            "├── empty_dir",
            "├── projects",
            "│   ├── app",
            "│   │   └── index.ts",
            "│   └── notes.txt",
            "└── root_file.txt",
            "",
            "4 directories, 4 files",
        ].join("\n");

        assert.equal(result.output, expected);
    });

    it("renders tree for specific directory target", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = treeCommand(
            { command: "tree", options: [], arguments: ["docs"] },
            context
        );

        assert.equal(result.exitCode, 0);

        const expected = [
            "docs",
            "└── readme.md",
            "",
            "0 directories, 1 file",
        ].join("\n");

        assert.equal(result.output, expected);
    });

    it("handles target when target is a file", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = treeCommand(
            { command: "tree", options: [], arguments: ["root_file.txt"] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.equal(result.output, "root_file.txt\n\n0 directories, 1 file");
    });

    it("includes hidden entries when -a option is passed", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = treeCommand(
            { command: "tree", options: ["-a"], arguments: ["projects"] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.match(result.output, /\.config/);
        assert.match(result.output, /1 directory, 3 files/);
    });

    it("lists only directories when -d option is passed", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = treeCommand(
            { command: "tree", options: ["-d"], arguments: [] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.doesNotMatch(result.output, /readme\.md/);
        assert.doesNotMatch(result.output, /root_file\.txt/);
        assert.match(result.output, /4 directories, 0 files/);
    });

    it("returns error when target path does not exist", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = treeCommand(
            { command: "tree", options: [], arguments: ["nonexistent"] },
            context
        );

        assert.equal(result.exitCode, 1);
        assert.equal(result.error, "tree: 'nonexistent': No such file or directory");
    });

    it("integrates with executeLine", () => {
        const registry = createCommandRegistry();
        registerBuiltinCommands(registry);

        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = executeLine("tree docs", context, registry);
        assert.equal(result.exitCode, 0);
        assert.match(result.output, /readme\.md/);
    });

    it("limits tree depth when -L level option is passed", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = treeCommand(
            { command: "tree", options: ["-L"], arguments: ["1"] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.doesNotMatch(result.output, /readme\.md/);
        assert.doesNotMatch(result.output, /index\.ts/);
        assert.match(result.output, /├── docs/);
        assert.match(result.output, /├── projects/);
    });

    it("supports attached -L syntax and validates invalid level", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const attached = treeCommand(
            { command: "tree", options: ["-L1"], arguments: [] },
            context
        );
        assert.equal(attached.exitCode, 0);

        const invalid = treeCommand(
            { command: "tree", options: ["-L0"], arguments: [] },
            context
        );
        assert.equal(invalid.exitCode, 1);
        assert.equal(invalid.error, "tree: Invalid level, must be greater than 0.");
    });

    it("prints full relative path prefix when -f option is passed", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = treeCommand(
            { command: "tree", options: ["-f"], arguments: ["docs"] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.match(result.output, /docs\/readme\.md/);
    });
});
