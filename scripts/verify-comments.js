const assert = require("assert");
const fs = require("fs");
const { execFileSync } = require("child_process");
const acorn = require("acorn");

function inspect(source) {
  const comments = [];
  const tokens = [];
  const tree = acorn.parse(source, { ecmaVersion: 2018, onComment: comments, onToken: tokens });
  const failures = comments.filter(comment => /[\u3400-\u9fff]|@(?:method|desc\b|des\b|return\b)|\{(?:String|Boolean|Object|Number)\}/.test(comment.value));
  return {
    failures,
    tokens: tokens.map(token => [ token.type.label, source.slice(token.start, token.end) ]),
    tree: JSON.parse(JSON.stringify(tree, (key, value) => key === "start" || key === "end" ? undefined : value)),
  };
}
assert.strictEqual(inspect("const text = '中文😀'; // English comment.\n").failures.length, 0);
assert.strictEqual(inspect("// 中文\nconst text = 'English';").failures.length, 1);
const baseIndex = process.argv.indexOf("--base");
const base = baseIndex === -1 ? null : process.argv[baseIndex + 1];
assert(baseIndex === -1 || base, "--base requires a commit reference");
const files = execFileSync("git", [ "ls-files", "-z", "--", "src" ], { encoding: "utf8" }).split("\0")
  .filter(file => file.endsWith(".js") && !file.startsWith("src/utils/say/"));
files.forEach(file => {
  const current = inspect(fs.readFileSync(file, "utf8"));
  assert.strictEqual(current.failures.length, 0, file + ": non-English or obsolete JSDoc comments");
  if (base) {
    const previous = inspect(execFileSync("git", [ "show", base + ":" + file ], { encoding: "utf8" }));
    assert.deepStrictEqual(current.tokens, previous.tokens, file + ": executable tokens changed");
    assert.deepStrictEqual(current.tree, previous.tree, file + ": executable AST changed");
  }
});
console.log("Repository-owned comments verified" + (base ? "; executable tokens and AST match " + base : "") + ".");
