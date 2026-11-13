import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { renderMarkdown } from "../../src/ui/markdown.js";

describe("renderMarkdown", () => {
    it("throws TypeError if input is not a string", () => {
        assert.throws(() => renderMarkdown(null as never), TypeError);
    });

    it("renders headings with appropriate html classes", () => {
        const md = "# Title\n## Subtitle\n### Section";
        const html = renderMarkdown(md);
        assert.match(html, /<h1 class="wt-md-h1">Title<\/h1>/);
        assert.match(html, /<h2 class="wt-md-h2">Subtitle<\/h2>/);
        assert.match(html, /<h3 class="wt-md-h3">Section<\/h3>/);
    });

    it("escapes raw HTML tags to prevent XSS", () => {
        const md = '<script>alert("xss")</script>';
        const html = renderMarkdown(md);
        assert.doesNotMatch(html, /<script>/);
        assert.match(html, /&lt;script&gt;/);
    });

    it("renders bold, italic, and inline code", () => {
        const md = "This is **bold**, *italic*, and `code`.";
        const html = renderMarkdown(md);
        assert.match(html, /<strong>bold<\/strong>/);
        assert.match(html, /<em>italic<\/em>/);
        assert.match(html, /<code class="wt-md-code">code<\/code>/);
    });

    it("renders code blocks", () => {
        const md = "```\nconst x = 10;\n```";
        const html = renderMarkdown(md);
        assert.match(html, /<pre class="wt-md-pre"><code>const x = 10;<\/code><\/pre>/);
    });

    it("renders blockquotes, lists, and links", () => {
        const md = "> Quote\n- Item 1\n[Home](https://example.com)";
        const html = renderMarkdown(md);
        assert.match(html, /<blockquote class="wt-md-quote">Quote<\/blockquote>/);
        assert.match(html, /<li class="wt-md-li">Item 1<\/li>/);
        assert.match(html, /<a class="wt-md-link" href="https:\/\/example\.com" target="_blank"/);
    });
});

