import { describe, it } from "node:test";
import assert from "node:assert/strict";

import type { Directory } from "../../src/vfs/node.js";
import { Session } from "../../src/session/session.js";
import type { ExecutionContext } from "../../src/command/context.js";
import { openCommand } from "../../src/command/builtins/open.js";
import { createCommandRegistry } from "../../src/command/registry.js";
import { registerBuiltinCommands } from "../../src/command/builtins/index.js";
import { executeLine } from "../../src/command/executor.js";

function createTestVFS(): Directory {
    return {
        name: "",
        kind: "directory",
        children: [
            {
                name: "about.txt",
                kind: "file",
                content: "Author: José\nTitle: WebTerminal",
            },
            {
                name: "script.ts",
                kind: "file",
                content: "const a: number = 10;",
            },
            {
                name: "photo.jpg",
                kind: "file",
                content: "imagedata",
            },
            {
                name: "music.mp3",
                kind: "file",
                content: "audiodata",
            },
            {
                name: "clip.mp4",
                kind: "file",
                content: "videodata",
            },
            {
                name: "document.pdf",
                kind: "file",
                content: "pdfcontent",
            },
            {
                name: "archive.zip",
                kind: "file",
                content: "zipdata",
            },
            {
                name: "github.url",
                kind: "file",
                content: "https://github.com/joseconceicao",
            },
            {
                name: "program.bin",
                kind: "file",
                content: "binarydata",
            },
            {
                name: "docs",
                kind: "directory",
                children: [
                    {
                        name: "guide.md",
                        kind: "file",
                        content: "# Guide\nDetailed guide.",
                    },
                ],
            },
        ],
    };
}

describe("open command", () => {
    it("throws TypeError when arguments are invalid", () => {
        assert.throws(() => openCommand(null as never, {} as never), {
            name: "TypeError",
        });
    });

    it("returns error when missing file operand", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = openCommand(
            { command: "open", options: [], arguments: [] },
            context
        );
        assert.equal(result.exitCode, 1);
        assert.equal(result.error, "open: missing file operand");
    });

    it("returns error when target file does not exist", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = openCommand(
            { command: "open", options: [], arguments: ["not_found.txt"] },
            context
        );
        assert.equal(result.exitCode, 1);
        assert.equal(result.error, "open: 'not_found.txt': No such file or directory");
    });

    it("returns error when target is a directory", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = openCommand(
            { command: "open", options: [], arguments: ["docs"] },
            context
        );
        assert.equal(result.exitCode, 1);
        assert.equal(result.error, "open: 'docs': Is a directory");
    });

    it("returns error when target is an unsupported file", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const result = openCommand(
            { command: "open", options: [], arguments: ["program.bin"] },
            context
        );
        assert.equal(result.exitCode, 1);
        assert.equal(result.error, "open: 'program.bin': Unsupported file format.");
    });

    it("handles text, code, and markdown files for terminal pager", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const resTxt = openCommand(
            { command: "open", options: [], arguments: ["about.txt"] },
            context
        );
        assert.equal(resTxt.exitCode, 0);
        assert.match(resTxt.output, /Opening 'about\.txt' in terminal pager/);

        const resCode = openCommand(
            { command: "open", options: [], arguments: ["script.ts"] },
            context
        );
        assert.equal(resCode.exitCode, 0);
        assert.match(resCode.output, /Opening code file 'script\.ts' in terminal pager/);

        const resMd = openCommand(
            { command: "open", options: [], arguments: ["docs/guide.md"] },
            context
        );
        assert.equal(resMd.exitCode, 0);
        assert.match(resMd.output, /rendered markdown/);
    });

    it("handles media, PDF, ZIP, and link files", () => {
        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const resImg = openCommand(
            { command: "open", options: [], arguments: ["photo.jpg"] },
            context
        );
        assert.equal(resImg.exitCode, 0);
        assert.match(resImg.output, /Opening image 'photo\.jpg' in a new tab/);

        const resAud = openCommand(
            { command: "open", options: [], arguments: ["music.mp3"] },
            context
        );
        assert.equal(resAud.exitCode, 0);
        assert.match(resAud.output, /Opening audio 'music\.mp3' in a new tab/);

        const resVid = openCommand(
            { command: "open", options: [], arguments: ["clip.mp4"] },
            context
        );
        assert.equal(resVid.exitCode, 0);
        assert.match(resVid.output, /Opening video 'clip\.mp4' in a new tab/);

        const resPdf = openCommand(
            { command: "open", options: [], arguments: ["document.pdf"] },
            context
        );
        assert.equal(resPdf.exitCode, 0);
        assert.match(resPdf.output, /Opening 'document\.pdf' in a new tab/);

        const resZip = openCommand(
            { command: "open", options: [], arguments: ["archive.zip"] },
            context
        );
        assert.equal(resZip.exitCode, 0);
        assert.match(resZip.output, /Downloading 'archive\.zip'/);

        const resLink = openCommand(
            { command: "open", options: [], arguments: ["github.url"] },
            context
        );
        assert.equal(resLink.exitCode, 0);
        assert.match(resLink.output, /Opening link in a new tab/);
    });

    it("opens direct URLs and integrates with executeLine and view alias", () => {
        const registry = createCommandRegistry();
        registerBuiltinCommands(registry);

        const context: ExecutionContext = {
            root: createTestVFS(),
            session: new Session(),
        };

        const resDirect = executeLine("open https://google.com", context, registry);
        assert.equal(resDirect.exitCode, 0);
        assert.match(resDirect.output, /Opening link in a new tab: https:\/\/google\.com/);

        const resView = executeLine("view docs/guide.md", context, registry);
        assert.equal(resView.exitCode, 0);
        assert.match(resView.output, /guide\.md/);
    });
});
