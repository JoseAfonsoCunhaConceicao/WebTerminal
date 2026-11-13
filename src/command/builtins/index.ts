/**
 * Registration for default built-in commands.
 */

import type { CommandRegistry } from "../registry.js";
import { pwdCommand } from "./pwd.js";
import { echoCommand } from "./echo.js";
import { cdCommand } from "./cd.js";
import { lsCommand } from "./ls.js";
import { catCommand } from "./cat.js";
import { clearCommand } from "./clear.js";
import { resetCommand } from "./reset.js";
import { historyCommand } from "./history.js";
import { helpCommand } from "./help.js";
import { whoamiCommand } from "./whoami.js";
import { manCommand } from "./man.js";
import { aproposCommand } from "./apropos.js";

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
    registry.register("clear", clearCommand);
    registry.register("reset", resetCommand);
    registry.register("history", historyCommand);
    registry.register("help", helpCommand);
    registry.register("whoami", whoamiCommand);
    registry.register("man", manCommand);
    registry.register("apropos", aproposCommand);
}
