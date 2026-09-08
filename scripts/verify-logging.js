const assert = require("assert");
const fs = require("fs");
const path = require("path");
const acorn = require("acorn");

function inspect(source) {
  const failures = [];
  const tree = acorn.parse(source, { ecmaVersion: 2018, locations: true });
  function visit(node) {
    if (!node || typeof node !== "object") return;
    if ((node.type === "Identifier" && node.name === "console") ||
        (node.type === "MemberExpression" && node.computed && node.property.type === "Literal" && node.property.value === "console") ||
        (node.type === "CallExpression" && node.callee.name === "require" && node.arguments[0] && /^(node:)?console$/.test(node.arguments[0].value))) {
      failures.push("Direct console reference at line " + node.loc.start.line);
    }
    if (node.type === "CallExpression" && node.callee.type === "MemberExpression" && node.callee.object.name === "logger") {
      const message = node.arguments[node.arguments.length - 1];
      if (!message || message.type !== "Literal" || typeof message.value !== "string" || !/^\[[a-z-]+\] [a-z][a-z0-9 ]*$/.test(message.value)) {
        failures.push("Unstable logger message at line " + node.loc.start.line);
      }
    }
    Object.keys(node).forEach(key => {
      const value = node[key];
      if (Array.isArray(value)) value.forEach(visit);
      else if (value && typeof value === "object") visit(value);
    });
  }
  visit(tree);
  return failures;
}
function sourceFiles(directory) {
  return fs.readdirSync(directory).reduce((files, name) => {
    const file = path.join(directory, name);
    if (file === path.join("src", "utils", "say")) return files;
    return files.concat(fs.statSync(file).isDirectory() ? sourceFiles(file) : /\.js$/.test(file) ? [ file ] : []);
  }, []);
}
function selfTest() {
  [ "console.log('x');", "promise.catch(console.error);", "const log = console.log;", "const { error } = console;", "global.console.warn('x');", "global['console'].warn('x');", "require('console').error('x');", "const { console: output } = global;" ].forEach(source => assert(inspect(source).length, source));
  [ "const text = 'console.log';", "// console.error('x');\nconst x = 1;", "logger.info({ count: 1 }, '[test] completed');" ].forEach(source => assert.deepStrictEqual(inspect(source), []));
  assert(inspect("logger.info('[test] ' + value);").length);
}
if (require.main === module) {
  selfTest();
  const failures = sourceFiles("src").reduce((all, file) => all.concat(inspect(fs.readFileSync(file, "utf8")).map(failure => file + ": " + failure)), []);
  assert.deepStrictEqual(failures, []);
  console.log("Application console and stable-message audit passed (CLI scripts and vendored say excluded).");
}
module.exports = { inspect, sourceFiles };
