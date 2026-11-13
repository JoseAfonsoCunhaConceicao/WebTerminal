import { describe, it } from "node:test";
import assert from "node:assert/strict";

import { Session } from "../../src/session/session.js";
import { parsePath } from "../../src/vfs/path.js";

describe("Session", () => {
    describe("constructor", () => {
        it("should initialize the current path to root", () => {
            const session = new Session();

            assert.deepStrictEqual(session.getCurrentPath(), parsePath("/"));
        });

        it("should initialize an empty history", () => {
            const session = new Session();

            assert.deepStrictEqual(session.getHistory(), []);
        });

        it("throws TypeError if maxHistoryEntries is not a positive integer", () => {
            assert.throws(() => new Session(0), {
                name: "TypeError",
                message: /maxHistoryEntries must be a positive integer/,
            });
            assert.throws(() => new Session(-5), {
                name: "TypeError",
            });
        });
    });

    describe("setCurrentPath", () => {
        it("should update the current path", () => {
            const session = new Session();
            const newPath = parsePath("/projects");

            session.setCurrentPath(newPath);

            assert.deepStrictEqual(session.getCurrentPath(), newPath);
        });
        it("should store the provided path without modifying it", () => {
            const session = new Session();
            const newPath = parsePath("/projects/webterminal");

            session.setCurrentPath(newPath);

            assert.strictEqual(session.getCurrentPath(), newPath);
        });
    });

    describe("addHistory", () => {
        it("should add a command to the history", () => {
            const session = new Session();

            session.addHistory("pwd");

            assert.deepStrictEqual(session.getHistory(), ["pwd"]);
        });

        it("should preserve the order of commands", () => {
            const session = new Session();

            session.addHistory("pwd");
            session.addHistory("ls");
            session.addHistory("cd projects");

            assert.deepStrictEqual(
                session.getHistory(),
                ["pwd", "ls", "cd projects"],
            );
        });

        it("discards oldest history entries when exceeding capacity", () => {
            const session = new Session(2);

            session.addHistory("cmd1");
            session.addHistory("cmd2");
            session.addHistory("cmd3");

            assert.deepStrictEqual(session.getHistory(), ["cmd2", "cmd3"]);
        });
    });

    describe("reset", () => {
        it("should reset the current path to root", () => {
            const session = new Session();

            session.setCurrentPath(parsePath("/projects"));

            session.reset();

            assert.deepStrictEqual(session.getCurrentPath(), parsePath("/"));
        });

        it("should clear the history", () => {
            const session = new Session();

            session.addHistory("pwd");
            session.addHistory("ls");

            session.reset();

            assert.deepStrictEqual(session.getHistory(), []);
        });

        it("should allow the session to be reused after reset", () => {
            const session = new Session();

            session.setCurrentPath(parsePath("/projects"));
            session.addHistory("pwd");

            session.reset();

            session.setCurrentPath(parsePath("/"));
            session.addHistory("ls");

            assert.deepStrictEqual(session.getCurrentPath(), parsePath("/"));
            assert.deepStrictEqual(session.getHistory(), ["ls"]);
        });
    });
});