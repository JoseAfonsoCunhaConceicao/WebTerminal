import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Directory } from "../../src/vfs/node.js";
import { parsePath } from "../../src/vfs/path.js";
import { Session } from "../../src/session/session.js";
import type { ExecutionContext } from "../../src/command/context.js";
import { catCommand } from "../../src/command/builtins/cat.js";

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
                        name: "notes.txt",
                        kind: "file",
                        content: "project notes",
                    },
                ],
            },
            {
                name: "first.txt",
                kind: "file",
                content: "first file content",
            },
            {
                name: "second.txt",
                kind: "file",
                content: "second file content",
            },
        ],
    };
}

describe("cat command", () => {
    it("returns error when no arguments are provided", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = catCommand(
            { command: "cat", options: [], arguments: [] },
            context
        );

        assert.equal(result.exitCode, 1);
        assert.equal(result.error, "cat: missing operand");
    });

    it("prints contents of a single file in current directory", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = catCommand(
            { command: "cat", options: [], arguments: ["first.txt"] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.equal(result.output, "first file content");
    });

    it("prints contents using relative nested path", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = catCommand(
            { command: "cat", options: [], arguments: ["projects/notes.txt"] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.equal(result.output, "project notes");
    });

    it("prints contents using absolute path", () => {
        const session = new Session();
        session.setCurrentPath(parsePath("/projects"));

        const context: ExecutionContext = {
            root: createTestVFS(),
            session,
        };

        const result = catCommand(
            { command: "cat", options: [], arguments: ["/first.txt"] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.equal(result.output, "first file content");
    });

    it("concatenates contents of multiple files", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = catCommand(
            { command: "cat", options: [], arguments: ["first.txt", "second.txt"] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.equal(result.output, "first file content\nsecond file content");
    });

    it("returns error when target is a directory", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = catCommand(
            { command: "cat", options: [], arguments: ["projects"] },
            context
        );

        assert.equal(result.exitCode, 1);
        assert.equal(result.error, "cat: projects: Is a directory");
    });

    it("returns error when target file does not exist", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = catCommand(
            { command: "cat", options: [], arguments: ["missing.txt"] },
            context
        );

        assert.equal(result.exitCode, 1);
        assert.equal(result.error, "cat: missing.txt: No such file or directory");
    });
});

