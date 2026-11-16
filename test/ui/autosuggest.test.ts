import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeSuggestion, acceptSuggestion } from "../../src/ui/autosuggest.js";

describe("History Autosuggestion Engine", () => {
    it("returns empty string for empty input or empty history", () => {
        assert.equal(computeSuggestion("", ["npm run demo"]), "");
        assert.equal(computeSuggestion("npm", []), "");
    });

    it("returns suffix remainder for prefix match", () => {
        const history = ["ls -la", "npm test", "npm run demo"];
        const suggestion = computeSuggestion("npm", history);
        assert.equal(suggestion, " run demo");
    });

    it("prioritizes the most recent historical command", () => {
        const history = ["git status", "git checkout main", "git commit -m 'test'"];
        const suggestion = computeSuggestion("git c", history);
        assert.equal(suggestion, "ommit -m 'test'");
    });

    it("returns empty string when input matches exactly", () => {
        const history = ["pwd", "clear"];
        assert.equal(computeSuggestion("clear", history), "");
    });

    it("returns empty string when no history item matches prefix", () => {
        const history = ["echo hello", "cat file.txt"];
        assert.equal(computeSuggestion("tree", history), "");
    });

    it("throws on invalid arguments in computeSuggestion", () => {
        assert.throws(() => computeSuggestion(null as never, ["test"]), TypeError);
        assert.throws(() => computeSuggestion("cmd", null as never), TypeError);
    });

    it("accepts suggestion by appending suffix to input", () => {
        const res = acceptSuggestion("git", " checkout main");
        assert.equal(res.input, "git checkout main");
        assert.equal(res.cursor, 17);
    });

    it("throws on invalid arguments in acceptSuggestion", () => {
        assert.throws(() => acceptSuggestion(null as never, "suffix"), TypeError);
        assert.throws(() => acceptSuggestion("prefix", null as never), TypeError);
    });
});

