import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { parseCommand } from "../../src/command/parser.js";

describe("parseCommand", () => {
    it("returns null for an empty token list", () => {
        const result = parseCommand([]);

        assert.equal(result, null);
    });

    it("parses a command without options or arguments", () => {
        const result = parseCommand(["pwd"]);

        assert.deepEqual(result, {
            command: "pwd",
            options: [],
            arguments: []
        });
    });

    it("parses arguments", () => {
        const result = parseCommand(["echo", "hello", "world"]);

        assert.deepEqual(result, {
            command: "echo",
            options: [],
            arguments: ["hello", "world"]
        });
    });

    it("parses short options", () => {
        const result = parseCommand(["ls", "-a", "-l"]);

        assert.deepEqual(result, {
            command: "ls",
            options: ["-a", "-l"],
            arguments: []
        });
    });

    it("preserves combined short options as a single token", () => {
        const result = parseCommand(["ls", "-la"]);

        assert.deepEqual(result, {
            command: "ls",
            options: ["-la"],
            arguments: []
        });
    });

    it("parses long options", () => {
        const result = parseCommand(["ls", "--all", "--human-readable"]);

        assert.deepEqual(result, {
            command: "ls",
            options: ["--all", "--human-readable"],
            arguments: []
        });
    });

    it("parses options and arguments together", () => {
        const result = parseCommand([
            "ls",
            "-la",
            "--human-readable",
            "/projects"
        ]);

        assert.deepEqual(result, {
            command: "ls",
            options: ["-la", "--human-readable"],
            arguments: ["/projects"]
        });
    });

    it("preserves the order of options and arguments", () => {
        const result = parseCommand([
            "command",
            "-a",
            "first",
            "--long",
            "second",
            "-b"
        ]);

        assert.deepEqual(result, {
            command: "command",
            options: ["-a", "--long", "-b"],
            arguments: ["first", "second"]
        });
    });

    it("treats -- as the end of option parsing", () => {
        const result = parseCommand([
            "cat",
            "--",
            "-file.txt",
            "--strange"
        ]);

        assert.deepEqual(result, {
            command: "cat",
            options: [],
            arguments: ["-file.txt", "--strange"]
        });
    });

    it("does not include -- in the invocation", () => {
        const result = parseCommand([
            "ls",
            "-l",
            "--",
            "--all",
            "-a"
        ]);

        assert.deepEqual(result, {
            command: "ls",
            options: ["-l"],
            arguments: ["--all", "-a"]
        });
    });

    it("treats all tokens after -- as arguments", () => {
        const result = parseCommand([
            "command",
            "--",
            "-a",
            "--long",
            "text",
            "-xyz"
        ]);

        assert.deepEqual(result, {
            command: "command",
            options: [],
            arguments: ["-a", "--long", "text", "-xyz"]
        });
    });

    it("preserves duplicate options", () => {
        const result = parseCommand([
            "command",
            "-a",
            "-a",
            "--all",
            "--all"
        ]);

        assert.deepEqual(result, {
            command: "command",
            options: ["-a", "-a", "--all", "--all"],
            arguments: []
        });
    });

    it("preserves duplicate arguments", () => {
        const result = parseCommand([
            "echo",
            "hello",
            "hello",
            "world",
            "hello"
        ]);

        assert.deepEqual(result, {
            command: "echo",
            options: [],
            arguments: ["hello", "hello", "world", "hello"]
        });
    });

    it("does not modify the input token list", () => {
        const tokens = [
            "ls",
            "-la",
            "--",
            "-file.txt"
        ];

        const originalTokens = [...tokens];

        parseCommand(tokens);

        assert.deepEqual(tokens, originalTokens);
    });
});