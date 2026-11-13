import { describe, test, it } from "node:test";
import assert from "node:assert/strict";

import {
  formatPath,
  joinPath,
  normalizePath,
  parsePath,
  resolvePath,
  type Path,
} from "../../src/vfs/path.js";

describe("parsePath", () => {
  test("parses an empty path", () => {
    assert.deepStrictEqual(parsePath(""), {
      components: [],
      isAbsolute: false,
    });
  });

  test("parses the root path", () => {
    assert.deepStrictEqual(parsePath("/"), {
      components: [],
      isAbsolute: true,
    });
  });

  test("parses a single relative component", () => {
    assert.deepStrictEqual(parsePath("home"), {
      components: ["home"],
      isAbsolute: false,
    });
  });

  test("parses a single absolute component", () => {
    assert.deepStrictEqual(parsePath("/home"), {
      components: ["home"],
      isAbsolute: true,
    });
  });

  test("parses multiple relative components", () => {
    assert.deepStrictEqual(parsePath("home/jose/docs"), {
      components: ["home", "jose", "docs"],
      isAbsolute: false,
    });
  });

  test("parses multiple absolute components", () => {
    assert.deepStrictEqual(parsePath("/home/jose/docs"), {
      components: ["home", "jose", "docs"],
      isAbsolute: true,
    });
  });

  test("ignores repeated separators", () => {
    assert.deepStrictEqual(parsePath("/home//jose///docs"), {
      components: ["home", "jose", "docs"],
      isAbsolute: true,
    });
  });

  test("ignores a trailing separator", () => {
    assert.deepStrictEqual(parsePath("/home/jose/"), {
      components: ["home", "jose"],
      isAbsolute: true,
    });
  });

  test("ignores repeated and trailing separators", () => {
    assert.deepStrictEqual(parsePath("//home///jose///"), {
      components: ["home", "jose"],
      isAbsolute: true,
    });
  });

  test("preserves dot components", () => {
    assert.deepStrictEqual(parsePath("./home/./docs"), {
      components: [".", "home", ".", "docs"],
      isAbsolute: false,
    });
  });

  test("preserves parent components", () => {
    assert.deepStrictEqual(parsePath("../home/../docs"), {
      components: ["..", "home", "..", "docs"],
      isAbsolute: false,
    });
  });

  test("preserves special components in absolute paths", () => {
    assert.deepStrictEqual(parsePath("/home/./../docs"), {
      components: ["home", ".", "..", "docs"],
      isAbsolute: true,
    });
  });
});

