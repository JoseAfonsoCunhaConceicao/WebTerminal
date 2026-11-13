/**
 * Test suite for the universal tab completion engine.
 */

import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    WebTerminal,
    computeCompletion,
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
                content: "sample",
            },
            {
                name: "projects",
                kind: "directory",
                children: [
                    { name: "readme.md", kind: "file", content: "read" },
                    { name: "script.sh", kind: "file", content: "echo 1" },
                ],
            },
        ],
    };
}

describe("computeCompletion", () => {
    it("completes unique command names with a trailing space", () => {
        const terminal = new WebTerminal({ root: createVFS() });
        const res = computeCompletion("pw", 2, terminal);

        assert.equal(res.completedInput, "pwd ");
        assert.equal(res.newCursorIndex, 4);
        assert.deepEqual(res.candidates, ["pwd"]);
    });

    it("completes common prefix for multiple matching commands", () => {
        const terminal = new WebTerminal({ root: createVFS() });
        const res = computeCompletion("c", 1, terminal);

        // cd, cat, clear share 'c'
        assert.ok(res.candidates.includes("cd"));
        assert.ok(res.candidates.includes("cat"));
        assert.ok(res.candidates.includes("clear"));
        assert.equal(res.completedInput, "c");
    });

    it("completes file names in current working directory", () => {
        const terminal = new WebTerminal({ root: createVFS() });
        const res = computeCompletion("cat not", 7, terminal);

        assert.equal(res.completedInput, "cat notes.txt ");
        assert.equal(res.newCursorIndex, 14);
        assert.deepEqual(res.candidates, ["notes.txt "]);
    });

    it("completes directory names with trailing slash", () => {
        const terminal = new WebTerminal({ root: createVFS() });
        const res = computeCompletion("cd pro", 6, terminal);

        assert.equal(res.completedInput, "cd projects/");
        assert.equal(res.newCursorIndex, 12);
        assert.deepEqual(res.candidates, ["projects/"]);
    });

    it("completes paths nested inside subdirectories", () => {
        const terminal = new WebTerminal({ root: createVFS() });
        const res = computeCompletion("cat projects/rea", 16, terminal);

        assert.equal(res.completedInput, "cat projects/readme.md ");
        assert.equal(res.newCursorIndex, 23);
    });

    it("returns original input when there are no matching candidates", () => {
        const terminal = new WebTerminal({ root: createVFS() });
        const res = computeCompletion("nonexistent", 11, terminal);

        assert.equal(res.completedInput, "nonexistent");
        assert.equal(res.candidates.length, 0);
    });
});

