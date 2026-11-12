import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Directory } from "../../src/vfs/node.js";
import { parsePath } from "../../src/vfs/path.js";
import { Session } from "../../src/session/session.js";
import type { ExecutionContext } from "../../src/command/context.js";
import { pwdCommand } from "../../src/command/builtins/pwd.js";
import { echoCommand } from "../../src/command/builtins/echo.js";
import { cdCommand } from "../../src/command/builtins/cd.js";

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
                ],
            },
            {
                name: "file.txt",
                kind: "file",
                content: "root file",
            },
        ],
    };
}

describe("built-in commands", () => {
    describe("pwd", () => {
        it("returns root directory path when at root", () => {
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = pwdCommand(
                { command: "pwd", options: [], arguments: [] },
                context
            );

            assert.deepEqual(result, {
                exitCode: 0,
                output: "/",
                error: null,
            });
        });

        it("returns current nested directory path", () => {
            const session = new Session();
            session.setCurrentPath(parsePath("/projects/app"));

            const context: ExecutionContext = {
                root: createTestVFS(),
                session,
            };

            const result = pwdCommand(
                { command: "pwd", options: [], arguments: [] },
                context
            );

            assert.deepEqual(result, {
                exitCode: 0,
                output: "/projects/app",
                error: null,
            });
        });
    });

    describe("echo", () => {
        it("returns empty string when no arguments are provided", () => {
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = echoCommand(
                { command: "echo", options: [], arguments: [] },
                context
            );

            assert.deepEqual(result, {
                exitCode: 0,
                output: "",
                error: null,
            });
        });

        it("returns joined arguments separated by space", () => {
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = echoCommand(
                { command: "echo", options: [], arguments: ["hello", "world"] },
                context
            );

            assert.deepEqual(result, {
                exitCode: 0,
                output: "hello world",
                error: null,
            });
        });
    });

    describe("cd", () => {
        it("navigates to root when called without arguments", () => {
            const session = new Session();
            session.setCurrentPath(parsePath("/projects/app"));

            const context: ExecutionContext = {
                root: createTestVFS(),
                session,
            };

            const result = cdCommand(
                { command: "cd", options: [], arguments: [] },
                context
            );

            assert.equal(result.exitCode, 0);
            assert.equal(session.getCurrentPath().components.length, 0);
        });

        it("changes directory to relative child directory", () => {
            const session = new Session();
            const context: ExecutionContext = {
                root: createTestVFS(),
                session,
            };

            const result = cdCommand(
                { command: "cd", options: [], arguments: ["projects"] },
                context
            );

            assert.equal(result.exitCode, 0);
            assert.deepEqual(session.getCurrentPath().components, ["projects"]);
        });

        it("changes directory using parent traversal", () => {
            const session = new Session();
            session.setCurrentPath(parsePath("/projects/app"));

            const context: ExecutionContext = {
                root: createTestVFS(),
                session,
            };

            const result = cdCommand(
                { command: "cd", options: [], arguments: [".."] },
                context
            );

            assert.equal(result.exitCode, 0);
            assert.deepEqual(session.getCurrentPath().components, ["projects"]);
        });

        it("returns error and does not mutate path when target does not exist", () => {
            const session = new Session();
            const context: ExecutionContext = {
                root: createTestVFS(),
                session,
            };

            const result = cdCommand(
                { command: "cd", options: [], arguments: ["nonexistent"] },
                context
            );

            assert.equal(result.exitCode, 1);
            assert.equal(result.error, "cd: no such file or directory: nonexistent");
            assert.equal(session.getCurrentPath().components.length, 0);
        });

        it("returns error and does not mutate path when target is a file", () => {
            const session = new Session();
            const context: ExecutionContext = {
                root: createTestVFS(),
                session,
            };

            const result = cdCommand(
                { command: "cd", options: [], arguments: ["file.txt"] },
                context
            );

            assert.equal(result.exitCode, 1);
            assert.equal(result.error, "cd: not a directory: file.txt");
            assert.equal(session.getCurrentPath().components.length, 0);
        });

        it("returns error when too many arguments are passed", () => {
            const session = new Session();
            const context: ExecutionContext = {
                root: createTestVFS(),
                session,
            };

            const result = cdCommand(
                { command: "cd", options: [], arguments: ["a", "b"] },
                context
            );

            assert.equal(result.exitCode, 1);
            assert.equal(result.error, "cd: too many arguments");
        });
    });
});