describe("normalizePath", () => {
  test("normalizes an empty relative path", () => {
    assert.deepStrictEqual(normalizePath(parsePath("")), {
      components: [],
      isAbsolute: false,
    });
  });

  test("normalizes the root path", () => {
    assert.deepStrictEqual(normalizePath(parsePath("/")), {
      components: [],
      isAbsolute: true,
    });
  });

  test("removes current-directory components", () => {
    assert.deepStrictEqual(normalizePath(parsePath("./home/./docs")), {
      components: ["home", "docs"],
      isAbsolute: false,
    });
  });

  test("resolves a parent component", () => {
    assert.deepStrictEqual(normalizePath(parsePath("home/jose/../docs")), {
      components: ["home", "docs"],
      isAbsolute: false,
    });
  });

  test("resolves multiple parent components", () => {
    assert.deepStrictEqual(
      normalizePath(parsePath("home/jose/projects/../../docs")),
      {
        components: ["home", "docs"],
        isAbsolute: false,
      },
    );
  });

  test("preserves unresolved parent components in relative paths", () => {
    assert.deepStrictEqual(normalizePath(parsePath("../../docs")), {
      components: ["..", "..", "docs"],
      isAbsolute: false,
    });
  });

  test("preserves unresolved parent components after normal components are exhausted", () => {
    assert.deepStrictEqual(normalizePath(parsePath("home/../../docs")), {
      components: ["..", "docs"],
      isAbsolute: false,
    });
  });

  test("removes parent components beyond the root of an absolute path", () => {
    assert.deepStrictEqual(normalizePath(parsePath("/../docs")), {
      components: ["docs"],
      isAbsolute: true,
    });
  });

  test("removes multiple parent components beyond the root", () => {
    assert.deepStrictEqual(normalizePath(parsePath("/../../docs")), {
      components: ["docs"],
      isAbsolute: true,
    });
  });

  test("resolves mixed dot and parent components", () => {
    assert.deepStrictEqual(
      normalizePath(parsePath("/home/./jose/../docs/./file")),
      {
        components: ["home", "docs", "file"],
        isAbsolute: true,
      },
    );
  });

  test("preserves the absolute flag", () => {
    const relative = normalizePath(parsePath("home/../docs"));
    const absolute = normalizePath(parsePath("/home/../docs"));

    assert.strictEqual(relative.isAbsolute, false);
    assert.strictEqual(absolute.isAbsolute, true);
  });

  test("does not mutate the input path", () => {
    const input: Path = parsePath("/home/jose/../docs");

    const originalComponents = [...input.components];
    const originalIsAbsolute = input.isAbsolute;

    normalizePath(input);

    assert.deepStrictEqual(input.components, originalComponents);
    assert.strictEqual(input.isAbsolute, originalIsAbsolute);
  });

  test("produces a path without dot components", () => {
    const result = normalizePath(
      parsePath("/home/./jose/../docs/./file"),
    );

    assert.ok(!result.components.includes("."));
  });

  test("produces an absolute path without parent components", () => {
    const result = normalizePath(
      parsePath("/home/../../jose/../docs"),
    );

    assert.ok(!result.components.includes(".."));
  });

  test("is idempotent", () => {
    const input = parsePath("/home/./jose/../docs/./projects/..");

    const once = normalizePath(input);
    const twice = normalizePath(once);

    assert.deepStrictEqual(twice, once);
  });

  test("never produces dot components", () => {
    const inputs = [
      parsePath(""),
      parsePath("."),
      parsePath("./home/./docs"),
      parsePath("home/./jose/../docs/./file"),
      parsePath("/home/./jose/../docs"),
    ];

    for (const input of inputs) {
      const result = normalizePath(input);

      assert.ok(!result.components.includes("."));
    }
  });

  test("never produces parent components in absolute paths", () => {
    const inputs = [
      parsePath("/"),
      parsePath("/.."),
      parsePath("/../home"),
      parsePath("/home/../../docs"),
      parsePath("/home/jose/../../../docs"),
      parsePath("/home/./jose/../../docs"),
    ];

    for (const input of inputs) {
      const result = normalizePath(input);

      assert.strictEqual(result.isAbsolute, true);
      assert.ok(!result.components.includes(".."));
    }
  });

  test("does not mutate the input during repeated normalization", () => {
    const input = parsePath("/home/./jose/../docs/./projects/..");

    const originalComponents = [...input.components];
    const originalIsAbsolute = input.isAbsolute;

    const once = normalizePath(input);
    normalizePath(once);

    assert.deepStrictEqual(input.components, originalComponents);
    assert.strictEqual(input.isAbsolute, originalIsAbsolute);
  });
});

describe("joinPath", () => {
  test("joins an absolute base with a relative path", () => {
    const base = parsePath("/home/jose");
    const path = parsePath("docs/projects");

    assert.deepStrictEqual(joinPath(base, path), {
      components: ["home", "jose", "docs", "projects"],
      isAbsolute: true,
    });
  });

  test("joins an absolute base with an empty relative path", () => {
    const base = parsePath("/home/jose");
    const path = parsePath("");

    assert.deepStrictEqual(joinPath(base, path), {
      components: ["home", "jose"],
      isAbsolute: true,
    });
  });

  test("does not normalize the joined path", () => {
    const base = parsePath("/home/jose");
    const path = parsePath("../docs/./projects");

    assert.deepStrictEqual(joinPath(base, path), {
      components: ["home", "jose", "..", "docs", ".", "projects"],
      isAbsolute: true,
    });
  });

  test("returns an absolute path unchanged", () => {
    const base = parsePath("/home/jose");
    const path = parsePath("/var/log");

    assert.strictEqual(joinPath(base, path), path);
  });

  test("does not mutate the base path", () => {
    const base = parsePath("/home/jose");
    const path = parsePath("docs");

    const originalComponents = [...base.components];

    joinPath(base, path);

    assert.deepStrictEqual(base.components, originalComponents);
  });

  test("does not mutate the relative path", () => {
    const base = parsePath("/home/jose");
    const path = parsePath("docs/projects");

    const originalComponents = [...path.components];

    joinPath(base, path);

    assert.deepStrictEqual(path.components, originalComponents);
  });

  test("creates a new component array when joining relative paths", () => {
    const base = parsePath("/home/jose");
    const path = parsePath("docs");

    const result = joinPath(base, path);

    assert.notStrictEqual(result.components, base.components);
    assert.notStrictEqual(result.components, path.components);
  });

  test("throws TypeError if basePath or path is invalid", () => {
    const valid = parsePath("/home");
    assert.throws(() => joinPath(null as unknown as Path, valid), {
      name: "TypeError",
      message: /BasePath must be a valid Path object/,
    });
    assert.throws(() => joinPath(valid, null as unknown as Path), {
      name: "TypeError",
      message: /Path must be a valid Path object/,
    });
  });
});

