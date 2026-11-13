import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Directory } from "../../src/vfs/node.js";
import { Session } from "../../src/session/session.js";
import type { ExecutionContext } from "../../src/command/context.js";
import { openCommand } from "../../src/command/builtins/open.js";
import { createCommandRegistry } from "../../src/command/registry.js";
import { registerBuiltinCommands } from "../../src/command/builtins/index.js";
import { executeLine } from "../../src/command/executor.js";

function createTestVFS(): Directory {
    return {
        name: "",
        kind: "directory",
        children: [
            {
                name: "about.txt",
                kind: "file",
                content: "Author: José\nTitle: WebTerminal",
            },
            {
                name: "empty.txt",
                kind: "file",
                content: "",
            },
            {
                name: "image.png",
                kind: "file",
                content: "binarydata",
            },
            {
                name: "docs",
                kind: "directory",
                children: [
                    {
                        name: "guide.md",
                        kind: "file",
                        content: "# Guide",
                    },
                ],
            },
        ],
    };
}

describe("open command", () => {
    it("throws TypeError when arguments are invalid", () => {
        assert.throws(() => openCommand(null as never, {} as never), {
            name: "TypeError",
        });
    });

    it("returns error when missing file operand", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = openCommand(
            { command: "open", options: [], arguments: [] },
            context
        );
        assert.equal(result.exitCode, 1);
        assert.equal(result.error, "open: missing file operand");
    });

    it("returns error when target file does not exist", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = openCommand(
            { command: "open", options: [], arguments: ["not_found.txt"] },
            context
        );
        assert.equal(result.exitCode, 1);
        assert.equal(result.error, "open: 'not_found.txt': No such file or directory");
    });

    it("returns error when target is a directory", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = openCommand(
            { command: "open", options: [], arguments: ["docs"] },
            context
        );
        assert.equal(result.exitCode, 1);
        assert.equal(result.error, "open: 'docs': Is a directory");
    });

    it("returns error when target is an unsupported binary file", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = openCommand(
            { command: "open", options: [], arguments: ["image.png"] },
            context
        );
        assert.equal(result.exitCode, 1);
        assert.match(result.error ?? "", /Unsupported file format/);
    });

    it("opens and formats text file successfully", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = openCommand(
            { command: "open", options: [], arguments: ["about.txt"] },
            context
        );
        assert.equal(result.exitCode, 0);
        assert.match(result.output, /=== \[ about\.txt \] \(2 lines\) ===/);
        assert.match(result.output, /Author: José/);
    });

    it("opens empty file with empty file label", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = openCommand(
            { command: "open", options: [], arguments: ["empty.txt"] },
            context
        );
        assert.equal(result.exitCode, 0);
        assert.match(result.output, /\(empty file\)/);
    });

    it("opens nested file and integrates with executeLine and view alias", () => {
        const registry = createCommandRegistry();
        registerBuiltinCommands(registry);

        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const resOpen = executeLine("open docs/guide.md", context, registry);
        assert.equal(resOpen.exitCode, 0);
        assert.match(resOpen.output, /guide\.md/);

        const resView = executeLine("view docs/guide.md", context, registry);
        assert.equal(resView.exitCode, 0);
        assert.match(resView.output, /guide\.md/);
    });
});

