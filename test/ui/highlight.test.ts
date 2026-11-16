import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { highlightCode, getLanguageConfig } from "../../src/ui/highlight/index.js";

describe("Syntax Highlighter (IDE Pager)", () => {
    it("throws on invalid arguments", () => {
        assert.throws(() => highlightCode(null as never, "file.ts"), TypeError);
        assert.throws(() => highlightCode("code", null as never), TypeError);
    });

    it("highlights TypeScript keywords, types, functions, strings, and numbers", () => {
        const code = 'const count: number = 42;\nfunction run(): void {\n    console.log("ready");\n}';
        const html = highlightCode(code, "index.ts");

        assert.match(html, /<span class="wt-syn-keyword">const<\/span>/);
        assert.match(html, /<span class="wt-syn-type">number<\/span>/);
        assert.match(html, /<span class="wt-syn-number">42<\/span>/);
        assert.match(html, /<span class="wt-syn-fn">run<\/span>/);
        assert.match(html, /<span class="wt-syn-string">"ready"<\/span>/);
        assert.match(html, /<span class="wt-code-num"[^>]*>\s*1<\/span>/);
        assert.match(html, /<span class="wt-code-num"[^>]*>\s*4<\/span>/);
    });

    it("does not match keywords inside strings (literal masking)", () => {
        const code = 'const message = "for while let const if";';
        const html = highlightCode(code, "script.js");

        assert.match(html, /<span class="wt-syn-keyword">const<\/span>/);
        assert.match(html, /<span class="wt-syn-string">"for while let const if"<\/span>/);
        assert.doesNotMatch(html, /<span class="wt-syn-keyword">while<\/span>/);
    });

    it("highlights Python comments and keywords", () => {
        const py = "# System check\ndef execute():\n    return 100";
        const html = highlightCode(py, "test.py");

        assert.match(html, /<span class="wt-syn-comment"># System check<\/span>/);
        assert.match(html, /<span class="wt-syn-keyword">def<\/span>/);
        assert.match(html, /<span class="wt-syn-keyword">return<\/span>/);
        assert.match(html, /<span class="wt-syn-number">100<\/span>/);
    });

    it("highlights SQL with case-insensitivity and -- comments", () => {
        const sql = "-- Query\nSELECT id, name FROM users WHERE id = 1;";
        const html = highlightCode(sql, "query.sql");

        assert.match(html, /<span class="wt-syn-comment">-- Query<\/span>/);
        assert.match(html, /<span class="wt-syn-keyword">SELECT<\/span>/);
        assert.match(html, /<span class="wt-syn-keyword">FROM<\/span>/);
        assert.match(html, /<span class="wt-syn-keyword">WHERE<\/span>/);
    });

    it("highlights HTML tags and block comments", () => {
        const htmlCode = "<!-- Header -->\n<div class=\"container\"><span>Text</span></div>";
        const html = highlightCode(htmlCode, "index.html");

        assert.match(html, /<span class="wt-syn-comment">&lt;!-- Header --&gt;<\/span>/);
        assert.match(html, /<span class="wt-syn-keyword">div<\/span>/);
        assert.match(html, /<span class="wt-syn-type">class<\/span>/);
    });

    it("highlights Assembly instructions and register types", () => {
        const asm = "; entry\nmov eax, 1\nret";
        const html = highlightCode(asm, "boot.asm");

        assert.match(html, /<span class="wt-syn-comment">; entry<\/span>/);
        assert.match(html, /<span class="wt-syn-keyword">mov<\/span>/);
        assert.match(html, /<span class="wt-syn-type">eax<\/span>/);
        assert.match(html, /<span class="wt-syn-keyword">ret<\/span>/);
    });

    it("highlights Lua and Prolog code", () => {
        const lua = "-- lua comment\nfunction test()\n    return nil\nend";
        const luaHtml = highlightCode(lua, "script.lua");
        assert.match(luaHtml, /<span class="wt-syn-comment">-- lua comment<\/span>/);
        assert.match(luaHtml, /<span class="wt-syn-keyword">nil<\/span>/);

        const prolog = "% prolog rule\nmortal(X) :- man(X).";
        const prologHtml = highlightCode(prolog, "logic.pl");
        assert.match(prologHtml, /<span class="wt-syn-comment">% prolog rule<\/span>/);
    });

    it("generates gutter row count matching newline count", () => {
        const multiline = "line1\nline2\nline3\nline4\nline5";
        const html = highlightCode(multiline, "lines.txt");
        const rows = (html.match(/class="wt-code-row"/g) || []).length;
        assert.equal(rows, 5);
    });

    it("provides language configuration correctly", () => {
        const pyConfig = getLanguageConfig("py");
        assert.equal(pyConfig.lineComment, "#");

        const sqlConfig = getLanguageConfig("sql");
        assert.equal(sqlConfig.lineComment, "--");
        assert.equal(sqlConfig.caseInsensitive, true);

        assert.throws(() => getLanguageConfig(null as never), TypeError);
    });
});
