import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Directory } from "../../src/vfs/node.js";
import { Session } from "../../src/session/session.js";
import type { ExecutionContext } from "../../src/command/context.js";
import { createCommandRegistry } from "../../src/command/registry.js";
import { registerBuiltinCommands } from "../../src/command/builtins/index.js";
import { executeInvocation, executeLine } from "../../src/command/executor.js";

function createTestVFS(): Directory {
    return {
        name: "",
        kind: "directory",
        children: [
            {
                name: "projects",
                kind: "directory",
                children: [],
            },
        ],
    };
}

describe("command executor", () => {
    describe("registry", () => {
        it("registers and retrieves a command handler", () => {
            const registry = createCommandRegistry();
            const dummyHandler = () => ({ exitCode: 0, output: "ok", error: null });

            registry.register("dummy", dummyHandler);

            assert.equal(registry.has("dummy"), true);
            assert.equal(registry.get("dummy"), dummyHandler);
            assert.deepEqual(registry.getRegisteredNames(), ["dummy"]);
        });

        it("throws TypeError when registering invalid name or handler", () => {
            const registry = createCommandRegistry();

            assert.throws(() => {
                registry.register("", () => ({ exitCode: 0, output: "", error: null }));
            }, TypeError);

            assert.throws(() => {
                registry.register("valid", null as unknown as () => never);
            }, TypeError);
        });
    });

    describe("executeInvocation", () => {
        it("returns 127 for unknown command", () => {
            const registry = createCommandRegistry();
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = executeInvocation(
                { command: "unknown", options: [], arguments: [] },
                context,
                registry
            );

            assert.equal(result.exitCode, 127);
            assert.equal(result.error, "unknown: command not found");
        });
    });

    describe("executeLine", () => {
        it("returns success with empty output for empty string", () => {
            const registry = createCommandRegistry();
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = executeLine("", context, registry);

            assert.equal(result.exitCode, 0);
            assert.equal(result.output, "");
            assert.equal(context.session.getHistory().length, 0);
        });

        it("returns syntax error with exitCode 2 for invalid quotes", () => {
            const registry = createCommandRegistry();
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = executeLine("echo 'unterminated", context, registry);

            assert.equal(result.exitCode, 2);
            assert.equal(result.error, "Unterminated single quote in input.");
        });

        it("records executed command in session history", () => {
            const registry = createCommandRegistry();
            registerBuiltinCommands(registry);

            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            executeLine("pwd", context, registry);
            executeLine("echo hello", context, registry);

            assert.deepEqual(context.session.getHistory(), ["pwd", "echo hello"]);
        });

        it("executes pwd, cd, and echo in a sequence", () => {
            const registry = createCommandRegistry();
            registerBuiltinCommands(registry);

            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const pwdInitial = executeLine("pwd", context, registry);
            assert.equal(pwdInitial.output, "/");

            const cdResult = executeLine("cd projects", context, registry);
            assert.equal(cdResult.exitCode, 0);

            const pwdUpdated = executeLine("pwd", context, registry);
            assert.equal(pwdUpdated.output, "/projects");

            const echoResult = executeLine("echo 'hello from terminal'", context, registry);
            assert.equal(echoResult.output, "hello from terminal");
        });
    });
});

