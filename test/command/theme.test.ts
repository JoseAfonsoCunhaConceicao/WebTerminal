import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { themeCommand } from "../../src/command/builtins/theme.js";
import type { CommandInvocation } from "../../src/command/invocation.js";
import type { ExecutionContext } from "../../src/command/context.js";

describe("theme built-in command", () => {
    const mockContext = {} as ExecutionContext;

    it("lists available themes when invoked without arguments", () => {
        const invocation: CommandInvocation = {
            command: "theme",
            arguments: [],
            options: [],
        };
        const res = themeCommand(invocation, mockContext);
        assert.equal(res.exitCode, 0);
        assert.match(res.output, /Available Themes:/);
        assert.match(res.output, /ghostty/);
        assert.match(res.output, /dracula/);
    });

    it("lists available themes when invoked with -l or --list flag", () => {
        const resShort = themeCommand({
            command: "theme",
            arguments: [],
            options: ["-l"],
        }, mockContext);
        assert.equal(resShort.exitCode, 0);
        assert.match(resShort.output, /Available Themes:/);

        const resLong = themeCommand({
            command: "theme",
            arguments: [],
            options: ["--list"],
        }, mockContext);
        assert.equal(resLong.exitCode, 0);
        assert.match(resLong.output, /Available Themes:/);

        const resSubcommand = themeCommand({
            command: "theme",
            arguments: ["list"],
            options: [],
        }, mockContext);
        assert.equal(resSubcommand.exitCode, 0);
        assert.match(resSubcommand.output, /Available Themes:/);
    });

    it("switches theme by name", () => {
        const invocation: CommandInvocation = {
            command: "theme",
            arguments: ["ghostty"],
            options: [],
        };
        const res = themeCommand(invocation, mockContext);
        assert.equal(res.exitCode, 0);
        assert.match(res.output, /Theme switched to Ghostty Dark/);
    });

    it("returns error for unknown theme", () => {
        const invocation: CommandInvocation = {
            command: "theme",
            arguments: ["nonexistent"],
            options: [],
        };
        const res = themeCommand(invocation, mockContext);
        assert.equal(res.exitCode, 1);
        assert.ok(res.error);
        assert.match(res.error, /Theme not found: 'nonexistent'/);
    });

    it("changes cursor style via --cursor option", () => {
        const invocation: CommandInvocation = {
            command: "theme",
            arguments: ["beam"],
            options: ["--cursor"],
        };
        const res = themeCommand(invocation, mockContext);
        assert.equal(res.exitCode, 0);
        assert.match(res.output, /Cursor style changed to 'beam'/);
    });

    it("returns error for unknown cursor style", () => {
        const invocation: CommandInvocation = {
            command: "theme",
            arguments: ["triangle"],
            options: ["--cursor"],
        };
        const res = themeCommand(invocation, mockContext);
        assert.equal(res.exitCode, 1);
        assert.ok(res.error);
        assert.match(res.error, /Unknown cursor style/);
    });

    it("changes prompt style via --prompt option", () => {
        const invocation: CommandInvocation = {
            command: "theme",
            arguments: ["robbyrussell"],
            options: ["--prompt"],
        };
        const res = themeCommand(invocation, mockContext);
        assert.equal(res.exitCode, 0);
        assert.match(res.output, /Prompt style changed to 'robbyrussell'/);
    });

    it("returns error for unknown prompt style", () => {
        const invocation: CommandInvocation = {
            command: "theme",
            arguments: ["weird"],
            options: ["--prompt"],
        };
        const res = themeCommand(invocation, mockContext);
        assert.equal(res.exitCode, 1);
        assert.ok(res.error);
        assert.match(res.error, /Unknown prompt style/);
    });

    it("throws on invalid invocation", () => {
        assert.throws(() => themeCommand(null as never, mockContext), TypeError);
    });
});
