/**
 * Terminal Theming Engine and Presets.
 */

export interface ThemeColors {
    readonly bg: string;
    readonly fg: string;
    readonly cursor: string;
    readonly prompt: string;
    readonly error: string;
    readonly system: string;
    readonly directory: string;
}

export interface ThemeChrome {
    readonly border?: string | undefined;
    readonly headerBg?: string | undefined;
    readonly gutter?: string | undefined;
}

export interface TerminalTheme {
    readonly id: string;
    readonly name: string;
    readonly colors: ThemeColors;
    readonly chrome?: ThemeChrome | undefined;
}

export const THEME_GHOSTTY: TerminalTheme = {
    id: "ghostty",
    name: "Ghostty Dark",
    colors: {
        bg: "#16181d",
        fg: "#d8dee9",
        cursor: "#c0caf5",
        prompt: "#50fa7b",
        error: "#ff5f56",
        system: "#7aa2f7",
        directory: "#56b6c2",
    },
    chrome: {
        border: "#272a34",
        headerBg: "#1f232b",
        gutter: "#4b5263",
    },
};

export const THEME_GITHUB_DARK: TerminalTheme = {
    id: "github-dark",
    name: "GitHub Dark",
    colors: {
        bg: "#0d1117",
        fg: "#c9d1d9",
        cursor: "#58a6ff",
        prompt: "#2ea043",
        error: "#f85149",
        system: "#58a6ff",
        directory: "#58a6ff",
    },
    chrome: {
        border: "#30363d",
        headerBg: "#161b22",
        gutter: "#484f58",
    },
};

export const THEME_DRACULA: TerminalTheme = {
    id: "dracula",
    name: "Dracula",
    colors: {
        bg: "#282a36",
        fg: "#f8f8f2",
        cursor: "#f8f8f2",
        prompt: "#50fa7b",
        error: "#ff5555",
        system: "#bd93f9",
        directory: "#8be9fd",
    },
    chrome: {
        border: "#44475a",
        headerBg: "#21222c",
        gutter: "#6272a4",
    },
};

export const THEME_MONOKAI: TerminalTheme = {
    id: "monokai",
    name: "Monokai Pro",
    colors: {
        bg: "#272822",
        fg: "#f8f8f2",
        cursor: "#f8f8f0",
        prompt: "#a6e22e",
        error: "#f92672",
        system: "#fd971f",
        directory: "#66d9ef",
    },
    chrome: {
        border: "#3e3d32",
        headerBg: "#1e1f1c",
        gutter: "#75715e",
    },
};

const BUILTIN_THEMES: ReadonlyMap<string, TerminalTheme> = new Map([
    [THEME_GHOSTTY.id, THEME_GHOSTTY],
    [THEME_GITHUB_DARK.id, THEME_GITHUB_DARK],
    [THEME_DRACULA.id, THEME_DRACULA],
    [THEME_MONOKAI.id, THEME_MONOKAI],
]);

export function listThemes(): readonly TerminalTheme[] {
    return Array.from(BUILTIN_THEMES.values());
}

export function getTheme(id: string): TerminalTheme | undefined {
    if (typeof id !== "string") {
        throw new TypeError("Theme id must be a string.");
    }
    if (id.length === 0) {
        return undefined;
    }
    return BUILTIN_THEMES.get(id.toLowerCase());
}

export function applyTheme(element: HTMLElement, theme: TerminalTheme): void {
    if (!element || typeof element.style?.setProperty !== "function") {
        throw new TypeError("Target element must be a valid HTMLElement.");
    }
    if (!theme || typeof theme.colors !== "object") {
        throw new TypeError("Theme must be a valid TerminalTheme object.");
    }

    const { colors, chrome } = theme;
    element.style.setProperty("--wt-bg", colors.bg);
    element.style.setProperty("--wt-fg", colors.fg);
    element.style.setProperty("--wt-cursor-color", colors.cursor);
    element.style.setProperty("--wt-prompt-color", colors.prompt);
    element.style.setProperty("--wt-error-color", colors.error);
    element.style.setProperty("--wt-system-color", colors.system);
    element.style.setProperty("--wt-link-color", colors.directory);

    if (chrome?.border) {
        element.style.setProperty("--wt-pager-border", chrome.border);
    }
    if (chrome?.headerBg) {
        element.style.setProperty("--wt-pager-header-bg", chrome.headerBg);
    }
    if (chrome?.gutter) {
        element.style.setProperty("--wt-gutter-color", chrome.gutter);
    }
}

