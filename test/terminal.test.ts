/**
 * Integration test suite for the WebTerminal facade and public exports.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    WebTerminal,
    createCommandRegistry,
    successResult,
    formatPath,
    freezeVFS,
    tokenize,
    parseCommand,
} from "../src/index.js";
import type { Directory } from "../src/index.js";

function createSampleVFS(): Directory {
    return {
        name: "",
        kind: "directory",
        children: [
            {
                name: "bin",
                kind: "directory",
                children: [
                    { name: "tool", kind: "file", content: "echo ok" },
                ],
            },
            {
                name: "home",
                kind: "directory",
                children: [
                    { name: "notes.txt", kind: "file", content: "hello world" },
                ],
            },
        ],
    };
}

describe("WebTerminal facade", () => {
    describe("initialization", () => {
        it("throws TypeError if options is not an object", () => {
            assert.throws(() => new WebTerminal(null as unknown as { root: Directory }), {
                name: "TypeError",
                message: /Options must be a valid object/,
            });
        });

        it("throws TypeError if root is not a directory", () => {
            assert.throws(() => new WebTerminal({ root: null as unknown as Directory }), {
                name: "TypeError",
                message: /Options.root must be a valid Directory node/,
            });
        });

        it("freezes the provided VFS deeply", () => {
            const vfs = createSampleVFS();
            const terminal = new WebTerminal({ root: vfs });

            assert.strictEqual(Object.isFrozen(terminal.getRoot()), true);
            const home = terminal.getRoot().children[1];
            assert.ok(home);
            assert.strictEqual(Object.isFrozen(home), true);
        });

        it("initializes session at root by default", () => {
            const terminal = new WebTerminal({ root: createSampleVFS() });
            assert.strictEqual(formatPath(terminal.getSession().getCurrentPath()), "/");
        });

        it("initializes session at initialPath if valid directory", () => {
            const terminal = new WebTerminal({
                root: createSampleVFS(),
                initialPath: "/home",
            });
            assert.strictEqual(formatPath(terminal.getSession().getCurrentPath()), "/home");
        });

        it("falls back to root if initialPath is invalid or a file", () => {
            const terminal = new WebTerminal({
                root: createSampleVFS(),
                initialPath: "/home/notes.txt",
            });
            assert.strictEqual(formatPath(terminal.getSession().getCurrentPath()), "/");
        });

        it("accepts custom command registry", () => {
            const customRegistry = createCommandRegistry();
            customRegistry.register("custom", () => successResult("custom-output"));
            const terminal = new WebTerminal({
                root: createSampleVFS(),
                registry: customRegistry,
            });

            const res = terminal.execute("custom");
            assert.strictEqual(res.exitCode, 0);
            assert.strictEqual(res.output, "custom-output");
        });

        it("configures session with custom maxHistoryEntries", () => {
            const terminal = new WebTerminal({
                root: createSampleVFS(),
                maxHistoryEntries: 2,
            });

            terminal.execute("echo a");
            terminal.execute("echo b");
            terminal.execute("echo c");

            assert.deepStrictEqual(terminal.getSession().getHistory(), ["echo b", "echo c"]);
        });
    });

    describe("command execution", () => {
        it("throws TypeError when commandLine is not a string", () => {
            const terminal = new WebTerminal({ root: createSampleVFS() });
            assert.throws(() => terminal.execute(123 as unknown as string), {
                name: "TypeError",
                message: /Command line must be a string/,
            });
        });

        it("executes built-in commands and navigates directories", () => {
            const terminal = new WebTerminal({ root: createSampleVFS() });

            const pwd1 = terminal.execute("pwd");
            assert.strictEqual(pwd1.exitCode, 0);
            assert.strictEqual(pwd1.output, "/");

            const cd1 = terminal.execute("cd home");
            assert.strictEqual(cd1.exitCode, 0);

            const pwd2 = terminal.execute("pwd");
            assert.strictEqual(pwd2.output, "/home");

            const cat1 = terminal.execute("cat notes.txt");
            assert.strictEqual(cat1.exitCode, 0);
            assert.strictEqual(cat1.output, "hello world");
        });

        it("records execution in history", () => {
            const terminal = new WebTerminal({ root: createSampleVFS() });
            terminal.execute("echo first");
            terminal.execute("echo second");

            const historyRes = terminal.execute("history");
            assert.strictEqual(historyRes.exitCode, 0);
            assert.match(historyRes.output, /echo first/);
            assert.match(historyRes.output, /echo second/);
        });

        it("returns syntax error with exitCode 2 for unclosed quotes", () => {
            const terminal = new WebTerminal({ root: createSampleVFS() });
            const res = terminal.execute("echo \"unclosed");
            assert.strictEqual(res.exitCode, 2);
            assert.match(res.error ?? "", /Unterminated double quote/);
        });

        it("returns 127 for unknown command", () => {
            const terminal = new WebTerminal({ root: createSampleVFS() });
            const res = terminal.execute("nonexistent_command");
            assert.strictEqual(res.exitCode, 127);
            assert.match(res.error ?? "", /command not found/);
        });

        it("returns exitCode 1 when command line exceeds maximum length", () => {
            const terminal = new WebTerminal({ root: createSampleVFS() });
            const oversized = "a".repeat(4097);
            const res = terminal.execute(oversized);
            assert.strictEqual(res.exitCode, 1);
            assert.match(res.error ?? "", /maximum length limit/);
        });
    });

    describe("public exports", () => {
        it("exports public tokenizer and parser functions", () => {
            const tokenRes = tokenize("echo 123");
            assert.strictEqual(tokenRes.success, true);
            if (tokenRes.success) {
                const invocation = parseCommand(tokenRes.tokens);
                assert.ok(invocation);
                assert.strictEqual(invocation.command, "echo");
            }
        });

        it("exports freezeVFS utility", () => {
            const testDir: Directory = { name: "test", kind: "directory", children: [] };
            const frozen = freezeVFS(testDir);
            assert.strictEqual(Object.isFrozen(frozen), true);
        });
    });
});