describe("path composition", () => {
  test("resolves a simple relative path", () => {
    const base = parsePath("/home/jose");
    const input = parsePath("docs/projects");

    const joined = joinPath(base, input);
    const result = normalizePath(joined);

    assert.deepStrictEqual(result, {
      components: ["home", "jose", "docs", "projects"],
      isAbsolute: true,
    });
  });

  test("resolves current-directory components", () => {
    const base = parsePath("/home/jose");
    const input = parsePath("./docs/./projects");

    const joined = joinPath(base, input);
    const result = normalizePath(joined);

    assert.deepStrictEqual(result, {
      components: ["home", "jose", "docs", "projects"],
      isAbsolute: true,
    });
  });

  test("resolves parent-directory components", () => {
    const base = parsePath("/home/jose");
    const input = parsePath("../docs");

    const joined = joinPath(base, input);
    const result = normalizePath(joined);

    assert.deepStrictEqual(result, {
      components: ["home", "docs"],
      isAbsolute: true,
    });
  });

  test("resolves mixed current and parent-directory components", () => {
    const base = parsePath("/home/jose");
    const input = parsePath(".././docs/../projects");

    const joined = joinPath(base, input);
    const result = normalizePath(joined);

    assert.deepStrictEqual(result, {
      components: ["home", "projects"],
      isAbsolute: true,
    });
  });

  test("preserves an absolute input path during composition", () => {
    const base = parsePath("/home/jose");
    const input = parsePath("/var/log/../tmp");

    const joined = joinPath(base, input);
    const result = normalizePath(joined);

    assert.deepStrictEqual(result, {
      components: ["var", "tmp"],
      isAbsolute: true,
    });
  });

  test("resolves multiple parent-directory components", () => {
    const base = parsePath("/home/jose/projects");
    const input = parsePath("../../docs");

    const joined = joinPath(base, input);
    const result = normalizePath(joined);

    assert.deepStrictEqual(result, {
      components: ["home", "docs"],
      isAbsolute: true,
    });
  });
});

