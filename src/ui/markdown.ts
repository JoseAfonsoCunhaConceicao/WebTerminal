/**
 * Lightweight, dependency-free Markdown renderer for terminal pager display.
 */

function escapeHtml(text: string): string {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function sanitizeHref(url: string): string {
    const clean = url.trim();
    if (clean.startsWith("http://") || clean.startsWith("https://") || clean.startsWith("mailto:") || clean.startsWith("#")) {
        return clean;
    }
    return "#";
}

function formatInlineElements(rawText: string): string {
    let text = rawText;
    text = text.replace(/`([^`]+)`/g, '<code class="wt-md-code">$1</code>');
    text = text.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    text = text.replace(/\*([^*]+)\*/g, "<em>$1</em>");
    text = text.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (_match, label, href) => {
        const safeUrl = sanitizeHref(href);
        return `<a class="wt-md-link" href="${safeUrl}" target="_blank" rel="noopener noreferrer">${label}</a>`;
    });
    return text;
}

function renderBlockLine(escapedLine: string): string {
    if (escapedLine.startsWith("### ")) {
        return `<h3 class="wt-md-h3">${formatInlineElements(escapedLine.slice(4))}</h3>`;
    }
    if (escapedLine.startsWith("## ")) {
        return `<h2 class="wt-md-h2">${formatInlineElements(escapedLine.slice(3))}</h2>`;
    }
    if (escapedLine.startsWith("# ")) {
        return `<h1 class="wt-md-h1">${formatInlineElements(escapedLine.slice(2))}</h1>`;
    }
    if (escapedLine.startsWith("&gt; ") || escapedLine.startsWith("> ")) {
        const quoteText = escapedLine.replace(/^(&gt;|>)\s+/, "");
        return `<blockquote class="wt-md-quote">${formatInlineElements(quoteText)}</blockquote>`;
    }
    if (/^[-*]\s+/.test(escapedLine)) {
        return `<li class="wt-md-li">${formatInlineElements(escapedLine.replace(/^[-*]\s+/, ""))}</li>`;
    }
    if (/^\d+\.\s+/.test(escapedLine)) {
        return `<li class="wt-md-li wt-md-oli">${formatInlineElements(escapedLine.replace(/^\d+\.\s+/, ""))}</li>`;
    }
    if (/^---+$/.test(escapedLine.trim())) {
        return '<hr class="wt-md-hr">';
    }
    if (escapedLine.trim().length === 0) {
        return '<div class="wt-md-empty"></div>';
    }
    return `<p class="wt-md-p">${formatInlineElements(escapedLine)}</p>`;
}

/**
 * Renders a Markdown string into formatted safe HTML.
 *
 * @param markdown - Raw Markdown source string.
 * @returns Safe HTML string suitable for rendering inside the terminal pager.
 */
export function renderMarkdown(markdown: string): string {
    if (typeof markdown !== "string") {
        throw new TypeError("Markdown input must be a string.");
    }

    const lines = markdown.split("\n");
    const count = lines.length;
    const output: string[] = [];
    let inCodeBlock = false;
    let codeBuffer: string[] = [];

    for (let idx = 0; idx < count; idx++) {
        const line = lines[idx]!;
        if (line.trim().startsWith("```")) {
            if (inCodeBlock) {
                output.push(`<pre class="wt-md-pre"><code>${codeBuffer.join("\n")}</code></pre>`);
                codeBuffer = [];
                inCodeBlock = false;
            } else {
                inCodeBlock = true;
            }
            continue;
        }

        if (inCodeBlock) {
            codeBuffer.push(escapeHtml(line));
            continue;
        }

        output.push(renderBlockLine(escapeHtml(line)));
    }

    if (inCodeBlock && codeBuffer.length > 0) {
        output.push(`<pre class="wt-md-pre"><code>${codeBuffer.join("\n")}</code></pre>`);
    }

    return output.join("\n");
}
