"use strict";

function chunk(items, size) {
  const groups = [];
  for (let i = 0; i < items.length; i += size) {
    groups.push(items.slice(i, i + size));
  }
  return groups;
}

function hasTooManyItemsPerLine(items, max) {
  const countByLine = new Map();
  items.forEach(item => {
    const line = item.loc.start.line;
    countByLine.set(line, (countByLine.get(line) || 0) + 1);
  });
  for (const count of countByLine.values()) {
    if (count > max) {
      return true;
    }
  }
  return false;
}

function buildMultilineBlock(itemsText, indent, max) {
  const groups = chunk(itemsText, max);
  const lines = groups.map(group => `${indent}${group.join(", ")},`);
  return `{\n${lines.join("\n")}\n}`;
}

module.exports = {
  meta: {
    type: "layout",
    docs: {
      description: "limit the number of import/destructuring specifiers per line",
      category: "Stylistic Issues",
    },
    fixable: "whitespace",
    schema: [
      {
        type: "object",
        properties: {
          max: {
            type: "integer",
            minimum: 1,
          },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooMany: "Do not put more than {{max}} imported/destructured items on one line.",
    },
  },

  create(context) {
    const sourceCode = context.getSourceCode();
    const options = context.options[0] || {};
    const max = options.max || 4;
    const indentUnit = "  ";

    function reportImportDeclaration(node) {
      const importSpecifiers = node.specifiers.filter(specifier => specifier.type === "ImportSpecifier");
      if (importSpecifiers.length <= max) {
        return;
      }
      if (!hasTooManyItemsPerLine(importSpecifiers, max)) {
        return;
      }

      context.report({
        node,
        messageId: "tooMany",
        data: { max },
        fix(fixer) {
          const first = importSpecifiers[0];
          const last = importSpecifiers[importSpecifiers.length - 1];
          const itemsText = importSpecifiers.map(specifier => sourceCode.getText(specifier));
          const replacement = buildMultilineBlock(itemsText, indentUnit, max);
          return fixer.replaceTextRange([ first.range[0] - 1, last.range[1] + 1 ], replacement);
        },
      });
    }

    function reportRequireObjectPattern(node) {
      if (!node.id || node.id.type !== "ObjectPattern") {
        return;
      }
      if (!node.init || node.init.type !== "CallExpression") {
        return;
      }
      if (!node.init.callee || node.init.callee.type !== "Identifier" || node.init.callee.name !== "require") {
        return;
      }

      const properties = node.id.properties.filter(property => property.type === "Property");
      if (properties.length <= max) {
        return;
      }
      if (!hasTooManyItemsPerLine(properties, max)) {
        return;
      }

      context.report({
        node: node.id,
        messageId: "tooMany",
        data: { max },
        fix(fixer) {
          const itemsText = properties.map(property => sourceCode.getText(property));
          const replacement = buildMultilineBlock(itemsText, indentUnit, max);
          return fixer.replaceText(node.id, replacement);
        },
      });
    }

    return {
      ImportDeclaration: reportImportDeclaration,
      VariableDeclarator: reportRequireObjectPattern,
    };
  },
};