describe("resolvePath", () => {
    describe("argument validation", () => {
        it("throws TypeError when currentPath is invalid or not absolute", () => {
            assert.throws(() => resolvePath(null as never, "doc"), {
                name: "TypeError",
                message: /CurrentPath must be a valid Path object/,
            });
            assert.throws(() => resolvePath({ components: ["home"], isAbsolute: false }, "doc"), {
                name: "TypeError",
                message: /CurrentPath must be an absolute path/,
            });
        });

        it("throws TypeError when input is not a string", () => {
            const current: Path = { components: [], isAbsolute: true };
            assert.throws(() => resolvePath(current, 123 as never), {
                name: "TypeError",
                message: /Input must be a string/,
            });
        });
    });

    describe("relative paths", () => {
        it("resolves a relative path against the current path", () => {
            const currentPath: Path = {
                components: ["home", "jose"],
                isAbsolute: true,
            };

            const result = resolvePath(currentPath, "documents/file.txt");

            assert.deepStrictEqual(result, {
                components: ["home", "jose", "documents", "file.txt"],
                isAbsolute: true,
            });
        });

        it("resolves an empty path to the current path", () => {
            const currentPath: Path = {
                components: ["home", "jose"],
                isAbsolute: true,
            };

            const result = resolvePath(currentPath, "");

            assert.deepStrictEqual(result, {
                components: ["home", "jose"],
                isAbsolute: true,
            });
        });

        it("resolves '.' to the current path", () => {
            const currentPath: Path = {
                components: ["home", "jose"],
                isAbsolute: true,
            };

            const result = resolvePath(currentPath, ".");

            assert.deepStrictEqual(result, {
                components: ["home", "jose"],
                isAbsolute: true,
            });
        });

        it("resolves a relative path containing '..'", () => {
            const currentPath: Path = {
                components: ["home", "jose", "projects"],
                isAbsolute: true,
            };

            const result = resolvePath(currentPath, "../documents");

            assert.deepStrictEqual(result, {
                components: ["home", "jose", "documents"],
                isAbsolute: true,
            });
        });

        it("resolves a complex relative path", () => {
            const currentPath: Path = {
                components: ["home", "jose", "projects"],
                isAbsolute: true,
            };

            const result = resolvePath(
                currentPath,
                "./../documents/./reports/../file.txt",
            );

            assert.deepStrictEqual(result, {
                components: [
                    "home",
                    "jose",
                    "documents",
                    "file.txt",
                ],
                isAbsolute: true,
            });
        });
    });

    describe("absolute paths", () => {
        it("resolves an absolute path independently of the current path", () => {
            const currentPath: Path = {
                components: ["home", "jose"],
                isAbsolute: true,
            };

            const result = resolvePath(currentPath, "/etc/config");

            assert.deepStrictEqual(result, {
                components: ["etc", "config"],
                isAbsolute: true,
            });
        });

        it("ignores the current path when the input is absolute", () => {
            const currentPath: Path = {
                components: ["home", "jose", "projects"],
                isAbsolute: true,
            };

            const result = resolvePath(currentPath, "/tmp/file.txt");

            assert.deepStrictEqual(result, {
                components: ["tmp", "file.txt"],
                isAbsolute: true,
            });
        });

        it("resolves the root path", () => {
            const currentPath: Path = {
                components: ["home", "jose"],
                isAbsolute: true,
            };

            const result = resolvePath(currentPath, "/");

            assert.deepStrictEqual(result, {
                components: [],
                isAbsolute: true,
            });
        });
    });

    describe("parent traversal", () => {
        it("resolves multiple parent components", () => {
            const currentPath: Path = {
                components: ["home", "jose", "projects"],
                isAbsolute: true,
            };

            const result = resolvePath(currentPath, "../../documents");

            assert.deepStrictEqual(result, {
                components: ["home", "documents"],
                isAbsolute: true,
            });
        });

        it("does not escape the root", () => {
            const currentPath: Path = {
                components: ["home"],
                isAbsolute: true,
            };

            const result = resolvePath(
                currentPath,
                "../../../../../etc",
            );

            assert.deepStrictEqual(result, {
                components: ["etc"],
                isAbsolute: true,
            });
        });

        it("does not escape the root when resolving an absolute path", () => {
            const currentPath: Path = {
                components: ["home", "jose"],
                isAbsolute: true,
            };

            const result = resolvePath(
                currentPath,
                "/../../../../etc",
            );

            assert.deepStrictEqual(result, {
                components: ["etc"],
                isAbsolute: true,
            });
        });
    });

    describe("separator handling", () => {
        it("resolves relative paths with repeated separators", () => {
            const currentPath: Path = {
                components: ["home", "jose"],
                isAbsolute: true,
            };

            const result = resolvePath(
                currentPath,
                "documents///projects//file.txt",
            );

            assert.deepStrictEqual(result, {
                components: [
                    "home",
                    "jose",
                    "documents",
                    "projects",
                    "file.txt",
                ],
                isAbsolute: true,
            });
        });

        it("resolves absolute paths with repeated separators", () => {
            const currentPath: Path = {
                components: ["home", "jose"],
                isAbsolute: true,
            };

            const result = resolvePath(
                currentPath,
                "///home//jose///documents/",
            );

            assert.deepStrictEqual(result, {
                components: [
                    "home",
                    "jose",
                    "documents",
                ],
                isAbsolute: true,
            });
        });
    });

    describe("nonexistent paths", () => {
        it("resolves a path even when the target does not exist", () => {
            const currentPath: Path = {
                components: ["home", "jose"],
                isAbsolute: true,
            };

            const result = resolvePath(
                currentPath,
                "does-not-exist/file.txt",
            );

            assert.deepStrictEqual(result, {
                components: [
                    "home",
                    "jose",
                    "does-not-exist",
                    "file.txt",
                ],
                isAbsolute: true,
            });
        });

        it("does not perform filesystem lookup", () => {
            const currentPath: Path = {
                components: ["home", "jose"],
                isAbsolute: true,
            };

            assert.doesNotThrow(() => {
                resolvePath(
                    currentPath,
                    "this/path/does/not/exist",
                );
            });
        });
    });

    describe("result invariants", () => {
        it("always returns an absolute path", () => {
            const currentPath: Path = {
                components: ["home", "jose"],
                isAbsolute: true,
            };

            const inputs = [
                "",
                ".",
                "..",
                "documents/file.txt",
                "../documents/file.txt",
                "/etc/config",
            ];

            for (const input of inputs) {
                const result = resolvePath(currentPath, input);

                assert.equal(result.isAbsolute, true);
            }
        });

        it("never returns '.' components", () => {
            const currentPath: Path = {
                components: ["home", "jose"],
                isAbsolute: true,
            };

            const result = resolvePath(
                currentPath,
                "./documents/./projects/./file.txt",
            );

            assert.equal(result.components.includes("."), false);
        });

        it("never returns '..' components", () => {
            const currentPath: Path = {
                components: ["home", "jose", "projects"],
                isAbsolute: true,
            };

            const result = resolvePath(
                currentPath,
                "../../documents/../file.txt",
            );

            assert.equal(result.components.includes(".."), false);
        });
    });

    describe("immutability", () => {
        it("does not mutate the current path", () => {
            const currentPath: Path = {
                components: ["home", "jose", "projects"],
                isAbsolute: true,
            };

            const originalPath: Path = {
                components: [...currentPath.components],
                isAbsolute: currentPath.isAbsolute,
            };

            resolvePath(currentPath, "../documents");

            assert.deepStrictEqual(currentPath, originalPath);
        });

        it("does not reuse the current path components array", () => {
            const currentPath: Path = {
                components: ["home", "jose"],
                isAbsolute: true,
            };

            const result = resolvePath(currentPath, "documents");

            assert.notStrictEqual(
                result.components,
                currentPath.components,
            );
        });
    });

    describe("determinism", () => {
        it("produces the same result for repeated calls", () => {
            const currentPath: Path = {
                components: ["home", "jose", "projects"],
                isAbsolute: true,
            };

            const first = resolvePath(
                currentPath,
                "../documents/./file.txt",
            );

            const second = resolvePath(
                currentPath,
                "../documents/./file.txt",
            );

            assert.deepStrictEqual(first, second);
        });

        it("is stable when resolving an already resolved path", () => {
            const currentPath: Path = {
                components: ["home", "jose", "projects"],
                isAbsolute: true,
            };

            const first = resolvePath(
                currentPath,
                "../documents/./file.txt",
            );

            const second = resolvePath(first, "");

            assert.deepStrictEqual(second, first);
        });
    });
});

describe("formatPath", () => {
    it("formats the root path", () => {
        const path: Path = { components: [], isAbsolute: true };
        assert.equal(formatPath(path), "/");
    });

    it("formats an empty relative path", () => {
        const path: Path = { components: [], isAbsolute: false };
        assert.equal(formatPath(path), "");
    });

    it("formats an absolute path with one component", () => {
        const path: Path = { components: ["home"], isAbsolute: true };
        assert.equal(formatPath(path), "/home");
    });

    it("formats an absolute path with multiple components", () => {
        const path: Path = { components: ["home", "user", "projects"], isAbsolute: true };
        assert.equal(formatPath(path), "/home/user/projects");
    });

    it("formats a relative path with multiple components", () => {
        const path: Path = { components: ["docs", "readme.txt"], isAbsolute: false };
        assert.equal(formatPath(path), "docs/readme.txt");
    });

    it("throws TypeError if path is invalid", () => {
        assert.throws(() => {
            formatPath(null as unknown as Path);
        }, TypeError);
    });
});
