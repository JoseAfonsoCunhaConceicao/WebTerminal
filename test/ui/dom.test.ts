/**
 * Test suite for mountTerminal and DOM adapters.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    WebTerminal,
    TerminalController,
    mountTerminal,
    injectTerminalStyles,
    TERMINAL_CSS,
} from "../../src/index.js";

describe("mountTerminal", () => {
    it("throws TypeError if container is not a valid HTMLElement", () => {
        const terminal = new WebTerminal({ root: { name: "", kind: "directory", children: [] } });
        const controller = new TerminalController({ terminal });

        assert.throws(() => mountTerminal(null as never, controller), {
            name: "TypeError",
            message: /Container must be a valid HTMLElement/,
        });
        assert.throws(() => mountTerminal({} as never, controller), {
            name: "TypeError",
        });
    });

    it("throws TypeError if controller is not a valid TerminalController", () => {
        const mockContainer = {
            appendChild: () => {},
            ownerDocument: null,
        };

        assert.throws(() => mountTerminal(mockContainer as never, null as never), {
            name: "TypeError",
            message: /Controller must be a valid TerminalController instance/,
        });
    });

    it("injects terminal CSS styles into provided document", () => {
        let appendedChild: { id: string; textContent: string } | null = null;
        const mockDoc = {
            head: {
                appendChild: (el: { id: string; textContent: string }) => {
                    appendedChild = el;
                },
            },
            getElementById: () => null,
            createElement: () => ({ id: "", textContent: "" }),
        };

        injectTerminalStyles(mockDoc as never);
        const result = appendedChild as { id: string; textContent: string } | null;
        assert.ok(result);
        assert.equal(result.id, "wt-terminal-styles");
        assert.equal(result.textContent, TERMINAL_CSS);
    });
});
