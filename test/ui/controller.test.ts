/**
 * Test suite for the universal TerminalController.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    WebTerminal,
    TerminalController,
} from "../../src/index.js";
import type { Directory } from "../../src/index.js";

function createVFS(): Directory {
    return {
        name: "",
        kind: "directory",
        children: [
            {
                name: "notes.txt",
                kind: "file",
                content: "sample content",
            },
            {
                name: "projects",
                kind: "directory",
                children: [
                    { name: "readme.md", kind: "file", content: "read me" },
                ],
            },
        ],
    };
}

describe("TerminalController", () => {
    describe("initialization", () => {
        it("throws TypeError if options is invalid", () => {
            assert.throws(() => new TerminalController(null as never), TypeError);
            assert.throws(() => new TerminalController({ terminal: null as never }), TypeError);
        });

        it("initializes default state with custom banner and prompt", () => {
            const terminal = new WebTerminal({ root: createVFS() });
            const controller = new TerminalController({
                terminal,
                user: "alice",
                host: "host1",
                welcomeBanner: "Welcome to terminal",
            });

            const state = controller.getState();
            assert.equal(state.input, "");
            assert.equal(state.cursorIndex, 0);
            assert.equal(state.prompt, "alice@host1:/$ ");
            assert.equal(state.lines.length, 1);
            assert.equal(state.lines[0]?.text, "Welcome to terminal");
            assert.equal(state.lines[0]?.kind, "system");
        });
    });

    describe("buffer editing and cursor control", () => {
        it("inserts text and moves cursor", () => {
            const terminal = new WebTerminal({ root: createVFS() });
            const controller = new TerminalController({ terminal });

            controller.insertText("hello");
            assert.equal(controller.getInput(), "hello");
            assert.equal(controller.getCursorIndex(), 5);

            controller.setCursorIndex(2);
            controller.insertText("X");
            assert.equal(controller.getInput(), "heXllo");
            assert.equal(controller.getCursorIndex(), 3);
        });

        it("deletes backward with backspace", () => {
            const terminal = new WebTerminal({ root: createVFS() });
            const controller = new TerminalController({ terminal });

            controller.insertText("abc");
            controller.deleteBackward();
            assert.equal(controller.getInput(), "ab");
            assert.equal(controller.getCursorIndex(), 2);
        });

        it("deletes forward with delete key", () => {
            const terminal = new WebTerminal({ root: createVFS() });
            const controller = new TerminalController({ terminal });

            controller.insertText("abc");
            controller.setCursorIndex(1);
            controller.deleteForward();
            assert.equal(controller.getInput(), "ac");
            assert.equal(controller.getCursorIndex(), 1);
        });
    });

    describe("command submission and output rendering", () => {
        it("executes command, appends output, and updates prompt on cd", () => {
            const terminal = new WebTerminal({ root: createVFS() });
            const controller = new TerminalController({ terminal, user: "guest", host: "box" });

            controller.insertText("pwd");
            controller.submit();

            const state1 = controller.getState();
            assert.equal(state1.input, "");
            assert.equal(state1.lines.length, 2);
            assert.equal(state1.lines[0]?.text, "pwd");
            assert.equal(state1.lines[1]?.text, "/");

            controller.insertText("cd projects");
            controller.submit();

            const state2 = controller.getState();
            assert.equal(state2.prompt, "guest@box:/projects$ ");
        });

        it("clears screen lines when clear command is executed", () => {
            const terminal = new WebTerminal({ root: createVFS() });
            const controller = new TerminalController({ terminal });

            controller.insertText("echo 1");
            controller.submit();
            assert.ok(controller.getState().lines.length > 0);

            controller.insertText("clear");
            controller.submit();
            assert.equal(controller.getState().lines.length, 0);
        });

        it("aborts line with Ctrl+C", () => {
            const terminal = new WebTerminal({ root: createVFS() });
            const controller = new TerminalController({ terminal });

            controller.insertText("sleep 100");
            controller.abort();

            assert.equal(controller.getInput(), "");
            const lines = controller.getState().lines;
            assert.equal(lines[lines.length - 1]?.text, "sleep 100^C");
        });
    });

    describe("history navigation", () => {
        it("navigates history up and down preserving uncommitted draft", () => {
            const terminal = new WebTerminal({ root: createVFS() });
            const controller = new TerminalController({ terminal });

            controller.insertText("echo first");
            controller.submit();
            controller.insertText("echo second");
            controller.submit();

            controller.insertText("drafting");
            controller.navigateHistory("up");
            assert.equal(controller.getInput(), "echo second");

            controller.navigateHistory("up");
            assert.equal(controller.getInput(), "echo first");

            controller.navigateHistory("down");
            assert.equal(controller.getInput(), "echo second");

            controller.navigateHistory("down");
            assert.equal(controller.getInput(), "drafting");
        });
    });

    describe("keyboard events and subscriptions", () => {
        it("handles standard keyboard events via handleKey", () => {
            const terminal = new WebTerminal({ root: createVFS() });
            const controller = new TerminalController({ terminal });

            controller.handleKey("a");
            controller.handleKey("b");
            assert.equal(controller.getInput(), "ab");

            controller.handleKey("ArrowLeft");
            assert.equal(controller.getCursorIndex(), 1);

            controller.handleKey("Backspace");
            assert.equal(controller.getInput(), "b");

            controller.handleKey("c", true);
            assert.equal(controller.getInput(), "");
        });

        it("notifies subscribers and allows unsubscription", () => {
            const terminal = new WebTerminal({ root: createVFS() });
            const controller = new TerminalController({ terminal });

            let notifications = 0;
            const unsub = controller.subscribe(() => {
                notifications++;
            });

            assert.equal(notifications, 1);
            controller.insertText("x");
            assert.equal(notifications, 2);

            unsub();
            controller.insertText("y");
            assert.equal(notifications, 2);
        });
    });
});

