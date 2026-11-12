import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Directory } from "../../src/vfs/node.js";
import { parsePath } from "../../src/vfs/path.js";
import { Session } from "../../src/session/session.js";
import type { ExecutionContext } from "../../src/command/context.js";
import { lsCommand } from "../../src/command/builtins/ls.js";

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
                        children: [],
                    },
                    {
                        name: "notes.txt",
                        kind: "file",
                        content: "hello world",
                    },
                    {
                        name: ".hidden",
                        kind: "file",
                        content: "secret",
                    },
                ],
            },
            {
                name: "empty_dir",
                kind: "directory",
                children: [],
            },
            {
                name: "file.txt",
                kind: "file",
                content: "root file",
            },
        ],
    };
}

describe("ls command", () => {
    it("lists current directory entries sorted alphabetically", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = lsCommand(
            { command: "ls", options: [], arguments: [] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.equal(result.output, "empty_dir  file.txt  projects");
    });

    it("lists entries for a specified path argument", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = lsCommand(
            { command: "ls", options: [], arguments: ["projects"] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.equal(result.output, "app  notes.txt");
    });

    it("prints file name when target is a file", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = lsCommand(
            { command: "ls", options: [], arguments: ["file.txt"] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.equal(result.output, "file.txt");
    });

    it("includes hidden files and dot entries with -a option", () => {
        const session = new Session();
        session.setCurrentPath(parsePath("/projects"));

        const context: ExecutionContext = {
            root: createTestVFS(),
            session,
        };

        const result = lsCommand(
            { command: "ls", options: ["-a"], arguments: [] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.equal(result.output, ".  ..  .hidden  app  notes.txt");
    });

    it("formats one entry per line with -1 option", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = lsCommand(
            { command: "ls", options: ["-1"], arguments: [] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.equal(result.output, "empty_dir\nfile.txt\nprojects");
    });

    it("returns empty string for empty directory", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = lsCommand(
            { command: "ls", options: [], arguments: ["empty_dir"] },
            context
        );

        assert.equal(result.exitCode, 0);
        assert.equal(result.output, "");
    });

    it("returns error when target path does not exist", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = lsCommand(
            { command: "ls", options: [], arguments: ["nonexistent"] },
            context
        );

        assert.equal(result.exitCode, 1);
        assert.equal(result.error, "ls: cannot access 'nonexistent': No such file or directory");
    });

    it("returns error when navigating through a file", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = lsCommand(
            { command: "ls", options: [], arguments: ["file.txt/sub"] },
            context
        );

        assert.equal(result.exitCode, 1);
        assert.equal(result.error, "ls: cannot access 'file.txt/sub': No such file or directory");
    });
});

