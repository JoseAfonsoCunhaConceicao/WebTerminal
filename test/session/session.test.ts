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
    });

    describe("setCurrentPath", () => {
        it("should update the current path", () => {
            const session = new Session();
            const newPath = parsePath("/projects");

            session.setCurrentPath(newPath);

            assert.deepStrictEqual(session.getCurrentPath(), newPath);
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