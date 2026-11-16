import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
    getTheme,
    listThemes,
    applyTheme,
    THEME_GHOSTTY,
    THEME_DRACULA,
    type TerminalTheme,
} from "../../src/ui/theme.js";

describe("Theme System", () => {
    it("lists all built-in themes", () => {
        const themes = listThemes();
        assert.ok(themes.length >= 4);
        const ids = themes.map((t) => t.id);
        assert.ok(ids.includes("ghostty"));
        assert.ok(ids.includes("github-dark"));
        assert.ok(ids.includes("dracula"));
        assert.ok(ids.includes("monokai"));
    });

    it("retrieves themes by id case-insensitively", () => {
        const ghostty = getTheme("Ghostty");
        assert.ok(ghostty);
        assert.equal(ghostty.id, "ghostty");
        assert.equal(ghostty.colors.bg, THEME_GHOSTTY.colors.bg);

        const dracula = getTheme("DRACULA");
        assert.ok(dracula);
        assert.equal(dracula.id, "dracula");
        assert.equal(dracula.colors.bg, THEME_DRACULA.colors.bg);
    });

    it("returns undefined for unknown theme or empty string", () => {
        assert.equal(getTheme("unknown-theme"), undefined);
        assert.equal(getTheme(""), undefined);
    });

    it("throws on invalid id type", () => {
        assert.throws(() => getTheme(null as never), TypeError);
    });

    it("applies theme css variables to a DOM element", () => {
        const properties: Record<string, string> = {};
        const mockElement = {
            style: {
                setProperty(key: string, val: string) {
                    properties[key] = val;
                },
            },
        } as unknown as HTMLElement;

        applyTheme(mockElement, THEME_GHOSTTY);
        assert.equal(properties["--wt-bg"], THEME_GHOSTTY.colors.bg);
        assert.equal(properties["--wt-fg"], THEME_GHOSTTY.colors.fg);
        assert.equal(properties["--wt-cursor-color"], THEME_GHOSTTY.colors.cursor);
        assert.equal(properties["--wt-prompt-color"], THEME_GHOSTTY.colors.prompt);
        assert.equal(properties["--wt-pager-border"], THEME_GHOSTTY.chrome?.border);
    });

    it("throws on invalid applyTheme arguments", () => {
        assert.throws(() => applyTheme(null as never, THEME_GHOSTTY), TypeError);
        assert.throws(() => applyTheme({} as HTMLElement, null as never), TypeError);
    });
});

