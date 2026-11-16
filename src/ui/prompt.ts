/**
 * Prompt formatters and customization presets.
 */

export interface PromptContext {
    readonly cwd: string;
    readonly basename: string;
    readonly user: string;
    readonly host: string;
}

export type PromptStyle = "classic" | "robbyrussell" | "minimal";

export type PromptFormatter = (ctx: PromptContext) => string;

export function formatClassicPrompt(ctx: PromptContext): string {
    if (!ctx || typeof ctx.cwd !== "string") {
        throw new TypeError("Invalid prompt context.");
    }
    return `${ctx.user}@${ctx.host}:${ctx.cwd}$ `;
}

export function formatRobbyrussellPrompt(ctx: PromptContext): string {
    if (!ctx || typeof ctx.basename !== "string") {
        throw new TypeError("Invalid prompt context.");
    }
    const name = ctx.basename.length === 0 ? "~" : ctx.basename;
    return `➜  ${name} `;
}

export function formatMinimalPrompt(ctx: PromptContext): string {
    if (!ctx || typeof ctx.basename !== "string") {
        throw new TypeError("Invalid prompt context.");
    }
    const name = ctx.basename.length === 0 ? "~" : ctx.basename;
    return `${name} ❯ `;
}

const BUILTIN_FORMATTERS: ReadonlyMap<PromptStyle, PromptFormatter> = new Map([
    ["classic", formatClassicPrompt],
    ["robbyrussell", formatRobbyrussellPrompt],
    ["minimal", formatMinimalPrompt],
]);

export function resolvePrompt(
    formatterOrStyle: PromptStyle | PromptFormatter | undefined,
    ctx: PromptContext
): string {
    if (!ctx || typeof ctx.cwd !== "string") {
        throw new TypeError("Invalid prompt context.");
    }

    if (typeof formatterOrStyle === "function") {
        return formatterOrStyle(ctx);
    }

    const key: PromptStyle = formatterOrStyle ?? "classic";
    const formatter = BUILTIN_FORMATTERS.get(key) ?? formatClassicPrompt;
    return formatter(ctx);
}
