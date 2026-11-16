import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    formatClassicPrompt,
    formatRobbyrussellPrompt,
    formatMinimalPrompt,
    resolvePrompt,
    type PromptContext,
} from "../../src/ui/prompt.js";

describe("Prompt System", () => {
    const sampleContext: PromptContext = {
        cwd: "/home/user/WebTerminal",
        basename: "WebTerminal",
        user: "developer",
        host: "macbook",
    };

    it("formats classic Unix prompt correctly", () => {
        const text = formatClassicPrompt(sampleContext);
        assert.equal(text, "developer@macbook:/home/user/WebTerminal$ ");
    });

    it("formats robbyrussell (Oh-My-Zsh / Ghostty) prompt cleanly without git", () => {
        const text = formatRobbyrussellPrompt(sampleContext);
        assert.equal(text, "➜  WebTerminal ");
    });

    it("formats minimal prompt correctly", () => {
        const text = formatMinimalPrompt(sampleContext);
        assert.equal(text, "WebTerminal ❯ ");
    });

    it("resolves prompt using preset strings and fallback", () => {
        const classic = resolvePrompt("classic", sampleContext);
        assert.equal(classic, "developer@macbook:/home/user/WebTerminal$ ");

        const robby = resolvePrompt("robbyrussell", sampleContext);
        assert.equal(robby, "➜  WebTerminal ");

        const minimal = resolvePrompt("minimal", sampleContext);
        assert.equal(minimal, "WebTerminal ❯ ");

        const defaultPrompt = resolvePrompt(undefined, sampleContext);
        assert.equal(defaultPrompt, "developer@macbook:/home/user/WebTerminal$ ");
    });

    it("resolves prompt using custom formatter function", () => {
        const custom = resolvePrompt(
            (ctx) => `[${ctx.user}] ${ctx.basename} # `,
            sampleContext
        );
        assert.equal(custom, "[developer] WebTerminal # ");
    });

    it("throws on invalid context arguments", () => {
        assert.throws(() => formatClassicPrompt(null as never), TypeError);
        assert.throws(() => formatRobbyrussellPrompt(null as never), TypeError);
        assert.throws(() => formatMinimalPrompt(null as never), TypeError);
        assert.throws(() => resolvePrompt("classic", null as never), TypeError);
    });
});
