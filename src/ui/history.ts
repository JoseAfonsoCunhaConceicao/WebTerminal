/**
 * Terminal command line history navigator.
 */

export interface HistoryTracker {
    index: number;
    draft: string;
}

export interface HistoryNavigationResult {
    readonly input: string;
    readonly cursor: number;
}

export function navigateHistoryState(
    history: readonly string[],
    tracker: HistoryTracker,
    currentInput: string,
    direction: "up" | "down"
): HistoryNavigationResult {
    if (!Array.isArray(history) || !tracker) {
        throw new TypeError("History and tracker must be valid.");
    }

    const total = history.length;
    if (total === 0) {
        return { input: currentInput, cursor: currentInput.length };
    }

    if (direction === "up") {
        if (tracker.index === -1) {
            tracker.draft = currentInput;
            tracker.index = total - 1;
        } else if (tracker.index > 0) {
            tracker.index--;
        }
        const text = history[tracker.index]!;
        return { input: text, cursor: text.length };
    }

    if (tracker.index !== -1) {
        if (tracker.index < total - 1) {
            tracker.index++;
            const text = history[tracker.index]!;
            return { input: text, cursor: text.length };
        }
        tracker.index = -1;
        return { input: tracker.draft, cursor: tracker.draft.length };
    }

    return { input: currentInput, cursor: currentInput.length };
}

