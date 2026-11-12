/**
 * Registration for default built-in commands.
 */

import type { CommandRegistry } from "../registry.js";
import { pwdCommand } from "./pwd.js";
import { echoCommand } from "./echo.js";
import { cdCommand } from "./cd.js";
import { lsCommand } from "./ls.js";
import { catCommand } from "./cat.js";

/**
 * Registers all core built-in commands into the provided registry.
 *
 * @param registry - The target CommandRegistry.
 */
export function registerBuiltinCommands(registry: CommandRegistry): void {
    if (typeof registry !== "object" || registry === null) {
        throw new TypeError("Registry must be a valid CommandRegistry object.");
    }

    registry.register("pwd", pwdCommand);
    registry.register("echo", echoCommand);
    registry.register("cd", cdCommand);
    registry.register("ls", lsCommand);
    registry.register("cat", catCommand);
}


