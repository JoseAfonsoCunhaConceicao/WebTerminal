import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { Session } from "../../src/session/session.js";
import type { Directory } from "../../src/vfs/node.js";
import type { ExecutionContext } from "../../src/command/context.js";
import { createCommandRegistry } from "../../src/command/registry.js";
import { registerBuiltinCommands } from "../../src/command/builtins/index.js";
import { manCommand } from "../../src/command/builtins/man.js";
import { aproposCommand } from "../../src/command/builtins/apropos.js";
import { whoamiCommand, DEFAULT_USER } from "../../src/command/builtins/whoami.js";
import { getManualPage, searchManualPages } from "../../src/command/manual.js";
import { executeLine } from "../../src/command/executor.js";

function createTestVFS(): Directory {
    return { name: "", kind: "directory", children: [] };
}

describe("manual and search commands", () => {
    describe("manual database", () => {
        it("retrieves a manual page by command name case-insensitively", () => {
            const page = getManualPage("PWD");

            assert.notEqual(page, undefined);
            assert.equal(page?.name, "pwd");
            assert.equal(page?.section, 1);
        });

        it("returns undefined for unknown manual entry", () => {
            const page = getManualPage("unknown_command");

            assert.equal(page, undefined);
        });

        it("searches manual entries by keyword", () => {
            const matches = searchManualPages("directory");

            assert.equal(matches.length >= 3, true);
            const names = matches.map((m) => m.name);
            assert.equal(names.includes("pwd"), true);
            assert.equal(names.includes("cd"), true);
            assert.equal(names.includes("ls"), true);
        });

        it("returns empty array when search has no matches", () => {
            const matches = searchManualPages("nonexistent_keyword_xyz");

            assert.equal(matches.length, 0);
        });

        it("throws TypeError if argument is not a string", () => {
            assert.throws(() => {
                getManualPage(null as unknown as string);
            }, TypeError);
        });
    });

    describe("man command", () => {
        it("returns error when no manual argument is provided", () => {
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = manCommand(
                { command: "man", options: [], arguments: [] },
                context
            );

            assert.equal(result.exitCode, 1);
            assert.equal(result.error, "What manual page do you want?");
        });

        it("displays formatted manual page for valid command", () => {
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = manCommand(
                { command: "man", options: [], arguments: ["cd"] },
                context
            );

            assert.equal(result.exitCode, 0);
            assert.match(result.output, /NAME\s+cd - Change the current working directory/);
            assert.match(result.output, /SYNOPSIS\s+cd \[PATH\]/);
            assert.match(result.output, /DESCRIPTION/);
        });

        it("returns error when manual entry does not exist", () => {
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = manCommand(
                { command: "man", options: [], arguments: ["fake"] },
                context
            );

            assert.equal(result.exitCode, 1);
            assert.equal(result.error, "No manual entry for fake");
        });
    });

    describe("apropos command", () => {
        it("returns error when keyword argument is missing", () => {
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = aproposCommand(
                { command: "apropos", options: [], arguments: [] },
                context
            );

            assert.equal(result.exitCode, 1);
            assert.equal(result.error, "apropos: missing search keyword");
        });

        it("returns matching command summaries for keyword", () => {
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = aproposCommand(
                { command: "apropos", options: [], arguments: ["directory"] },
                context
            );

            assert.equal(result.exitCode, 0);
            assert.match(result.output, /cd \(1\)\s+- Change the current working directory/);
            assert.match(result.output, /pwd \(1\)\s+- Print name of current working directory/);
        });

        it("returns error when nothing appropriate is found", () => {
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = aproposCommand(
                { command: "apropos", options: [], arguments: ["nonexistent_xyz"] },
                context
            );

            assert.equal(result.exitCode, 1);
            assert.equal(result.error, "nonexistent_xyz: nothing appropriate.");
        });
    });

    describe("whoami command", () => {
        it("returns the default user identity", () => {
            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const result = whoamiCommand(
                { command: "whoami", options: [], arguments: [] },
                context
            );

            assert.equal(result.exitCode, 0);
            assert.equal(result.output, DEFAULT_USER);
        });
    });

    describe("integration via executeLine", () => {
        it("executes whoami, man, and apropos through pipeline", () => {
            const registry = createCommandRegistry();
            registerBuiltinCommands(registry);

            const context: ExecutionContext = {
                root: createTestVFS(),
                session: new Session(),
            };

            const whoResult = executeLine("whoami", context, registry);
            assert.equal(whoResult.output, "visitor");

            const manResult = executeLine("man ls", context, registry);
            assert.equal(manResult.exitCode, 0);
            assert.match(manResult.output, /List directory contents/);

            const aproposResult = executeLine("apropos screen", context, registry);
            assert.equal(aproposResult.exitCode, 0);
            assert.match(aproposResult.output, /clear \(1\)/);
        });
    });
});

