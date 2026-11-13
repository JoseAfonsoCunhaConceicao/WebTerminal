/**
 * Keyboard action dispatcher for the universal terminal controller.
 */

import type { TerminalController } from "./controller.js";

/**
 * Dispatches modifier key combinations (e.g., Ctrl+C, Ctrl+L).
 */
function handleCtrlKey(controller: TerminalController, key: string): boolean {
    if (key === "c" || key === "C") {
        controller.abort();
        return true;
    }
    if (key === "l" || key === "L") {
        controller.clear();
        return true;
    }
    return false;
}

/**
 * Dispatches standard terminal keyboard events to controller operations.
 *
 * @param controller - The target TerminalController.
 * @param key - Key value from the keyboard event.
 * @param ctrlKey - Whether the Control modifier was active.
 *
 * @returns True if the key was consumed by the controller; false otherwise.
 */
export function dispatchKeyEvent(
    controller: TerminalController,
    key: string,
    ctrlKey = false
): boolean {
    if (typeof controller !== "object" || controller === null) {
        throw new TypeError("Controller must be a valid TerminalController instance.");
    }
    if (typeof key !== "string") {
        throw new TypeError("Key must be a string.");
    }

    if (ctrlKey) {
        return handleCtrlKey(controller, key);
    }

    switch (key) {
        case "Enter":
            controller.submit();
            return true;
        case "Backspace":
            controller.deleteBackward();
            return true;
        case "Delete":
            controller.deleteForward();
            return true;
        case "ArrowUp":
            controller.navigateHistory("up");
            return true;
        case "ArrowDown":
            controller.navigateHistory("down");
            return true;
        case "ArrowLeft":
            controller.setCursorIndex(controller.getCursorIndex() - 1);
            return true;
        case "ArrowRight":
            controller.setCursorIndex(controller.getCursorIndex() + 1);
            return true;
        case "Tab":
            controller.tabComplete();
            return true;
        case "Home":
            controller.setCursorIndex(0);
            return true;
        case "End":
            controller.setCursorIndex(controller.getInput().length);
            return true;
        case "Escape":
            controller.closeModal();
            return true;
        default:
            if (key.length === 1) {
                controller.insertText(key);
                return true;
            }
            return false;
    }
}

