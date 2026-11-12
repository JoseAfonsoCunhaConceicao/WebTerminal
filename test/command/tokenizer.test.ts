import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { tokenize } from "../../src/command/tokenizer.js";

describe("tokenize", () => {
    describe("empty and whitespace inputs", () => {
        it("returns an empty token list for an empty string", () => {
            const result = tokenize("");

            assert.deepEqual(result, {
                success: true,
                tokens: [],
            });
        });

        it("returns an empty token list for whitespace-only input", () => {
            const result = tokenize("   \t   ");

            assert.deepEqual(result, {
                success: true,
                tokens: [],
            });
        });

        it("ignores leading and trailing whitespace", () => {
            const result = tokenize("   pwd   ");

            assert.deepEqual(result, {
                success: true,
                tokens: ["pwd"],
            });
        });

        it("collapses multiple consecutive whitespace characters", () => {
            const result = tokenize("echo   hello \t  world");

            assert.deepEqual(result, {
                success: true,
                tokens: ["echo", "hello", "world"],
            });
        });
    });

    describe("simple unquoted tokens", () => {
        it("tokenizes a single command", () => {
            const result = tokenize("ls");

            assert.deepEqual(result, {
                success: true,
                tokens: ["ls"],
            });
        });

        it("tokenizes command with options and arguments", () => {
            const result = tokenize("ls -la /projects");

            assert.deepEqual(result, {
                success: true,
                tokens: ["ls", "-la", "/projects"],
            });
        });

        it("preserves unquoted escape characters", () => {
            const result = tokenize("cat file\\ name.txt");

            assert.deepEqual(result, {
                success: true,
                tokens: ["cat", "file name.txt"],
            });
        });

        it("preserves escaped backslash in unquoted context", () => {
            const result = tokenize("echo \\\\");

            assert.deepEqual(result, {
                success: true,
                tokens: ["echo", "\\"],
            });
        });
    });

    describe("single-quoted tokens", () => {
        it("preserves spaces inside single quotes", () => {
            const result = tokenize("echo 'hello world'");

            assert.deepEqual(result, {
                success: true,
                tokens: ["echo", "hello world"],
            });
        });

        it("treats backslashes as literal inside single quotes", () => {
            const result = tokenize("echo 'a\\b'");

            assert.deepEqual(result, {
                success: true,
                tokens: ["echo", "a\\b"],
            });
        });

        it("preserves empty single-quoted string as empty token", () => {
            const result = tokenize("echo ''");

            assert.deepEqual(result, {
                success: true,
                tokens: ["echo", ""],
            });
        });

        it("tokenizes empty single quotes alone as a single empty token", () => {
            const result = tokenize("''");

            assert.deepEqual(result, {
                success: true,
                tokens: [""],
            });
        });
    });

    describe("double-quoted tokens", () => {
        it("preserves spaces inside double quotes", () => {
            const result = tokenize("echo \"hello world\"");

            assert.deepEqual(result, {
                success: true,
                tokens: ["echo", "hello world"],
            });
        });

        it("escapes quotes inside double quotes", () => {
            const result = tokenize("echo \"hello \\\"world\\\"\"");

            assert.deepEqual(result, {
                success: true,
                tokens: ["echo", "hello \"world\""],
            });
        });

        it("escapes backslashes inside double quotes", () => {
            const result = tokenize("echo \"a\\\\b\"");

            assert.deepEqual(result, {
                success: true,
                tokens: ["echo", "a\\b"],
            });
        });

        it("preserves empty double-quoted string as empty token", () => {
            const result = tokenize("echo \"\"");

            assert.deepEqual(result, {
                success: true,
                tokens: ["echo", ""],
            });
        });
    });

    describe("mixed and adjacent tokens", () => {
        it("concatenates adjacent unquoted and quoted parts", () => {
            const result = tokenize("foo'bar'\"baz\"");

            assert.deepEqual(result, {
                success: true,
                tokens: ["foobarbaz"],
            });
        });

        it("tokenizes parameters with prefix and quotes", () => {
            const result = tokenize("cmd --prefix='val with space'");

            assert.deepEqual(result, {
                success: true,
                tokens: ["cmd", "--prefix=val with space"],
            });
        });
    });

    describe("syntax errors", () => {
        it("reports unterminated single quote with start index", () => {
            const result = tokenize("echo 'hello");

            assert.equal(result.success, false);
            if (!result.success) {
                assert.equal(result.error.code, "UNTERMINATED_SINGLE_QUOTE");
                assert.equal(result.error.index, 5);
            }
        });

        it("reports unterminated double quote with start index", () => {
            const result = tokenize("echo \"hello");

            assert.equal(result.success, false);
            if (!result.success) {
                assert.equal(result.error.code, "UNTERMINATED_DOUBLE_QUOTE");
                assert.equal(result.error.index, 5);
            }
        });

        it("reports trailing escape in unquoted string", () => {
            const result = tokenize("echo \\");

            assert.equal(result.success, false);
            if (!result.success) {
                assert.equal(result.error.code, "TRAILING_ESCAPE");
                assert.equal(result.error.index, 5);
            }
        });

        it("reports trailing escape inside double-quoted string", () => {
            const result = tokenize("echo \"hello \\");

            assert.equal(result.success, false);
            if (!result.success) {
                assert.equal(result.error.code, "TRAILING_ESCAPE");
                assert.equal(result.error.index, 12);
            }
        });
    });

    describe("defensive validation", () => {
        it("throws TypeError if input is not a string", () => {
            assert.throws(() => {
                tokenize(null as unknown as string);
            }, TypeError);
        });

        it("is deterministic on repeated calls", () => {
            const first = tokenize("echo 'hello'");
            const second = tokenize("echo 'hello'");

            assert.deepEqual(first, second);
        });
    });
});

