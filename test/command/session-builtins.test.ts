import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Directory } from "../../src/vfs/node.js";
import { parsePath } from "../../src/vfs/path.js";
import { Session } from "../../src/session/session.js";
import type { ExecutionContext } from "../../src/command/context.js";
import { createCommandRegistry } from "../../src/command/registry.js";
import { registerBuiltinCommands } from "../../src/command/builtins/index.js";
import { clearCommand, CLEAR_SCREEN_SEQUENCE } from "../../src/command/builtins/clear.js";
import { resetCommand } from "../../src/command/builtins/reset.js";
import { historyCommand } from "../../src/command/builtins/history.js";
import { helpCommand } from "../../src/command/builtins/help.js";
import { executeLine } from "../../src/command/executor.js";

function createTestVFS(): Directory {
    return {
        name: "",
        kind: "directory",
        children: [],
    };
}

describe("session built-in commands", () => {
    describe("clear", () => {
        it("returns the standard clear screen escape sequence", () => {
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = clearCommand(
                { command: "clear", options: [], arguments: [] },
                context
            );

            assert.equal(result.exitCode, 0);
            assert.equal(result.output, CLEAR_SCREEN_SEQUENCE);
            assert.equal(result.error, null);
        });
    });

    describe("reset", () => {
        it("resets the session path to root and clears history", () => {
            const session = new Session();
            session.setCurrentPath(parsePath("/some/deep/path"));
            session.addHistory("echo test");

            const context: ExecutionContext = {
                root: createTestVFS(),
                session,
            };

            const result = resetCommand(
                { command: "reset", options: [], arguments: [] },
                context
            );

            assert.equal(result.exitCode, 0);
            assert.equal(result.output, "Session reset.");
            assert.equal(session.getCurrentPath().components.length, 0);
            assert.equal(session.getHistory().length, 0);
        });
    });

    describe("history", () => {
        it("returns empty string when session history is empty", () => {
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = historyCommand(
                { command: "history", options: [], arguments: [] },
                context
            );

            assert.equal(result.exitCode, 0);
            assert.equal(result.output, "");
        });

        it("formats history entries with padded line numbers", () => {
            const session = new Session();
            session.addHistory("pwd");
            session.addHistory("ls -la");
            session.addHistory("cd /projects");

            const context: ExecutionContext = {
                root: createTestVFS(),
                session,
            };

            const result = historyCommand(
                { command: "history", options: [], arguments: [] },
                context
            );

            assert.equal(result.exitCode, 0);
            assert.equal(
                result.output,
                "   1  pwd\n   2  ls -la\n   3  cd /projects"
            );
        });
    });

    describe("help", () => {
        it("lists all available commands when called without arguments", () => {
            const registry = createCommandRegistry();
            registerBuiltinCommands(registry);

            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
                registry,
            };

            const result = helpCommand(
                { command: "help", options: [], arguments: [] },
                context
            );

            assert.equal(result.exitCode, 0);
            assert.match(result.output, /Available commands:/);
            assert.match(result.output, /pwd/);
            assert.match(result.output, /cd/);
            assert.match(result.output, /history/);
        });

        it("describes a specific requested command", () => {
            const registry = createCommandRegistry();
            registerBuiltinCommands(registry);

            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
                registry,
            };

            const result = helpCommand(
                { command: "help", options: [], arguments: ["pwd"] },
                context
            );

            assert.equal(result.exitCode, 0);
            assert.equal(result.output, "pwd - Print name of current working directory");
        });

        it("returns error when help topic is not found", () => {
            const registry = createCommandRegistry();
            registerBuiltinCommands(registry);

            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
                registry,
            };

            const result = helpCommand(
                { command: "help", options: [], arguments: ["nonexistent"] },
                context
            );

            assert.equal(result.exitCode, 1);
            assert.equal(result.error, "help: no help topics match 'nonexistent'");
        });
    });

    describe("integration via executeLine", () => {
        it("records commands in history and resets properly", () => {
            const registry = createCommandRegistry();
            registerBuiltinCommands(registry);

            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            executeLine("pwd", context, registry);
            executeLine("echo test", context, registry);

            const histResult = executeLine("history", context, registry);
            assert.equal(histResult.exitCode, 0);
            assert.match(histResult.output, /pwd/);
            assert.match(histResult.output, /echo test/);

            const resetResult = executeLine("reset", context, registry);
            assert.equal(resetResult.exitCode, 0);
            assert.equal(context.session.getHistory().length, 0);
        });
    });
});

